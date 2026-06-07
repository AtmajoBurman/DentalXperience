from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.models.dynamic_tables import Announcement, AnnouncementCreate, AnnouncementUpdate, Customer
from app.services.email_service import get_email_service

router = APIRouter(prefix="/announcements", tags=["announcements"])

@router.post("/", response_model=Announcement)
async def create_announcement(
    announcement: AnnouncementCreate, 
    background_tasks: BackgroundTasks,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_announcement = Announcement.model_validate(announcement)
    session.add(db_announcement)
    await session.commit()
    await session.refresh(db_announcement)
    
    # Fetch all registered customers
    result = await session.execute(select(Customer.email_address))
    customer_emails = result.scalars().all()
    
    if customer_emails:
        email_service = get_email_service()
        subject = f"New Announcement: {db_announcement.heading}"
        formatted_date = db_announcement.date_and_time.strftime("%d %b %Y, %I:%M %p")
        text = f"{db_announcement.description}\n\nDate: {formatted_date}"
        background_tasks.add_task(email_service.send_bulk_bcc, list(customer_emails), subject, text)
        
    return db_announcement

@router.get("/", response_model=List[Announcement])
async def read_announcements(session: AsyncSession = Depends(get_session)):
    # Filter out vanished announcements
    from zoneinfo import ZoneInfo
    now = datetime.now(ZoneInfo('Asia/Kolkata'))
    # The timezone handling in DB might need care, assuming naive UTC or IST.
    # For now, just fetching all and filtering in python if timezone naive, or filtering in SQL.
    # Let's filter in SQL assuming datetime is comparable
    result = await session.execute(select(Announcement).where(Announcement.vanishing_date > now.replace(tzinfo=None)))
    return result.scalars().all()

@router.get("/{announcement_id}", response_model=Announcement)
async def read_announcement(announcement_id: int, session: AsyncSession = Depends(get_session)):
    announcement = await session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@router.patch("/{announcement_id}", response_model=Announcement)
async def update_announcement(
    announcement_id: int, 
    announcement_update: AnnouncementUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_announcement = await session.get(Announcement, announcement_id)
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    update_data = announcement_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_announcement, key, value)
    session.add(db_announcement)
    await session.commit()
    await session.refresh(db_announcement)
    return db_announcement

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    announcement = await session.get(Announcement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    await session.delete(announcement)
    await session.commit()
    return {"ok": True}
