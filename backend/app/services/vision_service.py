import os
import uuid
import mimetypes
from app.models.database import minio_client
from app.core.config import settings

def upload_image_to_minio(file_path: str, prefix: str = "images") -> str | None:
    """
    Ham nay chiu trach nhiem day file anh tu thu muc tam len MinIO Object Storage
    """
    try:
        if not os.path.exists(file_path):
            return None

        # Tao ten file ngau nhien de tranh trung lap bi de mat anh cu
        file_extension = os.path.splitext(file_path)[1]
        object_name = f"{prefix}/{uuid.uuid4().hex}{file_extension}"
        
        # Tu dong nhan dien loai file (MIME type) de luu tren MinIO cho chuan xac
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "application/octet-stream"
        
        # Upload len MinIO
        minio_client.fput_object(
            bucket_name=settings.BUCKET_NAME,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type
        )
        
        # Tra ve duong dan public tu config thay vi hardcode 
        return f"{settings.MINIO_PUBLIC_URL}/{settings.BUCKET_NAME}/{object_name}"
        
    except Exception as e:
        print(f"[-] Loi khi upload anh len MinIO: {e}")
        return None
