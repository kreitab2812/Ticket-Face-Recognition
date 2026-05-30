import json
import uuid
import os
import time
import cv2
import requests # [FIX]: Thêm thư viện gọi Webhook
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

QDRANT_HOST = "qdrant_db"
QDRANT_PORT = 6333
COLLECTION_NAME = "attendees"
# API nội bộ trong Docker network để Worker báo cáo về Backend
WEBHOOK_URL = "http://backend_api:8000/admin/webhook_duplicate" 

print("[*] Dang ket noi toi Ket sat Qdrant...", flush=True)
while True:
    try:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        collections_response = qdrant.get_collections()
        collection_names = [col.name for col in collections_response.collections]
        
        if COLLECTION_NAME not in collection_names:
            qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=512, distance=Distance.COSINE) 
            )
            print("[+] Da tao collection moi thanh cong!", flush=True)
        else:
            print("[+] Da ket noi va tim thay collection Qdrant!", flush=True)
        break 
    except Exception as e:
        print(f"[-] Loi ket noi hoac khoi tao Qdrant: {str(e)}. Thu lai sau 3 giay...", flush=True)
        time.sleep(3)

def process_message(ch, method, properties, body):
    data = json.loads(body)
    raw_image_path = data.get('image_path')
    attendee_name = data.get('name')
    ticket_code = data.get('ticket_code')
    
    if raw_image_path:
        filename = os.path.basename(raw_image_path)
        image_path = os.path.join("/code/temp_images", filename)
    else:
        image_path = None

    print(f"\n[*] Worker bat dau trich xuat mat cho ve: {ticket_code}", flush=True)
    
    if not image_path or not os.path.exists(image_path):
        print(f"[-] LOI LOGIC: Khong tim thay file {image_path} tren o cung Worker!", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    file_size = os.path.getsize(image_path)
    if file_size < 1000:
        print("[-] LOI LOGIC: Anh bi hong hoac rong (dung luong qua nho)!", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        if os.path.exists(image_path): os.remove(image_path)
        return

    img_cv = cv2.imread(image_path)
    if img_cv is None:
        print("[-] LOI DU LIEU: OpenCV khong the doc duoc dinh dang anh nay!", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        if os.path.exists(image_path): os.remove(image_path)
        return

    try:
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]

        # ==========================================
        # [RADAR]: QUÉT TRÙNG LẶP TRƯỚC KHI LƯU
        # ==========================================
        search_result = qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=embedding,
            limit=1
        )

        if search_result and search_result[0].score > 0.85:
            match = search_result[0]
            original_ticket = match.payload.get("ticket_code")
            print(f"[-] CANH BAO: Phat hien khuon mat da ton tai (Trung voi ve {original_ticket})! Score: {match.score}", flush=True)
            
            # Đánh điện khẩn cấp báo cho Backend dọn rác
            payload = {
                "new_ticket_code": ticket_code,
                "original_ticket_code": original_ticket
            }
            try:
                requests.post(WEBHOOK_URL, json=payload, timeout=5)
            except Exception as req_err:
                print(f"[-] Loi goi Webhook toi Backend: {req_err}", flush=True)
            
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return # Hủy quá trình lưu

        # Nếu an toàn, tiếp tục lưu vào két sắt
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
        print(f"[+] LUU THANH CONG mat cua: {attendee_name}.", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except ValueError as ve:
        print(f"[-] DeepFace che anh (Khong thay khuon mat: {ve}).", flush=True)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"[-] Loi he thong xu ly ve {ticket_code}: {e}", flush=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
