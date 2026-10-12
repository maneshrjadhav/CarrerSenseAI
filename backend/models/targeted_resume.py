"""
Targeted Resume Model
MySQL persistence for job-targeted resume drafts, anti-fabrication tailored content,
before-and-after quality & match scores, and ReportLab generated PDFs.
CareerSense AI - Final Year Engineering Project
"""

import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from extensions import db

class TargetedResume(db.Model):
    __tablename__ = 'targeted_resumes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    original_resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    job_description_id = Column(Integer, ForeignKey('job_descriptions.id', ondelete='SET NULL'), nullable=True, index=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='SET NULL'), nullable=True, index=True)

    target_role = Column(String(150), nullable=False)
    company_name = Column(String(150), nullable=True)
    version_number = Column(Integer, default=1, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default='draft', nullable=False)  # 'draft', 'finalized'

    resume_data = Column(Text, nullable=False)

    original_quality_score = Column(Float, nullable=False, default=0.0)
    revised_quality_score = Column(Float, nullable=False, default=0.0)
    original_match_score = Column(Float, nullable=False, default=0.0)
    revised_match_score = Column(Float, nullable=False, default=0.0)

    pdf_path = Column(String(500), nullable=True)
    pdf_filename = Column(String(255), nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', backref=db.backref('targeted_resumes', cascade='all, delete-orphan'))
    original_resume = relationship('Resume', foreign_keys=[original_resume_id])
    job_description = relationship('JobDescription', foreign_keys=[job_description_id])
    analysis = relationship('Analysis', foreign_keys=[analysis_id])

    def get_resume_data(self):
        try:
            return json.loads(self.resume_data)
        except Exception:
            return {}

    def set_resume_data(self, data_dict):
        self.resume_data = json.dumps(data_dict, ensure_ascii=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'original_resume_id': self.original_resume_id,
            'job_description_id': self.job_description_id,
            'analysis_id': self.analysis_id,
            'target_role': self.target_role,
            'company_name': self.company_name,
            'version_number': self.version_number,
            'title': self.title,
            'status': self.status,
            'resume_data': self.get_resume_data(),
            'original_quality_score': round(self.original_quality_score, 1),
            'revised_quality_score': round(self.revised_quality_score, 1),
            'original_match_score': round(self.original_match_score, 1),
            'revised_match_score': round(self.revised_match_score, 1),
            'pdf_path': self.pdf_path,
            'pdf_filename': self.pdf_filename,
            'has_pdf': bool(self.pdf_path),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

