import asyncio
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app_core import clean_doc, db, next_id, utcnow
from auth_service import require_roles
from evolution_service import (
    EvolutionError,
    connect_instance,
    connection_state,
    create_instance,
    evolution_is_configured,
    logout_instance,
    safe_send_text,
)
from reservation_service import (
    DEFAULT_BOOKING_SETTINGS,
    booking_settings,
    decorate_waitlist,
    format_local,
    get_timezone,
    local_to_utc,
    maps_link,
    normalize_phone,
    public_origin,
    upsert_customer,
    waitlist_metrics,
)

router = APIRouter(tags=["booking"])
restaurant_guard = require_roles("restaurant")

RESERVATION_ACTIVE = {"scheduled", "confirmed", "attendance_confirmed"}
RESERVATION_ACTIONS = {
    "confirm": "attendance_confirmed",
    "cancel": "cancelled",
    "complete": "completed",
    "no-show": "no_show",
}


async def _restaurant_by_slug(slug: str) -> dict:
    restaurant = await db.restaurants.find_one({"slug": slug, "is_active": 1}, {"_id": 0})
    if not restaurant:
        raise HTTPException(404, "Restaurante não encontrado.")
    return restaurant


async def _owned(collection: str, item_id: int, user: dict) -> dict:
    row = await db[collection].find_one({"id": item_id, "restaurant_id": user["id"]}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Registro não encontrado.")
    return row


def _date_range(date_value: str, timezone_name: str) -> tuple[str, str]:
    try:
        start_local = datetime.fromisoformat(date_value).replace(tzinfo=get_timezone(timezone_name))
    except ValueError as exc:
        raise HTTPException(422, "Data inválida.") from exc
    start = start_local.astimezone(timezone.utc)
    return start.isoformat(), (start + timedelta(days=1)).isoformat()


async def _establishment(restaurant_id: int, establishment_id) -> dict | None:
    if not establishment_id:
        return None
    row = await db.establishments.find_one(
        {"id": int(establishment_id), "restaurant_id": restaurant_id, "is_active": 1}, {"_id": 0}
    )
    if not row:
        raise HTTPException(422, "Unidade do restaurante inválida.")
    return row


async def _reservation_slots(restaurant_id: int, date_value: str, settings: dict, establishment_id: int | None = None) -> list[dict]:
    timezone_name = settings["timezone"]
    try:
        day = datetime.fromisoformat(date_value).date()
    except ValueError as exc:
        raise HTTPException(422, "Data inválida.") from exc
    now_local = datetime.now(get_timezone(timezone_name))
    if day < now_local.date() or day > (now_local + timedelta(days=int(settings["advance_days"]))).date():
        return []
    if day.weekday() not in [int(value) for value in settings.get("days_open", [])]:
        return []
    try:
        open_hour, open_minute = map(int, settings["opening_time"].split(":"))
        close_hour, close_minute = map(int, settings["closing_time"].split(":"))
    except Exception as exc:
        raise HTTPException(422, "Revise os horários configurados para reservas.") from exc
    current = datetime(day.year, day.month, day.day, open_hour, open_minute, tzinfo=get_timezone(timezone_name))
    close = datetime(day.year, day.month, day.day, close_hour, close_minute, tzinfo=get_timezone(timezone_name))
    if close <= current:
        close += timedelta(days=1)
    interval = max(10, int(settings["slot_interval_minutes"]))
    minimum = now_local + timedelta(minutes=max(0, int(settings["min_advance_minutes"])))
    query = {
        "restaurant_id": restaurant_id,
        "starts_at": {"$gte": current.astimezone(timezone.utc).isoformat(), "$lt": close.astimezone(timezone.utc).isoformat()},
        "status": {"$in": list(RESERVATION_ACTIVE)},
    }
    if establishment_id:
        query["establishment_id"] = establishment_id
    rows = await db.reservations.find(query, {"_id": 0, "starts_at": 1}).to_list(10000)
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["starts_at"]] = counts.get(row["starts_at"], 0) + 1
    slots = []
    capacity = max(1, int(settings["max_reservations_per_slot"]))
    while current < close:
        utc_value = current.astimezone(timezone.utc).isoformat()
        used = counts.get(utc_value, 0)
        if current >= minimum:
            slots.append({"time": current.strftime("%H:%M"), "available": used < capacity, "remaining": max(0, capacity - used)})
        current += timedelta(minutes=interval)
    return slots


