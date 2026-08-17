"""Regras compartilhadas de reservas, fila e lembretes agendados."""

import asyncio
import logging
import math
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pymongo import ReturnDocument

from app_core import db, next_id, utcnow
from evolution_service import safe_send_text

logger = logging.getLogger(__name__)

DEFAULT_BOOKING_SETTINGS = {
    "enabled": False,
    "timezone": "America/Sao_Paulo",
    "opening_time": "18:00",
    "closing_time": "23:00",
    "slot_interval_minutes": 30,
    "max_reservations_per_slot": 5,
    "advance_days": 30,
    "min_advance_minutes": 60,
    "reminder_minutes": 30,
    "waitlist_avg_minutes": 15,
    "reservation_duration_minutes": 90,
    "days_open": [0, 1, 2, 3, 4, 5, 6],
}


def booking_settings(document: dict | None) -> dict:
    return {**DEFAULT_BOOKING_SETTINGS, **(document or {})}


def get_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or DEFAULT_BOOKING_SETTINGS["timezone"])
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_BOOKING_SETTINGS["timezone"])


def normalize_phone(country_code, phone) -> tuple[str, str, str]:
    ddi = re.sub(r"\D", "", str(country_code or "55"))[:4] or "55"
    national = re.sub(r"\D", "", str(phone or ""))
    national = national.lstrip("0")
    if national.startswith(ddi) and len(national) > 11:
        national = national[len(ddi):]
    full = f"{ddi}{national}"
    if len(national) < 8 or len(full) > 15:
        raise ValueError("Informe um número de WhatsApp válido.")
    return ddi, national, full


def local_to_utc(date_value: str, time_value: str, tz_name: str) -> datetime:
    try:
        naive = datetime.fromisoformat(f"{date_value}T{time_value}")
    except ValueError as exc:
        raise ValueError("Data ou horário inválido.") from exc
    return naive.replace(tzinfo=get_timezone(tz_name)).astimezone(timezone.utc)


def format_local(iso_value: str, tz_name: str) -> tuple[str, str]:
    value = datetime.fromisoformat(iso_value.replace("Z", "+00:00"))
    local = value.astimezone(get_timezone(tz_name))
    return local.strftime("%d/%m/%Y"), local.strftime("%H:%M")


def maps_link(restaurant: dict, establishment: dict | None = None) -> str:
    place = establishment or restaurant
    lat, lng = place.get("latitude"), place.get("longitude")
    destination = f"{lat},{lng}" if lat is not None and lng is not None else place.get("address") or restaurant.get("address") or restaurant.get("name")
    return f"https://www.google.com/maps/dir/?api=1&destination={quote_plus(str(destination))}"


def public_origin(request=None) -> str:
    if request:
        origin = str(request.headers.get("origin") or "").rstrip("/")
        if origin:
            return origin
        forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if forwarded_host:
            protocol = request.headers.get("x-forwarded-proto") or request.url.scheme
            return f"{protocol}://{forwarded_host}".rstrip("/")
    return ""


async def waitlist_metrics(restaurant_id: int) -> tuple[int, int]:
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": restaurant_id}, {"_id": 0}))
    rows = await db.waitlist_entries.find(
        {"restaurant_id": restaurant_id, "status": "seated", "wait_minutes": {"$gt": 0}, "initial_position": {"$gt": 0}},
        {"_id": 0, "wait_minutes": 1, "initial_position": 1},
    ).sort("seated_at", -1).to_list(30)
    if rows:
        per_turn = sum(float(row["wait_minutes"]) / max(1, int(row["initial_position"])) for row in rows) / len(rows)
        avg = max(3, min(120, round(per_turn)))
    else:
        avg = int(settings.get("waitlist_avg_minutes") or 15)
    active = await db.waitlist_entries.count_documents({"restaurant_id": restaurant_id, "status": {"$in": ["waiting", "called"]}})
    return avg, active


async def decorate_waitlist(row: dict) -> dict:
    active_rows = await db.waitlist_entries.find(
        {"restaurant_id": row["restaurant_id"], "status": {"$in": ["waiting", "called"]}},
        {"_id": 0, "id": 1},
    ).sort([("joined_at", 1), ("id", 1)]).to_list(10000)
    ids = [item["id"] for item in active_rows]
    position = ids.index(row["id"]) + 1 if row["id"] in ids else 0
    per_turn, _ = await waitlist_metrics(row["restaurant_id"])
    return {**row, "position": position, "estimated_minutes": per_turn * position, "average_turn_minutes": per_turn}


async def upsert_customer(restaurant_id: int, name: str, ddi: str, phone: str, full_phone: str, source: str) -> dict:
    now = utcnow()
    customer = await db.booking_customers.find_one_and_update(
        {"restaurant_id": restaurant_id, "phone_e164": full_phone},
        {
            "$set": {"name": name, "country_code": ddi, "phone": phone, "last_seen_at": now},
            "$setOnInsert": {"id": await next_id("booking_customers"), "restaurant_id": restaurant_id, "phone_e164": full_phone, "created_at": now},
            "$inc": {"reservation_count" if source == "reservation" else "waitlist_count": 1},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    return customer


async def _reservation_reminder_message(reservation: dict) -> str:
    restaurant = await db.restaurants.find_one({"id": reservation["restaurant_id"]}, {"_id": 0}) or {}
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": reservation["restaurant_id"]}, {"_id": 0}))
    date_label, time_label = format_local(reservation["starts_at"], settings["timezone"])
    link = reservation.get("public_url") or ""
    return (
        f"Olá, {reservation['customer_name']}! 👋\n\n"
        f"Sua reserva no *{restaurant.get('name', 'restaurante')}* é às *{time_label}* de hoje ({date_label}).\n"
        f"Confirme sua presença ou cancele por aqui: {link}\n\n"
        "Esperamos você!"
    )


async def process_due_reminders() -> int:
    now = utcnow()
    stale = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    query = {
        "status": {"$in": ["confirmed", "scheduled"]},
        "reminder_sent_at": None,
        "reminder_due_at": {"$lte": now},
        "$or": [{"reminder_processing_at": None}, {"reminder_processing_at": {"$lt": stale}}],
    }
    processed = 0
    while True:
        row = await db.reservations.find_one_and_update(
            query,
            {"$set": {"reminder_processing_at": now}, "$inc": {"reminder_attempts": 1}},
            return_document=ReturnDocument.AFTER,
            projection={"_id": 0},
        )
        if not row:
            break
        sent = await safe_send_text(
            row["restaurant_id"], row["phone_e164"], await _reservation_reminder_message(row), "reservation_reminder", row["id"]
        )
        attempt_time = utcnow()
        values = {"reminder_last_attempt_at": attempt_time}
        if sent:
            values.update({"reminder_sent_at": attempt_time, "reminder_processing_at": None, "reminder_error": None})
        else:
            values["reminder_processing_at"] = attempt_time
            values["reminder_error"] = "WhatsApp indisponível; nova tentativa será realizada automaticamente."
        await db.reservations.update_one({"id": row["id"]}, {"$set": values})
        processed += 1
    return processed


async def reminder_worker():
    while True:
        try:
            await process_due_reminders()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Falha no processamento de lembretes de reserva")
        await asyncio.sleep(30)
