from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from pydantic import BaseModel

class ReorderRequest(BaseModel):
    item_ids: List[int]

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Staff, StaffCreate, StaffUpdate, Admin

router = APIRouter(prefix="/staff", tags=["staff"])

@router.get("/", response_model=List[Staff])
async def read_staff(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Staff).order_by(Staff.order_index.asc()))
    return result.scalars().all()

@router.post("/", response_model=Staff)
async def create_staff(
    staff_create: StaffCreate,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_staff = Staff.model_validate(staff_create)
    session.add(db_staff)
    await session.commit()
    await session.refresh(db_staff)
    return db_staff

@router.get("/{staff_id}", response_model=Staff)
async def read_staff(staff_id: int, session: AsyncSession = Depends(get_session)):
    staff = await session.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff

@router.patch("/{staff_id}", response_model=Staff)
async def update_staff(
    staff_id: int, 
    staff_update: StaffUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_staff = await session.get(Staff, staff_id)
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    update_data = staff_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_staff, key, value)
    session.add(db_staff)
    await session.commit()
    await session.refresh(db_staff)
    return db_staff

@router.delete("/{staff_id}")
async def delete_staff(
    staff_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    staff = await session.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    await session.delete(staff)
    await session.commit()
    return {"ok": True}

@router.post("/reorder")
async def reorder_staff(
    req: ReorderRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    for index, item_id in enumerate(req.item_ids):
        item = await session.get(Staff, item_id)
        if item:
            item.order_index = index
            session.add(item)
    await session.commit()
    return {"ok": True}
