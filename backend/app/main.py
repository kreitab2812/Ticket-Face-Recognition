import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from deepface import DeepFace

from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.models.database import engine
# Cap nhat import models sau khi da tach rieng schemas o phan cuc truoc
from app.models import models 
from app.api import router_kiosk, router_admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

os.makedirs("temp_images", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[*] Dang warm-up model AI ArcFace & RetinaFace. Vui long doi...")
    try:
        DeepFace.build_model("ArcFace")
        DeepFace.build_model("RetinaFace")
        logger.info("[+] Warm-up model thanh cong!")
    except Exception as e:
        logger.error(f"[-] Loi nghiem trong khi warm-up model: {e}")
    
    yield 
    logger.info("[*] Dang tat he thong, hen gap lai!")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_kiosk.router, tags=["Kiosk Gate"])
app.include_router(router_admin.router, prefix="/admin", tags=["Admin Portal"])

@app.get("/")
def root():
    return {"message": "Event Check-in Enterprise API is running!"}
