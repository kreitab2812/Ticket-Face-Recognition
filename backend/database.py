import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from minio import Minio

# uu tien lay tu file .env, neu khong co thi dung default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@postgres:5432/event_checkin")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# init db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# config minio storage
MINIO_URL = os.getenv("MINIO_URL", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "adminpassword")

# doi ten bucket cho dung context
BUCKET_NAME = "checkin-images"

minio_client = Minio(
    MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # chay mang local docker nen ko can ssl
)

# tu tao bucket neu db trang
try:
    if not minio_client.bucket_exists(BUCKET_NAME):
        minio_client.make_bucket(BUCKET_NAME)
        print(f"Created bucket {BUCKET_NAME}")
except Exception as e:
    print(f"MinIO error: {e}") # throw loi ra terminal check cho nhanh
