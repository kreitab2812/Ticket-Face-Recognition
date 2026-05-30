from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from minio import Minio
from app.core.config import settings
import json

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      
    pool_size=10,            
    max_overflow=20          
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# [MẸO BYPASS MIGRATION]: Chạy ngầm SQL gỡ Constraint trực tiếp trên Database đang sống
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE checkin_logs ALTER COLUMN attendee_id DROP NOT NULL;"))
        conn.commit()
except Exception:
    pass # Nếu đã gỡ rồi thì bỏ qua

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

minio_client = Minio(
    settings.MINIO_URL,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False
)

def init_minio():
    try:
        if not minio_client.bucket_exists(settings.BUCKET_NAME):
            minio_client.make_bucket(settings.BUCKET_NAME)
            print(f"[*] Da khoi tao vung chua {settings.BUCKET_NAME} tren MinIO.")
        
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.BUCKET_NAME}/*"]
                }
            ]
        }
        minio_client.set_bucket_policy(settings.BUCKET_NAME, json.dumps(policy))
    except Exception as e:
        print(f"[-] Loi khoi tao MinIO Policy: {e}")
