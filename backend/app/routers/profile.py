from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Profile, ProfileUpdate, Admin

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=Profile)
async def read_profile(session: AsyncSession = Depends(get_session)):
    profile = await session.get(Profile, 1)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.patch("/", response_model=Profile)
async def update_profile(
    profile_update: ProfileUpdate,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_profile = await session.get(Profile, 1)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    update_data = profile_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)
    session.add(db_profile)
    await session.commit()
    await session.refresh(db_profile)
    return db_profile
