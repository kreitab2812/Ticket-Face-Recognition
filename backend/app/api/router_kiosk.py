from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import traceback
import datetime
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db, minio_client
from app.models import schemas
from app.core.config import settings

router = APIRouter()
qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

@router.post("/check-in")
async def check_in_event(
    file_rgb: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    rgb_path = f"temp_images/checkin_{file_rgb.filename}"
    with open(rgb_path, "wb") as buffer:
        shutil.copyfileobj(file_rgb.file, buffer)

    try:
        # Tách lớp: Gọi trực tiếp Vision Engine
        try:
            embedding_objs = DeepFace.represent(
                img_path=rgb_path, 
                model_name="ArcFace", 
                detector_backend="retinaface",
                enforce_detection=True
            )
            embedding = embedding_objs[0]["embedding"]
        except ValueError:
            return {"status": "error", "message": "Không tìm thấy khuôn mặt hợp lệ."}

        search_result = qdrant.query_points(
            collection_name="faces_arcface",
            query=embedding,
            limit=1,
            score_threshold=0.5 
        ).points

        if not search_result:
            return {"status": "denied", "message": "Không tìm thấy thông tin vé!"}

        matched_ticket_code = search_result[0].payload["ticket_code"]
        
        # Tách lớp: Ticket Verification Logic
        attendee = db.query(schemas.Attendee).filter(schemas.Attendee.ticket_code == matched_ticket_code).first()

        if not attendee:
            return {"status": "denied", "message": "Lỗi đồng bộ: Không tìm thấy thông tin khách."}

        now = datetime.datetime.now()
        
        if attendee.is_checked_in:
            checkin_status = "Cảnh báo vé chợ đen"
            access = "denied"
            msg = f"CẢNH BÁO: Vé {attendee.ticket_code} của {attendee.name} đã được sử dụng!"
        else:
            attendee.is_checked_in = True 
            checkin_status = "Hợp lệ"
            access = "granted"
            msg = f"Check-in thành công! Xin chào {attendee.name}."

        # Audit Logging & Evidence Upload
        object_name = f"event-logs/{attendee.ticket_code}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
        minio_client.fput_object(settings.BUCKET_NAME, object_name, rgb_path)
        image_url = f"http://{settings.MINIO_URL}/{settings.BUCKET_NAME}/{object_name}"

        new_log = schemas.CheckInLog(
            attendee_id=attendee.id,
            check_time=now,
            image_url=image_url,
            status=checkin_status
        )
        db.add(new_log)
        db.commit()

        return {
            "status": "success",
            "access": access,
            "message": msg,
            "attendee": attendee.name,
            "ticket_code": attendee.ticket_code,
            "time": now.strftime("%H:%M:%S")
        }
        
    except Exception as e:
        traceback.print_exc()
