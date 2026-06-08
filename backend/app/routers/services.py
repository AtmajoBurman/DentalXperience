from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.db import get_session
from app.models.dynamic_tables import Service, ServiceCreate, ServiceUpdate
from app.core.auth import get_current_admin

router = APIRouter(
    prefix="/services",
    tags=["services"],
)

class ReorderRequest(BaseModel):
    service_ids: List[int]

@router.get("/", response_model=List[Service])
async def read_services(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Service).order_by(Service.order_index))
    services = result.scalars().all()
    return services

@router.post("/", response_model=Service)
async def create_service(
    service_in: ServiceCreate,
    session: AsyncSession = Depends(get_session),
    admin=Depends(get_current_admin)
):
    # Get max order_index to append
    result = await session.execute(select(Service).order_by(Service.order_index.desc()))
    last_service = result.scalars().first()
    new_order = last_service.order_index + 1 if last_service else 0
    
    service_data = service_in.model_dump(exclude={"order_index"})
    service = Service(**service_data, order_index=new_order)
    session.add(service)
    await session.commit()
    await session.refresh(service)
    return service

@router.put("/{service_id}", response_model=Service)
async def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    session: AsyncSession = Depends(get_session),
    admin=Depends(get_current_admin)
):
    service = await session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = service_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)
        
    session.add(service)
    await session.commit()
    await session.refresh(service)
    return service

@router.delete("/{service_id}", response_model=dict)
async def delete_service(
    service_id: int,
    session: AsyncSession = Depends(get_session),
    admin=Depends(get_current_admin)
):
    service = await session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    await session.delete(service)
    await session.commit()
    return {"message": "Service deleted successfully"}

@router.put("/reorder/", response_model=dict)
async def reorder_services(
    request: ReorderRequest,
    session: AsyncSession = Depends(get_session),
    admin=Depends(get_current_admin)
):
    # We will receive an array of service_ids in the new order
    for index, s_id in enumerate(request.service_ids):
        service = await session.get(Service, s_id)
        if service:
            service.order_index = index
            session.add(service)
            
    await session.commit()
    return {"message": "Services reordered successfully"}
