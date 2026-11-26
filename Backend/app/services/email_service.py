"""Sending email. With no SMTP server configured (development) the message is
written to the server log instead, so links can still be copied from the terminal."""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.warning("EMAIL NOT SENT (no SMTP_HOST set). To: %s | Subject: %s\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM or settings.SMTP_USER
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException):
        # Never let a mail problem break the request; the log shows what went wrong.
        logger.exception("Could not send email to %s", to)
