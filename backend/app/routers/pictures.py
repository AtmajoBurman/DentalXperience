from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.models.dynamic_tables import Picture, PictureCreate, PictureUpdate

router = APIRouter(prefix="/pictures", tags=["pictures"])

@router.post("/", response_model=Picture)
async def create_picture(
    picture: PictureCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_picture = Picture.model_validate(picture)
    session.add(db_picture)
    await session.commit()
    await session.refresh(db_picture)
    return db_picture

@router.get("/", response_model=List[Picture])
async def read_pictures(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Picture))
    return result.scalars().all()

@router.get("/{picture_id}", response_model=Picture)
async def read_picture(picture_id: int, session: AsyncSession = Depends(get_session)):
    picture = await session.get(Picture, picture_id)
    if not picture:
        raise HTTPException(status_code=404, detail="Picture not found")
    return picture

@router.patch("/{picture_id}", response_model=Picture)
async def update_picture(
    picture_id: int, 
    picture_update: PictureUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_picture = await session.get(Picture, picture_id)
    if not db_picture:
        raise HTTPException(status_code=404, detail="Picture not found")
    update_data = picture_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_picture, key, value)
    session.add(db_picture)
    await session.commit()
    await session.refresh(db_picture)
    return db_picture

@router.delete("/{picture_id}")
async def delete_picture(
    picture_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    picture = await session.get(Picture, picture_id)
    if not picture:
        raise HTTPException(status_code=404, detail="Picture not found")
    await session.delete(picture)
    await session.commit()
    return {"ok": True}
