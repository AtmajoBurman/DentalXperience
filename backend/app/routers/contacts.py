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
from app.models.dynamic_tables import Contact, ContactCreate, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.post("/", response_model=Contact)
async def create_contact(
    contact: ContactCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_contact = Contact.model_validate(contact)
    session.add(db_contact)
    await session.commit()
    await session.refresh(db_contact)
    return db_contact

@router.get("/", response_model=List[Contact])
async def read_contacts(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Contact).order_by(Contact.order_index.asc()))
    return result.scalars().all()

@router.get("/{contact_id}", response_model=Contact)
async def read_contact(contact_id: int, session: AsyncSession = Depends(get_session)):
    contact = await session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.patch("/{contact_id}", response_model=Contact)
async def update_contact(
    contact_id: int, 
    contact_update: ContactUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_contact = await session.get(Contact, contact_id)
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    update_data = contact_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_contact, key, value)
    session.add(db_contact)
    await session.commit()
    await session.refresh(db_contact)
    return db_contact

@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    contact = await session.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await session.delete(contact)
    await session.commit()
    return {"ok": True}

@router.post("/reorder")
async def reorder_contacts(
    req: ReorderRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    for index, item_id in enumerate(req.item_ids):
        item = await session.get(Contact, item_id)
        if item:
            item.order_index = index
            session.add(item)
    await session.commit()
    return {"ok": True}
