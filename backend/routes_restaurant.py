import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ai_menu_service import (
    analyze_menu_upload,
    generate_menu_descriptions,
    normalize_allergens,
    poll_menu_analysis,
)
from app_core import clean_doc, db, next_id, slugify, utcnow
from asaas_service import plan_discount, start_billing
from auth_service import hash_password, require_roles, verify_password
from file_service import save_upload
from qr_template_service import active_qr_templates

router = APIRouter(prefix="/api/restaurant", tags=["restaurant"])
guard = require_roles("restaurant")

async def owned(collection, item_id, user):
    item = await db[collection].find_one({"id": item_id, "restaurant_id": user["id"]}, {"_id": 0})
    if not item: raise HTTPException(404, "Registro não encontrado.")
    return item

@router.get("/dashboard")
async def dashboard(user=Depends(guard)):
    rid = user["id"]
    return {"restaurant": user, "counts": {
        "categories": await db.categories.count_documents({"restaurant_id": rid}),
        "products": await db.products.count_documents({"restaurant_id": rid}),
        "featured": await db.products.count_documents({"restaurant_id": rid, "is_featured": 1}),
        "video_pending": await db.video_requests.count_documents({"restaurant_id": rid, "status": "pending"}),
        "video_done": await db.video_requests.count_documents({"restaurant_id": rid, "status": {"$in": ["done", "completed"]}}),
    }}

@router.get("/categories")
async def categories(user=Depends(guard)):
    return await db.categories.find({"restaurant_id": user["id"]}, {"_id": 0}).sort([("sort_order", 1), ("name", 1)]).to_list(1000)

@router.post("/categories")
async def category_save(body: dict, user=Depends(guard)):
    name = str(body.get("name", "")).strip()
    if not name: raise HTTPException(422, "Informe o nome da categoria.")
    if body.get("id"):
        await db.categories.update_one({"id": int(body["id"]), "restaurant_id": user["id"]}, {"$set": {"name": name, "sort_order": int(body.get("sort_order", 0))}})
        return {"ok": True, "message": "Categoria atualizada."}
    doc = {"id": await next_id("categories"), "restaurant_id": user["id"], "name": name, "sort_order": int(body.get("sort_order", 0)), "is_active": 1, "created_at": utcnow()}
    await db.categories.insert_one(doc.copy()); return clean_doc(doc)

@router.patch("/categories/{item_id}/{action}")
async def category_action(item_id: int, action: str, user=Depends(guard)):
    item = await owned("categories", item_id, user)
    if action == "toggle": await db.categories.update_one({"id": item_id}, {"$set": {"is_active": 0 if item.get("is_active") else 1}})
    elif action == "delete": await db.categories.delete_one({"id": item_id, "restaurant_id": user["id"]})
    else: raise HTTPException(404)
    return {"ok": True}

@router.get("/products")
async def products(cat: int = 0, q: str = "", user=Depends(guard)):
    query = {"restaurant_id": user["id"]}
    if cat: query["category_id"] = cat
    if q: query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]
    rows = await db.products.find(query, {"_id": 0}).sort([("is_featured", -1), ("sort_order", 1), ("id", -1)]).to_list(5000)
    categories_map = {r["id"]: r["name"] for r in await db.categories.find({"restaurant_id": user["id"]}, {"_id": 0}).to_list(1000)}
    for row in rows: row["category_name"] = categories_map.get(row.get("category_id"), "—")
    return rows

@router.get("/products/{item_id}")
async def product(item_id: int, user=Depends(guard)):
    return await owned("products", item_id, user)

