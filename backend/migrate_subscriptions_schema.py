"""
Migration & Seeding Script for CareerSense AI Subscriptions and Payments
Creates subscription_plans, user_subscriptions, and payments tables in MySQL,
and seeds the 4 core subscription plans.
"""

import sys
import os
import json

backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import create_app
from extensions import db
from models.subscription import SubscriptionPlan, UserSubscription, Payment

STANDARD_PLANS = [
    {
        "plan_name": "ATS Report Pass",
        "plan_code": "ats_pass",
        "plan_type": "ats_pass",
        "duration_months": 0,
        "duration_days": 1,
        "price_inr": 39.0,
        "is_popular": False,
        "features": [
            "Job Description-based ATS Report download",
            "Valid for 24 hours from activation",
            "Does NOT include Skill Gap, Career Roadmap, or Interview Preparation"
        ]
    },
    {
        "plan_name": "Monthly Plan",
        "plan_code": "monthly",
        "plan_type": "subscription",
        "duration_months": 1,
        "duration_days": None,
        "price_inr": 349.0,
        "is_popular": False,
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "Eligible ATS Report downloads during the active period",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    },
    {
        "plan_name": "Quarterly Plan",
        "plan_code": "quarterly",
        "plan_type": "subscription",
        "duration_months": 3,
        "duration_days": None,
        "price_inr": 599.0,
        "is_popular": True,  # Student recommended
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "Eligible ATS Report downloads during the active period",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    },
    {
        "plan_name": "Annual Plan",
        "plan_code": "annual",
        "plan_type": "subscription",
        "duration_months": 12,
        "duration_days": None,
        "price_inr": 999.0,
        "is_popular": False,
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "Eligible ATS Report downloads during the active period",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    }
]

# The six-month INR 749 plan was discontinued on 2026-10-12. It must never be
# reactivated by re-running this seed script; historical records are preserved.
DISCONTINUED_PLAN_CODES = ['half_yearly']

def migrate_and_seed():
    app = create_app()
    with app.app_context():
        print("[Migration] Checking / Creating subscription and payment tables in MySQL...")
        db.create_all()
        print("[Migration] Tables created / verified successfully.")

        print("[Seeding] Checking subscription plans...")
        for p_data in STANDARD_PLANS:
            existing = db.session.query(SubscriptionPlan).filter_by(plan_code=p_data['plan_code']).first()
            if not existing:
                plan = SubscriptionPlan(
                    plan_name=p_data['plan_name'],
                    plan_code=p_data['plan_code'],
                    plan_type=p_data['plan_type'],
                    duration_months=p_data['duration_months'],
                    duration_days=p_data['duration_days'],
                    price_inr=p_data['price_inr'],
                    is_active=True,
                    is_popular=p_data['is_popular'],
                    features_json=json.dumps(p_data['features'])
                )
                db.session.add(plan)
                print(f"[Seeding] Added plan: {p_data['plan_name']} (INR {p_data['price_inr']})")
            else:
                # Update details if price or features changed
                existing.plan_name = p_data['plan_name']
                existing.plan_type = p_data['plan_type']
                existing.duration_months = p_data['duration_months']
                existing.duration_days = p_data['duration_days']
                existing.price_inr = p_data['price_inr']
                existing.is_popular = p_data['is_popular']
                existing.is_active = True
                existing.features_json = json.dumps(p_data['features'])
                print(f"[Seeding] Plan '{p_data['plan_name']}' verified/updated.")

        for code in DISCONTINUED_PLAN_CODES:
            plan = db.session.query(SubscriptionPlan).filter_by(plan_code=code).first()
            if plan and plan.is_active:
                plan.is_active = False
                print(f"[Seeding] Discontinued plan '{code}' deactivated (historical records preserved).")

        db.session.commit()
        print("[Success] Subscription plans migration and seeding complete!")

if __name__ == '__main__':
    migrate_and_seed()
