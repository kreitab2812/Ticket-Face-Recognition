from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import base64
import uuid
import os
import datetime
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db, minio_client
from app.models import schemas
from app.core.config import settings

router = APIRouter()
qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

@router.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("[+] Kiosk đã kết nối luồng WebSocket trực tiếp!")
    try:
        while True:
            # 1. Nhận khung hình từ Frontend gửi qua (Dạng Base64)
            data = await websocket.receive_text()
            if not data.startswith("data:image"):
                continue

            # 2. Giải mã Base64 thành file ảnh
            encoded_data = data.split(',')[1]
            img_bytes = base64.b64decode(encoded_data)
            temp_path = f"temp_images/ws_{uuid.uuid4().hex[:8]}.jpg"
            
            with open(temp_path, "wb") as f:
                f.write(img_bytes)

            # 3. Trích xuất AI và kiểm tra vé
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
                    await websocket.send_json({"status": "error", "message": "Không có trong hệ thống"})
                    os.remove(temp_path)
                    continue

                matched_ticket_code = search_result[0].payload["ticket_code"]
                attendee = db.query(schemas.Attendee).filter(schemas.Attendee.ticket_code == matched_ticket_code).first()

                now = datetime.datetime.now()
                
                if attendee.is_checked_in:
                    # Gửi tín hiệu ĐỎ tức thì qua WebSocket
                    await websocket.send_json({
                        "status": "error", 
                        "access": "denied",
                        "message": f"CẢNH BÁO: Vé của {attendee.name} đã xài!"
                    })
                    checkin_status = "Cảnh báo vé chợ đen"
                else:
                    # Gửi tín hiệu XANH tức thì
                    attendee.is_checked_in = True 
                    await websocket.send_json({
                        "status": "success", 
                        "access": "granted",
                        "message": f"Hợp lệ: Xin chào {attendee.name}"
                    })
                    checkin_status = "Hợp lệ"

                # 4. Lưu log và dọn rác
                db.commit()
                os.remove(temp_path)

            except ValueError:
                # Không thấy mặt, báo cho Kiosk quét tiếp
                await websocket.send_json({"status": "idle"})
                os.remove(temp_path)

    except WebSocketDisconnect:
        print("[-] Kiosk đã ngắt kết nối WebSocket.")
    except Exception as e:
        print(f"Lỗi Server: {e}")
