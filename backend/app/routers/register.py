import re
import secrets
import string
import logging
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from datetime import datetime, timezone, timedelta
from app.schemas import RegisterRequest, VerifyOTPRequest, FeedbackRequest
from app.core.config import settings
from app.core.db import get_session
from app.models.dynamic_tables import OTPRecord, Customer
from app.services.email_service import get_email_service

router = APIRouter(
    prefix="/register",
    tags=["register"]
)

logger = logging.getLogger(__name__)

def is_valid_email(email: str) -> bool:
    # simple regex for basic email validation
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

@router.post("/request-otp", response_class=JSONResponse)
async def request_otp(request: RegisterRequest, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_session)):
    if not is_valid_email(request.email):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Email not valid. Please enter a valid email."}
        )
    
    # Check if email is already registered
    existing_customer = await session.execute(select(Customer).where(Customer.email_address == request.email))
    if existing_customer.scalars().first():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "this email is already registered with us", "registered": True}
        )
    
    # Generate 6-char alphanumeric OTP
    alphabet = string.ascii_uppercase + string.digits
    otp = ''.join(secrets.choice(alphabet) for i in range(6))
    
    # Clear any existing OTPs for this email to avoid clutter
    await session.execute(OTPRecord.__table__.delete().where(OTPRecord.email == request.email))

    # Save new OTP to DB
    otp_record = OTPRecord(email=request.email, otp=otp)
    session.add(otp_record)
    await session.commit()
    
    # Send email with OTP
    email_service = get_email_service()
    subject = "Your Registration OTP"
    text = f"Your OTP for registration is: {otp}\nIt is valid for 5 minutes."
    
    # Run email sending in the background so the endpoint returns immediately
    background_tasks.add_task(email_service.send, request.email, subject, text)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "OTP request received. Email is being sent."}
    )

@router.post("/verify", response_class=JSONResponse)
async def verify_otp(request: VerifyOTPRequest, session: AsyncSession = Depends(get_session)):
    # Find latest OTP for the email
    result = await session.execute(
        select(OTPRecord)
        .where(OTPRecord.email == request.email)
        .order_by(OTPRecord.created_at.desc())
    )
    latest_otp = result.scalars().first()
    
    if not latest_otp or latest_otp.otp != request.otp:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Invalid OTP."}
        )
        
    # Strictly enforce 5-minute expiry at the application level
    if datetime.utcnow() - latest_otp.created_at > timedelta(minutes=5):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Expired OTP. Please request a new one."}
        )
        
    # Check if email is already registered (in case they verified twice)
    existing_customer = await session.execute(select(Customer).where(Customer.email_address == request.email))
    if existing_customer.scalars().first():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Email already registered."}
        )
        
    # Register user
    new_customer = Customer(email_address=request.email)
    session.add(new_customer)
    
    # Optionally delete the used OTP or all OTPs for this email to clean up early
    await session.execute(OTPRecord.__table__.delete().where(OTPRecord.email == request.email))
    
    await session.commit()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Added to database."}
    )

@router.post("/request-unregister-otp", response_class=JSONResponse)
async def request_unregister_otp(request: RegisterRequest, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_session)):
    if not is_valid_email(request.email):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "Invalid email format."})
        
    result = await session.execute(select(Customer).where(Customer.email_address == request.email))
    customer = result.scalars().first()
    
    if not customer:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "We did not find this email registered with us"}
        )
        
    await session.execute(OTPRecord.__table__.delete().where(OTPRecord.email == request.email))
    
    otp = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    
    new_otp = OTPRecord(email=request.email, otp=otp)
    session.add(new_otp)
    await session.commit()
    
    email_service = get_email_service()
    subject = "Your Unregister OTP"
    text = f"Your OTP to unregister is: {otp}\nIt is valid for 5 minutes."
    background_tasks.add_task(email_service.send, request.email, subject, text)
    
    return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "OTP sent."})

@router.post("/verify-unregister-otp", response_class=JSONResponse)
async def verify_unregister_otp(request: VerifyOTPRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(OTPRecord)
        .where(OTPRecord.email == request.email)
        .order_by(OTPRecord.created_at.desc())
    )
    otp_record = result.scalars().first()
    
    if not otp_record or otp_record.otp != request.otp:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "Invalid OTP."})
        
    if datetime.utcnow() - otp_record.created_at > timedelta(minutes=5):
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "Expired OTP. Please request a new one."})
        
    # Delete the customer
    await session.execute(Customer.__table__.delete().where(Customer.email_address == request.email))
    # Delete OTP
    await session.execute(OTPRecord.__table__.delete().where(OTPRecord.email == request.email))
    await session.commit()
    
    return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Your email has been successfully unregistered"})

@router.post("/submit-feedback", response_class=JSONResponse)
async def submit_feedback(request: FeedbackRequest, background_tasks: BackgroundTasks):
    if not request.feedback or not request.feedback.strip():
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message": "Feedback cannot be blank."})
        
    email_service = get_email_service()
    
    # Send thank you to user
    user_subject = "Thank you for your feedback"
    user_text = "We have received your feedback. Thank you for your response!"
    background_tasks.add_task(email_service.send, request.email, user_subject, user_text)
    
    # Send feedback to admin
    admin_subject = "User Unregistered: Feedback"
    admin_text = f"User {request.email} has unregistered.\n\nFeedback:\n{request.feedback}"
    background_tasks.add_task(email_service.send, "burmandentalclinic@gmail.com", admin_subject, admin_text)
    
    return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Feedback submitted."})
