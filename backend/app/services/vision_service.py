import os
import uuid
from app.models.database import minio_client
from app.core.config import settings

def upload_image_to_minio(file_path: str, prefix: str = "images") -> str:
    """
    Ham nay chiu trach nhiem day file anh tu thu muc tam len MinIO Object Storage
    """
    try:
        if not os.path.exists(file_path):
            return None

        # Tao ten file ngau nhien de tranh trung lap
        file_extension = os.path.splitext(file_path)[1]
        object_name = f"{prefix}/{uuid.uuid4().hex}{file_extension}"
        
        # Upload len MinIO
        minio_client.fput_object(
            bucket_name=settings.BUCKET_NAME,
            object_name=object_name,
            file_path=file_path,
            content_type="image/jpeg"
        )
        
        # Tra ve duong dan de luu vao Database
        # Luu y: Trong thuc te can cau hinh bucket public, o day ta luu duong dan tuong doi
        return f"http://localhost:9000/{settings.BUCKET_NAME}/{object_name}"
        
    except Exception as e:
        print(f"[-] Loi khi upload anh len MinIO: {e}")
        return None
