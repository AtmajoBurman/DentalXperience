from pydantic import BaseModel, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class UpdatePasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

class EmailRequest(BaseModel):
    email: str = Field(..., description="Email Address of the recipient")
    message: str = Field(..., description="Message content")

class RegisterRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class FeedbackRequest(BaseModel):
    email: str
    feedback: str
