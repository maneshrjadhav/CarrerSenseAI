from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from extensions import db

class Resume(db.Model):
    __tablename__ = 'resumes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)
    extracted_text = Column(LONGTEXT, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(
        Enum('uploaded', 'parsed', 'analyzed', 'failed', name='resume_statuses'),
        nullable=False,
        default='uploaded'
    )

    # Relationships
    user = relationship('User', back_populates='resumes')
    analyses = relationship('Analysis', back_populates='resume', cascade='all, delete-orphan')
    sections = relationship('ResumeSection', back_populates='resume', cascade='all, delete-orphan')
    skills = relationship('ResumeSkill', back_populates='resume', cascade='all, delete-orphan')
    analysis = relationship('ResumeAnalysis', back_populates='resume', uselist=False, cascade='all, delete-orphan')
    suggestions = relationship('ResumeSuggestion', back_populates='resume', cascade='all, delete-orphan')
    interviews = relationship('InterviewSession', back_populates='resume')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'status': self.status
        }

