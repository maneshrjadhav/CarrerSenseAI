from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from extensions import db

class PasswordResetOTP(db.Model):
    __tablename__ = 'password_reset_otps'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    email = Column(String(120), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    used = Column(Boolean, nullable=False, default=False)
    reset_token = Column(String(255), nullable=True, unique=True, index=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship('User', backref=db.backref('reset_otps', cascade='all, delete-orphan'))

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def is_locked(self) -> bool:
        return self.attempts >= self.max_attempts

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'attempts': self.attempts,
            'max_attempts': self.max_attempts,
            'used': self.used,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
