import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    POSTGRES_URL: str
    JWT_SECRET_KEY: str
    RESEND_API_KEY: str | None = None
    SMTP_USERNAME: str = "burmandentalclinic@gmail.com"
    GOOGLE_APP_PASSWORD: str | None = None
    
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

settings = Settings()