async def _send_reservation_confirmation(reservation: dict):
    restaurant = await db.restaurants.find_one({"id": reservation["restaurant_id"]}, {"_id": 0}) or {}
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": reservation["restaurant_id"]}, {"_id": 0}))
    establishment = await _establishment(reservation["restaurant_id"], reservation.get("establishment_id"))
    date_label, time_label = format_local(reservation["starts_at"], settings["timezone"])
    location_label = (establishment or {}).get("name") or restaurant.get("name", "restaurante")
    message = (
        f"Reserva confirmada ✅\n\n"
        f"Olá, {reservation['customer_name']}! Sua reserva no *{location_label}* foi realizada.\n"
        f"📅 {date_label} às {time_label}\n"
        f"👥 {reservation.get('party_size', 1)} pessoa(s)\n\n"
        f"📍 Como chegar: {reservation['maps_url']}\n"
        f"Detalhes e confirmação: {reservation['public_url']}"
    )
    sent = await safe_send_text(reservation["restaurant_id"], reservation["phone_e164"], message, "reservation_confirmation", reservation["id"])
    await db.reservations.update_one(
        {"id": reservation["id"]},
        {"$set": {"confirmation_message_status": "sent" if sent else "pending", "confirmation_message_attempted_at": utcnow()}},
    )


async def _send_waitlist_joined(entry: dict):
    restaurant = await db.restaurants.find_one({"id": entry["restaurant_id"]}, {"_id": 0}) or {}
    decorated = await decorate_waitlist(entry)
    message = (
        f"Você entrou na fila do *{restaurant.get('name', 'restaurante')}* 🍽️\n\n"
        f"Posição atual: *{decorated['position']}ª*\n"
        f"Previsão: aproximadamente *{decorated['estimated_minutes']} min*\n\n"
        f"Acompanhe em tempo real: {entry['public_url']}"
    )
    sent = await safe_send_text(entry["restaurant_id"], entry["phone_e164"], message, "waitlist_joined", entry["id"])
    await db.waitlist_entries.update_one({"id": entry["id"]}, {"$set": {"join_message_status": "sent" if sent else "pending"}})


async def _send_waitlist_called(entry: dict):
    restaurant = await db.restaurants.find_one({"id": entry["restaurant_id"]}, {"_id": 0}) or {}
    message = (
        f"Sua mesa está pronta, {entry['customer_name']}! 🔔\n\n"
        f"A equipe do *{restaurant.get('name', 'restaurante')}* está esperando por você. "
        f"Dirija-se à recepção agora.\n\nAcompanhe: {entry['public_url']}"
    )
    sent = await safe_send_text(entry["restaurant_id"], entry["phone_e164"], message, "waitlist_called", entry["id"])
    await db.waitlist_entries.update_one({"id": entry["id"]}, {"$set": {"call_message_status": "sent" if sent else "pending"}})


# ── Área pública: reservas ───────────────────────────────────────────────

@router.get("/api/public/reservations/config")
async def public_reservation_config(r: str):
    restaurant = await _restaurant_by_slug(r)
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": restaurant["id"]}, {"_id": 0}))
    establishments = await db.establishments.find(
        {"restaurant_id": restaurant["id"], "is_active": 1}, {"_id": 0, "id": 1, "name": 1, "address": 1}
    ).sort([("sort_order", 1), ("name", 1)]).to_list(100)
    return {
        "enabled": bool(settings["enabled"]),
        "timezone": settings["timezone"],
        "advance_days": settings["advance_days"],
        "min_advance_minutes": settings["min_advance_minutes"],
        "days_open": settings["days_open"],
        "establishments": establishments,
    }


