import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
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

class GmailSMTPService(EmailService):
    def _notify_admin_via_resend(self, context_msg: str):
        resend.api_key = os.getenv("RESEND_API_KEY")
        if not resend.api_key:
            logger.error("RESEND_API_KEY not found. Cannot notify admin.")
            return
        try:
            params = {
                "from": "dentalclinicissue@resend.dev",
                "to": ["atmajoburman7@gmail.com"],
                "subject": "Urgent: Email Sending Failed",
                "text": "Emails are not getting sent, please fix.",
                "html": "<p>Emails are not getting sent, please fix.</p>"
            }
            resend.Emails.send(params)
            logger.info("Admin notified via Resend.")
        except Exception as admin_err:
            logger.error(f"Failed to notify admin via Resend: {admin_err}")

    def send(self, recipient: str, subject: str, text: str, html: str = None) -> bool:
        sender_email = "burmandentalclinic@gmail.com"
        app_password = os.getenv("GOOGLE_APP_PASSWORD")

        if not app_password:
            logger.error("GOOGLE_APP_PASSWORD is not set. Cannot send email.")
            return False

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = recipient
        msg["Subject"] = subject

        msg.attach(MIMEText(text, "plain"))
        if html:
            msg.attach(MIMEText(html, "html"))

        try:
            server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
            server.login(sender_email, app_password)
            server.send_message(msg)
            server.quit()
            
            print("Email sent successfully!")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            if e.smtp_code == 534:
                logger.error("Encountered 534 SMTPAuthenticationError. Attempting fallback password...")
                app_password_2 = os.getenv("GOOGLE_APP_PASSWORD_2")
                if app_password_2:
                    try:
                        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
                        server.login(sender_email, app_password_2)
                        server.send_message(msg)
                        server.quit()
                        logger.info("Email sent successfully with GOOGLE_APP_PASSWORD_2!")
                        return True
                    except Exception as fallback_e:
                        logger.error("Fallback sending failed:", fallback_e)
                
                logger.error("Fallback also failed. Notifying admin via Resend.")
                self._notify_admin_via_resend("Failed during send().")
            logger.error("Error:", e)
            return False
        except Exception as e:
            logger.error("Error:", e)
            return False

    def send_bulk_bcc(self, bcc_recipients: list[str], subject: str, text: str, html: str = None) -> bool:
        if not bcc_recipients:
            return True
            
        sender_email = "burmandentalclinic@gmail.com"
        app_password = os.getenv("GOOGLE_APP_PASSWORD")

        if not app_password:
            logger.error("GOOGLE_APP_PASSWORD is not set. Cannot send bulk email.")
            return False

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = sender_email # "undisclosed-recipients" or sender_email
        msg["Bcc"] = ", ".join(bcc_recipients)
        msg["Subject"] = subject

        msg.attach(MIMEText(text, "plain"))
        if html:
            msg.attach(MIMEText(html, "html"))

        try:
            server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
            server.login(sender_email, app_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Bulk Bcc Email sent successfully to {len(bcc_recipients)} recipients!")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            if e.smtp_code == 534:
                logger.error("Encountered 534 SMTPAuthenticationError. Attempting fallback password...")
                app_password_2 = os.getenv("GOOGLE_APP_PASSWORD_2")
                if app_password_2:
                    try:
                        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
                        server.login(sender_email, app_password_2)
                        server.send_message(msg)
                        server.quit()
                        logger.info(f"Bulk Bcc Email sent successfully to {len(bcc_recipients)} recipients with GOOGLE_APP_PASSWORD_2!")
                        return True
                    except Exception as fallback_e:
                        logger.error("Fallback sending failed:", fallback_e)
                
                logger.error("Fallback also failed. Notifying admin via Resend.")
                self._notify_admin_via_resend("Failed during send_bulk_bcc().")
            print("Error in bulk sending:", e)
            return False
        except Exception as e:
            print("Error in bulk sending:", e)
            return False

class ResendService(EmailService):
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        if self.api_key:
            resend.api_key = self.api_key

    def send(self, recipient: str, subject: str, text: str, html: str = None) -> bool:
        if not self.api_key:
            logger.error("RESEND_API_KEY is not set.")
            return False
            
        try:
            resend.Emails.send({
                "from": settings.SMTP_USERNAME, # Or a verified domain for Resend
                "to": recipient,
                "subject": subject,
                "text": text,
                "html": html or f"<p>{text}</p>"
            })
            return True
        except Exception as e:
            logger.error(f"Failed to send email via Resend API: {e}")
            return False

# Factory or Dependency Injection function
def get_email_service() -> EmailService:
    # Use Gmail for now as per user request
    return GmailSMTPService()
