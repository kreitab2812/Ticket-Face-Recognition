import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from deepface import DeepFace

from app.core.config import settings
from app.models.database import engine
from app.models import schemas
from app.api import router_kiosk, router_admin

# Khởi tạo thư mục tạm
os.makedirs("temp_images", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo DB Schema
schemas.Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_event():
    print("[*] Đang warm-up model AI ArcFace & RetinaFace...")
    try:
        DeepFace.build_model("ArcFace")
        DeepFace.build_model("RetinaFace")
    except:
        pass

# Đăng ký các Router phân hệ
app.include_router(router_kiosk.router, tags=["Kiosk Gate"])
app.include_router(router_admin.router, prefix="/admin", tags=["Admin Portal"])

@app.get("/")
def read_root():
    return {"message": "Enterprise Check-in API is running."}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
