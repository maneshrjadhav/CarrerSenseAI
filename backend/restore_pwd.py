import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from extensions import db
from models.user import User
from models.password_reset_otp import PasswordResetOTP
from routes.auth import hash_password

with app.app_context():
    u = db.session.query(User).filter_by(email="candidate_alpha_v25@careersense.ai").first()
    if u:
        u.password_hash = hash_password("CandidatePassword123!")
        db.session.query(PasswordResetOTP).filter_by(user_id=u.id).delete()
        db.session.commit()
        print("Candidate password and reset OTP state restored successfully.")
    else:
        print("User not found.")
