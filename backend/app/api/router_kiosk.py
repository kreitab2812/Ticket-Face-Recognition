from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.concurrency import run_in_threadpool # Them luong xu ly phu
from sqlalchemy.orm import Session
import base64
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db
from app.models import models # Cap nhat tu schemas sang models
from app.core.config import settings
from app.services import vision_service, ticket_service

router = APIRouter()
qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

# Gom cac tac vu Sync (dong bo) gay nghen server vao mot ham rieng biet
def process_face_recognition(img_path: str):
    embedding_objs = DeepFace.represent(
        img_path=img_path, 
        model_name="ArcFace", 
        detector_backend="RetinaFace"
    )
    embedding = embedding_objs[0]["embedding"]
    
    search_result = qdrant.search(
        collection_name="attendees",
        query_vector=embedding,
        limit=1,
        score_threshold=0.6 
    )
    return search_result

@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("[+] Kiosk da ket noi luong WebSocket truc tiep!")
    try:
        while True:
            data = await websocket.receive_text()
            if not data.startswith("data:image"):
                continue

            encoded_data = data.split(',')[1]
            img_bytes = base64.b64decode(encoded_data)
            temp_path = f"temp_images/ws_{uuid.uuid4().hex[:8]}.jpg"
            
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            try:
                # Giai quyet nut that: Nho Threadpool chay AI de khong lam treo luong WebSocket
                search_result = await run_in_threadpool(process_face_recognition, temp_path)

                if search_result:
                    match = search_result[0]
                    ticket_code = match.payload.get("ticket_code")
                    attendee = ticket_service.get_attendee_by_ticket(db, ticket_code)

                    if attendee:
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
                
                # Khong tim thay mat hoac khong trung khop
                await websocket.send_json({"status": "idle"})
                
            except ValueError:
                # Bat rieng loi cua Deepface neu khong nhan dien duoc mat
                await websocket.send_json({"status": "idle"})
            except Exception as e:
                print(f"[-] Loi xu ly anh: {e}")
                await websocket.send_json({"status": "idle"})
            finally:
                # Biet doi don dep: Luon luon xoa file temp du cho code chay dung hay bao loi
                if os.path.exists(temp_path):
                    os.remove(temp_path)

    except WebSocketDisconnect:
        print("[-] Kiosk da ngat ket noi WebSocket.")
    except Exception as e:
        print(f"[-] Loi Server WebSocket: {e}")
