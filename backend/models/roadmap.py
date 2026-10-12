from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from extensions import db

class Roadmap(db.Model):
    __tablename__ = 'roadmaps'

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    target_role = Column(String(150), nullable=False)
    total_duration_weeks = Column(Integer, default=6)
    daily_study_hours = Column(db.Float, default=1.0)
    study_days_per_week = Column(Integer, default=5)
    learning_style = Column(String(50), default='balanced') # balanced, intensive, project_based
    total_learning_hours = Column(db.Float, default=30.0)
    overall_progress = Column(Integer, default=0) # 0 - 100%

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    analysis = relationship('Analysis', back_populates='roadmap')
    user = relationship('User', back_populates='roadmaps')
    items = relationship('RoadmapItem', back_populates='roadmap', cascade='all, delete-orphan', order_by='RoadmapItem.order_index')

    def to_dict(self):
        match_ctx = {}
        if self.analysis:
            match_ctx = {
                'match_score': round(self.analysis.match_score, 1) if self.analysis.match_score is not None else 0,
                'target_role': self.analysis.target_role,
                'candidate_name': self.analysis.candidate_name,
                'company_name': self.analysis.job_description.company_name if (self.analysis.job_description and self.analysis.job_description.company_name) else 'Target Organization',
                'resume_filename': self.analysis.resume.filename if self.analysis.resume else 'Uploaded Resume',
                'total_required_skills': self.analysis.total_required_skills or 0,
                'matched_skills_count': self.analysis.matched_skills_count or 0,
                'missing_skills_count': self.analysis.missing_skills_count or 0,
                'partial_skills_count': self.analysis.partial_skills_count or 0,
            }
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'user_id': self.user_id,
            'target_role': self.target_role,
            'match_context': match_ctx,
            'total_duration_weeks': self.total_duration_weeks,
            'daily_study_hours': self.daily_study_hours or 1.0,
            'study_days_per_week': self.study_days_per_week or 5,
            'learning_style': self.learning_style or 'balanced',
            'total_learning_hours': self.total_learning_hours or (
                (self.daily_study_hours or 1.0) * (self.study_days_per_week or 5) * (self.total_duration_weeks or 6)
            ),
            'overall_progress': self.overall_progress,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class RoadmapItem(db.Model):
    __tablename__ = 'roadmap_items'

    id = Column(Integer, primary_key=True, autoincrement=True)
    roadmap_id = Column(Integer, ForeignKey('roadmaps.id', ondelete='CASCADE'), nullable=False, index=True)
    phase_number = Column(Integer, nullable=False)
    skill_name = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    duration_weeks = Column(String(50), nullable=False)
    priority = Column(
        Enum('HIGH', 'MEDIUM', 'LOW', name='roadmap_priority_enum'),
        nullable=False,
        default='HIGH'
    )
    topics = Column(JSON, nullable=False)
    practice_project = Column(Text, nullable=False)
    expected_outcome = Column(Text, nullable=True)
    tasks = Column(JSON, nullable=True) # List of daily/weekly actionable tasks
    resource_categories = Column(JSON, nullable=True)
    status = Column(
        Enum('Not Started', 'In Progress', 'Completed', name='roadmap_item_status_enum'),
        default='Not Started',
        nullable=False
    )
    progress = Column(Integer, default=0) # 0, 25, 50, 75, 100
    order_index = Column(Integer, nullable=False)

    # Relationship
    roadmap = relationship('Roadmap', back_populates='items')

    def to_dict(self):
        from services.curriculum_data import get_skill_curriculum
        curr = get_skill_curriculum(self.skill_name)
        return {
            'id': self.id,
            'roadmap_id': self.roadmap_id,
            'phase_number': self.phase_number,
            'skill_name': self.skill_name,
            'title': self.title,
            'duration_weeks': self.duration_weeks,
            'priority': self.priority,
            'topics': self.topics if isinstance(self.topics, list) else [],
            'practice_project': self.practice_project,
            'expected_outcome': self.expected_outcome or f"Demonstrable proficiency in {self.skill_name} with functional portfolio code.",
            'tasks': self.tasks if isinstance(self.tasks, list) else [],
            'resource_categories': self.resource_categories if isinstance(self.resource_categories, (list, dict)) else [],
            'curriculum': curr,
            'status': self.status,
            'progress': self.progress,
            'order_index': self.order_index
        }

