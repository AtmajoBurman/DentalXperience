from typing import Optional
from datetime import time, date
import re
from pydantic import AnyUrl, field_validator
from sqlmodel import Field, SQLModel
from app.models.validators import is_google_drive_link

# --- Schedule ---

class ScheduleBase(SQLModel):
    from_time: time
    to_time: time

class Schedule(ScheduleBase, table=True):
    __tablename__ = "schedule"
    # id 1 to 7 for 7 days
    id: int = Field(primary_key=True, ge=1, le=7)

class ScheduleUpdate(SQLModel):
    from_time: Optional[time] = None
    to_time: Optional[time] = None

# --- Profile ---

class ProfileBase(SQLModel):
    google_maps_location_link: str
    name_of_doctor: str
    name_of_chamber: str
    doctor_profile_picture: str

    @field_validator("doctor_profile_picture")
    @classmethod
    def validate_google_drive(cls, v: str):
        if not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

class Profile(ProfileBase, table=True):
    __tablename__ = "profile"
    id: int = Field(default=1, primary_key=True)  # Only 1 profile

class ProfileUpdate(SQLModel):
    google_maps_location_link: Optional[str] = None
    name_of_doctor: Optional[str] = None
    name_of_chamber: Optional[str] = None
    doctor_profile_picture: Optional[str] = None

    @field_validator("doctor_profile_picture")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

# --- Staff ---

class StaffBase(SQLModel):
    name: str = Field(max_length=100)
    description: str = Field(max_length=1000)
    from_date: date
    till_date: Optional[date] = None
    phone_number: Optional[str] = None
    profile_picture: str
    order_index: int = Field(default=0)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]):
        if v is not None:
            if not re.match(r"^\+\d{2}-\d{10}$", v):
                raise ValueError("Phone number must be of the format +ab-xycdefghij (e.g., +91-8549762582)")
        return v

    @field_validator("profile_picture")
    @classmethod
    def validate_google_drive(cls, v: str):
        if not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase, table=True):
    __tablename__ = "staff"
    id: Optional[int] = Field(default=None, primary_key=True)

class StaffUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    from_date: Optional[date] = None
    till_date: Optional[date] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]):
        if v is not None:
            if not re.match(r"^\+\d{2}-\d{10}$", v):
                raise ValueError("Phone number must be of the format +ab-xycdefghij (e.g., +91-8549762582)")
        return v

    @field_validator("profile_picture")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

# --- Admin ---

class Admin(SQLModel, table=True):
    __tablename__ = "admin"
    id: int = Field(default=1, primary_key=True)
    username: str = Field(unique=True)
    hashed_password: str
