from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from app.schemas import EmailRequest
from app.core.config import settings
from app.core.auth import get_current_admin
from app.models.static_tables import Admin
from app.services.email_service import get_email_service
import logging

router = APIRouter(
    prefix="/email",
    tags=["email"]
)

logger = logging.getLogger(__name__)

@router.post("/send", response_class=JSONResponse)
async def send_email(request: EmailRequest, background_tasks: BackgroundTasks, admin: Admin = Depends(get_current_admin)):
    email_service = get_email_service()
    
    try:
        # Run email sending in the background
        background_tasks.add_task(
            email_service.send,
            recipient=request.email,
            subject="New Message from Dental Clinic",
            text=request.message
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Email sending task started"}
        )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Email Failed to send", "error": str(e)}
        )
