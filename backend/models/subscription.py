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

    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_name = Column(String(100), nullable=False)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)
    duration_months = Column(Integer, nullable=False)
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

    def to_dict(self):
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'plan_code': self.plan_code,
            'duration_months': self.duration_months,
            'price_inr': self.price_inr,
            'features': self.get_features(),
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

