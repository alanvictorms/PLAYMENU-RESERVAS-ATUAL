import mimetypes
import re
from pathlib import Path
from tempfile import SpooledTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from starlette.responses import FileResponse, StreamingResponse

from app_core import ROOT, clean_doc, db, files, next_id, utcnow
from asaas_service import asaas_request, ensure_customer, get_asaas_credentials, pix_qr_code, provision_video_request
from auth_service import require_roles
from file_service import save_upload

router = APIRouter(prefix="/api", tags=["videos"])

def _download_name(value: str, fallback: str = "imagem") -> str:
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value or "").strip("-.")
    return value or fallback

def _legacy_media_path(path: str) -> Path | None:
    relative = path.split("/public/assets/uploads/", 1)[-1].lstrip("/")
    candidate = (ROOT.parent / "frontend" / "public" / "public" / "assets" / "uploads" / relative).resolve()
    uploads_root = (ROOT.parent / "frontend" / "public" / "public" / "assets" / "uploads").resolve()
    return candidate if candidate.is_relative_to(uploads_root) and candidate.is_file() else None

async def _image_source(path: str):
    if path.startswith("/api/files/"):
        try:
            stream = await files.open_download_stream(ObjectId(path.rsplit("/", 1)[-1]))
        except Exception as exc:
            raise HTTPException(404, "Imagem não encontrada.") from exc
        return stream, None
    local_path = _legacy_media_path(path)
    if not local_path:
        raise HTTPException(404, "Imagem não encontrada.")
    return None, local_path

async def _stream_chunks(stream):
    while chunk := await stream.readchunk():
        yield chunk

def _file_chunks(source):
    try:
        while chunk := source.read(1024 * 1024):
            yield chunk
    finally:
        source.close()

PAID_STATUS = {"RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"}
OPEN_STATUS = {"PENDING", "AWAITING_RISK_ANALYSIS"}

async def _charge_request(request: dict, billing_type: str):
    """Gera a cobrança de uma solicitação de vídeo e devolve fatura + QR Code PIX."""
    restaurant = await db.restaurants.find_one({"id": request["restaurant_id"]}, {"_id": 0})
    key, base = await get_asaas_credentials()
    customer_id = await ensure_customer(restaurant, key, base)
    if request.get("asaas_payment_id"):
        try: asaas_request("DELETE", f'/payments/{request["asaas_payment_id"]}', key=key, base=base)
        except Exception: pass
    billing_type = "CREDIT_CARD" if billing_type == "CREDIT_CARD" else "PIX"
    payment = asaas_request("POST", "/payments", {"customer": customer_id, "billingType": billing_type, "value": round(int(request["value_cents"]) / 100, 2), "dueDate": utcnow()[:10], "description": f'Solicitação de vídeo #{request["id"]} - {request["title"]}'}, key=key, base=base)
    await db.video_requests.update_one({"id": request["id"]}, {"$set": {"asaas_payment_id": payment.get("id"), "billing_type": billing_type, "payment_status": "pending", "payment_created_at": utcnow()}})
    return {"payment": payment, "invoiceUrl": payment.get("invoiceUrl"), "billing_type": billing_type, "pix": pix_qr_code(payment["id"], billing_type, key, base)}

async def _sync_payment(request: dict):
    """Confere o status da cobrança no Asaas — o webhook pode não ter chegado ainda."""
    if request.get("payment_status") in {"paid", "waived"} or not request.get("asaas_payment_id"): return request
    key, base = await get_asaas_credentials()
    try: payment = asaas_request("GET", f'/payments/{request["asaas_payment_id"]}', key=key, base=base)
    except HTTPException: return request
    if payment.get("status") in PAID_STATUS:
        await provision_video_request(request["asaas_payment_id"], payment)
        return await db.video_requests.find_one({"id": request["id"]}, {"_id": 0})
    request["payment_detail"] = {"status": payment.get("status"), "invoiceUrl": payment.get("invoiceUrl"), "dueDate": payment.get("dueDate"), "expired": payment.get("status") == "OVERDUE"}
    return request

@router.get("/restaurant/video-requests")
async def list_requests(user=Depends(require_roles("restaurant"))):
    products = await db.products.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("title", 1).to_list(5000)
    categories = await db.categories.find({"restaurant_id": user["id"]}, {"_id": 0}).sort([("sort_order", 1), ("name", 1)]).to_list(1000)
    requests = await db.video_requests.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("id", -1).to_list(1000)
    counts = {}
    for item in await db.video_request_items.find({"request_id": {"$in": [r["id"] for r in requests]}}, {"_id": 0, "request_id": 1}).to_list(20000):
        counts[item["request_id"]] = counts.get(item["request_id"], 0) + 1
    for request in requests: request["items_count"] = counts.get(request["id"], 0)
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}
    return {"products": products, "categories": categories, "requests": requests, "video_price_cents": int(platform.get("video_price_cents", 399)), "is_model": bool(user.get("is_model"))}

