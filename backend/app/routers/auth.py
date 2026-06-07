from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.auth import create_access_token, get_current_admin, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.static_tables import Admin
from app.schemas import Token, UpdatePasswordRequest

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
):
    admin = await session.get(Admin, 1)
    if not admin or admin.username != form_data.username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    from app.core.auth import verify_password
    if not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/update-password")
async def update_password(
    request: UpdatePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    current_admin.hashed_password = get_password_hash(request.new_password)
    session.add(current_admin)
    await session.commit()
    return {"message": "Password updated successfully"}
