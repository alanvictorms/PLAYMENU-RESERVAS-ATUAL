"""Integração isolada com a Evolution API.

As credenciais globais nunca saem do backend. Cada restaurante possui uma
instância própria e o restante do sistema pode operar normalmente enquanto o
WhatsApp ainda não estiver configurado/conectado.
"""

import logging
import re
from urllib.parse import quote

import httpx

from app_core import db, next_id, utcnow

logger = logging.getLogger(__name__)


class EvolutionError(RuntimeError):
    pass


async def _global_config() -> tuple[str, str]:
    rows = await db.app_settings.find(
        {"setting_key": {"$in": ["evolution_api_url", "evolution_api_key"]}},
        {"_id": 0},
    ).to_list(10)
    values = {row["setting_key"]: str(row.get("setting_value") or "").strip() for row in rows}
    url = values.get("evolution_api_url", "").rstrip("/")
    api_key = values.get("evolution_api_key", "")
    if not url or not api_key:
        raise EvolutionError("A Evolution API ainda não foi configurada pelo Super Admin.")
    return url, api_key


async def evolution_is_configured() -> bool:
    try:
        await _global_config()
        return True
    except EvolutionError:
        return False


async def _request(method: str, path: str, payload: dict | None = None) -> dict:
    url, api_key = await _global_config()
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.request(
                method,
                f"{url}{path}",
                headers={"apikey": api_key, "Content-Type": "application/json"},
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise EvolutionError("Não foi possível acessar a Evolution API.") from exc
    if response.status_code >= 400:
        try:
            detail = response.json().get("message") or response.json().get("error")
        except Exception:
            detail = response.text[:240]
        if isinstance(detail, list):
            detail = "; ".join(map(str, detail))
        raise EvolutionError(str(detail or f"Evolution API respondeu HTTP {response.status_code}."))
    try:
        return response.json()
    except ValueError:
        return {"ok": True}


def instance_name(restaurant_id: int, slug: str = "") -> str:
    clean_slug = re.sub(r"[^a-z0-9-]", "", str(slug).lower())[:28].strip("-")
    return f"playmenu-{restaurant_id}-{clean_slug or 'restaurante'}"


def normalize_connection_state(value) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"open", "connected", "online"}:
        return "connected"
    if raw in {"connecting", "created", "pairing"}:
        return "connecting"
    return "disconnected"


def extract_qr(data: dict | None) -> str | None:
    if not isinstance(data, dict):
        return None
    qrcode = data.get("qrcode") if isinstance(data.get("qrcode"), dict) else data
    value = qrcode.get("base64") or qrcode.get("base64Qr")
    return str(value) if value else None


async def create_instance(restaurant: dict, webhook_url: str | None = None) -> dict:
    name = instance_name(restaurant["id"], restaurant.get("slug", ""))
    token = __import__("secrets").token_urlsafe(32)
    payload = {
        "instanceName": name,
        "qrcode": True,
        "integration": "WHATSAPP-BAILEYS",
        "token": token,
    }
    if webhook_url:
        payload["webhook"] = {
            "enabled": True,
            "url": webhook_url,
            "byEvents": False,
            "base64": True,
            "events": ["QRCODE_UPDATED", "CONNECTION_UPDATE"],
        }
    try:
        data = await _request("POST", "/instance/create", payload)
    except EvolutionError as exc:
        # Instâncias previamente criadas continuam reutilizáveis. O status abaixo
        # confirma se o conflito veio de uma instância que de fato existe.
        if not any(word in str(exc).lower() for word in ("exist", "already", "unique")):
            raise
        data = await _request("GET", f"/instance/connectionState/{quote(name)}")
    raw_state = (
        (data.get("instance") or {}).get("state")
        or (data.get("instance") or {}).get("status")
        or "connecting"
    )
    values = {
        "instance_name": name,
        "instance_token": token,
        "connection_status": normalize_connection_state(raw_state),
        "qr_code": extract_qr(data),
        "last_error": None,
        "updated_at": utcnow(),
    }
    await db.whatsapp_instances.update_one(
        {"restaurant_id": restaurant["id"]},
        {"$set": values, "$setOnInsert": {"id": await next_id("whatsapp_instances"), "restaurant_id": restaurant["id"], "created_at": utcnow()}},
        upsert=True,
    )
    return {"instance_name": name, "status": values["connection_status"], "qr_code": values["qr_code"]}


async def connect_instance(name: str) -> dict:
    data = await _request("GET", f"/instance/connect/{quote(name)}")
    return {"status": "connecting", "qr_code": extract_qr(data), "raw": data}


async def connection_state(name: str) -> str:
    data = await _request("GET", f"/instance/connectionState/{quote(name)}")
    raw = (data.get("instance") or {}).get("state") or data.get("state")
    return normalize_connection_state(raw)


async def logout_instance(name: str) -> None:
    await _request("DELETE", f"/instance/logout/{quote(name)}")


async def send_text(restaurant_id: int, number: str, text: str, kind: str = "notification", reference_id: int | None = None) -> bool:
    instance = await db.whatsapp_instances.find_one({"restaurant_id": restaurant_id}, {"_id": 0})
    if not instance or instance.get("connection_status") != "connected":
        raise EvolutionError("O WhatsApp do restaurante não está conectado.")
    payload = {"number": number, "text": text, "linkPreview": True}
    try:
        try:
            await _request("POST", f"/message/sendText/{quote(instance['instance_name'])}", payload)
        except EvolutionError:
            # Compatibilidade com instalações que ainda usam o formato textMessage.
            legacy = {"number": number, "textMessage": {"text": text}, "linkPreview": True}
            await _request("POST", f"/message/sendText/{quote(instance['instance_name'])}", legacy)
        status, error = "sent", None
        return True
    except EvolutionError as exc:
        status, error = "failed", str(exc)
        raise
    finally:
        await db.whatsapp_message_logs.insert_one({
            "id": await next_id("whatsapp_message_logs"),
            "restaurant_id": restaurant_id,
            "reference_id": reference_id,
            "kind": kind,
            "number": number,
            "status": status,
            "error": error,
            "created_at": utcnow(),
        })


async def safe_send_text(*args, **kwargs) -> bool:
    try:
        return await send_text(*args, **kwargs)
    except Exception as exc:
        logger.warning("WhatsApp não enviado: %s", exc)
        return False
