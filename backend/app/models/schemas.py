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
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# 2. SCHEMAS CHO NGUOI THAM GIA (ATTENDEE)
# ==========================================

class AttendeeBase(BaseModel):
    name: str
    ticket_code: str
    image_url: Optional[str] = None # [FIX]: Khai báo để API trả link ảnh về cho UI

class AttendeeCreate(AttendeeBase):
    pass

class AttendeeUpdate(BaseModel):
    name: Optional[str] = None
    is_checked_in: Optional[bool] = None

class AttendeeResponse(AttendeeBase):
    id: int
    is_checked_in: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AttendeeDetailResponse(AttendeeResponse):
    logs: List[CheckInLogResponse] = []