@router.post("/products")
async def product_save(
    id: int = Form(0), category_id: str = Form(""), title: str = Form(...), description: str = Form(""), allergens: str = Form(""),
    price_cents: int = Form(0), sort_order: int = Form(0), is_active: bool = Form(True), ar_enabled: bool = Form(False), remove_video: bool = Form(False),
    thumb_image: UploadFile | None = File(None), video_file: UploadFile | None = File(None), ar_model_file: UploadFile | None = File(None), user=Depends(guard)
):
    values = {"category_id": int(category_id) if category_id else None, "title": title.strip(), "description": description.strip(), "allergens": allergens or None, "price_cents": price_cents, "sort_order": sort_order, "is_active": int(is_active), "ar_enabled": int(ar_enabled)}
    thumb = await save_upload(thumb_image, "thumbs"); video = await save_upload(video_file, "videos") if user.get("is_model") else None; model = await save_upload(ar_model_file, "models3d")
    if thumb: values["thumb_image"] = thumb["path"]
    if video: values["video_file"] = video["path"]
    if model: values["ar_model_file"] = model["path"]
    if remove_video: values["video_file"] = None
    if id:
        await owned("products", id, user); await db.products.update_one({"id": id}, {"$set": values}); return {"id": id, "message": "Produto atualizado."}
    values.update({"id": await next_id("products"), "restaurant_id": user["id"], "is_featured": 0, "featured_label": "Mais pedido hoje", "featured_icon": "🔥", "created_at": utcnow()})
    await db.products.insert_one(values.copy()); return clean_doc(values)

@router.patch("/products/{item_id}/{action}")
async def product_action(item_id: int, action: str, user=Depends(guard)):
    item = await owned("products", item_id, user)
    if action == "toggle": await db.products.update_one({"id": item_id}, {"$set": {"is_active": 0 if item.get("is_active") else 1}})
    elif action == "feature": await db.products.update_one({"id": item_id}, {"$set": {"is_featured": 0 if item.get("is_featured") else 1}})
    elif action == "delete": await db.products.delete_one({"id": item_id, "restaurant_id": user["id"]})
    else: raise HTTPException(404)
    return {"ok": True}

@router.post("/menu-import/analyze")
async def analyze_menu(menu_file: UploadFile = File(...), user=Depends(guard)):
    return await analyze_menu_upload(menu_file, user["id"])

@router.get("/menu-import/analyze/{job_id}")
async def menu_import_analysis_status(job_id: str, user=Depends(guard)):
    return await poll_menu_analysis(job_id, user["id"])

@router.post("/menu-import/descriptions")
async def menu_import_descriptions(body: dict, user=Depends(guard)):
    return await generate_menu_descriptions(body.get("items"), user["id"])

@router.post("/menu-import/confirm")
async def confirm_menu_import(body: dict, user=Depends(guard)):
    raw_items = body.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise HTTPException(422, "Nenhum produto foi selecionado para cadastro.")
    if len(raw_items) > 300:
        raise HTTPException(422, "O limite por importação é de 300 produtos.")

    selected = [
        item for item in raw_items
        if isinstance(item, dict) and item.get("selected", True) and str(item.get("title") or "").strip()
    ]
    if not selected:
        raise HTTPException(422, "Selecione pelo menos um produto.")

    existing_categories = await db.categories.find(
        {"restaurant_id": user["id"]},
        {"_id": 0},
    ).sort([("sort_order", 1), ("id", 1)]).to_list(1000)
    category_map = {str(item.get("name") or "").strip().casefold(): item for item in existing_categories}
    next_category_id = await next_id("categories")
    next_category_order = max([int(item.get("sort_order") or 0) for item in existing_categories] or [-1]) + 1
    created_categories = []

    for raw in selected:
        name = str(raw.get("category") or "Outros").strip()[:80] or "Outros"
        key = name.casefold()
        if key in category_map:
            continue
        document = {
            "id": next_category_id,
            "restaurant_id": user["id"],
            "name": name,
            "sort_order": next_category_order,
            "is_active": 1,
            "created_at": utcnow(),
        }
        await db.categories.insert_one(document.copy())
        category_map[key] = document
        created_categories.append(clean_doc(document))
        next_category_id += 1
        next_category_order += 1

    next_product_id = await next_id("products")
    activate = int(bool(body.get("activate", True)))
    products = []
    for position, raw in enumerate(selected):
        title = str(raw.get("title") or "").strip()[:140]
        if not title:
            continue
        category_name = str(raw.get("category") or "Outros").strip()[:80] or "Outros"
        try:
            price_cents = max(0, int(raw.get("price_cents") or 0))
        except (TypeError, ValueError):
            price_cents = 0
        try:
            sort_order = int(raw.get("sort_order") if raw.get("sort_order") is not None else position)
        except (TypeError, ValueError):
            sort_order = position
        document = {
            "id": next_product_id,
            "restaurant_id": user["id"],
            "category_id": category_map[category_name.casefold()]["id"],
            "title": title,
            "description": str(raw.get("description") or "").strip()[:1000],
            "allergens": ",".join(normalize_allergens(raw.get("allergens"))) or None,
            "price_cents": price_cents,
            "sort_order": sort_order,
            "is_active": activate,
            "ar_enabled": 0,
            "is_featured": 0,
            "featured_label": "Mais pedido hoje",
            "featured_icon": "🔥",
            "thumb_image": None,
            "video_file": None,
            "ar_model_file": None,
            "created_at": utcnow(),
            "import_source": "ai_menu",
        }
        await db.products.insert_one(document.copy())
        products.append(clean_doc(document))
        next_product_id += 1

    if not products:
        raise HTTPException(422, "Os produtos selecionados não têm nomes válidos.")
    return {
        "ok": True,
        "categories_created": len(created_categories),
        "products_created": len(products),
        "products": products,
    }

