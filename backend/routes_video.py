from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app_core import clean_doc, db, next_id, utcnow
from asaas_service import asaas_request
from auth_service import require_roles
from file_service import save_upload

router = APIRouter(prefix="/api", tags=["videos"])

@router.get("/restaurant/video-requests")
async def list_requests(user=Depends(require_roles("restaurant"))):
    products = await db.products.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("title", 1).to_list(5000)
    requests = await db.video_requests.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("id", -1).to_list(1000)
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}
    return {"products": products, "requests": requests, "video_price_cents": int(platform.get("video_price_cents", 399)), "is_model": bool(user.get("is_model"))}

@router.get("/restaurant/gallery")
async def gallery(user=Depends(require_roles("restaurant"))):
    requests = await db.video_requests.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("id", -1).to_list(5000)
    request_ids = [item["id"] for item in requests]
    items = await db.video_request_items.find({"request_id": {"$in": request_ids}}, {"_id": 0}).sort([("request_id", -1), ("id", 1)]).to_list(10000)
    products = {p["id"]: p for p in await db.products.find({"restaurant_id": user["id"]}, {"_id": 0}).to_list(10000)}
    grouped = {}
    for item in items: grouped.setdefault(item["request_id"], []).append(item)
    media = []
    for request in requests:
        request_items = grouped.get(request["id"]) or [None]
        for item in request_items:
            product = products.get((item or {}).get("product_id"), {})
            media.append({"request": request, "item": item, "product": product, "title": product.get("title") or request.get("title"), "image_file": (item or {}).get("image_file") or product.get("thumb_image") or request.get("image_file"), "video_file": (item or {}).get("video_file") or request.get("video_file")})
    return media

@router.post("/restaurant/video-requests")
async def create_request(product_ids: str = Form(...), notes: str = Form(""), auto_apply: bool = Form(True), billing_type: str = Form("PIX"), model_videos: list[UploadFile] = File(default=[]), user=Depends(require_roles("restaurant"))):
    ids = sorted({int(x) for x in product_ids.split(",") if x.strip().isdigit()})
    products = await db.products.find({"restaurant_id": user["id"], "id": {"$in": ids}}, {"_id": 0}).sort([("sort_order", 1), ("id", 1)]).to_list(1000)
    if not products: raise HTTPException(422, "Selecione pelo menos um produto.")
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}; total = int(platform.get("video_price_cents", 399)) * len(products)
    request_id = await next_id("video_requests")
    doc = {"id": request_id, "restaurant_id": user["id"], "product_id": products[0]["id"], "title": products[0]["title"] if len(products) == 1 else f"Lote de {len(products)} vídeos", "notes": notes or None, "image_file": products[0].get("thumb_image"), "status": "pending", "value_cents": total, "auto_apply": int(auto_apply), "payment_status": "waived" if user.get("is_model") else "pending", "created_at": utcnow()}
    await db.video_requests.insert_one(doc.copy())
    uploaded = []
    if user.get("is_model"):
        for file in model_videos: uploaded.append(await save_upload(file, "videos"))
    for index, product in enumerate(products):
        path = uploaded[index]["path"] if index < len(uploaded) and uploaded[index] else None
        item = {"id": await next_id("video_request_items"), "request_id": request_id, "product_id": product["id"], "image_file": product.get("thumb_image"), "video_file": path, "applied": int(bool(path and auto_apply)), "created_at": utcnow()}
        await db.video_request_items.insert_one(item)
        if path and auto_apply: await db.products.update_one({"id": product["id"]}, {"$set": {"video_file": path}})
    if not user.get("is_model"):
        restaurant = await db.restaurants.find_one({"id": user["id"]}, {"_id": 0})
        customer_id = restaurant.get("asaas_customer_id")
        if not customer_id: raise HTTPException(422, "Configure CPF/CNPJ e cliente Asaas antes de solicitar vídeos.")
        pay = asaas_request("POST", "/payments", {"customer": customer_id, "billingType": billing_type, "value": round(total / 100, 2), "dueDate": utcnow()[:10], "description": f'Solicitação de vídeo #{request_id} - {doc["title"]}'})
        await db.video_requests.update_one({"id": request_id}, {"$set": {"asaas_payment_id": pay.get("id")}})
        doc["payment"] = pay
        if billing_type == "PIX": doc["pix"] = asaas_request("GET", f'/payments/{pay["id"]}/pixQrCode')
    return clean_doc(doc)

@router.get("/superadmin/video-requests")
async def admin_requests(status: str = "all", user=Depends(require_roles("superadmin"))):
    query = {} if status == "all" else {"status": status}
    rows = await db.video_requests.find(query, {"_id": 0}).sort([("status", -1), ("id", -1)]).to_list(5000)
    names = {r["id"]: r["name"] for r in await db.restaurants.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(5000)}
    for row in rows: row["restaurant_name"] = names.get(row["restaurant_id"], "—")
    return rows

@router.get("/superadmin/video-requests/{item_id}")
async def admin_request(item_id: int, user=Depends(require_roles("superadmin"))):
    request = await db.video_requests.find_one({"id": item_id}, {"_id": 0})
    if not request: raise HTTPException(404)
    items = await db.video_request_items.find({"request_id": item_id}, {"_id": 0}).sort("id", 1).to_list(1000)
    products = {p["id"]: p for p in await db.products.find({"id": {"$in": [i.get("product_id") for i in items]}}, {"_id": 0}).to_list(1000)}
    for item in items: item["product"] = products.get(item.get("product_id"), {})
    return {"request": request, "items": items}

@router.post("/superadmin/video-requests/{item_id}/respond")
async def respond(item_id: int, target_item: int = Form(0), response_notes: str = Form(""), video_file: UploadFile | None = File(None), user=Depends(require_roles("superadmin"))):
    request = await db.video_requests.find_one({"id": item_id}, {"_id": 0}); upload = await save_upload(video_file, "videos")
    if not request: raise HTTPException(404)
    if target_item:
        if not upload: raise HTTPException(422, "Anexe o vídeo para este produto.")
        item = await db.video_request_items.find_one({"id": target_item, "request_id": item_id}, {"_id": 0})
        await db.video_request_items.update_one({"id": target_item}, {"$set": {"video_file": upload["path"], "applied": int(bool(request.get("auto_apply")))}})
        if request.get("auto_apply") and item: await db.products.update_one({"id": item.get("product_id"), "restaurant_id": request["restaurant_id"]}, {"$set": {"video_file": upload["path"]}})
    elif upload:
        await db.video_requests.update_one({"id": item_id}, {"$set": {"video_file": upload["path"]}})
        items = await db.video_request_items.find({"request_id": item_id}, {"_id": 0}).to_list(1000)
        for item in items:
            await db.video_request_items.update_one({"id": item["id"]}, {"$set": {"video_file": upload["path"], "applied": int(bool(request.get("auto_apply")))}})
            if request.get("auto_apply"): await db.products.update_one({"id": item.get("product_id")}, {"$set": {"video_file": upload["path"]}})
    pending = await db.video_request_items.count_documents({"request_id": item_id, "$or": [{"video_file": None}, {"video_file": ""}]})
    update = {"response_notes": response_notes}
    if not pending: update.update({"status": "done", "responded_at": utcnow()})
    await db.video_requests.update_one({"id": item_id}, {"$set": update})
    return {"ok": True}