@router.get("/api/public/reservations/slots")
async def public_reservation_slots(r: str, date: str, establishment_id: int = 0):
    restaurant = await _restaurant_by_slug(r)
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": restaurant["id"]}, {"_id": 0}))
    if not settings["enabled"]:
        raise HTTPException(404, "Reservas não estão disponíveis neste restaurante.")
    if establishment_id:
        await _establishment(restaurant["id"], establishment_id)
    return {"date": date, "slots": await _reservation_slots(restaurant["id"], date, settings, establishment_id or None)}


@router.post("/api/public/reservations")
async def create_public_reservation(body: dict, request: Request, tasks: BackgroundTasks):
    restaurant = await _restaurant_by_slug(str(body.get("restaurant_slug") or ""))
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": restaurant["id"]}, {"_id": 0}))
    if not settings["enabled"]:
        raise HTTPException(422, "Este restaurante não está recebendo reservas no momento.")
    name = str(body.get("customer_name") or "").strip()[:120]
    if len(name) < 2:
        raise HTTPException(422, "Informe seu nome.")
    try:
        ddi, phone, full_phone = normalize_phone(body.get("country_code"), body.get("phone"))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    date_value, time_value = str(body.get("date") or ""), str(body.get("time") or "")
    establishment = await _establishment(restaurant["id"], body.get("establishment_id"))
    slots = await _reservation_slots(restaurant["id"], date_value, settings, (establishment or {}).get("id"))
    slot = next((item for item in slots if item["time"] == time_value), None)
    if not slot or not slot["available"]:
        raise HTTPException(409, "Este horário não está mais disponível. Escolha outro.")
    starts = local_to_utc(date_value, time_value, settings["timezone"])
    customer = await upsert_customer(restaurant["id"], name, ddi, phone, full_phone, "reservation")
    token = secrets.token_urlsafe(24)
    origin = public_origin(request)
    reminder_due = starts - timedelta(minutes=max(1, int(settings["reminder_minutes"])))
    document = {
        "id": await next_id("reservations"),
        "restaurant_id": restaurant["id"],
        "customer_id": customer["id"],
        "customer_name": name,
        "country_code": ddi,
        "phone": phone,
        "phone_e164": full_phone,
        "party_size": max(1, min(30, int(body.get("party_size") or 1))),
        "establishment_id": (establishment or {}).get("id"),
        "starts_at": starts.isoformat(),
        "local_date": date_value,
        "local_time": time_value,
        "timezone": settings["timezone"],
        "status": "confirmed",
        "public_token": token,
        "public_url": f"{origin}/reserva/{token}",
        "maps_url": maps_link(restaurant, establishment),
        "notes": str(body.get("notes") or "").strip()[:500] or None,
        "reminder_due_at": reminder_due.isoformat(),
        "reminder_sent_at": None,
        "reminder_processing_at": None,
        "reminder_attempts": 0,
        "confirmation_message_status": "pending",
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await db.reservations.insert_one(document.copy())
    tasks.add_task(_send_reservation_confirmation, clean_doc(document))
    return {"ok": True, "reservation": clean_doc(document), "message": "Reserva realizada com sucesso."}


@router.get("/api/public/reservations/{token}")
async def public_reservation(token: str):
    row = await db.reservations.find_one({"public_token": token}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Reserva não encontrada.")
    restaurant = await db.restaurants.find_one({"id": row["restaurant_id"]}, {"_id": 0, "name": 1, "address": 1, "slug": 1}) or {}
    establishment = await db.establishments.find_one({"id": row.get("establishment_id")}, {"_id": 0, "name": 1, "address": 1}) if row.get("establishment_id") else None
    return {"reservation": row, "restaurant": restaurant, "establishment": establishment}


@router.patch("/api/public/reservations/{token}/{action}")
async def public_reservation_action(token: str, action: str):
    if action not in {"confirm", "cancel"}:
        raise HTTPException(404, "Ação inválida.")
    status = "attendance_confirmed" if action == "confirm" else "cancelled"
    result = await db.reservations.update_one(
        {"public_token": token, "status": {"$in": list(RESERVATION_ACTIVE)}},
        {"$set": {"status": status, f"{action}ed_at": utcnow(), "updated_at": utcnow()}},
    )
    if not result.matched_count:
        raise HTTPException(409, "Esta reserva não pode mais ser alterada.")
    return {"ok": True, "status": status}


# ── Área pública: fila em tempo real ────────────────────────────────────

@router.get("/api/public/waitlist/{token}")
async def public_waitlist(token: str):
    row = await db.waitlist_entries.find_one({"public_token": token}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Entrada na fila não encontrada.")
    restaurant = await db.restaurants.find_one({"id": row["restaurant_id"]}, {"_id": 0, "name": 1, "address": 1, "slug": 1}) or {}
    return {"entry": await decorate_waitlist(row), "restaurant": restaurant}


@router.get("/api/public/waitlist/{token}/events")
async def public_waitlist_events(token: str, request: Request):
    if not await db.waitlist_entries.find_one({"public_token": token}, {"_id": 1}):
        raise HTTPException(404, "Entrada na fila não encontrada.")

    async def stream():
        last_payload = ""
        yield "retry: 3000\n\n"
        for _ in range(400):
            if await request.is_disconnected():
                break
            row = await db.waitlist_entries.find_one({"public_token": token}, {"_id": 0})
            if not row:
                yield 'event: removed\ndata: {"removed":true}\n\n'
                break
            decorated = await decorate_waitlist(row)
            payload = json.dumps({"entry": decorated}, ensure_ascii=False, separators=(",", ":"))
            if payload != last_payload:
                yield f"event: update\ndata: {payload}\n\n"
                last_payload = payload
            else:
                yield ": keep-alive\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ── Painel do restaurante ──────────────────────────────────────────────

@router.get("/api/restaurant/booking-dashboard")
async def booking_dashboard(user=Depends(restaurant_guard)):
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": user["id"]}, {"_id": 0}))
    start, end = _date_range(datetime.now(get_timezone(settings["timezone"])).date().isoformat(), settings["timezone"])
    today_query = {"restaurant_id": user["id"], "starts_at": {"$gte": start, "$lt": end}}
    reservations_today = await db.reservations.count_documents(today_query)
    reservations_upcoming = await db.reservations.count_documents({"restaurant_id": user["id"], "starts_at": {"$gte": utcnow()}, "status": {"$in": list(RESERVATION_ACTIVE)}})
    waiting = await db.waitlist_entries.count_documents({"restaurant_id": user["id"], "status": {"$in": ["waiting", "called"]}})
    customers = await db.booking_customers.count_documents({"restaurant_id": user["id"]})
    whatsapp = await db.whatsapp_instances.find_one({"restaurant_id": user["id"]}, {"_id": 0, "connection_status": 1}) or {}
    return {"reservations_today": reservations_today, "reservations_upcoming": reservations_upcoming, "waitlist_active": waiting, "customers": customers, "reservation_enabled": bool(settings["enabled"]), "whatsapp_status": whatsapp.get("connection_status", "disconnected")}


@router.get("/api/restaurant/reservation-settings")
async def get_reservation_settings(user=Depends(restaurant_guard)):
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": user["id"]}, {"_id": 0}))
    establishments = await db.establishments.find({"restaurant_id": user["id"], "is_active": 1}, {"_id": 0}).sort("name", 1).to_list(100)
    return {"settings": settings, "establishments": establishments}


@router.post("/api/restaurant/reservation-settings")
async def save_reservation_settings(body: dict, user=Depends(restaurant_guard)):
    values = {
        "enabled": bool(body.get("enabled")),
        "timezone": str(body.get("timezone") or DEFAULT_BOOKING_SETTINGS["timezone"])[:80],
        "opening_time": str(body.get("opening_time") or "18:00")[:5],
        "closing_time": str(body.get("closing_time") or "23:00")[:5],
        "slot_interval_minutes": max(10, min(240, int(body.get("slot_interval_minutes") or 30))),
        "max_reservations_per_slot": max(1, min(100, int(body.get("max_reservations_per_slot") or 5))),
        "advance_days": max(1, min(365, int(body.get("advance_days") or 30))),
        "min_advance_minutes": max(0, min(10080, int(body.get("min_advance_minutes") or 60))),
        "reminder_minutes": max(5, min(1440, int(body.get("reminder_minutes") or 30))),
        "waitlist_avg_minutes": max(3, min(240, int(body.get("waitlist_avg_minutes") or 15))),
        "reservation_duration_minutes": max(15, min(480, int(body.get("reservation_duration_minutes") or 90))),
        "days_open": sorted({int(day) for day in (body.get("days_open") or []) if 0 <= int(day) <= 6}),
        "updated_at": utcnow(),
    }
    get_timezone(values["timezone"])
    if not values["days_open"]:
        raise HTTPException(422, "Selecione pelo menos um dia de funcionamento.")
    await db.reservation_settings.update_one(
        {"restaurant_id": user["id"]},
        {"$set": values, "$setOnInsert": {"id": await next_id("reservation_settings"), "restaurant_id": user["id"], "created_at": utcnow()}},
        upsert=True,
    )
    return {"ok": True, "settings": {**values, "restaurant_id": user["id"]}}


@router.get("/api/restaurant/reservations")
async def restaurant_reservations(date: str = "", status: str = "all", user=Depends(restaurant_guard)):
    query: dict = {"restaurant_id": user["id"]}
    settings = booking_settings(await db.reservation_settings.find_one({"restaurant_id": user["id"]}, {"_id": 0}))
    if date:
        start, end = _date_range(date, settings["timezone"])
        query["starts_at"] = {"$gte": start, "$lt": end}
    if status != "all":
        query["status"] = status
    rows = await db.reservations.find(query, {"_id": 0}).sort([("starts_at", 1), ("id", 1)]).to_list(5000)
    establishments = {row["id"]: row["name"] for row in await db.establishments.find({"restaurant_id": user["id"]}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    for row in rows:
        row["establishment_name"] = establishments.get(row.get("establishment_id"))
    return rows


@router.patch("/api/restaurant/reservations/{item_id}/{action}")
async def restaurant_reservation_action(item_id: int, action: str, tasks: BackgroundTasks, user=Depends(restaurant_guard)):
    row = await _owned("reservations", item_id, user)
    if action not in RESERVATION_ACTIONS:
        raise HTTPException(404, "Ação inválida.")
    status = RESERVATION_ACTIONS[action]
    await db.reservations.update_one({"id": item_id, "restaurant_id": user["id"]}, {"$set": {"status": status, f"{action.replace('-', '_')}_at": utcnow(), "updated_at": utcnow()}})
    if action == "cancel":
        tasks.add_task(safe_send_text, user["id"], row["phone_e164"], f"Olá, {row['customer_name']}. Sua reserva foi cancelada pelo restaurante. Se precisar, entre em contato para escolher outro horário.", "reservation_cancelled", item_id)
    return {"ok": True, "status": status}


@router.get("/api/restaurant/booking-customers")
async def booking_customers(q: str = "", user=Depends(restaurant_guard)):
    query: dict = {"restaurant_id": user["id"]}
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"phone_e164": {"$regex": q}}]
    return await db.booking_customers.find(query, {"_id": 0}).sort("last_seen_at", -1).to_list(10000)


@router.get("/api/restaurant/waitlist")
async def restaurant_waitlist(status: str = "active", user=Depends(restaurant_guard)):
    query: dict = {"restaurant_id": user["id"]}
    if status == "active":
        query["status"] = {"$in": ["waiting", "called"]}
    elif status != "all":
        query["status"] = status
    rows = await db.waitlist_entries.find(query, {"_id": 0}).sort([("joined_at", 1), ("id", 1)]).to_list(5000)
    return [await decorate_waitlist(row) for row in rows]


@router.post("/api/restaurant/waitlist")
async def add_waitlist(body: dict, request: Request, tasks: BackgroundTasks, user=Depends(restaurant_guard)):
    name = str(body.get("customer_name") or "").strip()[:120]
    if len(name) < 2:
        raise HTTPException(422, "Informe o nome do cliente.")
    try:
        ddi, phone, full_phone = normalize_phone(body.get("country_code"), body.get("phone"))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    if await db.waitlist_entries.find_one({"restaurant_id": user["id"], "phone_e164": full_phone, "status": {"$in": ["waiting", "called"]}}, {"_id": 1}):
        raise HTTPException(409, "Este WhatsApp já está na fila ativa.")
    customer = await upsert_customer(user["id"], name, ddi, phone, full_phone, "waitlist")
    _, active_count = await waitlist_metrics(user["id"])
    token = secrets.token_urlsafe(24)
    document = {
        "id": await next_id("waitlist_entries"),
        "restaurant_id": user["id"],
        "customer_id": customer["id"],
        "customer_name": name,
        "country_code": ddi,
        "phone": phone,
        "phone_e164": full_phone,
        "party_size": max(1, min(30, int(body.get("party_size") or 1))),
        "status": "waiting",
        "initial_position": active_count + 1,
        "public_token": token,
        "public_url": f"{public_origin(request)}/fila/{token}",
        "notes": str(body.get("notes") or "").strip()[:300] or None,
        "joined_at": utcnow(),
        "updated_at": utcnow(),
        "join_message_status": "pending",
    }
    await db.waitlist_entries.insert_one(document.copy())
    tasks.add_task(_send_waitlist_joined, clean_doc(document))
    return {"ok": True, "entry": await decorate_waitlist(clean_doc(document))}


@router.patch("/api/restaurant/waitlist/{item_id}/{action}")
async def waitlist_action(item_id: int, action: str, tasks: BackgroundTasks, user=Depends(restaurant_guard)):
    row = await _owned("waitlist_entries", item_id, user)
    now = datetime.now(timezone.utc)
    if action == "call":
        if row.get("status") != "waiting":
            raise HTTPException(409, "Somente clientes aguardando podem ser chamados.")
        values = {"status": "called", "called_at": now.isoformat(), "updated_at": now.isoformat()}
        await db.waitlist_entries.update_one({"id": item_id}, {"$set": values})
        tasks.add_task(_send_waitlist_called, {**row, **values})
    elif action == "seat":
        if row.get("status") not in {"waiting", "called"}:
            raise HTTPException(409, "Este cliente não está mais na fila ativa.")
        joined = datetime.fromisoformat(row["joined_at"].replace("Z", "+00:00"))
        wait_minutes = max(1, round((now - joined).total_seconds() / 60))
        await db.waitlist_entries.update_one({"id": item_id}, {"$set": {"status": "seated", "seated_at": now.isoformat(), "wait_minutes": wait_minutes, "updated_at": now.isoformat()}})
    elif action == "cancel":
        await db.waitlist_entries.update_one({"id": item_id}, {"$set": {"status": "cancelled", "cancelled_at": now.isoformat(), "updated_at": now.isoformat()}})
    else:
        raise HTTPException(404, "Ação inválida.")
    return {"ok": True}


# ── WhatsApp do restaurante ────────────────────────────────────────────

@router.get("/api/restaurant/whatsapp")
async def whatsapp_status(user=Depends(restaurant_guard)):
    row = await db.whatsapp_instances.find_one({"restaurant_id": user["id"]}, {"_id": 0, "instance_token": 0, "webhook_secret": 0}) or {}
    configured = await evolution_is_configured()
    if configured and row.get("instance_name"):
        try:
            state = await connection_state(row["instance_name"])
            changes = {"connection_status": state, "updated_at": utcnow(), "last_error": None}
            if state == "connected":
                changes["qr_code"] = None
            await db.whatsapp_instances.update_one({"restaurant_id": user["id"]}, {"$set": changes})
            row.update(changes)
        except EvolutionError as exc:
            row["last_error"] = str(exc)
    return {"configured": configured, "instance": row or None}


@router.post("/api/restaurant/whatsapp/connect")
async def whatsapp_connect(request: Request, user=Depends(restaurant_guard)):
    restaurant = await db.restaurants.find_one({"id": user["id"]}, {"_id": 0}) or user
    existing = await db.whatsapp_instances.find_one({"restaurant_id": user["id"]}, {"_id": 0})
    try:
        if not existing or not existing.get("instance_name"):
            webhook_secret = secrets.token_urlsafe(28)
            webhook_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
            webhook_protocol = request.headers.get("x-forwarded-proto") or request.url.scheme
            webhook_origin = f"{webhook_protocol}://{webhook_host}".rstrip("/")
            webhook_url = f"{webhook_origin}/api/webhooks/evolution/{webhook_secret}"
            result = await create_instance(restaurant, webhook_url)
            await db.whatsapp_instances.update_one({"restaurant_id": user["id"]}, {"$set": {"webhook_secret": webhook_secret}})
        else:
            result = await connect_instance(existing["instance_name"])
            await db.whatsapp_instances.update_one({"restaurant_id": user["id"]}, {"$set": {"qr_code": result.get("qr_code"), "connection_status": result["status"], "last_error": None, "updated_at": utcnow()}})
        return result
    except EvolutionError as exc:
        await db.whatsapp_instances.update_one({"restaurant_id": user["id"]}, {"$set": {"last_error": str(exc), "updated_at": utcnow()}}, upsert=False)
        raise HTTPException(502, str(exc)) from exc


@router.post("/api/restaurant/whatsapp/disconnect")
async def whatsapp_disconnect(user=Depends(restaurant_guard)):
    row = await db.whatsapp_instances.find_one({"restaurant_id": user["id"]}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Instância não encontrada.")
    try:
        await logout_instance(row["instance_name"])
    except EvolutionError as exc:
        raise HTTPException(502, str(exc)) from exc
    await db.whatsapp_instances.update_one({"restaurant_id": user["id"]}, {"$set": {"connection_status": "disconnected", "qr_code": None, "updated_at": utcnow()}})
    return {"ok": True}


@router.post("/api/webhooks/evolution/{webhook_secret}")
async def evolution_webhook(webhook_secret: str, request: Request):
    instance = await db.whatsapp_instances.find_one({"webhook_secret": webhook_secret}, {"_id": 0})
    if not instance:
        raise HTTPException(404)
    data = await request.json()
    event = str(data.get("event") or "").upper().replace(".", "_")
    payload = data.get("data") if isinstance(data.get("data"), dict) else data
    changes = {"updated_at": utcnow()}
    if "CONNECTION" in event:
        raw = payload.get("state") or payload.get("status") or (payload.get("instance") or {}).get("state")
        from evolution_service import normalize_connection_state
        changes["connection_status"] = normalize_connection_state(raw)
        if changes["connection_status"] == "connected":
            changes["qr_code"] = None
    if "QRCODE" in event:
        from evolution_service import extract_qr
        changes["qr_code"] = extract_qr(payload)
        changes["connection_status"] = "connecting"
    await db.whatsapp_instances.update_one({"id": instance["id"]}, {"$set": changes})
    return {"ok": True}