@router.get("/settings")
async def get_settings(user=Depends(guard)):
    return await db.settings.find_one({"restaurant_id": user["id"]}, {"_id": 0}) or {"restaurant_id": user["id"], "store_name": user["name"]}

@router.post("/settings")
async def save_settings(store_name: str = Form(...), tagline: str = Form(""), badge_text: str = Form("Antenado"), instagram: str = Form(""), whatsapp: str = Form(""), social_links: str = Form("[]"), logo_image: UploadFile | None = File(None), cover_image: UploadFile | None = File(None), user=Depends(guard)):
    try: social = json.loads(social_links)
    except Exception: social = []
    values = {"store_name": store_name, "tagline": tagline, "badge_text": badge_text, "instagram": instagram or None, "whatsapp": "".join(filter(str.isdigit, whatsapp)) or None, "social_links": social}
    logo = await save_upload(logo_image, "branding"); cover = await save_upload(cover_image, "branding")
    if logo: values["logo_image"] = logo["path"]
    if cover: values["cover_image"] = cover["path"]
    await db.settings.update_one({"restaurant_id": user["id"]}, {"$set": values, "$setOnInsert": {"id": await next_id("settings"), "restaurant_id": user["id"]}}, upsert=True)
    return {"ok": True, "message": "Configurações salvas."}

@router.get("/qr-kit")
async def qr_kit(user=Depends(guard)):
    restaurant = await db.restaurants.find_one(
        {"id": user["id"]},
        {"_id": 0, "name": 1, "slug": 1},
    )
    settings = await db.settings.find_one(
        {"restaurant_id": user["id"]},
        {"_id": 0, "logo_image": 1, "store_name": 1},
    ) or {}
    return {
        "restaurant": {
            "name": settings.get("store_name") or restaurant.get("name"),
            "slug": restaurant.get("slug"),
            "logo_image": settings.get("logo_image"),
        },
        "menu_path": f'/cardapio?r={restaurant.get("slug")}',
        "templates": await active_qr_templates(),
    }

@router.post("/wizard")
async def wizard(store_name: str = Form(...), instagram: str = Form(""), whatsapp: str = Form(""), address: str = Form(""), latitude: str = Form(""), longitude: str = Form(""), logo_image: UploadFile | None = File(None), cover_image: UploadFile | None = File(None), user=Depends(guard)):
    await save_settings(store_name, "", "Antenado", instagram, whatsapp, "[]", logo_image, cover_image, user)
    await db.restaurants.update_one({"id": user["id"]}, {"$set": {"address": address or None, "latitude": float(latitude) if latitude else None, "longitude": float(longitude) if longitude else None}})
    return {"ok": True}

