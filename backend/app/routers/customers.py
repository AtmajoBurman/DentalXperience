from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.models.dynamic_tables import Customer, CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("/", response_model=Customer)
async def create_customer(
    customer: CustomerCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_customer = Customer.model_validate(customer)
    session.add(db_customer)
    await session.commit()
    await session.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[Customer])
async def read_customers(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(Customer))
    return result.scalars().all()

@router.get("/{customer_id}", response_model=Customer)
async def read_customer(
    customer_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    customer = await session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: int, 
    customer_update: CustomerUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_customer = await session.get(Customer, customer_id)
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    session.add(db_customer)
    await session.commit()
    await session.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    customer = await session.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await session.delete(customer)
    await session.commit()
    return {"ok": True}
