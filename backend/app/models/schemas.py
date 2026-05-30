from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class CheckInLogBase(BaseModel):
    status: str
    image_url: Optional[str] = None

class CheckInLogCreate(CheckInLogBase):
    # [FIX AN NINH]: Báo cho Pydantic biết ID có thể trống
    attendee_id: Optional[int] = None

class CheckInLogResponse(CheckInLogBase):
    id: int
    attendee_id: Optional[int] = None
    check_time: datetime
    model_config = ConfigDict(from_attributes=True)

class AttendeeBase(BaseModel):
    name: str
    ticket_code: str
    image_url: Optional[str] = None 

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
