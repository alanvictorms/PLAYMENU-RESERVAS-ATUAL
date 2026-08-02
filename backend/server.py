import logging
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app_core import client
from legacy_seed import seed_legacy_data
from auth_service import hash_password
from routes_auth import router as auth_router
from routes_management import router as management_router
from routes_public import router as public_router
from routes_restaurant import router as restaurant_router
from routes_video import router as video_router

app = FastAPI(title="PlayMenu API", version="2.0")

@app.get("/api/")
async def root():
    return {"message": "PlayMenu API"}

app.include_router(auth_router)
app.include_router(restaurant_router)
app.include_router(management_router)
app.include_router(video_router)
app.include_router(public_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=os.environ.get('CORS_ORIGINS') != '*',
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def reset_all_passwords():
    """Reset all user passwords to 123456"""
    from app_core import db
    new_hash = hash_password("123456")
    for collection in ["admins", "agents", "restaurants"]:
        result = await db[collection].update_many(
            {"password_hash": {"$exists": True}},
            {"$set": {"password_hash": new_hash}}
        )
        if result.modified_count:
            logger.info(f"Reset {result.modified_count} passwords in {collection}")

@app.on_event("startup")
async def startup():
    await seed_legacy_data()
    await reset_all_passwords()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
