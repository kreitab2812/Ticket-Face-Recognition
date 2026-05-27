from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from minio import Minio
from app.core.config import settings

# Tối ưu 1: Thêm pool_pre_ping và giới hạn số lượng connection
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Tự động kiểm tra và kết nối lại nếu connection bị rớt
    pool_size=10,            # Số lượng connection giữ sẵn
    max_overflow=20          # Số lượng connection tối đa tạo thêm khi quá tải
)
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

# Tối ưu 2: Đưa vào hàm init để FastAPI gọi 1 lần duy nhất lúc startup (lifespan)
def init_minio():
    try:
        if not minio_client.bucket_exists(settings.BUCKET_NAME):
            minio_client.make_bucket(settings.BUCKET_NAME)
            print(f"[*] Da khoi tao vung chua {settings.BUCKET_NAME} tren MinIO.")
    except Exception as e:
        print(f"[-] Loi ket noi MinIO: {e}")