@router.get("/profile")
async def profile(user=Depends(guard)): return user

@router.patch("/profile")
async def profile_update(body: dict, user=Depends(guard)):
    action = body.get("action")
    if action == "change_password":
        raw = await db.restaurants.find_one({"id": user["id"]}, {"_id": 0})
        if not verify_password(str(body.get("current_password", "")), raw.get("password_hash", "")): raise HTTPException(422, "Senha atual incorreta.")
        if len(str(body.get("new_password", ""))) < 6 or body.get("new_password") != body.get("confirm_password"): raise HTTPException(422, "Revise a nova senha e sua confirmação.")
        await db.restaurants.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body["new_password"])}})
    else:
        values = {k: body.get(k) for k in ["name", "email", "phone", "cpf_cnpj"] if k in body}
        if values.get("email") and values["email"].lower() != user.get("email", "").lower(): values.update({"email_verified_at": None, "email_verification_token": None, "email_verification_sent_at": None})
        await db.restaurants.update_one({"id": user["id"]}, {"$set": values})
    return {"ok": True}

@router.get("/reviews")
async def reviews(status: str = "pending", user=Depends(guard)):
    query = {"restaurant_id": user["id"]}
    if status != "all": query["status"] = status
    return await db.restaurant_reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@router.patch("/reviews/{item_id}/{action}")
async def review_action(item_id: int, action: str, user=Depends(guard)):
    await owned("restaurant_reviews", item_id, user)
    if action in {"approve", "reject"}: await db.restaurant_reviews.update_one({"id": item_id}, {"$set": {"status": "approved" if action == "approve" else "rejected", "reviewed_at": utcnow()}})
    elif action == "delete": await db.restaurant_reviews.delete_one({"id": item_id})
    return {"ok": True}

@router.get("/subscriptions")
async def subscriptions(user=Depends(guard)):
    plans = await db.plans.find({"is_active": 1}, {"_id": 0}).sort([("price_cents", 1), ("name", 1)]).to_list(100)
    for plan in plans: plan["effective_price_cents"] = max(0, int(plan.get("price_cents", 0)) - plan_discount(plan))
    payments = await db.subscriptions_payments.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("id", -1).to_list(100)
    return {"restaurant": user, "plans": plans, "payments": payments}

@router.post("/billing")
async def billing(body: dict, user=Depends(guard)):
    return await start_billing(user["id"], int(body.get("plan_id", 0)), "CREDIT_CARD" if body.get("billing_type") == "CREDIT_CARD" else "PIX")

@router.get("/metrics")
async def metrics(start: str = "", end: str = "", product_id: int = 0, user=Depends(guard)):
    end_dt = datetime.now(timezone.utc) if not end else datetime.fromisoformat(end + "T23:59:59+00:00")
    start_dt = end_dt - timedelta(days=29) if not start else datetime.fromisoformat(start + "T00:00:00+00:00")
    query = {"restaurant_id": user["id"], "created_at": {"$gte": start_dt.isoformat(), "$lte": end_dt.isoformat()}}
    events = await db.menu_analytics_events.find(query, {"_id": 0}).to_list(100000)
    filtered_product = [e for e in events if e.get("event_type") == "product_view" and (not product_id or e.get("product_id") == product_id)]
    products = await db.products.find({"restaurant_id": user["id"]}, {"_id": 0, "id": 1, "title": 1}).to_list(5000); names = {p["id"]: p["title"] for p in products}
    counts = {}; daily = {}
    for event in events:
        day = str(event.get("created_at", ""))[:10]; daily.setdefault(day, {"menu": 0, "products": 0, "links": 0})
        key = {"menu_view": "menu", "product_view": "products", "link_click": "links"}.get(event.get("event_type"))
        if key and (key != "products" or not product_id or event.get("product_id") == product_id): daily[day][key] += 1
        if event.get("event_type") == "product_view": counts[event.get("product_id")] = counts.get(event.get("product_id"), 0) + 1
    return {"menu_views": sum(e.get("event_type") == "menu_view" for e in events), "unique_visitors": len({e.get("visitor_id") for e in events if e.get("visitor_id")}), "product_views": len(filtered_product), "link_clicks": sum(e.get("event_type") == "link_click" for e in events), "daily": daily, "top_products": sorted([{"id": k, "title": names.get(k, "Produto"), "views": v} for k, v in counts.items()], key=lambda x: -x["views"])[:10], "products": products}

