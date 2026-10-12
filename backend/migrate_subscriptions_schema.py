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
        "plan_name": "Monthly Plan",
        "plan_code": "monthly",
        "duration_months": 1,
        "price_inr": 349.0,
        "is_popular": False,
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "ATS Report Generation & Download",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    },
    {
        "plan_name": "Quarterly Plan",
        "plan_code": "quarterly",
        "duration_months": 3,
        "price_inr": 599.0,
        "is_popular": True,  # Student recommended
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "ATS Report Generation & Download",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    },
    {
        "plan_name": "Half-Yearly Plan",
        "plan_code": "half_yearly",
        "duration_months": 6,
        "price_inr": 749.0,
        "is_popular": False,
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "ATS Report Generation & Download",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    },
    {
        "plan_name": "Annual Plan",
        "plan_code": "annual",
        "duration_months": 12,
        "price_inr": 999.0,
        "is_popular": False,
        "features": [
            "Skill Gap Analysis",
            "Personalized Career Roadmap",
            "Interview Preparation",
            "ATS Report Generation & Download",
            "Resume-to-JD skill-gap learning recommendations",
            "Interview question practice and answer feedback"
        ]
    }
]

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
                    duration_months=p_data['duration_months'],
                    price_inr=p_data['price_inr'],
                    is_active=True,
                    is_popular=p_data['is_popular'],
                    features_json=json.dumps(p_data['features'])
                )
                db.session.add(plan)
                print(f"[Seeding] Added plan: {p_data['plan_name']} (INR {p_data['price_inr']}, {p_data['duration_months']} mo)")
            else:
                # Update details if price or features changed
                existing.plan_name = p_data['plan_name']
                existing.duration_months = p_data['duration_months']
                existing.price_inr = p_data['price_inr']
                existing.is_popular = p_data['is_popular']
                existing.features_json = json.dumps(p_data['features'])
                print(f"[Seeding] Plan '{p_data['plan_name']}' verified/updated.")

        db.session.commit()
        print("[Success] Subscription plans migration and seeding complete!")

if __name__ == '__main__':
    migrate_and_seed()
