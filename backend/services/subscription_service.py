"""
CareerSense AI — Subscription Entitlement & Access Control Service
Enforces feature gating, plan validity checks, and subscription lifecycle management in Flask & MySQL.
"""

from datetime import datetime, timedelta
from functools import wraps
from flask import jsonify, request, current_app
from extensions import db
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.payment_request import PaymentRequest
from models.user import User

FEATURE_DISPLAY_NAMES = {
    'skill_gap': 'Skill Gap Analysis & Recommendations',
    'career_roadmap': 'Personalized Career Roadmap & Sequential Progression',
    'interview_prep': 'AI-Powered Mock Interview Preparation & Feedback',
    'ats_report': 'ATS Compliance & Job-Match Report (PDF Generation & Download)'
}

class FreePlan:
    id = 1
    plan_name = "Full Access (Free)"
    plan_type = "subscription"
    price_inr = 0
    duration_months = 120
    is_active = True
    grants_features = {'skill_gap', 'career_roadmap', 'interview_prep', 'ats_report'}

    def to_dict(self):
        return {
            'id': 1,
            'plan_name': 'Full Access (Free)',
            'plan_type': 'subscription',
            'price_inr': 0,
            'duration_months': 120,
            'is_active': True,
            'grants_features': ['skill_gap', 'career_roadmap', 'interview_prep', 'ats_report']
        }

class FreeAccessSubscription:
    def __init__(self, user_id: int):
        self.id = 1
        self.user_id = user_id
        self.plan_id = 1
        self.status = 'active'
        self.is_currently_active = True
        self.remaining_days = 3650
        self.days_remaining = 3650
        self.start_date = datetime(2025, 1, 1)
        self.end_date = datetime(2035, 1, 1)
        self.plan = FreePlan()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_id': self.plan_id,
            'plan': self.plan.to_dict(),
            'status': 'active',
            'is_active': True,
            'days_remaining': 3650,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat()
        }

def get_user_active_subscription(user_id: int):
    """
    Returns active subscription representation so all existing code passes active checks.
    Under the free-access model, all registered users have full active access.
    """
    return FreeAccessSubscription(user_id)

def get_active_subscription_granting(user_id: int, feature_name: str):
    """Returns active subscription for the feature (all features unlocked)."""
    return get_user_active_subscription(user_id)

def get_user_feature_entitlements(user_id: int) -> dict:
    """Returns which features are unlocked. All features are 100% unlocked for registered users."""
    return {
        'skill_gap': True,
        'career_roadmap': True,
        'interview_prep': True,
        'ats_report': True
    }

def check_feature_access(user_id: int, feature_name: str = None) -> dict:
    """
    Evaluates whether the user has entitlement to access a feature.
    Under the free-access model, all features are completely unlocked for all registered users.
    """
    sub = get_user_active_subscription(user_id)
    return {
        "allowed": True,
        "reason": "free_access",
        "message": "All CareerSense AI features are freely accessible without a subscription.",
        "subscription": sub.to_dict(),
        "feature_name": feature_name
    }

def subscription_required(feature_name: str = None):
    """
    Decorator for Flask routes. Verifies user authentication.
    All authenticated candidates have free access to all features without subscription gating.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or (args[0] if args else None)
            if not current_user or not getattr(current_user, 'id', None):
                return jsonify({"success": False, "message": "Authentication required."}), 401
            return f(*args, **kwargs)
        return wrapper
    return decorator

def activate_user_subscription(user_id: int, plan_id: int, payment_id: int = None) -> UserSubscription:
    """
    Activates or extends a subscription for a user after verified payment.

    Duration is server-controlled by the plan catalog (plan.total_duration_days).
    An active subscription of the same plan type is extended from its current
    end date; a different plan type (e.g. the one-day ATS pass vs. a monthly
    subscription) always creates a separate entitlement row so purchasing a
    pass can never overwrite or extend a career subscription and vice versa.
    """
    plan = db.session.query(SubscriptionPlan).filter_by(id=plan_id).first()
    if not plan:
        raise ValueError(f"Subscription plan id {plan_id} not found.")

    now = datetime.utcnow()
    duration_days = plan.total_duration_days
    if not duration_days or duration_days <= 0:
        raise ValueError(f"Plan '{plan.plan_name}' has an invalid duration configuration.")
    plan_type = plan.plan_type or 'subscription'

    # Look for an active subscription of the same plan type to extend
    current_sub = db.session.query(UserSubscription).filter(
        UserSubscription.user_id == user_id,
        UserSubscription.status == 'active',
        UserSubscription.end_date >= now
    ).join(SubscriptionPlan, UserSubscription.plan_id == SubscriptionPlan.id).filter(
        SubscriptionPlan.plan_type == plan_type
    ).order_by(UserSubscription.end_date.desc()).first()

    if current_sub:
        # Extend from the current end date so active days are never lost
        end_date = current_sub.end_date + timedelta(days=duration_days)
        current_sub.plan_id = plan.id
        current_sub.end_date = end_date
        current_sub.payment_id = payment_id or current_sub.payment_id
        current_sub.status = 'active'
        current_sub.updated_at = now
        sub_to_return = current_sub
    else:
        start_date = now
        end_date = now + timedelta(days=duration_days)
        new_sub = UserSubscription(
            user_id=user_id,
            plan_id=plan.id,
            start_date=start_date,
            end_date=end_date,
            status='active',
            payment_id=payment_id
        )
        db.session.add(new_sub)
        sub_to_return = new_sub

    db.session.commit()
    return sub_to_return

