from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from extensions import db

class Analysis(db.Model):
    __tablename__ = 'analyses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    job_description_id = Column(Integer, ForeignKey('job_descriptions.id', ondelete='SET NULL'), nullable=True, index=True)

    target_role = Column(String(150), nullable=False)
    match_score = Column(Float, nullable=False)             # 0 - 100
    skill_coverage = Column(Float, nullable=False)          # 0 - 100
    semantic_similarity = Column(Float, nullable=False)     # 0 - 100

    candidate_name = Column(String(150), nullable=True)
    candidate_email = Column(String(150), nullable=True)
    candidate_phone = Column(String(50), nullable=True)

    total_required_skills = Column(Integer, default=0)
    matched_skills_count = Column(Integer, default=0)
    missing_skills_count = Column(Integer, default=0)
    partial_skills_count = Column(Integer, default=0)
    status = Column(String(50), default='completed')

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', back_populates='analyses')
    resume = relationship('Resume', back_populates='analyses')
    job_description = relationship('JobDescription', back_populates='analyses')
    skills = relationship('AnalysisSkill', back_populates='analysis', cascade='all, delete-orphan')
    skill_gaps = relationship('SkillGap', back_populates='analysis', cascade='all, delete-orphan')
    roadmap = relationship('Roadmap', back_populates='analysis', uselist=False, cascade='all, delete-orphan')
    reports = relationship('Report', back_populates='analysis', cascade='all, delete-orphan')
    interviews = relationship('InterviewSession', back_populates='analysis', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resume_id': self.resume_id,
            'job_description_id': self.job_description_id,
            'target_role': self.target_role,
            'match_score': round(self.match_score, 1),
            'skill_coverage': round(self.skill_coverage, 1),
            'semantic_similarity': round(self.semantic_similarity, 1),
            'candidate_name': self.candidate_name,
            'candidate_email': self.candidate_email,
            'candidate_phone': self.candidate_phone,
            'total_required_skills': self.total_required_skills,
            'matched_skills_count': self.matched_skills_count,
            'missing_skills_count': self.missing_skills_count,
            'partial_skills_count': self.partial_skills_count,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

