from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app_core import clean_doc, db, next_id, unique_slug, utcnow
from auth_service import hash_password, require_roles
from file_service import save_upload
from qr_template_service import ensure_default_qr_templates, validate_qr_template

router = APIRouter(prefix="/api", tags=["management"])

async def agent_scope(user):
    if user["role"] == "gerente":
        reps = await db.agents.find({"parent_id": user["id"]}, {"_id": 0, "id": 1}).to_list(10000)
        return [user["id"], *[r["id"] for r in reps]]
    return [user["id"]]

@router.get("/agent/dashboard")
async def agent_dashboard(user=Depends(require_roles("gerente", "representante"))):
    scope = await agent_scope(user)
    active = await db.restaurants.count_documents({"seller_agent_id": {"$in": scope}, "status": "active"})
    total = await db.restaurants.count_documents({"seller_agent_id": {"$in": scope}})
    commissions = await db.commissions.find({"agent_id": user["id"]}, {"_id": 0}).to_list(10000)
    available = sum(int(c.get("amount_cents", 0)) for c in commissions if c.get("status") == "available" and (not c.get("available_at") or c["available_at"] <= utcnow()))
    return {"active_clients": active, "total_clients": total, "available_balance": available, "commissions_total": sum(int(c.get("amount_cents", 0)) for c in commissions), "agent": user}

