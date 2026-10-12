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

def get_user_active_subscription(user_id: int):
    """
    Retrieves the current valid, active subscription for the user.
    Automatically expires subscriptions whose end_date is in the past.
    """
    now = datetime.utcnow()

    # Find subscriptions marked active
    subs = db.session.query(UserSubscription).filter(
        UserSubscription.user_id == user_id,
        UserSubscription.status == 'active'
    ).order_by(UserSubscription.end_date.desc()).all()

    active_sub = None
    for sub in subs:
        if sub.end_date < now:
            sub.status = 'expired'
            db.session.add(sub)
        elif not active_sub:
            active_sub = sub

    if subs:
        db.session.commit()

    return active_sub

def check_feature_access(user_id: int, feature_name: str = None) -> dict:
    """
    Evaluates whether the user has entitlement to access a paid feature.
    
    Paid features:
    - 'skill_gap'
    - 'career_roadmap'
    - 'interview_prep'
    
    Returns:
    {
        "allowed": bool,
        "reason": "active" | "subscription_required" | "subscription_expired",
        "message": str,
        "subscription": dict | None,
        "feature_name": str
    }
    """
    sub = get_user_active_subscription(user_id)
    feature_label = FEATURE_DISPLAY_NAMES.get(feature_name, feature_name or 'Paid Module')

    if not sub:
        # Check if user has a pending payment request awaiting admin verification
        pending_req = db.session.query(PaymentRequest).filter_by(
            user_id=user_id,
            status='pending_verification'
        ).order_by(PaymentRequest.created_at.desc()).first()

        if pending_req:
            return {
                "allowed": False,
                "reason": "payment_pending_verification",
                "message": f"Your payment of ₹{int(pending_req.amount_inr)} (Ref: {pending_req.request_reference}) is currently pending admin verification. Access will be unlocked once approved.",
                "subscription": None,
                "pending_request": pending_req.to_dict(),
                "feature_name": feature_name
            }

        # Check if user had a previous subscription that expired
        past_sub = db.session.query(UserSubscription).filter(
            UserSubscription.user_id == user_id,
            UserSubscription.status == 'expired'
        ).order_by(UserSubscription.end_date.desc()).first()

        if past_sub:
            return {
                "allowed": False,
                "reason": "subscription_expired",
                "message": f"Your subscription expired on {past_sub.end_date.strftime('%d %b %Y')}. Please renew to access {feature_label}.",
                "subscription": past_sub.to_dict(),
                "feature_name": feature_name
            }

        return {
            "allowed": False,
            "reason": "subscription_required",
            "message": f"{feature_label} is a premium CareerSense AI feature. Please subscribe to a plan to continue.",
            "subscription": None,
            "feature_name": feature_name
        }

    return {
        "allowed": True,
        "reason": "active",
        "message": f"Access granted under {sub.plan.plan_name}.",
        "subscription": sub.to_dict(),
        "feature_name": feature_name
    }

def subscription_required(feature_name: str = None):
    """
    Decorator to enforce paid subscription access on Flask routes.
    Must be used AFTER @token_required.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Extract current_user from kwargs or args (token_required passes current_user=user)
            current_user = kwargs.get('current_user') or (args[0] if args else None)
            if not current_user or not getattr(current_user, 'id', None):
                return jsonify({"success": False, "message": "Authentication required."}), 401

            access = check_feature_access(current_user.id, feature_name)
            if not access["allowed"]:
                # Fetch available active plans for upgrade modal
                plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
                return jsonify({
                    "success": False,
                    "access_denied": True,
                    "subscription_required": True,
                    "feature": feature_name,
                    "reason": access["reason"],
                    "message": access["message"],
                    "pending_request": access.get("pending_request"),
                    "upgrade_url": "/pricing",
                    "available_plans": [p.to_dict() for p in plans]
                }), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator

def activate_user_subscription(user_id: int, plan_id: int, payment_id: int = None) -> UserSubscription:
    """
    Activates or extends a subscription for a user after verified payment.
    """
    plan = db.session.query(SubscriptionPlan).filter_by(id=plan_id).first()
    if not plan:
        raise ValueError(f"Subscription plan id {plan_id} not found.")

    now = datetime.utcnow()
    # Check if user already has an active subscription to extend it seamlessly
    current_sub = get_user_active_subscription(user_id)

    duration_days = plan.duration_months * 30
    if plan.duration_months == 12:
        duration_days = 365

    if current_sub:
        start_date = current_sub.start_date
        # Extend from current end date
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

