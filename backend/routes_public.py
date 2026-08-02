import csv
import hashlib
import io
import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import Response

from app_core import clean_doc, db, next_id, public_media, utcnow
from asaas_service import provision_payment
from file_service import stream_file
from auth_service import require_roles

router = APIRouter(tags=["public"])

def visitor_id(request):
    return request.cookies.get("pm_visitor") or uuid.uuid4().hex

async def track(request, restaurant_id, event_type, product_id=None, link_type=None, link_label=None):
    forwarded = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    doc = {"id": await next_id("menu_analytics_events"), "restaurant_id": restaurant_id, "event_type": event_type, "product_id": product_id, "link_type": link_type, "link_label": link_label, "visitor_id": visitor_id(request), "ip_hash": hashlib.sha256(forwarded.encode()).hexdigest(), "user_agent": request.headers.get("user-agent"), "referrer": request.headers.get("referer"), "page_url": str(request.url), "created_at": utcnow()}
    await db.menu_analytics_events.insert_one(doc)

@router.get("/api/public/menu")
async def public_menu(request: Request, r: str = "", q: str = "", cat: int = 0, preview: bool = False):
    restaurant = await db.restaurants.find_one({"slug": r, **({} if preview else {"is_active": 1})}, {"_id": 0}) if r else await db.restaurants.find_one({"is_active": 1}, {"_id": 0}, sort=[("id", 1)])
    if not restaurant: raise HTTPException(404, "Restaurante não encontrado.")
    rid = restaurant["id"]
    settings = await db.settings.find_one({"restaurant_id": rid}, {"_id": 0}) or {"store_name": restaurant["name"], "tagline": "", "badge_text": "Antenado"}
    query = {"restaurant_id": rid, "is_active": 1}
    if cat: query["category_id"] = cat
    if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
    products = await db.products.find(query, {"_id": 0}).sort([("sort_order", 1), ("id", -1)]).to_list(10000)
    categories = await db.categories.find({"restaurant_id": rid, "is_active": 1}, {"_id": 0}).sort([("sort_order", 1), ("name", 1)]).to_list(1000)
    reviews = await db.restaurant_reviews.find({"restaurant_id": rid, "status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for row in products:
        for field in ["thumb_image", "video_file", "ar_model_file"]: row[field.replace("_file", "_url").replace("thumb_image", "image_url")] = public_media(row.get(field))
    if not preview: await track(request, rid, "menu_view")
    avg = sum(int(x.get("rating", 0)) for x in reviews) / len(reviews) if reviews else 0
    return {"restaurant": restaurant, "settings": settings, "categories": categories, "products": products, "reviews": reviews, "reviews_summary": {"total": len(reviews), "avg_rating": avg}}

@router.get("/api/public/product/{item_id}")
async def product(item_id: int, request: Request):
    row = await db.products.find_one({"id": item_id, "is_active": 1}, {"_id": 0})
    if not row: raise HTTPException(404)
    await track(request, row["restaurant_id"], "product_view", item_id)
    return {**row, "price": f'R$ {int(row.get("price_cents",0))/100:.2f}'.replace(".", ","), "image_url": public_media(row.get("thumb_image")), "video_url": public_media(row.get("video_file")), "ar_model_url": public_media(row.get("ar_model_file"))}

@router.post("/api/public/analytics")
async def analytics(body: dict, request: Request):
    event = body.get("event_type")
    if event not in {"product_view", "link_click"}: raise HTTPException(400)
    restaurant_id = int(body.get("restaurant_id", 0))
    product_id = int(body.get("product_id", 0)) or None
    if product_id:
        product = await db.products.find_one({"id": product_id, "is_active": 1}, {"_id": 0, "restaurant_id": 1})
        if not product: raise HTTPException(400)
        restaurant_id = product["restaurant_id"]
    await track(request, restaurant_id, event, product_id, body.get("link_type"), body.get("link_label"))
    return {"ok": True}

@router.post("/api/public/reviews")
async def review(body: dict):
    rating = int(body.get("rating", 0)); restaurant_id = int(body.get("restaurant_id", 0))
    if rating < 1 or rating > 5: raise HTTPException(422, "Selecione uma nota de 1 a 5 estrelas.")
    doc = {"id": await next_id("restaurant_reviews"), "restaurant_id": restaurant_id, "customer_name": str(body.get("customer_name", ""))[:120] or None, "rating": rating, "comment": str(body.get("comment", ""))[:1000] or None, "status": "pending", "created_at": utcnow(), "reviewed_at": None}
    await db.restaurant_reviews.insert_one(doc.copy()); return {"ok": True}

@router.get("/api/public/bio/{restaurant_slug}/{page_slug}")
async def public_bio_page(restaurant_slug: str, page_slug: str):
    restaurant = await db.restaurants.find_one({"slug": restaurant_slug, "is_active": 1}, {"_id": 0, "id": 1, "name": 1})
    if not restaurant:
        raise HTTPException(404, "Restaurante não encontrado.")
    page = await db.bio_pages.find_one({"restaurant_id": restaurant["id"], "slug": page_slug, "published": True}, {"_id": 0})
    if not page:
        raise HTTPException(404, "Página não encontrada ou ainda não publicada.")
    return {"html": page.get("html", ""), "project_name": page.get("project_name"), "updated_at": page.get("updated_at")}

@router.get("/api/files/{file_id}")
async def get_file(file_id: str): return await stream_file(file_id)

@router.post("/api/webhooks/asaas")
async def asaas_webhook(request: Request, tasks: BackgroundTasks):
    expected = os.environ.get("ASAAS_WEBHOOK_SECRET", "")
    if not expected or request.headers.get("asaas-access-token", "") != expected: raise HTTPException(401, "Unauthorized")
    data = await request.json()
    if not data.get("event"): raise HTTPException(400, "Invalid payload")
    if data["event"] in {"PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"} and data.get("payment"):
        tasks.add_task(provision_payment, data["payment"])
    return {"ok": True}

@router.get("/api/restaurant/metrics/export")
async def export_metrics(start: str, end: str, user=Depends(require_roles("restaurant"))):
    restaurant_id = user["id"]
    events = await db.menu_analytics_events.find({"restaurant_id": restaurant_id, "created_at": {"$gte": start, "$lte": end + "T23:59:59"}}, {"_id": 0}).sort("created_at", -1).to_list(100000)
    products = {p["id"]: p["title"] for p in await db.products.find({"restaurant_id": restaurant_id}, {"_id": 0, "id": 1, "title": 1}).to_list(10000)}
    stream = io.StringIO(); writer = csv.writer(stream, delimiter=";"); writer.writerow(["Data", "Evento", "Produto", "Tipo do link", "Link", "Visitante"])
    for event in events: writer.writerow([event.get("created_at"), event.get("event_type"), products.get(event.get("product_id"), ""), event.get("link_type", ""), event.get("link_label", ""), event.get("visitor_id", "")])
    return Response("\ufeff" + stream.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="metricas-playmenu-{start}-a-{end}.csv"'})