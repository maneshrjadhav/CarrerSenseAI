from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, Enum, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from extensions import db

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='SET NULL'), nullable=True, index=True)
    resume_id = Column(Integer, ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True, index=True)

    target_role = Column(String(150), nullable=False)
    company_name = Column(String(150), nullable=True)

    interview_type = Column(
        Enum('Technical', 'HR/Behavioral', 'Mixed', name='interview_type_enum'),
        default='Technical',
        nullable=False
    )
    difficulty = Column(
        Enum('Beginner', 'Intermediate', 'Advanced', name='interview_difficulty_enum'),
        default='Intermediate',
        nullable=False
    )

    # Self-introduction recording metadata
    intro_type = Column(String(50), default='video', nullable=True) # 'video', 'audio', 'text'
    intro_text = Column(Text, nullable=True) # typed self-introduction or transcript
    intro_duration_seconds = Column(Float, default=0.0)
    intro_completed = Column(Boolean, default=False)

    status = Column(
        Enum('pending_intro', 'in_progress', 'completed', 'abandoned', name='interview_status_enum'),
        default='pending_intro',
        nullable=False
    )

    overall_score = Column(Float, nullable=True)
    performance_summary = Column(JSON, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', back_populates='interviews')
    analysis = relationship('Analysis', back_populates='interviews')
    resume = relationship('Resume', back_populates='interviews')
    questions = relationship(
        'InterviewQuestion',
        back_populates='session',
        cascade='all, delete-orphan',
        order_by='InterviewQuestion.question_index'
    )

    def to_dict(self, include_solutions=False):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'analysis_id': self.analysis_id,
            'resume_id': self.resume_id,
            'target_role': self.target_role,
            'company_name': self.company_name,
            'interview_type': self.interview_type,
            'difficulty': self.difficulty,
            'intro_type': self.intro_type,
            'intro_text': self.intro_text,
            'intro_duration_seconds': self.intro_duration_seconds,
            'intro_completed': self.intro_completed,
            'status': self.status,
            'overall_score': round(self.overall_score, 1) if self.overall_score is not None else None,
            'performance_summary': self.performance_summary,
            'total_questions': len(self.questions) if self.questions else 0,
            'completed_questions': sum(1 for q in self.questions if q.is_submitted) if self.questions else 0,
            'questions': [q.to_dict(include_solution=include_solutions) for q in self.questions] if self.questions else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class InterviewQuestion(db.Model):
    __tablename__ = 'interview_questions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey('interview_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    question_index = Column(Integer, nullable=False) # 1, 2, 3...
    skill_name = Column(String(100), nullable=False)
    category = Column(String(100), default='Technical', nullable=False)
    difficulty = Column(String(50), default='Intermediate', nullable=False)
    question_text = Column(Text, nullable=False)
    time_guidance = Column(String(50), default='2-3 minutes', nullable=True)

    # Candidate submission
    candidate_answer = Column(Text, nullable=True)
    answer_mode = Column(String(20), default='text', nullable=True) # 'text' or 'voice'
    is_submitted = Column(Boolean, default=False, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    # Evaluation results
    score = Column(Float, nullable=True)
    evaluation = Column(JSON, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    session = relationship('InterviewSession', back_populates='questions')

    def to_dict(self, include_solution=False):
        data = {
            'id': self.id,
            'session_id': self.session_id,
            'question_index': self.question_index,
            'skill_name': self.skill_name,
            'category': self.category,
            'difficulty': self.difficulty,
            'question_text': self.question_text,
            'time_guidance': self.time_guidance,
            'candidate_answer': self.candidate_answer,
            'answer_mode': self.answer_mode,
            'is_submitted': self.is_submitted,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'score': round(self.score, 1) if self.score is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        # Hide model answers and evaluation until the question is submitted!
        if self.is_submitted or include_solution:
            data['evaluation'] = self.evaluation
            if isinstance(self.evaluation, dict):
                data['model_answer'] = self.evaluation.get('model_answer')
                data['solution'] = self.evaluation.get('model_answer')
                data['why_stronger'] = self.evaluation.get('why_stronger')
                data['strengths'] = self.evaluation.get('strengths')
                data['missing_concepts'] = self.evaluation.get('missing_concepts')
                data['improvement_tips'] = self.evaluation.get('improvement_tips')
        else:
            data['evaluation'] = None
            data['model_answer'] = None
            data['solution'] = None
            data['why_stronger'] = None

        return data
