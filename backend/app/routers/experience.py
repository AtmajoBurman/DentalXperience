from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel

class ReorderRequest(BaseModel):
    item_ids: List[int]

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.models.dynamic_tables import Experience, ExperienceCreate, ExperienceUpdate

router = APIRouter(prefix="/experience", tags=["experience"])

@router.post("/", response_model=Experience)
async def create_experience(
    experience: ExperienceCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_experience = Experience.model_validate(experience)
    session.add(db_experience)
    await session.commit()
    await session.refresh(db_experience)
    return db_experience

@router.get("/", response_model=List[Experience])
async def read_experiences(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Experience).order_by(Experience.order_index.asc()))
    return result.scalars().all()

@router.get("/{experience_id}", response_model=Experience)
async def read_experience(experience_id: int, session: AsyncSession = Depends(get_session)):
    experience = await session.get(Experience, experience_id)
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    return experience

@router.patch("/{experience_id}", response_model=Experience)
async def update_experience(
    experience_id: int, 
    experience_update: ExperienceUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_experience = await session.get(Experience, experience_id)
    if not db_experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    update_data = experience_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_experience, key, value)
    session.add(db_experience)
    await session.commit()
    await session.refresh(db_experience)
    return db_experience

@router.delete("/{experience_id}")
async def delete_experience(
    experience_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    experience = await session.get(Experience, experience_id)
    if not experience:
        raise HTTPException(status_code=404, detail="Experience not found")
    await session.delete(experience)
    await session.commit()
    return {"ok": True}

@router.post("/reorder")
async def reorder_experiences(
    req: ReorderRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    for index, item_id in enumerate(req.item_ids):
        item = await session.get(Experience, item_id)
        if item:
            item.order_index = index
            session.add(item)
    await session.commit()
    return {"ok": True}