@router.get("/bio-pages")
async def bio_pages(user=Depends(guard)):
    restaurant = await db.restaurants.find_one({"id": user["id"]}, {"_id": 0, "slug": 1})
    rows = await db.bio_pages.find({"restaurant_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    result = []
    for row in rows:
        state = dict(row.get("state") or {})
        state.update({
            "projectId": row["project_id"],
            "projectName": row.get("project_name", "Página sem título"),
            "updatedAt": row.get("updated_at"),
            "published": bool(row.get("published")),
            "slug": row.get("slug"),
            "publicUrl": f'/bio/{restaurant.get("slug")}/{row.get("slug")}' if row.get("published") else None,
        })
        result.append(state)
    return result

async def unique_bio_slug(restaurant_id: int, name: str, project_id: str) -> str:
    existing = await db.bio_pages.find_one({"restaurant_id": restaurant_id, "project_id": project_id}, {"_id": 0, "slug": 1})
    if existing and existing.get("slug"):
        return existing["slug"]
    base = slugify(name) or "pagina"
    candidate, suffix = base, 2
    while await db.bio_pages.find_one({"restaurant_id": restaurant_id, "slug": candidate, "project_id": {"$ne": project_id}}, {"_id": 1}):
        candidate, suffix = f"{base}-{suffix}", suffix + 1
    return candidate

@router.post("/bio-pages")
async def save_bio_page(body: dict, user=Depends(guard)):
    project_id = str(body.get("project_id") or "").strip()
    project_name = str(body.get("project_name") or "Página sem título").strip()[:80]
    state = body.get("state")
    html = str(body.get("html") or "")
    if not project_id or not isinstance(state, dict):
        raise HTTPException(422, "Projeto inválido.")
    slug = await unique_bio_slug(user["id"], project_name, project_id)
    existing = await db.bio_pages.find_one({"restaurant_id": user["id"], "project_id": project_id}, {"_id": 0})
    values = {"project_name": project_name, "slug": slug, "state": state, "html": html, "updated_at": utcnow()}
    if "published" in body:
        values["published"] = bool(body.get("published"))
        if body.get("published"):
            values["published_at"] = utcnow()
    elif not existing:
        values["published"] = False
    await db.bio_pages.update_one(
        {"restaurant_id": user["id"], "project_id": project_id},
        {"$set": values, "$setOnInsert": {"id": await next_id("bio_pages"), "restaurant_id": user["id"], "project_id": project_id, "created_at": utcnow()}},
        upsert=True,
    )
    restaurant = await db.restaurants.find_one({"id": user["id"]}, {"_id": 0, "slug": 1})
    return {"ok": True, "slug": slug, "published": bool(values.get("published", (existing or {}).get("published"))), "public_url": f'/bio/{restaurant.get("slug")}/{slug}'}

@router.delete("/bio-pages/{project_id}")
async def delete_bio_page(project_id: str, user=Depends(guard)):
    result = await db.bio_pages.delete_one({"restaurant_id": user["id"], "project_id": project_id})
    if not result.deleted_count:
        raise HTTPException(404, "Página não encontrada.")
    return {"ok": True}

@router.post("/bio-assets")
async def upload_bio_asset(asset: UploadFile = File(...), user=Depends(guard)):
    uploaded = await save_upload(asset, "bio")
    return {"url": uploaded["path"], "name": uploaded["original_name"], "size": uploaded["size"]}
