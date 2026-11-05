"""
Subscription and Payment Models
MySQL persistence for subscription plans, user subscription status, and payment transactions.
CareerSense AI - Final Year Engineering Project
"""

import json
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from extensions import db

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'

    PLAN_TYPE_SUBSCRIPTION = 'subscription'
    PLAN_TYPE_ATS_PASS = 'ats_pass'

    # Features each plan type grants. The one-day ATS pass grants ONLY the
    # JD-based ATS report download; it must never unlock the premium career
    # intelligence modules (skill gap, roadmap, interview prep).
    GRANTS_BY_PLAN_TYPE = {
        PLAN_TYPE_SUBSCRIPTION: {'skill_gap', 'career_roadmap', 'interview_prep', 'ats_report'},
        PLAN_TYPE_ATS_PASS: {'ats_report'},
    }

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_name = Column(String(100), nullable=False)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)
    plan_type = Column(String(30), default='subscription', nullable=False, index=True)
    duration_months = Column(Integer, nullable=False)
    duration_days = Column(Integer, nullable=True)
    price_inr = Column(Float, nullable=False)
    features_json = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_popular = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    subscriptions = relationship('UserSubscription', back_populates='plan', cascade='all, delete-orphan')
    payments = relationship('Payment', back_populates='plan')

    def get_features(self):
        try:
            return json.loads(self.features_json)
        except Exception:
            return []

    def set_features(self, features_list):
        self.features_json = json.dumps(features_list)

    @property
    def grants_features(self):
        return set(self.GRANTS_BY_PLAN_TYPE.get(self.plan_type or 'subscription', set()))

    @property
    def total_duration_days(self):
        """Authoritative entitlement length in days for this plan."""
        if self.duration_days:
            return int(self.duration_days)
        months = int(self.duration_months or 0)
        if months == 12:
            return 365
        return months * 30

    @property
    def duration_label(self):
        if self.plan_type == self.PLAN_TYPE_ATS_PASS or (self.duration_days and not self.duration_months):
            days = self.total_duration_days
            return '1 day' if days == 1 else f'{days} days'
        months = int(self.duration_months or 0)
        if months == 1:
            return '1 month'
        if months == 12:
            return '1 year'
        return f'{months} months'

    def to_dict(self):
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'plan_code': self.plan_code,
            'plan_type': self.plan_type or 'subscription',
            'duration_months': self.duration_months,
            'duration_days': self.total_duration_days,
            'total_duration_days': self.total_duration_days,
            'duration_label': self.duration_label,
            'price_inr': self.price_inr,
            'features': self.get_features(),
            'grants_features': sorted(self.grants_features),
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserSubscription(db.Model):
    __tablename__ = 'user_subscriptions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'), nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False, index=True)
    status = Column(
        Enum('active', 'expired', 'cancelled', 'pending', name='sub_status_enum'),
        default='active',
        nullable=False,
        index=True
    )
    payment_id = Column(Integer, ForeignKey('payments.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', back_populates='subscriptions')
    plan = relationship('SubscriptionPlan', back_populates='subscriptions')
    payment = relationship('Payment', foreign_keys=[payment_id])

    @property
    def is_currently_active(self):
        now = datetime.utcnow()
        # Allow 60-second grace window on start_date for database timestamp rounding & clock drift
        return self.status == 'active' and (self.start_date - timedelta(seconds=60)) <= now <= self.end_date

    @property
    def remaining_days(self):
        if not self.is_currently_active:
            return 0
        delta = self.end_date - datetime.utcnow()
        return max(0, delta.days)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'is_currently_active': self.is_currently_active,
            'remaining_days': self.remaining_days,
            'payment_id': self.payment_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Payment(db.Model):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'), nullable=False, index=True)
    gateway_order_id = Column(String(100), nullable=False, unique=True, index=True)
    gateway_payment_id = Column(String(100), nullable=True, index=True)
    gateway_signature = Column(String(255), nullable=True)
    amount_inr = Column(Float, nullable=False)
    currency = Column(String(10), default='INR', nullable=False)
    payment_method = Column(String(50), nullable=True)  # 'upi', 'debit_card', 'card', etc.
    payment_status = Column(
        Enum('created', 'authorized', 'captured', 'failed', 'refunded', name='pay_status_enum'),
        default='created',
        nullable=False,
        index=True
    )
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', back_populates='payments')
    plan = relationship('SubscriptionPlan', back_populates='payments')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'plan_name': self.plan.plan_name if self.plan else None,
            'gateway_order_id': self.gateway_order_id,
            'gateway_payment_id': self.gateway_payment_id,
            'amount_inr': self.amount_inr,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

