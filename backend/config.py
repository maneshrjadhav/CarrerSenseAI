import os
import urllib.parse
from datetime import timedelta
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'careersense_ai_secret_key_super_secret_2026')
    PORT = int(os.getenv('PORT', 5000))
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    # Match Scoring Weights (Configurable: 70% Skill Score + 30% TF-IDF Cosine Similarity)
    SKILL_COVERAGE_WEIGHT = float(os.getenv('SKILL_COVERAGE_WEIGHT', '0.70'))
    SEMANTIC_SIMILARITY_WEIGHT = float(os.getenv('SEMANTIC_SIMILARITY_WEIGHT', '0.30'))

    # Interview Readiness Thresholds (Configurable)
    INTERVIEW_READINESS_THRESHOLD = float(os.getenv('INTERVIEW_READINESS_THRESHOLD', '80.0'))
    MAX_CRITICAL_GAPS_ALLOWED = int(os.getenv('MAX_CRITICAL_GAPS_ALLOWED', '0'))

    # Razorpay Payment Gateway Configuration
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_CareerSenseAI2026')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'careersense_rzp_secret_key_test_2026')
    RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', 'careersense_rzp_webhook_secret_2026')
    RAZORPAY_CURRENCY = 'INR'

    # JWT Authentication
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'careersense_ai_jwt_secret_super_secure_key_2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # SMTP Email Configuration (Customizable via environment variables)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', '1', 'yes']
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'false').lower() in ['true', '1', 'yes']
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'CareerSense AI <noreply@careersense.ai>')

    # Password Reset & OTP Policy
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 5))
    OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv('OTP_RESEND_COOLDOWN_SECONDS', 60))
    OTP_MAX_ATTEMPTS = int(os.getenv('OTP_MAX_ATTEMPTS', 5))

    # MySQL connection parameters
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.getenv('MYSQL_PORT', '3306')
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'careersense_ai')

    # SQLAlchemy Database URI (PyMySQL)
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        encoded_password = urllib.parse.quote_plus(MYSQL_PASSWORD)
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{MYSQL_USER}:{encoded_password}@"
            f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
        )
    else:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
    }

    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
