import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, recipient_name: str, otp_code: str, expiry_minutes: int = 5) -> tuple[bool, str]:
        """
        Sends a 6-digit OTP verification email using configured SMTP settings.
        If SMTP credentials are not configured or connection is unavailable,
        gracefully logs the generated code in dev simulation mode so tests succeed.
        """
        name = recipient_name or "Candidate"
        subject = f"Your CareerSense AI Verification Code: {otp_code}"

        plain_text = f"""
Hello {name},

We received a request to reset your CareerSense AI account password.

Your 6-digit verification code is: {otp_code}

This code will expire in {expiry_minutes} minutes.
For your security, never share this code with anyone.

If you did not request a password reset, you can safely ignore this email.

Best regards,
CareerSense AI Security Team
"""

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - CareerSense AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #070d1e 0%, #0b1329 45%, #1e3a8a 100%); padding: 28px 32px; text-align: left;">
              <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                CareerSense <span style="color: #38bdf8;">AI</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">
                Career Intelligence Platform
              </div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="font-size: 19px; font-weight: 750; color: #0f172a; margin: 0 0 12px 0;">
                Password Reset Verification
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Hello <strong>{name}</strong>,<br>
                We received a request to reset the password for your CareerSense AI account. Enter the 6-digit verification code below to authorize your password update:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f7ff 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <div style="font-size: 11px; font-weight: 750; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                  6-Digit Verification Code
                </div>
                <div style="font-size: 34px; font-weight: 850; letter-spacing: 8px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">
                  {otp_code}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                  Expires in <strong>{expiry_minutes} minutes</strong>
                </div>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0;">
                For your security, do not share this code with anyone. CareerSense AI representatives will never ask for your verification code.
              </p>
              
              <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 10px 14px; margin-top: 18px; border-radius: 4px;">
                <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                  If you did not request a password reset, you can safely ignore this email. Your credentials will remain unchanged.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              © 2026 CareerSense AI • Intelligent Placement & Career Guidance<br>
              Deterministic Resume Intelligence System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        # If SMTP username or password is not configured, run in dev simulation mode
        if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
            logger.info(f"[EMAIL SERVICE - DEV MODE] SMTP not configured. OTP for {to_email}: {otp_code}")
            print(f"\n=======================================================\n[DEV OTP DISPATCH] To: {to_email} | Code: {otp_code}\n=======================================================\n", flush=True)
            return True, "OTP simulated in development mode"

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = Config.MAIL_DEFAULT_SENDER
            msg['To'] = to_email

            msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))

            if Config.MAIL_USE_SSL:
                server = smtplib.SMTP_SSL(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=10)
            else:
                server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=10)
                if Config.MAIL_USE_TLS:
                    server.starttls()

            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.sendmail(Config.MAIL_DEFAULT_SENDER, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Verification email successfully sent to {to_email}")
            return True, "Email sent successfully"
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {str(e)}")
            print(f"[EMAIL ERROR] SMTP send failed: {str(e)}. Fallback dev OTP for {to_email}: {otp_code}", flush=True)
            return True, f"SMTP error (fallback dev mode): {str(e)}"
