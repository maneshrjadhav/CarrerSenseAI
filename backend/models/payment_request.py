"""
Payment Request and Admin Payment Settings Models
Handles manual UPI QR/Bank payment requests, admin approval workflows,
audit logging, and payment configuration.
CareerSense AI - Final Year Engineering Project
"""

import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime,
    Enum, ForeignKey, func
)
from sqlalchemy.orm import relationship
from extensions import db


class PaymentSettings(db.Model):
    __tablename__ = 'payment_settings'

    id = Column(Integer, primary_key=True, autoincrement=True)
    upi_id = Column(String(120), default='', nullable=False)
    upi_qr_image_url = Column(String(255), default='', nullable=True)
    account_holder_name = Column(String(150), default='', nullable=False)
    bank_name = Column(String(150), default='', nullable=False)
    account_number = Column(String(50), default='', nullable=False)
    ifsc_code = Column(String(30), default='', nullable=False)
    account_type = Column(String(50), default='Savings Account', nullable=False)
    payment_instructions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    updated_by_admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    admin_user = relationship('User', foreign_keys=[updated_by_admin_id])

    def to_dict(self):
        """Full representation for admin management dashboard."""
        return {
            'id': self.id,
            'upi_id': self.upi_id,
            'upi_qr_image_url': self.upi_qr_image_url,
            'account_holder_name': self.account_holder_name,
            'bank_name': self.bank_name,
            'account_number': self.account_number,
            'ifsc_code': self.ifsc_code,
            'account_type': self.account_type,
            'payment_instructions': self.payment_instructions,
            'is_active': self.is_active,
            'updated_by_admin_id': self.updated_by_admin_id,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_public_dict(self):
        """
        Public/Student view: provides necessary payment transfer details
        without exposing any internal system metadata.
        """
        return {
            'upi_id': self.upi_id,
            'upi_qr_image_url': self.upi_qr_image_url,
            'account_holder_name': self.account_holder_name,
            'bank_name': self.bank_name,
            'account_number': self.account_number,
            'ifsc_code': self.ifsc_code,
            'account_type': self.account_type,
            'payment_instructions': self.payment_instructions,
            'is_active': self.is_active
        }


class PaymentRequest(db.Model):
    __tablename__ = 'payment_requests'

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_reference = Column(String(60), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey('subscription_plans.id'), nullable=False, index=True)
    amount_inr = Column(Float, nullable=False)
    currency = Column(String(10), default='INR', nullable=False)
    payment_method = Column(String(50), default='upi_qr', nullable=False)  # 'upi_qr', 'bank_transfer'
    utr_number = Column(String(100), index=True, nullable=True)
    payment_time = Column(String(100), nullable=True)
    receipt_file_url = Column(String(255), nullable=True)
    status = Column(
        Enum('awaiting_payment', 'pending_verification', 'approved', 'rejected', 'expired', name='pay_req_status_enum'),
        default='awaiting_payment',
        nullable=False,
        index=True
    )
    student_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    approved_by_admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    activated_subscription_id = Column(Integer, ForeignKey('user_subscriptions.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship('User', foreign_keys=[user_id])
    plan = relationship('SubscriptionPlan', foreign_keys=[plan_id])
    approver = relationship('User', foreign_keys=[approved_by_admin_id])
    activated_subscription = relationship('UserSubscription', foreign_keys=[activated_subscription_id])
    audit_logs = relationship('PaymentAuditLog', back_populates='payment_request', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'request_reference': self.request_reference,
            'user_id': self.user_id,
            'student_name': self.user.full_name if self.user else None,
            'student_email': self.user.email if self.user else None,
            'plan_id': self.plan_id,
            'plan_name': self.plan.plan_name if self.plan else None,
            'plan_duration_months': self.plan.duration_months if self.plan else None,
            'amount_inr': self.amount_inr,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'utr_number': self.utr_number,
            'payment_time': self.payment_time,
            'receipt_file_url': self.receipt_file_url,
            'status': self.status,
            'student_notes': self.student_notes,
            'admin_notes': self.admin_notes,
            'rejection_reason': self.rejection_reason,
            'approved_by_admin_id': self.approved_by_admin_id,
            'approver_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'activated_subscription_id': self.activated_subscription_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PaymentAuditLog(db.Model):
    __tablename__ = 'payment_audit_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_request_id = Column(Integer, ForeignKey('payment_requests.id', ondelete='CASCADE'), nullable=True, index=True)
    action = Column(String(50), nullable=False)  # 'REQUEST_CREATED', 'UTR_SUBMITTED', 'APPROVED', 'REJECTED', 'SETTINGS_UPDATED'
    performed_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    payment_request = relationship('PaymentRequest', back_populates='audit_logs')
    performer = relationship('User', foreign_keys=[performed_by_user_id])

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {"raw": self.details_json}
        return {
            'id': self.id,
            'payment_request_id': self.payment_request_id,
            'action': self.action,
            'performed_by_user_id': self.performed_by_user_id,
            'performer_name': self.performer.full_name if self.performer else None,
            'performer_email': self.performer.email if self.performer else None,
            'ip_address': self.ip_address,
            'previous_status': self.previous_status,
            'new_status': self.new_status,
            'details': details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

