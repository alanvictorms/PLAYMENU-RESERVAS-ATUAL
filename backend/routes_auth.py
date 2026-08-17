import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app_core import db, next_id, slugify, unique_slug, utcnow
from auth_service import current_user, find_login, hash_password, issue_token, verify_password
from mail_service import send_password_code, send_verification

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class RegisterBody(BaseModel):
    tipo: str = "restaurante"
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    pix_key: str | None = None
    ref: int | None = None

@router.post("/login")
async def login(body: LoginBody):
    user = await find_login(body.email.strip(), body.password)
    pending_onboarding = user["role"] == "restaurant" and user.get("status") == "pending" and not user.get("onboarding_completed_at")
    redirect = "/admin/configuracao-inicial" if pending_onboarding else {
        "superadmin": "/superadmin", "gerente": "/gerente", "representante": "/representante", "restaurant": "/admin"
    }[user["role"]]
    return {"token": issue_token(user), "role": user["role"], "redirect": redirect, "user": {k: v for k, v in user.items() if k not in {"password_hash", "_id"}}}

@router.get("/me")
async def me(user=Depends(current_user)):
    return user

@router.post("/register")
async def register(body: RegisterBody):
    if len(body.password) < 6:
        raise HTTPException(422, "A senha deve ter no mínimo 6 caracteres.")
    if await db.restaurants.find_one({"email": body.email}, {"_id": 1}) or await db.agents.find_one({"email": body.email}, {"_id": 1}):
        raise HTTPException(409, "E-mail já cadastrado.")
    if body.tipo == "representante":
        doc = {"id": await next_id("agents"), "name": body.name, "email": body.email, "password_hash": hash_password(body.password), "phone": body.phone, "role": "representante", "parent_id": body.ref, "pix_key": body.pix_key, "is_active": 1, "created_at": utcnow()}
        await db.agents.insert_one(doc.copy())
    else:
        doc = {"id": await next_id("restaurants"), "name": body.name, "slug": await unique_slug(body.name), "email": body.email, "password_hash": hash_password(body.password), "phone": body.phone, "is_active": 0, "seller_agent_id": body.ref, "status": "pending", "is_model": 0, "created_at": utcnow()}
        await db.restaurants.insert_one(doc.copy())
        await db.settings.insert_one({"id": await next_id("settings"), "restaurant_id": doc["id"], "store_name": body.name})
    return {"ok": True, "message": "Cadastro realizado com sucesso."}

@router.post("/forgot/request")
async def forgot_request(body: dict):
    email = str(body.get("email", "")).strip()
    account = None
    for account_type, collection in [("admin", "admins"), ("agent", "agents"), ("restaurant", "restaurants")]:
        account = await db[collection].find_one({"email": email}, {"_id": 0})
        if account:
            account["account_type"] = account_type
            break
    if not account:
        return {"ok": True}
    code = str(random.randint(100000, 999999))
    await db.password_resets.update_many({"email": email, "used_at": None}, {"$set": {"used_at": utcnow()}})
    reset = {"id": await next_id("password_resets"), "account_type": account["account_type"], "account_id": account["id"], "email": email, "code_hash": hash_password(code), "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(), "used_at": None, "attempts": 0, "created_at": utcnow()}
    await db.password_resets.insert_one(reset)
    await send_password_code(email, account.get("name") or "PlayMenu", code)
    return {"ok": True}

@router.post("/forgot/reset")
async def forgot_reset(body: dict):
    email, code, password = str(body.get("email", "")), str(body.get("code", "")), str(body.get("password", ""))
    reset = await db.password_resets.find_one({"email": email, "used_at": None}, sort=[("id", -1)])
    if not reset or reset.get("expires_at", "") < utcnow() or int(reset.get("attempts", 0)) >= 5 or not verify_password(code, reset.get("code_hash", "")):
        if reset: await db.password_resets.update_one({"_id": reset["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(422, "Código inválido ou expirado.")
    if len(password) < 6: raise HTTPException(422, "A senha deve ter no mínimo 6 caracteres.")
    collection = {"admin": "admins", "agent": "agents", "restaurant": "restaurants"}[reset["account_type"]]
    await db[collection].update_one({"id": reset["account_id"]}, {"$set": {"password_hash": hash_password(password)}})
    await db.password_resets.update_one({"_id": reset["_id"]}, {"$set": {"used_at": utcnow()}})
    return {"ok": True}

@router.post("/verification/send")
async def verification_send(user=Depends(current_user)):
    if user["role"] not in {"restaurant", "gerente", "representante"}: raise HTTPException(403)
    token = await send_verification(user["role"], user)
    return {"ok": bool(token)}

@router.get("/verification/confirm")
async def verification_confirm(type: str, token: str):
    collection = "agents" if type == "agent" else "restaurants"
    result = await db[collection].update_one({"email_verification_token": token}, {"$set": {"email_verified_at": utcnow()}, "$unset": {"email_verification_token": "", "email_verification_sent_at": ""}})
    if not result.modified_count: raise HTTPException(404, "Link inválido.")
    return {"ok": True}