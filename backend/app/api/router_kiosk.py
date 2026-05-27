from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import base64
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db
from app.models import schemas
from app.core.config import settings
from app.services import vision_service, ticket_service

router = APIRouter()
qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("[+] Kiosk da ket noi luong WebSocket truc tiep!")
    try:
        while True:
            # 1. Nhan khung hinh tu Frontend gui qua (Dang Base64)
            data = await websocket.receive_text()
            if not data.startswith("data:image"):
                continue

            # 2. Giai ma Base64 thanh file anh
            encoded_data = data.split(',')[1]
            img_bytes = base64.b64decode(encoded_data)
            temp_path = f"temp_images/ws_{uuid.uuid4().hex[:8]}.jpg"
            
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            # 3. Trich xuat AI va kiem tra ve
            try:
                embedding_objs = DeepFace.represent(
                    img_path=temp_path, 
                    model_name="ArcFace", 
                    detector_backend="retinaface",
                    enforce_detection=True
                )
                embedding = embedding_objs[0]["embedding"]
                
                search_result = qdrant.query_points(
                    collection_name="faces_arcface",
                    query=embedding,
                    limit=1,
                    score_threshold=0.5 
                ).points

                if not search_result:
                    await websocket.send_json({"status": "error", "message": "Khong co trong he thong"})
                    os.remove(temp_path)
                    continue

                # 4. Xu ly logic ve cho den va Ghi Log
                matched_ticket_code = search_result[0].payload["ticket_code"]
                attendee = ticket_service.get_attendee_by_ticket(db, matched_ticket_code)

                # Upload anh bang chung len MinIO
                evidence_img_url = vision_service.upload_image_to_minio(temp_path, prefix="checkin_evidence")
                
                if attendee.is_checked_in:
                    # Gui tin hieu DO tuc thi qua WebSocket
                    await websocket.send_json({
                        "status": "error", 
                        "access": "denied",
                        "message": f"CANH BAO: Ve cua {attendee.name} da xai!"
                    })
                    # Ghi log hanh vi dang ngo
                    ticket_service.log_checkin_event(db, attendee.id, "Canh bao ve cho den", evidence_img_url)
                else:
                    # Gui tin hieu XANH tuc thi
                    attendee.is_checked_in = True 
                    await websocket.send_json({
                        "status": "success", 
                        "access": "granted",
                        "message": f"Hop le: Xin chao {attendee.name}"
                    })
                    # Ghi log thanh cong
                    ticket_service.log_checkin_event(db, attendee.id, "Hop le", evidence_img_url)

                db.commit()
                # Xoa anh tam sau khi xu ly xong
                if os.path.exists(temp_path):
                    os.remove(temp_path)

            except ValueError:
                # Khong thay mat, bao cho Kiosk quet tiep
                await websocket.send_json({"status": "idle"})
                if os.path.exists(temp_path):
                    os.remove(temp_path)

    except WebSocketDisconnect:
        print("[-] Kiosk da ngat ket noi WebSocket.")
    except Exception as e:
        print(f"Loi Server: {e}")
