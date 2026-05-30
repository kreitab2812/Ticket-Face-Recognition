import os
import uuid
import mimetypes
from app.models.database import minio_client
from app.core.config import settings

def upload_image_to_minio(file_path: str, prefix: str = "images") -> str | None:
    try:
        # Kiem tra xem file tam thoi co that su ton tai khong
        if not os.path.exists(file_path):
            print(f"[-] Khong tim thay file de upload: {file_path}", flush=True)
            return None

        # [FIX TẬN GỐC]: Kiểm tra xem Bucket (Thùng chứa) đã tồn tại trong MinIO chưa.
        # Nếu chưa có thì tự động tạo mới!
        found = minio_client.bucket_exists(settings.BUCKET_NAME)
        if not found:
            minio_client.make_bucket(settings.BUCKET_NAME)
            print(f"[*] Da tao moi bucket '{settings.BUCKET_NAME}' tren MinIO", flush=True)

        # Tao ten file ngau nhien de tranh trung lap bi de mat anh cu
        file_extension = os.path.splitext(file_path)[1]
        if not file_extension:
            file_extension = ".jpg" 
            
        object_name = f"{prefix}/{uuid.uuid4().hex}{file_extension}"
        
        # Tu dong nhan dien loai file
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "image/jpeg"
        
        # Upload len MinIO
        minio_client.fput_object(
            bucket_name=settings.BUCKET_NAME,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type
        )
        
        # Lay IP tu file .env, neu khong co mac dinh la localhost
        server_ip = os.getenv("SERVER_IP", "localhost")
        public_image_url = f"http://{server_ip}:9005/{settings.BUCKET_NAME}/{object_name}"
        
        print(f"[+] Da up anh len MinIO thanh cong: {public_image_url}", flush=True)
        return public_image_url
        
    except Exception as e:
        print(f"[-] Loi khi upload anh len MinIO: {e}", flush=True)
        return None
