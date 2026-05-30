from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
import base64
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db
from app.models import models
from app.services import vision_service, ticket_service

router = APIRouter()

def process_face_recognition(img_path: str):
    print(f"\n[*] Kiosk bat dau phan tich anh: {img_path}", flush=True)
    
    # CAM BIEN 1: Kiem tra file anh tu Web co that su duoc luu xuong chua?
    if not os.path.exists(img_path):
        print(f"[-] LOI LOGIC: File luu tu WebSocket da bi boc hoi!", flush=True)
        return []
        
    # CAM BIEN 2: Kiem tra dung luong de chong anh hỏng, ảnh đen
    file_size = os.path.getsize(img_path)
    print(f"[*] -> Dung luong anh Web cam chup: {file_size} bytes", flush=True)
    if file_size < 1024: 
        print("[-] LOI LOGIC: ReactJS gui anh loi/anh rong (Duoi 1KB)!", flush=True)
        return []

    try:
        # Phat hien va trich xuat mat
        embedding_objs = DeepFace.represent(
            img_path=img_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]
        print("[+] Da tom duoc mat tu Kiosk, chuan bi hoi Qdrant...", flush=True)
        
        # Goi qua Qdrant voi tieu chuan 0.1 de do kén camera
        qdrant_local = QdrantClient(host="qdrant_db", port=6333)
        search_result = qdrant_local.search(
            collection_name="attendees",
            query_vector=embedding,
            limit=1,
            score_threshold=0.1
        )
        print(f"[+] Diem so Qdrant tra ve: {search_result}", flush=True)
        return search_result
        
    except ValueError:
        print("[-] DeepFace che anh Kiosk: Khong co mat hoac qua mo.", flush=True)
        return []
    except Exception as e:
        print(f"[-] Loi he thong DeepFace/Qdrant: {e}", flush=True)
        return []

@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("[+] Kiosk Frontend DA KET NOI thanh cong!", flush=True)
    
    try:
        while True:
            data = await websocket.receive_text()
            if not data.startswith("data:image"):
                continue

            try:
                # [FIX]: Tang cuong su an toan khi boc tach Base64 tu JS gui len
                if ',' in data:
                    encoded_data = data.split(',', 1)[1]
                else:
                    encoded_data = data
                img_bytes = base64.b64decode(encoded_data)
            except Exception as e:
                print(f"[-] LOI LOGIC: Giai ma Base64 bi hong - {e}", flush=True)
                continue

            temp_path = f"temp_images/ws_{uuid.uuid4().hex[:8]}.jpg"
            
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            try:
                # Threadpool de AI khong lam lag luong mang
                search_result = await run_in_threadpool(process_face_recognition, temp_path)

                if search_result:
                    match = search_result[0]
                    ticket_code = match.payload.get("ticket_code")
                    attendee = ticket_service.get_attendee_by_ticket(db, ticket_code)

                    if attendee:
                        print(f"[*] Phat hien khach hang: {attendee.name}", flush=True)
                        evidence_img_url = vision_service.upload_image_to_minio(temp_path, prefix="checkins")
                        
                        if attendee.is_checked_in:
                            await websocket.send_json({
                                "status": "error", 
                                "access": "denied",
                                "message": f"CANH BAO: Ve cua {attendee.name} da xai!"
                            })
                            ticket_service.log_checkin_event(db, attendee.id, "Canh bao ve cho den", evidence_img_url)
                        else:
                            attendee.is_checked_in = True 
                            await websocket.send_json({
                                "status": "success", 
                                "access": "granted",
                                "message": f"Hop le: Xin chao {attendee.name}"
                            })
                            ticket_service.log_checkin_event(db, attendee.id, "Hop le", evidence_img_url)

                        db.commit()
                        continue
                    else:
                        print("[-] Phat hien mat trong Qdrant nhung KHONG CO trong Postgres!", flush=True)
                        await websocket.send_json({"status": "error", "message": "Loi dong bo giua AI va Database!"})
                        continue
                
                # Khong tim thay mat hoac khong trung khop
                await websocket.send_json({"status": "idle"})
                
            except Exception as e:
                print(f"[-] LOI NGHIEM TRONG Backend: {e}", flush=True)
                await websocket.send_json({"status": "error", "message": f"He thong dang loi: {e}"})
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

    except WebSocketDisconnect:
        print("[-] Kiosk Frontend da thoat.", flush=True)
    except Exception as e:
        print(f"[-] Loi Server WebSocket: {e}", flush=True)
