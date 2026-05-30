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
        # Kiem tra xem file tam thoi co that su ton tai khong
        if not os.path.exists(file_path):
            print(f"[-] Khong tim thay file de upload: {file_path}", flush=True)
            return None

        # Tao ten file ngau nhien de tranh trung lap bi de mat anh cu
        file_extension = os.path.splitext(file_path)[1]
        if not file_extension:
            file_extension = ".jpg"  # Fallback an toan neu file khong co duoi
            
        object_name = f"{prefix}/{uuid.uuid4().hex}{file_extension}"
        
        # Tu dong nhan dien loai file (MIME type) de luu tren MinIO cho chuan xac
        # Neu khong co content_type chuan, MinIO se hieu nham la file van ban hoac file rac
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "image/jpeg" # Ep kieu luon thanh anh cho chac chan
        
        # Upload len MinIO thong qua client noi bo
        minio_client.fput_object(
            bucket_name=settings.BUCKET_NAME,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type
        )
        
        # [FIX QUAN TRỌNG NHẤT]: Hardcode IP public cua may tinh that
        # De trinh duyet Web o ben ngoai Docker co the hieu va render duoc hinh anh
        public_image_url = f"http://localhost:9005/{settings.BUCKET_NAME}/{object_name}"
        
        print(f"[+] Da up anh len MinIO thanh cong: {public_image_url}", flush=True)
        
        return public_image_url
        
    except Exception as e:
        print(f"[-] Loi khi upload anh len MinIO: {e}", flush=True)
        return None
