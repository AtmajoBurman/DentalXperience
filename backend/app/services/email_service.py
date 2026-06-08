from dotenv import load_dotenv
import resend
from app.core.config import settings
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class EmailService:
    def send(self, recipient: str, subject: str, text: str, html: str = None) -> bool:
        raise NotImplementedError("Subclasses must implement the send method.")
        
    def send_bulk_bcc(self, bcc_recipients: list[str], subject: str, text: str, html: str = None) -> bool:
        raise NotImplementedError("Subclasses must implement the send_bulk_bcc method.")



class ResendService(EmailService):
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        if self.api_key:
            resend.api_key = self.api_key

    def send(self, recipient: str, subject: str, text: str, html: str = None) -> bool:
        if not self.api_key:
            logger.error("RESEND_API_KEY is not set.")
            return False
            
        footer_text = "\n\n---\nThis is an auto-generated email. Please do not reply to it."
        footer_html = "<br><br><hr><p style='color: #888; font-size: 12px;'><i>This is an auto-generated email. Please do not reply to it.</i></p>"
        
        final_text = f"{text}{footer_text}"
        final_html = f"{html}{footer_html}" if html else f"<p>{text}</p>{footer_html}"

        try:
            resend.Emails.send({
                "from": "contact@burmandental.co.in",
                "to": recipient,
                "subject": subject,
                "text": final_text,
                "html": final_html
            })
            return True
        except Exception as e:
            logger.error(f"Failed to send email via Resend API: {e}")
            return False

    def send_bulk_bcc(self, bcc_recipients: list[str], subject: str, text: str, html: str = None) -> bool:
        if not self.api_key:
            logger.error("RESEND_API_KEY is not set.")
            return False
            
        if not bcc_recipients:
            return True

        footer_text = "\n\n---\nThis is an auto-generated email. Please do not reply to it."
        footer_html = "<br><br><hr><p style='color: #888; font-size: 12px;'><i>This is an auto-generated email. Please do not reply to it.</i></p>"
        
        final_text = f"{text}{footer_text}"
        final_html = f"{html}{footer_html}" if html else f"<p>{text}</p>{footer_html}"

        try:
            resend.Emails.send({
                "from": "notification@burmandental.co.in",
                "to": "notification@burmandental.co.in",
                "bcc": bcc_recipients,
                "subject": subject,
                "text": final_text,
                "html": final_html
            })
            return True
        except Exception as e:
            logger.error(f"Failed to send bulk bcc via Resend API: {e}")
            return False

# Factory or Dependency Injection function
def get_email_service() -> EmailService:
    # Use Resend to bypass Render's port blocking
    return ResendService()
