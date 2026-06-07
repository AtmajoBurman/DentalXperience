from contextlib import asynccontextmanager
from datetime import datetime, time, timezone, timedelta, date
from zoneinfo import ZoneInfo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, text

from app.core.db import engine, init_db
from app.models.static_tables import Schedule, Profile, Staff, Admin
from app.models.dynamic_tables import Announcement, OTPRecord
from app.core.auth import get_password_hash
from app.core.config import settings

from app.routers import pictures, experience, announcements, customers, schedule, profile, staff, auth, email, register, contacts, rules, chatbot

async def cleanup_announcements():
    async with AsyncSession(engine) as session:
        now = datetime.now(ZoneInfo('Asia/Kolkata')).replace(tzinfo=None)
        # Delete announcements where vanishing_date <= now
        # Using raw SQL or fetching and deleting
        result = await session.execute(select(Announcement).where(Announcement.vanishing_date <= now))
        expired_announcements = result.scalars().all()
        for ann in expired_announcements:
            await session.delete(ann)
        if expired_announcements:
            await session.commit()
            print(f"Cleaned up {len(expired_announcements)} expired announcements.")

async def cleanup_otps():
    async with AsyncSession(engine) as session:
        ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
        # Delete OTPs older than 10 minutes
        result = await session.execute(select(OTPRecord).where(OTPRecord.created_at <= ten_minutes_ago))
        expired_otps = result.scalars().all()
        for otp in expired_otps:
            await session.delete(otp)
        if expired_otps:
            await session.commit()
            print(f"Cleaned up {len(expired_otps)} expired OTPs.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    await init_db()

    # Populate static tables if empty
    async with AsyncSession(engine) as session:
        # Check Schedule
        schedule_count = await session.scalar(select(text("COUNT(id)")).select_from(Schedule))
        if schedule_count == 0:
            for i in range(1, 8):
                session.add(Schedule(id=i, from_time=time(9, 0), to_time=time(17, 0)))
        
        # Check Profile
        profile_count = await session.scalar(select(text("COUNT(id)")).select_from(Profile))
        if profile_count == 0:
            session.add(Profile(
                id=1,
                google_maps_location_link="https://maps.google.com/",
                name_of_doctor="Dr. Default",
                name_of_chamber="Default Chamber",
                doctor_profile_picture="https://drive.google.com/file/d/dummy/view"
            ))

        # Check Staff
        staff_count = await session.scalar(select(text("COUNT(id)")).select_from(Staff))
        if staff_count == 0:
            session.add(Staff(
                name="Default Staff",
                description="Default Description",
                from_date=date(2024, 1, 1),
                profile_picture="https://drive.google.com/file/d/placeholder/view"
            ))

        # Check Admin
        admin_count = await session.scalar(select(text("COUNT(id)")).select_from(Admin))
        if admin_count == 0:
            session.add(Admin(
                username="admin",
                hashed_password=get_password_hash("admin123")
            ))
            
        await session.commit()

    # Setup APScheduler
    scheduler = AsyncIOScheduler()
    # Run cleanup every minute
    scheduler.add_job(cleanup_announcements, "interval", minutes=1)
    scheduler.add_job(cleanup_otps, "interval", minutes=5)
    scheduler.start()

    yield

    # Shutdown APScheduler
    scheduler.shutdown()

app = FastAPI(title="Dental Clinic Portfolio Backend", lifespan=lifespan)

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/admin/")

# Mount the admin frontend
app.mount("/admin", StaticFiles(directory="frontend-admin", html=True), name="admin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pictures.router)
app.include_router(experience.router)
app.include_router(announcements.router)
app.include_router(customers.router)
app.include_router(schedule.router)
app.include_router(profile.router)
app.include_router(staff.router)
app.include_router(auth.router)
app.include_router(email.router)
app.include_router(register.router)
app.include_router(contacts.router)
app.include_router(rules.router)
app.include_router(chatbot.router)
