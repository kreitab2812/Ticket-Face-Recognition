import io
import os
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_get_all_attendees():
    response = client.get("/admin/attendees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_checkin_logs():
    response = client.get("/admin/logs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# =============== UPDATE 2 TEST CASE MOI ===============

def test_add_attendee_success():
    # 1. Dam bao thu muc temp_images luon ton tai de khong bi loi FileNotFoundError
    os.makedirs("temp_images", exist_ok=True)
    
    # 2. Tao ma ve random theo thoi gian thuc de khong bao gio bi trung (Vi du: VIP_1716832...)
    unique_ticket = f"VIP_{int(time.time())}"
    
    fake_image = io.BytesIO(b"day_la_du_lieu_anh_gia")
    
    response = client.post(
        "/admin/add_attendee",
        data={"name": "Khach Hang Test", "ticket_code": unique_ticket},
        files={"file": ("avatar.jpg", fake_image, "image/jpeg")}
    )
    
    assert response.status_code == 200
    # In ra loi chi tiet tu backend neu no khong phai la success
    assert response.json()["status"] == "success", response.json()

def test_add_attendee_duplicate_ticket():
    unique_ticket = f"VIP_DUP_{int(time.time())}"
    fake_image = io.BytesIO(b"day_la_du_lieu_anh_gia")
    
    # Lan 1: Day len de he thong luu vao DB
    client.post(
        "/admin/add_attendee",
        data={"name": "Khach Hang Copy", "ticket_code": unique_ticket},
        files={"file": ("avatar.jpg", fake_image, "image/jpeg")}
    )
    
    # Lan 2: Reset file va co tinh day lai dung ma ve do
    fake_image.seek(0) 
    response = client.post(
        "/admin/add_attendee",
        data={"name": "Khach Hang Copy", "ticket_code": unique_ticket},
        files={"file": ("avatar.jpg", fake_image, "image/jpeg")}
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "error"
    assert response.json()["message"] == "Ma ve nay da ton tai trong he thong!"
