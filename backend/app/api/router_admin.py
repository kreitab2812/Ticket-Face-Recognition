from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
import pika
import json
import traceback
import uuid
import os
from typing import List
from deepface import DeepFace
from qdrant_client import QdrantClient

from app.models.database import get_db
from app.models import models, schemas 
from app.core.config import settings
from app.services import vision_service, ticket_service

router = APIRouter()
TEMP_DIR = "/code/temp_images"

# [BỘ LỌC AI TRƯỚC CỔNG]: Kiểm tra trùng lặp khuôn mặt ngay lập tức
def check_duplicate_face(img_path: str):
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
            limit=1
        )
        # Nếu giống hơn 85%, trả về mã vé của người đã đăng ký trước đó
        if search_result and search_result[0].score > 0.85:
            return search_result[0].payload.get("ticket_code")
        return None
    except Exception as e:
        print(f"[-] Loi check trung mat truoc cong: {e}", flush=True)
        return "NO_FACE"

@router.post("/add_attendee")
async def add_attendee(
    name: str = Form(...), 
    ticket_code: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    temp_path = None
    try:
        exist_ticket = ticket_service.get_attendee_by_ticket(db, ticket_code)
        if exist_ticket:
            return {"status": "error", "message": f"Mã vé {ticket_code} đã tồn tại trong hệ thống!"}

        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR, exist_ok=True)

        file_ext = os.path.splitext(file.filename)[1]
        if not file_ext:
            file_ext = ".jpg" 
            
        safe_filename = f"ticket_{ticket_code}_{uuid.uuid4().hex[:8]}{file_ext}"
        temp_path = os.path.join(TEMP_DIR, safe_filename)
        
        content = await file.read()
        with open(temp_path, "wb") as buffer:
            buffer.write(content)

        # 1. KIỂM DUYỆT TỨC THÌ BẰNG AI
        duplicate_ticket = await run_in_threadpool(check_duplicate_face, temp_path)
        
        if duplicate_ticket == "NO_FACE":
            if os.path.exists(temp_path): os.remove(temp_path)
            return {"status": "error", "message": "AI không tìm thấy khuôn mặt rõ nét. Vui lòng chụp lại!"}
        elif duplicate_ticket:
            if os.path.exists(temp_path): os.remove(temp_path)
            return {
                "status": "error", 
                "message": f"LỖI AN NINH: Khuôn mặt này đã bị trùng với khách hàng có mã vé [{duplicate_ticket}]!"
            }

        # 2. AN TOÀN -> BẮT ĐẦU LƯU DỮ LIỆU
        profile_image_url = vision_service.upload_image_to_minio(temp_path, prefix="profiles")
        if not profile_image_url:
            raise Exception("Loi mang: MinIO khong the luu anh. Vui long check lai!")

        new_attendee = models.Attendee(
            name=name, 
            ticket_code=ticket_code,
            image_url=profile_image_url
        )
        db.add(new_attendee)
        db.flush() 

        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=settings.MQ_HOST,
                credentials=pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
            )
        )
        channel = connection.channel()
        channel.queue_declare(queue='ticket_processing')

        message = {"name": name, "ticket_code": ticket_code, "image_path": temp_path}
        channel.basic_publish(exchange='', routing_key='ticket_processing', body=json.dumps(message))
        connection.close()

        db.commit()
        db.refresh(new_attendee)

        return {
            "status": "success", 
            "id": new_attendee.id, 
            "message": "Đã lưu thông tin và truyền dữ liệu cho hệ thống Kiosk."
        }
    except Exception as e:
        db.rollback()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        print(f"\n[!!!] LỖI THÊM KHÁCH: {str(e)}\n", flush=True)
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@router.get("/logs", response_model=List[schemas.CheckInLogResponse])
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(models.CheckInLog).order_by(models.CheckInLog.check_time.desc()).all()
    return logs

@router.get("/attendees", response_model=List[schemas.AttendeeResponse])
def get_attendees(db: Session = Depends(get_db)):
    attendees = db.query(models.Attendee).order_by(models.Attendee.created_at.desc()).all()
    return attendees
    
@router.delete("/attendee/{id}")
def delete_attendee(id: int, db: Session = Depends(get_db)):
    attendee = db.query(models.Attendee).filter(models.Attendee.id == id).first()
    if not attendee:
        return {"status": "error", "message": "Khong tim thay khach moi nay"}
    try:
        db.query(models.CheckInLog).filter(models.CheckInLog.attendee_id == id).delete()
        db.delete(attendee)
        db.commit()
        return {"status": "success", "message": "Da xoa khach moi thanh cong!"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": f"Loi khi xoa: {str(e)}"}
