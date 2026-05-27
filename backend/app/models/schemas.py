from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# ==========================================
# 1. SCHEMAS CHO LOG CHECK-IN
# ==========================================

class CheckInLogBase(BaseModel):
    status: str
    image_url: Optional[str] = None

class CheckInLogCreate(CheckInLogBase):
    attendee_id: int

class CheckInLogResponse(CheckInLogBase):
    id: int
    attendee_id: int
    check_time: datetime

    # Cau hinh de Pydantic tuong thich va doc duoc du lieu tu SQLAlchemy ORM
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. SCHEMAS CHO NGUOI THAM GIA (ATTENDEE)
# ==========================================

class AttendeeBase(BaseModel):
    name: str
    ticket_code: str

class AttendeeCreate(AttendeeBase):
    # Dung khi client tao moi ticket nguoi dung
    pass

class AttendeeUpdate(BaseModel):
    # Dung khi can cap nhat trang thai hoac thong tin
    name: Optional[str] = None
    is_checked_in: Optional[bool] = None

class AttendeeResponse(AttendeeBase):
    id: int
    is_checked_in: bool
    created_at: datetime
    
    # Cau hinh de tu dong map tu SQLAlchemy model sang JSON
    model_config = ConfigDict(from_attributes=True)

class AttendeeDetailResponse(AttendeeResponse):
    # Tra ve thong tin chi tiet kem theo lich su cac lan quet checkin
    logs: List[CheckInLogResponse] = []