@router.get("/agent/restaurants")
async def agent_restaurants(user=Depends(require_roles("gerente", "representante"))):
    scope = await agent_scope(user)
    rows = await db.restaurants.find({"seller_agent_id": {"$in": scope}}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(10000)
    agents = {a["id"]: a["name"] for a in await db.agents.find({"id": {"$in": scope}}, {"_id": 0, "id": 1, "name": 1}).to_list(10000)}
    for row in rows: row["agent_name"] = agents.get(row.get("seller_agent_id"), "Direto")
    return rows

@router.post("/agent/restaurants")
async def agent_restaurant_save(body: dict, user=Depends(require_roles("gerente", "representante"))):
    scope = await agent_scope(user)
    item_id = int(body.get("id", 0))
    if item_id:
        result = await db.restaurants.update_one({"id": item_id, "seller_agent_id": {"$in": scope}}, {"$set": {k: body.get(k) for k in ["name", "email", "address", "latitude", "longitude"] if k in body}})
        if not result.matched_count: raise HTTPException(404)
        return {"ok": True}
    if await db.restaurants.find_one({"email": body.get("email")}, {"_id": 1}): raise HTTPException(409, "E-mail já cadastrado.")
    password = str(body.get("password", ""))
    if len(password) < 4: raise HTTPException(422, "Senha com no mínimo 4 caracteres.")
    doc = {"id": await next_id("restaurants"), "name": str(body.get("name", "")).strip(), "slug": await unique_slug(str(body.get("name", ""))), "email": body.get("email"), "password_hash": hash_password(password), "address": body.get("address") or None, "latitude": body.get("latitude"), "longitude": body.get("longitude"), "is_active": 0, "seller_agent_id": user["id"], "status": "pending", "is_model": 0, "created_at": utcnow()}
    await db.restaurants.insert_one(doc.copy()); await db.settings.insert_one({"id": await next_id("settings"), "restaurant_id": doc["id"], "store_name": doc["name"]})
    return clean_doc(doc)

@router.delete("/agent/restaurants/{item_id}")
async def delete_lead(item_id: int, user=Depends(require_roles("representante"))):
    result = await db.restaurants.delete_one({"id": item_id, "seller_agent_id": user["id"], "status": {"$ne": "active"}})
    if not result.deleted_count: raise HTTPException(422, "Restaurantes ativos não são removidos por segurança.")
    return {"ok": True}

@router.get("/agent/representatives")
async def representatives(user=Depends(require_roles("gerente"))):
    return await db.agents.find({"parent_id": user["id"], "role": "representante"}, {"_id": 0, "password_hash": 0}).sort("name", 1).to_list(10000)

@router.post("/agent/representatives")
async def representative_save(body: dict, user=Depends(require_roles("gerente"))):
    max_pct = user.get("max_pct_rep")
    for key in ["pct_adesao", "pct_mensalidade"]:
        if max_pct is not None and float(body.get(key) or 0) > float(max_pct): raise HTTPException(422, "Percentual acima do limite do gerente.")
    if body.get("id"):
        await db.agents.update_one({"id": int(body["id"]), "parent_id": user["id"]}, {"$set": {"pct_adesao": body.get("pct_adesao"), "pct_mensalidade": body.get("pct_mensalidade")}}); return {"ok": True}
    doc = {"id": await next_id("agents"), "name": body.get("name"), "email": body.get("email"), "password_hash": hash_password(body.get("password", "")), "role": "representante", "parent_id": user["id"], "is_active": 1, "pct_adesao": body.get("pct_adesao"), "pct_mensalidade": body.get("pct_mensalidade"), "created_at": utcnow()}
    await db.agents.insert_one(doc.copy()); return clean_doc(doc)

@router.get("/agent/commissions")
async def commissions(user=Depends(require_roles("gerente", "representante"))):
    return await db.commissions.find({"agent_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(10000)

@router.get("/agent/withdrawals")
async def agent_withdrawals(user=Depends(require_roles("gerente", "representante"))):
    rows = await db.withdrawals.find({"agent_id": user["id"]}, {"_id": 0}).sort("requested_at", -1).to_list(10000)
    commissions = await db.commissions.find({"agent_id": user["id"], "status": "available"}, {"_id": 0}).to_list(10000)
    balance = sum(int(c.get("amount_cents", 0)) for c in commissions if not c.get("available_at") or c["available_at"] <= utcnow())
    platform = await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {}
    return {"rows": rows, "balance": balance, "minimum": int(platform.get("min_withdrawal_cents", 5000))}

@router.post("/agent/withdrawals")
async def request_withdrawal(body: dict, user=Depends(require_roles("gerente", "representante"))):
    amount = int(body.get("amount_cents", 0)); current = await agent_withdrawals(user)
    if not user.get("email_verified_at"): raise HTTPException(422, "Valide seu e-mail antes de solicitar saque.")
    if not user.get("pix_verified_at"): raise HTTPException(422, "Valide sua chave PIX antes de solicitar saque.")
    if amount < current["minimum"] or amount > current["balance"]: raise HTTPException(422, "Valor indisponível para saque.")
    pix = str(body.get("pix_key") or user.get("pix_key") or "").strip()
    if not pix: raise HTTPException(422, "Informe a chave PIX.")
    doc = {"id": await next_id("withdrawals"), "agent_id": user["id"], "amount_cents": amount, "status": "pending", "pix_key": pix, "note": None, "requested_at": utcnow(), "decided_at": None}
    await db.withdrawals.insert_one(doc.copy()); await db.agents.update_one({"id": user["id"]}, {"$set": {"pix_key": pix}}); return clean_doc(doc)

@router.post("/agent/pix/validate")
async def validate_pix(body: dict, user=Depends(require_roles("gerente", "representante"))):
    pix = str(body.get("pix_key", "")).strip()
    if not pix: raise HTTPException(422, "Informe sua chave PIX.")
    await db.agents.update_one({"id": user["id"]}, {"$set": {"pix_key": pix, "pix_verified_at": utcnow()}})
    return {"ok": True}

@router.get("/agent/materials")
async def agent_materials(user=Depends(require_roles("gerente", "representante"))):
    return await db.support_materials.find({"is_active": 1, "audience": {"$in": ["all", user["role"]]}}, {"_id": 0}).sort("created_at", -1).to_list(10000)

@router.get("/agent/routes")
async def routes(user=Depends(require_roles("gerente", "representante"))):
    restaurants = await agent_restaurants(user); routes = await db.agent_routes.find({"agent_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    for route in routes: route["stops"] = await db.agent_route_stops.find({"route_id": route["id"]}, {"_id": 0}).sort([("sort_order", 1), ("id", 1)]).to_list(1000)
    return {"restaurants": restaurants, "routes": routes}

@router.post("/agent/routes")
async def save_route(body: dict, user=Depends(require_roles("gerente", "representante"))):
    stops = body.get("stops") or []
    if not stops: raise HTTPException(422, "Rota sem estabelecimentos.")
    route_id = await next_id("agent_routes"); doc = {"id": route_id, "agent_id": user["id"], "title": body.get("title") or "Rota " + utcnow()[:16], "start_address": body.get("start_address"), "start_lat": body.get("start_lat"), "start_lng": body.get("start_lng"), "total_distance_meters": int(body.get("distance_meters", 0)), "total_duration_seconds": int(body.get("duration_seconds", 0)), "status": "planned", "rating": None, "notes": None, "created_at": utcnow(), "completed_at": None}
    await db.agent_routes.insert_one(doc.copy())
    for index, stop in enumerate(stops, 1): await db.agent_route_stops.insert_one({"id": await next_id("agent_route_stops"), "route_id": route_id, "place_id": stop.get("place_id"), "name": stop.get("name", "Estabelecimento")[:180], "address": stop.get("address", "")[:255], "lat": stop.get("lat"), "lng": stop.get("lng"), "phone": None, "contact_name": None, "notes": None, "visit_status": "pending", "sort_order": index, "updated_at": utcnow()})
    return clean_doc(doc)

@router.patch("/agent/routes/{route_id}")
async def update_route(route_id: int, body: dict, user=Depends(require_roles("gerente", "representante"))):
    action = body.get("action")
    if action == "complete": await db.agent_routes.update_one({"id": route_id, "agent_id": user["id"]}, {"$set": {"status": "completed", "rating": max(1, min(5, int(body.get("rating", 1)))), "notes": body.get("notes"), "completed_at": utcnow()}})
    elif action == "delete": await db.agent_routes.delete_one({"id": route_id, "agent_id": user["id"]}); await db.agent_route_stops.delete_many({"route_id": route_id})
    else: raise HTTPException(422)
    return {"ok": True}

@router.patch("/agent/route-stops/{stop_id}")
async def update_stop(stop_id: int, body: dict, user=Depends(require_roles("gerente", "representante"))):
    route_ids = [r["id"] for r in await db.agent_routes.find({"agent_id": user["id"]}, {"_id": 0, "id": 1}).to_list(10000)]
    allowed = {"pending", "visited", "interested", "not_interested", "closed"}; status = body.get("visit_status", "pending")
    if status not in allowed: status = "pending"
    result = await db.agent_route_stops.update_one({"id": stop_id, "route_id": {"$in": route_ids}}, {"$set": {"visit_status": status, "contact_name": body.get("contact_name", ""), "phone": body.get("phone", ""), "notes": body.get("notes", ""), "updated_at": utcnow()}})
    if not result.matched_count: raise HTTPException(404)
    return {"ok": True}

# SuperAdmin
@router.get("/superadmin/dashboard")
async def super_dashboard(user=Depends(require_roles("superadmin"))):
    return {"restaurants": await db.restaurants.count_documents({}), "active_restaurants": await db.restaurants.count_documents({"status": "active"}), "agents": await db.agents.count_documents({}), "pending_requests": await db.video_requests.count_documents({"status": "pending"}), "pending_withdrawals": await db.withdrawals.count_documents({"status": "pending"})}

@router.get("/superadmin/restaurants")
async def super_restaurants(user=Depends(require_roles("superadmin"))):
    rows = await db.restaurants.find({}, {"_id": 0, "password_hash": 0}).sort("id", -1).to_list(10000); agents = {a["id"]: a["name"] for a in await db.agents.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(10000)}
    for row in rows: row["seller_name"] = agents.get(row.get("seller_agent_id"), "—")
    return rows

@router.post("/superadmin/restaurants")
async def super_restaurant(body: dict, user=Depends(require_roles("superadmin"))):
    if body.get("action") in {"toggle", "activate", "toggle_model"}:
        item = await db.restaurants.find_one({"id": int(body["id"])}, {"_id": 0})
        if not item: raise HTTPException(404)
        if body["action"] == "toggle": update = {"is_active": 0 if item.get("is_active") else 1, "status": "suspended" if item.get("status") == "active" else "active"}
        elif body["action"] == "activate": update = {"is_active": 1, "status": "active", "activated_at": utcnow()}
        else: update = {"is_model": 0 if item.get("is_model") else 1}
        await db.restaurants.update_one({"id": item["id"]}, {"$set": update}); return {"ok": True}
    password = str(body.get("password", ""))
    if len(password) < 4: raise HTTPException(422, "Preencha a senha com no mínimo 4 caracteres.")
    if await db.restaurants.find_one({"email": body.get("email")}, {"_id": 1}): raise HTTPException(409, "E-mail já cadastrado.")
    doc = {"id": await next_id("restaurants"), "name": str(body.get("name", "")).strip(), "slug": await unique_slug(str(body.get("name", ""))), "email": body.get("email"), "password_hash": hash_password(password), "is_active": 0, "seller_agent_id": None, "status": "pending", "is_model": 0, "created_at": utcnow()}
    await db.restaurants.insert_one(doc.copy())
    await db.settings.insert_one({"id": await next_id("settings"), "restaurant_id": doc["id"], "store_name": doc["name"]})
    return clean_doc(doc)

@router.get("/superadmin/agents")
async def super_agents(user=Depends(require_roles("superadmin"))):
    rows = await db.agents.find({}, {"_id": 0, "password_hash": 0}).sort([("role", 1), ("name", 1)]).to_list(10000); names = {a["id"]: a["name"] for a in rows}
    for row in rows: row["parent_name"] = names.get(row.get("parent_id"), "—")
    return rows

@router.post("/superadmin/agents")
async def super_agent(body: dict, user=Depends(require_roles("superadmin"))):
    action, item_id = body.get("action", "add"), int(body.get("id", 0))
    if action == "add":
        doc = {"id": await next_id("agents"), "name": body.get("name"), "email": body.get("email"), "password_hash": hash_password(body.get("password", "")), "role": body.get("role", "representante"), "parent_id": body.get("parent_id"), "pct_adesao": body.get("pct_adesao"), "pct_mensalidade": body.get("pct_mensalidade"), "max_pct_rep": body.get("max_pct_rep"), "is_active": 1, "created_at": utcnow()}; await db.agents.insert_one(doc.copy()); return clean_doc(doc)
    item = await db.agents.find_one({"id": item_id}, {"_id": 0})
    if not item: raise HTTPException(404)
    if action == "toggle": await db.agents.update_one({"id": item_id}, {"$set": {"is_active": 0 if item.get("is_active") else 1}})
    elif action == "promote": await db.agents.update_one({"id": item_id, "role": "representante"}, {"$set": {"role": "gerente", "parent_id": None}})
    elif action == "update_pct": await db.agents.update_one({"id": item_id}, {"$set": {k: body.get(k) for k in ["pct_adesao", "pct_mensalidade", "max_pct_rep"]}})
    elif action == "delete":
        has_links = await db.agents.count_documents({"parent_id": item_id}) if item.get("role") == "gerente" else await db.restaurants.count_documents({"seller_agent_id": item_id})
        if has_links: raise HTTPException(422, "Existem registros vinculados a este agente.")
        await db.agents.delete_one({"id": item_id})
    return {"ok": True}

@router.get("/superadmin/plans")
async def super_plans(user=Depends(require_roles("superadmin"))): return await db.plans.find({}, {"_id": 0}).sort([("periodicity_days", 1), ("price_cents", 1)]).to_list(1000)

@router.post("/superadmin/plans")
async def super_plan(body: dict, user=Depends(require_roles("superadmin"))):
    action, item_id = body.get("action", "add"), int(body.get("id", 0))
    if action == "delete":
        if await db.restaurants.count_documents({"plan_id": item_id}): raise HTTPException(422, "Existem restaurantes vinculados a este plano.")
        await db.plans.delete_one({"id": item_id}); return {"ok": True}
    values = {k: body.get(k) for k in ["name", "description", "price_cents", "discount_type", "discount_percent", "discount_value_cents", "periodicity_days", "is_active"]}
    if item_id: await db.plans.update_one({"id": item_id}, {"$set": values})
    else: values.update({"id": await next_id("plans"), "created_at": utcnow()}); await db.plans.insert_one(values.copy())
    return clean_doc(values)

@router.get("/superadmin/commission-rules")
async def rules(user=Depends(require_roles("superadmin"))): return await db.commission_rules.find({}, {"_id": 0}).sort("min_active_clients", 1).to_list(1000)

@router.post("/superadmin/commission-rules")
async def rule_save(body: dict, user=Depends(require_roles("superadmin"))):
    if body.get("action") == "delete": await db.commission_rules.delete_one({"id": int(body["id"]), "min_active_clients": {"$gt": 0}})
    else: await db.commission_rules.update_one({"min_active_clients": int(body["min_active_clients"])}, {"$set": {"pct_adesao": float(body["pct_adesao"]), "pct_mensalidade": float(body["pct_mensalidade"])}, "$setOnInsert": {"id": await next_id("commission_rules")}}, upsert=True)
    return {"ok": True}

@router.get("/superadmin/withdrawals")
async def super_withdrawals(user=Depends(require_roles("superadmin"))):
    rows = await db.withdrawals.find({}, {"_id": 0}).sort("requested_at", -1).to_list(10000); agents = {a["id"]: a for a in await db.agents.find({}, {"_id": 0, "password_hash": 0}).to_list(10000)}
    for row in rows: row["agent"] = agents.get(row.get("agent_id"), {})
    return rows

@router.post("/superadmin/withdrawals")
async def decide_withdrawal(body: dict, user=Depends(require_roles("superadmin"))):
    item = await db.withdrawals.find_one({"id": int(body["id"]), "status": "pending"}, {"_id": 0})
    if not item: raise HTTPException(404)
    status = "approved" if body.get("action") == "approve" else "rejected"
    await db.withdrawals.update_one({"id": item["id"]}, {"$set": {"status": status, "note": body.get("note"), "decided_at": utcnow()}})
    if status == "approved":
        remaining = int(item["amount_cents"]); commissions = await db.commissions.find({"agent_id": item["agent_id"], "status": "available"}, {"_id": 0}).sort("created_at", 1).to_list(10000)
        for commission in commissions:
            if remaining <= 0: break
            await db.commissions.update_one({"id": commission["id"]}, {"$set": {"status": "withdrawn"}}); remaining -= int(commission.get("amount_cents", 0))
    return {"ok": True}

@router.get("/superadmin/materials")
async def super_materials(user=Depends(require_roles("superadmin"))): return await db.support_materials.find({}, {"_id": 0}).sort([("is_active", -1), ("created_at", -1)]).to_list(10000)

@router.post("/superadmin/materials")
async def super_material(title: str = Form(...), description: str = Form(""), audience: str = Form("all"), material_type: str = Form("file"), external_url: str = Form(""), is_active: bool = Form(True), material_file: UploadFile | None = File(None), user=Depends(require_roles("superadmin"))):
    upload = await save_upload(material_file, "materials") if material_type != "video_link" else None
    if material_type == "video_link" and not external_url.startswith(("http://", "https://")): raise HTTPException(422, "Informe um link válido.")
    if material_type != "video_link" and not upload: raise HTTPException(422, "Selecione um arquivo.")
    doc = {"id": await next_id("support_materials"), "title": title, "description": description or None, "audience": audience, "material_type": material_type, "file_path": upload["path"] if upload else None, "original_filename": upload["original_name"] if upload else None, "file_size": upload["size"] if upload else None, "external_url": external_url or None, "is_active": int(is_active), "created_at": utcnow(), "updated_at": utcnow()}; await db.support_materials.insert_one(doc.copy()); return clean_doc(doc)

@router.patch("/superadmin/materials/{item_id}/{action}")
async def material_action(item_id: int, action: str, user=Depends(require_roles("superadmin"))):
    item = await db.support_materials.find_one({"id": item_id}, {"_id": 0})
    if action == "toggle": await db.support_materials.update_one({"id": item_id}, {"$set": {"is_active": 0 if item.get("is_active") else 1}})
    elif action == "delete": await db.support_materials.delete_one({"id": item_id})
    return {"ok": True}

@router.get("/superadmin/qr-templates")
async def super_qr_templates(user=Depends(require_roles("superadmin"))):
    await ensure_default_qr_templates()
    return await db.qr_templates.find({}, {"_id": 0}).sort([("is_active", -1), ("id", 1)]).to_list(1000)

@router.post("/superadmin/qr-templates")
async def save_qr_template(
    id: int = Form(0),
    name: str = Form(...),
    description: str = Form(""),
    width: int = Form(...),
    height: int = Form(...),
    qr_x: int = Form(...),
    qr_y: int = Form(...),
    qr_size: int = Form(...),
    logo_x: int = Form(...),
    logo_y: int = Form(...),
    logo_size: int = Form(...),
    background_color: str = Form("#201827"),
    accent_color: str = Form("#f4581c"),
    is_active: bool = Form(True),
    template_file: UploadFile | None = File(None),
    user=Depends(require_roles("superadmin")),
):
    values = validate_qr_template({
        "name": name,
        "description": description,
        "width": width,
        "height": height,
        "qr_x": qr_x,
        "qr_y": qr_y,
        "qr_size": qr_size,
        "logo_x": logo_x,
        "logo_y": logo_y,
        "logo_size": logo_size,
        "background_color": background_color,
        "accent_color": accent_color,
        "is_active": is_active,
    })
    uploaded = await save_upload(template_file, "qr_templates")
    if uploaded:
        values["template_file"] = uploaded["path"]
        values["original_filename"] = uploaded["original_name"]
    if id:
        existing = await db.qr_templates.find_one({"id": id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Modelo não encontrado.")
        values["builtin_theme"] = existing.get("builtin_theme") if not uploaded else None
        await db.qr_templates.update_one({"id": id}, {"$set": values})
        return {"ok": True, "id": id}
    values.update({
        "id": await next_id("qr_templates"),
        "template_file": values.get("template_file"),
        "builtin_theme": None,
        "created_at": utcnow(),
    })
    await db.qr_templates.insert_one(values.copy())
    return clean_doc(values)

@router.patch("/superadmin/qr-templates/{item_id}/{action}")
async def qr_template_action(item_id: int, action: str, user=Depends(require_roles("superadmin"))):
    item = await db.qr_templates.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Modelo não encontrado.")
    if action == "toggle":
        await db.qr_templates.update_one(
            {"id": item_id},
            {"$set": {"is_active": 0 if item.get("is_active") else 1, "updated_at": utcnow()}},
        )
    elif action == "delete":
        await db.qr_templates.delete_one({"id": item_id})
    else:
        raise HTTPException(404, "Ação inválida.")
    return {"ok": True}

@router.get("/superadmin/settings")
async def super_settings(user=Depends(require_roles("superadmin"))):
    values = {r["setting_key"]: r.get("setting_value", "") for r in await db.app_settings.find({}, {"_id": 0}).to_list(1000)}
    values["ai_api_key_configured"] = bool(values.get("ai_api_key"))
    values["ai_api_key"] = ""
    return values

@router.post("/superadmin/settings")
async def save_super_settings(body: dict, user=Depends(require_roles("superadmin"))):
    allowed = {
        "smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from", "smtp_from_name",
        "ai_provider", "ai_api_url", "ai_api_key", "ai_model", "ai_timeout_seconds",
    }
    for key, value in body.items():
        if key not in allowed:
            continue
        if key == "ai_api_key" and not str(value or "").strip():
            continue
        await db.app_settings.update_one(
            {"setting_key": key},
            {"$set": {"setting_value": str(value), "updated_at": utcnow()}},
            upsert=True,
        )
    return {"ok": True}

@router.get("/superadmin/platform-settings")
async def platform_settings(user=Depends(require_roles("superadmin"))):
    return await db.platform_settings.find_one({"id": 1}, {"_id": 0}) or {"id": 1, "adesao_cents": 29900, "mensalidade_cents": 9900, "video_price_cents": 4900, "min_withdrawal_cents": 5000, "override_pct_adesao": 5, "override_pct_mensalidade": 5}

@router.post("/superadmin/platform-settings")
async def save_platform_settings(body: dict, user=Depends(require_roles("superadmin"))):
    values = {key: (float(body.get(key, 0)) if key.startswith("override_") else int(body.get(key, 0))) for key in ["adesao_cents", "mensalidade_cents", "video_price_cents", "min_withdrawal_cents", "override_pct_adesao", "override_pct_mensalidade"]}
    await db.platform_settings.update_one({"id": 1}, {"$set": values}, upsert=True)
    return {"ok": True}
