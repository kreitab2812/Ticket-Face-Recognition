import json
import uuid
import os
import time
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

# GHIM CHẾT ĐỊA CHỈ: Tuyệt đối không dùng os.getenv cho Host nữa để tránh lỗi từ file .env
QDRANT_HOST = "qdrant_db"
QDRANT_PORT = 6333
COLLECTION_NAME = "attendees"

print("[*] Dang ket noi toi Ket sat Qdrant...", flush=True)
while True:
    try:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        qdrant.get_collection(COLLECTION_NAME)
        print("[+] Da ket noi va tim thay collection Qdrant!", flush=True)
        break
    except Exception as e:
        if "Not found" in str(e):
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=512, distance=Distance.COSINE) 
            )
            print("[+] Da tao collection moi thanh cong!", flush=True)
            break
        else:
            print(f"[-] Qdrant chua san sang. Thu lai sau 3 giay...", flush=True)
            time.sleep(3)

def process_message(ch, method, properties, body):
    data = json.loads(body)
    raw_image_path = data.get('image_path')
    attendee_name = data.get('name')
    ticket_code = data.get('ticket_code')
    
    # 1. NẮN ĐƯỜNG DẪN: Đảm bảo map đúng thư mục /code/temp_images trong Docker
    image_path = raw_image_path
    if image_path and not image_path.startswith('/'):
        image_path = raw_image_path.replace("temp_images/", "/code/temp_images/")

    print(f"\n[*] Worker bat dau trich xuat mat cho ve: {ticket_code}", flush=True)
    print(f"[*] -> Duong dan goc tu RabbitMQ: {raw_image_path}", flush=True)
    print(f"[*] -> Duong dan Worker dang tim: {image_path}", flush=True)

    # 2. CẢM BIẾN TỒN TẠI FILE
    if not image_path or not os.path.exists(image_path):
        print(f"[-] LOI LOGIC: Khong tim thay file {image_path} tren o cung Worker!", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    # 3. CẢM BIẾN DUNG LƯỢNG FILE
    file_size = os.path.getsize(image_path)
    print(f"[*] -> Dung luong anh the up len: {file_size} bytes", flush=True)
    if file_size < 1000:
        print("[-] LOI LOGIC: Anh the bi hong hoac rong (dung luong qua nho)!", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    try:
        # Nhận diện và cắt mặt
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]

        # Lưu vào két sắt Qdrant
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "name": attendee_name,
                        "ticket_code": ticket_code 
                    }
                )
            ]
        )
        print(f"[+] LU'U THANH CONG mat cua: {attendee_name}.", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except ValueError:
        print(f"[-] DeepFace chê ảnh (Thực sự không thấy mặt hoặc ảnh quá mờ).", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"[-] Loi xu ly ve {ticket_code}: {e}", flush=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
    finally:
        # Xóa file rác để tối ưu dung lượng
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
