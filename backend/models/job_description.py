from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from extensions import db

class JobDescription(db.Model):
    __tablename__ = 'job_descriptions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    job_title = Column(String(150), nullable=False)
    company_name = Column(String(150), nullable=True)
    description = Column(LONGTEXT, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship('User', back_populates='job_descriptions')
    analyses = relationship('Analysis', back_populates='job_description')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_title': self.job_title,
            'company_name': self.company_name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

