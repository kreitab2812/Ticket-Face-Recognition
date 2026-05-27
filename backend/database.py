import os
from sqlalchemy import create_create_engine, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from minio import Minio

# 1. Cấu hình kết nối PostgreSQL (Sử dụng tên service 'postgres' trong Docker)
DATABASE_URL = "postgresql://admin:adminpassword@postgres:5432/access_control"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Lấy một session kết nối tới DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. Cấu hình kết nối MinIO Object Storage (Sử dụng tên service 'minio' trong Docker)
MINIO_URL = "minio:9000"
MINIO_ACCESS_KEY = "admin"
MINIO_SECRET_KEY = "adminpassword"
BUCKET_NAME = "attendance-images"

minio_client = Minio(
    MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Chạy nội bộ không cần https
)

# Tự động tạo bucket chứa ảnh nếu chưa tồn tại
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
        print(f"[+] Đã tạo bucket '{BUCKET_NAME}' thành công trên MinIO.")
except Exception as e:
    print(f"[-] Không thể khởi tạo bucket MinIO: {e}")
