from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Enum, ForeignKey, DateTime, func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from extensions import db

class ResumeSection(db.Model):
    __tablename__ = 'resume_sections'

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    section_name = Column(String(100), nullable=False)
    section_content = Column(LONGTEXT, nullable=False)
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship
    resume = relationship('Resume', back_populates='sections')

    def to_dict(self):
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'section_name': self.section_name,
            'section_content': self.section_content,
            'word_count': self.word_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ResumeSkill(db.Model):
    __tablename__ = 'resume_skills'

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    confidence = Column(Float, default=1.0)
    evidence_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship
    resume = relationship('Resume', back_populates='skills')

    def to_dict(self):
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'skill_name': self.skill_name,
            'category': self.category,
            'confidence': round(self.confidence, 2),
            'evidence_text': self.evidence_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ResumeAnalysis(db.Model):
    __tablename__ = 'resume_analysis'

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    quality_score = Column(Float, nullable=False)  # 0 to 100
    total_skills_detected = Column(Integer, default=0)
    sections_detected_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    reading_time_minutes = Column(Float, default=1.0)

    candidate_name = Column(String(150), nullable=True)
    candidate_email = Column(String(150), nullable=True)
    candidate_phone = Column(String(50), nullable=True)
    summary_snippet = Column(Text, nullable=True)

    analyzed_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    resume = relationship('Resume', back_populates='analysis')
    user = relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'user_id': self.user_id,
            'quality_score': round(self.quality_score, 1),
            'total_skills_detected': self.total_skills_detected,
            'sections_detected_count': self.sections_detected_count,
            'word_count': self.word_count,
            'reading_time_minutes': round(self.reading_time_minutes, 1),
            'candidate_name': self.candidate_name,
            'candidate_email': self.candidate_email,
            'candidate_phone': self.candidate_phone,
            'summary_snippet': self.summary_snippet,
            'analyzed_at': self.analyzed_at.isoformat() if self.analyzed_at else None
        }

class ResumeSuggestion(db.Model):
    __tablename__ = 'resume_suggestions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(Enum('strength', 'improvement', name='suggestion_types'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    priority = Column(Enum('HIGH', 'MEDIUM', 'LOW', name='suggestion_priorities'), default='MEDIUM')
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship
    resume = relationship('Resume', back_populates='suggestions')

    def to_dict(self):
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'type': self.type,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

