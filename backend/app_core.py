import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
files = AsyncIOMotorGridFSBucket(db, bucket_name="playmenu_files")

COLLECTIONS = {
    "admins", "agents", "agent_routes", "agent_route_stops", "app_settings",
    "categories", "commissions", "commission_rules", "menu_analytics_events",
    "password_resets", "plans", "platform_settings", "products", "restaurants",
    "restaurant_reviews", "settings", "subscriptions_payments", "support_materials",
    "video_requests", "video_request_items", "withdrawals", "bio_pages",
    "qr_templates", "menu_import_jobs",
}

def utcnow():
    return datetime.now(timezone.utc).isoformat()

def clean_doc(doc):
    if doc is None:
        return None
    out = {}
    for key, value in doc.items():
        if key == "_id":
            continue
        if isinstance(value, datetime):
            value = value.isoformat()
        out[key] = value
    return out

async def next_id(collection: str) -> int:
    row = await db[collection].find_one({}, {"_id": 0, "id": 1}, sort=[("id", -1)])
    return int((row or {}).get("id") or 0) + 1

def slugify(value: str) -> str:
    import unicodedata
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value)) or "restaurante"

def money(cents) -> str:
    value = int(cents or 0) / 100
    return "R$ " + f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def public_media(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith("/api/files/") or path.startswith("http"):
        return path
    return "/public/assets/uploads/" + path.lstrip("/")

async def unique_slug(name: str) -> str:
    base = slugify(name)
    slug, index = base, 2
    while await db.restaurants.find_one({"slug": slug}, {"_id": 1}):
        slug, index = f"{base}-{index}", index + 1
    return slug

def new_file_name(original: str, folder: str) -> str:
    suffix = Path(original).suffix.lower()
    return f"{folder}/{uuid.uuid4().hex}{suffix}"
