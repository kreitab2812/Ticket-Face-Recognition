from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from minio import Minio
from app.core.config import settings

# Khởi tạo kết nối PostgreSQL
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Khởi tạo kết nối MinIO
minio_client = Minio(
    settings.MINIO_URL,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False
)

try:
    if not minio_client.bucket_exists(settings.BUCKET_NAME):
        minio_client.make_bucket(settings.BUCKET_NAME)
        print(f"[*] Đã khởi tạo vùng chứa {settings.BUCKET_NAME} trên MinIO.")
except Exception as e:
    print(f"[-] Lỗi kết nối MinIO: {e}")