@router.get("/restaurant/video-requests/{item_id}")
async def request_detail(item_id: int, user=Depends(require_roles("restaurant"))):
    request = await db.video_requests.find_one({"id": item_id, "restaurant_id": user["id"]}, {"_id": 0})
    if not request: raise HTTPException(404, "Solicitação não encontrada.")
    request = await _sync_payment(request)
    items = await db.video_request_items.find({"request_id": item_id}, {"_id": 0}).sort("id", 1).to_list(1000)
    products = {p["id"]: p for p in await db.products.find({"restaurant_id": user["id"], "id": {"$in": [i.get("product_id") for i in items]}}, {"_id": 0}).to_list(1000)}
    for item in items: item["product"] = products.get(item.get("product_id"), {})
    return {"request": clean_doc(request), "items": items}

@router.post("/restaurant/video-requests/{item_id}/payment")
async def request_payment(item_id: int, body: dict | None = None, user=Depends(require_roles("restaurant"))):
    """Gera a cobrança ou a segunda via quando o QR Code expirou."""
    request = await db.video_requests.find_one({"id": item_id, "restaurant_id": user["id"]}, {"_id": 0})
    if not request: raise HTTPException(404, "Solicitação não encontrada.")
    if request.get("payment_status") in {"paid", "waived"}: raise HTTPException(422, "Esta solicitação já está paga.")
    if request.get("status") == "cancelled": raise HTTPException(422, "Esta solicitação foi cancelada.")
    request = await _sync_payment(request)
    if request.get("payment_status") == "paid": return {"ok": True, "paid": True}
    return await _charge_request(request, str((body or {}).get("billing_type") or request.get("billing_type") or "PIX"))

@router.patch("/restaurant/video-requests/{item_id}/cancel")
async def cancel_request(item_id: int, user=Depends(require_roles("restaurant"))):
    request = await db.video_requests.find_one({"id": item_id, "restaurant_id": user["id"]}, {"_id": 0})
    if not request: raise HTTPException(404, "Solicitação não encontrada.")
    if request.get("status") == "done": raise HTTPException(422, "Esta solicitação já foi concluída.")
    if request.get("payment_status") == "paid": raise HTTPException(422, "Solicitação paga: fale com o suporte para cancelar.")
    if request.get("asaas_payment_id"):
        key, base = await get_asaas_credentials()
        try: asaas_request("DELETE", f'/payments/{request["asaas_payment_id"]}', key=key, base=base)
        except Exception: pass
    await db.video_requests.update_one({"id": item_id}, {"$set": {"status": "cancelled", "payment_status": "cancelled", "cancelled_at": utcnow(), "asaas_payment_id": None}})
    return {"ok": True}

@router.get("/restaurant/gallery")
async def gallery(user=Depends(require_roles("restaurant"))):
    requests = await db.video_requests.find({"restaurant_id": user["id"], "status": {"$nin": ["awaiting_payment", "cancelled"]}}, {"_id": 0}).sort("id", -1).to_list(5000)
    request_ids = [item["id"] for item in requests]
    items = await db.video_request_items.find({"request_id": {"$in": request_ids}}, {"_id": 0}).sort([("request_id", -1), ("id", 1)]).to_list(10000)
    products = {p["id"]: p for p in await db.products.find({"restaurant_id": user["id"]}, {"_id": 0}).to_list(10000)}
    categories = {c["id"]: c["name"] for c in await db.categories.find({"restaurant_id": user["id"]}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)}
    grouped = {}
    for item in items: grouped.setdefault(item["request_id"], []).append(item)
    media = []
    for request in requests:
        request_items = grouped.get(request["id"]) or [None]
        for item in request_items:
            product = products.get((item or {}).get("product_id"), {})
            media.append({"request": request, "item": item, "product": product, "title": product.get("title") or request.get("title"), "category_id": product.get("category_id"), "category_name": categories.get(product.get("category_id"), "Sem categoria"), "image_file": (item or {}).get("image_file") or product.get("thumb_image") or request.get("image_file"), "video_file": (item or {}).get("video_file") or request.get("video_file")})
    return media

