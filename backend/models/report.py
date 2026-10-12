from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from extensions import db

class Report(db.Model):
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    report_filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    analysis = relationship('Analysis', back_populates='reports')
    user = relationship('User', back_populates='reports')

    def to_dict(self):
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'user_id': self.user_id,
            'report_filename': self.report_filename,
            'file_size': self.file_size,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None
        }

