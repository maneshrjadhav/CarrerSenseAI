from sqlalchemy import Column, Integer, String, Float, Boolean, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from extensions import db

class AnalysisSkill(db.Model):
    __tablename__ = 'analysis_skills'

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    match_status = Column(
        Enum('matched', 'missing', 'partial', 'extra', name='match_status_enum'),
        nullable=False,
        default='matched'
    )
    is_required = Column(Boolean, default=True)
    confidence = Column(Float, default=1.0)
    evidence_text = Column(Text, nullable=True)
    recommended_improvement = Column(Text, nullable=True)

    # Relationship
    analysis = relationship('Analysis', back_populates='skills')

    def to_dict(self):
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'skill_name': self.skill_name,
            'category': self.category,
            'match_status': self.match_status,
            'is_required': self.is_required,
            'confidence': round(self.confidence, 2),
            'evidence_text': self.evidence_text,
            'recommended_improvement': self.recommended_improvement
        }

class SkillGap(db.Model):
    __tablename__ = 'skill_gaps'

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False, index=True)
    skill_name = Column(String(100), nullable=False)
    priority = Column(
        Enum('HIGH', 'MEDIUM', 'LOW', name='gap_priority_enum'),
        nullable=False,
        default='HIGH'
    )
    reason = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    estimated_learning_duration = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)

    # Relationship
    analysis = relationship('Analysis', back_populates='skill_gaps')

    def to_dict(self):
        rec = self.recommendation or f"Learn core fundamentals of {self.skill_name} → Build practical project → Integrate into full application."
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'skill_name': self.skill_name,
            'priority': self.priority,
            'reason': self.reason or f"Key competency required for target role.",
            'recommendation': rec,
            'estimated_learning_duration': self.estimated_learning_duration or '2–3 weeks',
            'category': self.category or 'General'
        }

