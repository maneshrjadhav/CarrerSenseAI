from extensions import db
from models.user import User
from models.resume import Resume
from models.job_description import JobDescription
from models.analysis import Analysis
from models.skill import AnalysisSkill, SkillGap
from models.roadmap import Roadmap, RoadmapItem
from models.report import Report
from models.resume_intelligence import (
    ResumeSection, ResumeSkill, ResumeAnalysis, ResumeSuggestion
)
from models.interview import InterviewSession, InterviewQuestion
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.targeted_resume import TargetedResume
from models.payment_request import PaymentSettings, PaymentRequest, PaymentAuditLog

Base = db.Model

__all__ = [
    'db',
    'Base',
    'User',
    'Resume',
    'JobDescription',
    'Analysis',
    'AnalysisSkill',
    'SkillGap',
    'Roadmap',
    'RoadmapItem',
    'Report',
    'ResumeSection',
    'ResumeSkill',
    'ResumeAnalysis',
    'ResumeSuggestion',
    'InterviewSession',
    'InterviewQuestion',
    'SubscriptionPlan',
    'UserSubscription',
    'Payment',
    'TargetedResume',
    'PaymentSettings',
    'PaymentRequest',
    'PaymentAuditLog'
]
