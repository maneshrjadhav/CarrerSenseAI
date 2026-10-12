from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Enum, func
from sqlalchemy.orm import relationship
from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    dob = Column(Date, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum('candidate', 'recruiter', 'admin', name='user_roles'),
        nullable=False,
        default='candidate'
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    resumes = relationship('Resume', back_populates='user', cascade='all, delete-orphan')
    job_descriptions = relationship('JobDescription', back_populates='user')
    analyses = relationship('Analysis', back_populates='user', cascade='all, delete-orphan')
    roadmaps = relationship('Roadmap', back_populates='user', cascade='all, delete-orphan')
    reports = relationship('Report', back_populates='user', cascade='all, delete-orphan')
    interviews = relationship('InterviewSession', back_populates='user', cascade='all, delete-orphan')
    subscriptions = relationship('UserSubscription', back_populates='user', cascade='all, delete-orphan')
    payments = relationship('Payment', back_populates='user', cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        # Support 'name' as alias for 'full_name'
        if 'name' in kwargs and 'full_name' not in kwargs:
            kwargs['full_name'] = kwargs.pop('name')
        # Sanitize empty string for optional fields
        if 'dob' in kwargs:
            val = kwargs['dob']
            if not val:
                kwargs['dob'] = None
            elif isinstance(val, str):
                try:
                    kwargs['dob'] = datetime.strptime(val, '%Y-%m-%d').date()
                except ValueError:
                    kwargs['dob'] = None
        if 'phone' in kwargs and not kwargs['phone']:
            kwargs['phone'] = None
        super().__init__(**kwargs)

    @property
    def name(self):
        return self.full_name

    @name.setter
    def name(self, val):
        self.full_name = val

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'dob': self.dob.isoformat() if self.dob else None,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

