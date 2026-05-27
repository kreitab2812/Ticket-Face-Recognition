import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from deepface import DeepFace

from app.core.config import settings
from app.models.database import engine
from app.models import schemas
from app.api import router_kiosk, router_admin

# Thiet lap he thong log de de dang debug
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Khoi tao thu muc tam cho xu ly anh
os.makedirs("temp_images", exist_ok=True)

# Tao cac bang trong CSDL neu chua ton tai
schemas.Base.metadata.create_all(bind=engine)

# Quan ly vong doi cua app (thay the cho on_event startup cu)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Logic chay truoc khi app bat dau nhan request
    logger.info("[*] Dang warm-up model AI ArcFace & RetinaFace. Vui long doi...")
    try:
        DeepFace.build_model("ArcFace")
        DeepFace.build_model("RetinaFace")
        logger.info("[+] Warm-up model thanh cong!")
    except Exception as e:
        # In ra loi thay vi dung 'pass' de biet ly do neu model saph
        logger.error(f"[-] Loi nghiem trong khi warm-up model: {e}")
    
    yield # Tra quyen dieu khien lai cho FastAPI
    
    # Logic chay khi app stop (neu can giai phong tai nguyen thi viet vao day)
    logger.info("[*] Dang tat he thong, hen gap lai!")

# Khoi tao app FastAPI
app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Cau hinh CORS cho phep Frontend goi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thuc te nen gioi han domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dang ky cac route xu ly chuc nang
app.include_router(router_kiosk.router, tags=["Kiosk Gate"])
app.include_router(router_admin.router, prefix="/admin", tags=["Admin Portal"])

# Route kiem tra suc khoe cua API (Health check)
@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": f"{settings.PROJECT_NAME} API is running smoothly."
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
