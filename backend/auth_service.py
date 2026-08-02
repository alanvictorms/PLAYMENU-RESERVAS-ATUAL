import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app_core import clean_doc, db

security = HTTPBearer(auto_error=False)

def verify_password(password: str, hashed: str) -> bool:
    try:
        normalized = hashed.replace("$2y$", "$2b$").encode()
        return bcrypt.checkpw(password.encode(), normalized)
    except Exception:
        return False

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def issue_token(user: dict) -> str:
    payload = {
        "sub": str(user["id"]), "role": user["role"], "name": user.get("name") or user.get("email"),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")

async def find_login(email: str, password: str):
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    if admin and verify_password(password, admin.get("password_hash", "")):
        return {**admin, "role": "superadmin", "name": admin.get("email")}
    agent = await db.agents.find_one({"email": email, "is_active": 1}, {"_id": 0})
    if agent and verify_password(password, agent.get("password_hash", "")):
        return agent
    restaurant = await db.restaurants.find_one({"email": email}, {"_id": 0})
    if restaurant and verify_password(password, restaurant.get("password_hash", "")):
        status = restaurant.get("status") or ("active" if restaurant.get("is_active") else "pending")
        if status in {"suspended", "cancelled"}:
            raise HTTPException(403, "Conta suspensa ou cancelada.")
        return {**restaurant, "role": "restaurant"}
    raise HTTPException(401, "E-mail ou senha inválidos.")

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Acesso não autenticado.")
    try:
        payload = jwt.decode(credentials.credentials, os.environ["JWT_SECRET"], algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Sessão expirada.")
    role, user_id = payload.get("role"), int(payload.get("sub", 0))
    collection = "admins" if role == "superadmin" else ("restaurants" if role == "restaurant" else "agents")
    user = await db[collection].find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "Conta não encontrada.")
    user["role"] = role
    return clean_doc(user)

def require_roles(*roles):
    async def guard(user=Depends(current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Acesso negado.")
        return user
    return guard