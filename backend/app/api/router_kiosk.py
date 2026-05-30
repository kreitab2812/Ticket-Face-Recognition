from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from pydantic import BaseModel
import base64
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db
from app.models import models
from app.services import vision_service, ticket_service

router = APIRouter()
TEMP_DIR = "/code/temp_images"

# ==========================================
# [REST API]: TRẠM NHẬN TANG CHỨNG AN NINH
# ==========================================
class SecurityPayload(BaseModel):
    image_data: str
    status: str

@router.post("/log_security")
async def log_security_event(payload: SecurityPayload, db: Session = Depends(get_db)):
    try:
        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR, exist_ok=True)
            
        encoded_data = payload.image_data.split(',', 1)[1] if ',' in payload.image_data else payload.image_data
        img_bytes = base64.b64decode(encoded_data)
        
        temp_path = os.path.join(TEMP_DIR, f"sec_{uuid.uuid4().hex[:8]}.jpg")
        with open(temp_path, "wb") as f:
            f.write(img_bytes)
            
        evidence_img_url = vision_service.upload_image_to_minio(temp_path, prefix="security")
        
        # attendee_id = None vì chỉ là tang chứng kẻ lạ / che cam
        new_log = models.CheckInLog(
            attendee_id=None,
            status=payload.status,
            image_url=evidence_img_url
        )
        db.add(new_log)
        db.commit()
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return {"status": "success"}
    except Exception as e:
        print(f"[-] Loi ghi log an ninh: {e}", flush=True)
        return {"status": "error", "message": str(e)}

# ==========================================
# [WEBSOCKET]: LUỒNG AI QUÉT MẶT
# ==========================================
def process_face_recognition(img_path: str):
    if not os.path.exists(img_path): return []
    file_size = os.path.getsize(img_path)
    if file_size < 1024: return []

    try:
        embedding_objs = DeepFace.represent(
            img_path=img_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]
        
        qdrant_local = QdrantClient(host="qdrant_db", port=6333)
        search_result = qdrant_local.search(
            collection_name="attendees",
            query_vector=embedding,
            limit=1,
            score_threshold=0.1
        )
        return search_result
    except Exception:
        return []

@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR, exist_ok=True)
        
    try:
        while True:
            data = await websocket.receive_text()
            if not data.startswith("data:image"): continue

            try:
                encoded_data = data.split(',', 1)[1] if ',' in data else data
                img_bytes = base64.b64decode(encoded_data)
            except Exception:
                continue

            temp_path = os.path.join(TEMP_DIR, f"ws_{uuid.uuid4().hex[:8]}.jpg")
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            try:
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
                                "message": f"CẢNH BÁO: Vé của {attendee.name} đã được sử dụng!"
                            })
                            ticket_service.log_checkin_event(db, attendee.id, "Cảnh báo: Vé đã dùng", evidence_img_url)
                        else:
                            attendee.is_checked_in = True 
                            await websocket.send_json({
                                "status": "success", 
                                "access": "granted",
                                "message": f"Hợp lệ: Xin chào {attendee.name}"
                            })
                            ticket_service.log_checkin_event(db, attendee.id, "Hợp lệ", evidence_img_url)

                        db.commit()
                        continue
                    else:
                        await websocket.send_json({"status": "error", "message": "Lỗi đồng bộ dữ liệu!"})
                        continue
                
                await websocket.send_json({
                    "status": "failed", 
                    "message": "Chưa nhận diện được khuôn mặt hợp lệ!"
                })
                
            except Exception as e:
                await websocket.send_json({"status": "error", "message": f"Hệ thống đang lỗi: {e}"})
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
    except WebSocketDisconnect:
        pass
