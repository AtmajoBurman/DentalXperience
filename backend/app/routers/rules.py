from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

class ReorderRequest(BaseModel):
    item_ids: List[int]

from app.core.db import get_session
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.models.dynamic_tables import RuleCategory, RuleCategoryCreate, RuleCategoryUpdate, RuleCategoryWithRules, RuleItem, RuleItemCreate, RuleItemUpdate

router = APIRouter(prefix="/rules", tags=["rules"])

# --- Categories ---

@router.post("/categories/", response_model=RuleCategory)
async def create_category(
    category: RuleCategoryCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_category = RuleCategory.model_validate(category)
    session.add(db_category)
    await session.commit()
    await session.refresh(db_category)
    return db_category

@router.get("/categories/", response_model=List[RuleCategoryWithRules])
async def read_categories(session: AsyncSession = Depends(get_session)):
    # Need to load the rules for each category
    result = await session.execute(
        select(RuleCategory).options(selectinload(RuleCategory.rules))
    )
    categories = result.scalars().all()
    for cat in categories:
        cat.rules.sort(key=lambda r: r.order_index)
    return categories

@router.patch("/categories/{category_id}", response_model=RuleCategory)
async def update_category(
    category_id: int, 
    category_update: RuleCategoryUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_category = await session.get(RuleCategory, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    session.add(db_category)
    await session.commit()
    await session.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_category = await session.get(RuleCategory, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    await session.delete(db_category)
    await session.commit()
    return {"ok": True}

# --- Rule Items ---

@router.post("/items/", response_model=RuleItem)
async def create_rule_item(
    item: RuleItemCreate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_category = await session.get(RuleCategory, item.category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_item = RuleItem.model_validate(item)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item

@router.patch("/items/{item_id}", response_model=RuleItem)
async def update_rule_item(
    item_id: int, 
    item_update: RuleItemUpdate, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_item = await session.get(RuleItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Rule not found")
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item

@router.delete("/items/{item_id}")
async def delete_rule_item(
    item_id: int, 
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    db_item = await session.get(RuleItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Rule not found")
    await session.delete(db_item)
    await session.commit()
    return {"ok": True}

@router.post("/items/reorder")
async def reorder_rule_items(
    req: ReorderRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    for index, item_id in enumerate(req.item_ids):
        item = await session.get(RuleItem, item_id)
        if item:
            item.order_index = index
            session.add(item)
    await session.commit()
    return {"ok": True}
