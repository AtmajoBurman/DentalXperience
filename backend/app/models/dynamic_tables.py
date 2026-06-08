from typing import Optional, List
from datetime import date, datetime, timezone
from pydantic import AnyUrl, EmailStr, field_validator
from sqlmodel import Field, SQLModel, Relationship
from app.models.validators import is_google_drive_link

# --- Pictures ---

class PictureBase(SQLModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_google_drive(cls, v: str):
        if not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

class Picture(PictureBase, table=True):
    __tablename__ = "pictures"
    id: Optional[int] = Field(default=None, primary_key=True)

class PictureCreate(PictureBase):
    pass

class PictureUpdate(SQLModel):
    url: Optional[str] = None

    @field_validator("url")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

# --- Experience ---

class ExperienceBase(SQLModel):
    heading: str = Field(max_length=100)
    experience_category: str = Field(max_length=50)
    description: str = Field(max_length=2000)
    exp_start: date
    exp_end: Optional[date] = None
    picture_link: str
    order_index: int = Field(default=0)

    @field_validator("picture_link")
    @classmethod
    def validate_google_drive(cls, v: str):
        if not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

class Experience(ExperienceBase, table=True):
    __tablename__ = "experience"
    id: Optional[int] = Field(default=None, primary_key=True)

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(SQLModel):
    heading: Optional[str] = Field(default=None, max_length=100)
    experience_category: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=2000)
    exp_start: Optional[date] = None
    exp_end: Optional[date] = None
    picture_link: Optional[str] = None

    @field_validator("picture_link")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

# --- Announcements ---

class AnnouncementBase(SQLModel):
    heading: str = Field(max_length=100)
    date_and_time: datetime
    description: str
    vanishing_date: datetime

class Announcement(AnnouncementBase, table=True):
    __tablename__ = "announcements"
    id: Optional[int] = Field(default=None, primary_key=True)

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(SQLModel):
    heading: Optional[str] = Field(default=None, max_length=100)
    date_and_time: Optional[datetime] = None
    description: Optional[str] = None
    vanishing_date: Optional[datetime] = None

# --- Customers ---

class CustomerBase(SQLModel):
    email_address: EmailStr = Field(unique=True)

class Customer(CustomerBase, table=True):
    __tablename__ = "customers"
    id: Optional[int] = Field(default=None, primary_key=True)

class OTPRecord(SQLModel, table=True):
    __tablename__ = "otp_records"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(SQLModel):
    email_address: Optional[EmailStr] = None

# --- Contacts ---

class ContactBase(SQLModel):
    name: str = Field(max_length=100)
    contact_number: str = Field(max_length=15)
    profile_picture: Optional[str] = None
    order_index: int = Field(default=0)

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, v: str):
        import re
        if not re.match(r"^\+\d{2}-\d{10}$", v):
            raise ValueError("Contact number must be in the format +xy-abcdefghij")
        return v

    @field_validator("profile_picture")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

class Contact(ContactBase, table=True):
    __tablename__ = "contacts"
    id: Optional[int] = Field(default=None, primary_key=True)

class ContactCreate(ContactBase):
    pass

class ContactUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=100)
    contact_number: Optional[str] = Field(default=None, max_length=15)
    profile_picture: Optional[str] = None

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, v: Optional[str]):
        if v is not None:
            import re
            if not re.match(r"^\+\d{2}-\d{10}$", v):
                raise ValueError("Contact number must be in the format +xy-abcdefghij")
        return v

    @field_validator("profile_picture")
    @classmethod
    def validate_google_drive(cls, v: Optional[str]):
        if v is not None and not v.startswith("https://drive.google.com/") and not v.startswith("http://drive.google.com/"):
            raise ValueError("Must be a valid Google Drive link")
        return v

# --- Rules and Regulations ---

class RuleItemBase(SQLModel):
    description: str = Field(max_length=500)
    category_id: int = Field(foreign_key="rule_categories.id")
    order_index: int = Field(default=0)

class RuleItem(RuleItemBase, table=True):
    __tablename__ = "rule_items"
    id: Optional[int] = Field(default=None, primary_key=True)
    category: Optional["RuleCategory"] = Relationship(back_populates="rules")

class RuleItemCreate(RuleItemBase):
    pass

class RuleItemUpdate(SQLModel):
    description: Optional[str] = Field(default=None, max_length=500)

class RuleCategoryBase(SQLModel):
    name: str = Field(max_length=150)

class RuleCategory(RuleCategoryBase, table=True):
    __tablename__ = "rule_categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    rules: List[RuleItem] = Relationship(back_populates="category", cascade_delete=True)

class RuleCategoryCreate(RuleCategoryBase):
    pass

class RuleCategoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=150)

class RuleCategoryWithRules(RuleCategoryBase):
    id: int
    rules: List[RuleItem] = []

# --- Services ---

class ServiceBase(SQLModel):
    service_name: str = Field(max_length=100)
    service_provided: str = Field(max_length=400)
    order_index: int = Field(default=0)

class Service(ServiceBase, table=True):
    __tablename__ = "services"
    id: Optional[int] = Field(default=None, primary_key=True)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(SQLModel):
    service_name: Optional[str] = Field(default=None, max_length=100)
    service_provided: Optional[str] = Field(default=None, max_length=400)
    order_index: Optional[int] = None
