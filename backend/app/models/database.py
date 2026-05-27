from sqlalchemy import create_engine
# Tối ưu: Import declarative_base tu sqlalchemy.orm cho chuan SQLAlchemy 2.0+
from sqlalchemy.orm import sessionmaker, declarative_base
from minio import Minio
from app.core.config import settings

# Khoi tao ket noi PostgreSQL
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Khoi tao ket noi MinIO Object Storage
minio_client = Minio(
    settings.MINIO_URL,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False
)

# Kiem tra va tao bucket neu chua ton tai
try:
    if not minio_client.bucket_exists(settings.BUCKET_NAME):
        minio_client.make_bucket(settings.BUCKET_NAME)
        print(f"[*] Da khoi tao vung chua {settings.BUCKET_NAME} tren MinIO.")
except Exception as e:
    print(f"[-] Loi ket noi MinIO: {e}")
