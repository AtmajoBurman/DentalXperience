from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Schedule, ScheduleUpdate, Admin

router = APIRouter(prefix="/schedule", tags=["schedule"])

@router.get("/", response_model=List[Schedule])
async def read_schedules(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Schedule).order_by(Schedule.id))
    return result.scalars().all()

@router.get("/{schedule_id}", response_model=Schedule)
async def read_schedule(schedule_id: int, session: AsyncSession = Depends(get_session)):
    schedule = await session.get(Schedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.patch("/{schedule_id}", response_model=Schedule)
async def update_schedule(
    schedule_id: int, 
    schedule_update: ScheduleUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_schedule = await session.get(Schedule, schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    update_data = schedule_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_schedule, key, value)
    session.add(db_schedule)
    await session.commit()
    await session.refresh(db_schedule)
    return db_schedule