@router.post("/restaurant/video-requests")
async def create_request(product_ids: str = Form(...), notes: str = Form(""), auto_apply: bool = Form(True), billing_type: str = Form("PIX"), model_videos: list[UploadFile] = File(default=[]), user=Depends(require_roles("restaurant"))):
    ids = sorted({int(x) for x in product_ids.split(",") if x.strip().isdigit()})
    products = await db.products.find({"restaurant_id": user["id"], "id": {"$in": ids}}, {"_id": 0}).sort([("sort_order", 1), ("id", 1)]).to_list(1000)
    if not products: raise HTTPException(422, "Selecione pelo menos um produto.")
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}; total = int(platform.get("video_price_cents", 399)) * len(products)
    request_id = await next_id("video_requests")
    # Enquanto o pagamento não é confirmado a solicitação fica em "awaiting_payment" e
    # não aparece para o Super Admin.
    doc = {"id": request_id, "restaurant_id": user["id"], "product_id": products[0]["id"], "title": products[0]["title"] if len(products) == 1 else f"Lote de {len(products)} vídeos", "notes": notes or None, "image_file": products[0].get("thumb_image"), "status": "pending" if user.get("is_model") else "awaiting_payment", "value_cents": total, "auto_apply": int(auto_apply), "payment_status": "waived" if user.get("is_model") else "pending", "created_at": utcnow()}
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
        charge = await _charge_request(doc, billing_type)
        doc.update({"payment": charge["payment"], "pix": charge["pix"], "invoiceUrl": charge["invoiceUrl"], "billing_type": charge["billing_type"], "asaas_payment_id": charge["payment"].get("id")})
    return clean_doc(doc)

@router.get("/superadmin/video-requests")
async def admin_requests(status: str = "all", user=Depends(require_roles("superadmin"))):
    # Solicitações sem pagamento confirmado (ou canceladas) não entram na fila de produção.
    query = {"status": {"$nin": ["awaiting_payment", "cancelled"]}} if status == "all" else {"status": status}
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

@router.get("/superadmin/video-requests/{request_id}/images/{item_id}/download")
async def download_request_image(request_id: int, item_id: int, user=Depends(require_roles("superadmin"))):
    item = await db.video_request_items.find_one({"id": item_id, "request_id": request_id}, {"_id": 0})
    if not item or not item.get("image_file"):
        raise HTTPException(404, "Imagem não encontrada.")
    product = await db.products.find_one({"id": item.get("product_id")}, {"_id": 0, "title": 1}) or {}
    stream, local_path = await _image_source(item["image_file"])
    suffix = Path(item["image_file"]).suffix or (Path(stream.filename).suffix if stream else "") or ".jpg"
    filename = f'{_download_name(product.get("title") or f"produto-{item_id}")}{suffix}'
    if local_path:
        return FileResponse(local_path, filename=filename, media_type=mimetypes.guess_type(filename)[0])
    content_type = (stream.metadata or {}).get("content_type") or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return StreamingResponse(_stream_chunks(stream), media_type=content_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})

@router.get("/superadmin/video-requests/{request_id}/images/download")
async def download_request_images(request_id: int, user=Depends(require_roles("superadmin"))):
    request = await db.video_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(404, "Solicitação não encontrada.")
    items = await db.video_request_items.find({"request_id": request_id, "image_file": {"$nin": [None, ""]}}, {"_id": 0}).sort("id", 1).to_list(1000)
    if not items:
        raise HTTPException(404, "Esta solicitação não possui imagens.")
    products = {p["id"]: p for p in await db.products.find({"id": {"$in": [i.get("product_id") for i in items]}}, {"_id": 0, "id": 1, "title": 1}).to_list(1000)}
    archive = SpooledTemporaryFile(max_size=16 * 1024 * 1024)
    used_names = set()
    with ZipFile(archive, "w", ZIP_DEFLATED) as zip_file:
        for index, item in enumerate(items, 1):
            stream, local_path = await _image_source(item["image_file"])
            suffix = Path(item["image_file"]).suffix or (Path(stream.filename).suffix if stream else "") or ".jpg"
            base = _download_name(products.get(item.get("product_id"), {}).get("title") or f"imagem-{index}")
            filename = f"{index:03d}-{base}{suffix}"
            while filename in used_names:
                filename = f"{index:03d}-{base}-{item['id']}{suffix}"
            used_names.add(filename)
            with zip_file.open(filename, "w") as target:
                if local_path:
                    with local_path.open("rb") as source:
                        while chunk := source.read(1024 * 1024):
                            target.write(chunk)
                else:
                    while chunk := await stream.readchunk():
                        target.write(chunk)
    archive.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="solicitacao-{request_id}-imagens.zip"'}
    return StreamingResponse(_file_chunks(archive), media_type="application/zip", headers=headers)

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