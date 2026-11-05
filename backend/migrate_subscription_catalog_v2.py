"""
CareerSense AI — Subscription Catalog Migration v2 (2026-10-12)

Single authoritative plan catalog update:
  1. Adds plan_type / duration_days columns to subscription_plans (safe, guarded).
  2. Activates exactly these four customer-facing plans:
       - ATS Report Pass : INR 39  / 1 day  (JD-based ATS report download only)
       - Monthly         : INR 349 / 1 month
       - Quarterly       : INR 599 / 3 months
       - Annual          : INR 999 / 1 year
  3. Deactivates the discontinued six-month INR 749 plan from the active
     catalog. Historical rows, payments, and subscriptions are preserved.

Safe to re-run: every step is idempotent and never deletes historical data.

Usage:  python migrate_subscription_catalog_v2.py
"""

import sys
import os
import json

backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from sqlalchemy import text

from app import create_app
from extensions import db
from models.subscription import SubscriptionPlan

CUSTOMER_FACING_IDENTITY_FEATURES = [
    "Skill Gap Analysis",
    "Personalized Career Roadmap",
    "Interview Preparation",
    "Eligible ATS Report downloads during the active period",
    "Resume-to-JD skill-gap learning recommendations",
    "Interview question practice and answer feedback"
]

CATALOG = [
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
        "features": CUSTOMER_FACING_IDENTITY_FEATURES
    },
    {
        "plan_name": "Quarterly Plan",
        "plan_code": "quarterly",
        "plan_type": "subscription",
        "duration_months": 3,
        "duration_days": None,
        "price_inr": 599.0,
        "is_popular": True,
        "features": CUSTOMER_FACING_IDENTITY_FEATURES
    },
    {
        "plan_name": "Annual Plan",
        "plan_code": "annual",
        "plan_type": "subscription",
        "duration_months": 12,
        "duration_days": None,
        "price_inr": 999.0,
        "is_popular": False,
        "features": CUSTOMER_FACING_IDENTITY_FEATURES
    },
]

DISCONTINUED_PLAN_CODES = ['half_yearly']


def ensure_columns():
    """Add plan_type / duration_days columns if they do not exist yet."""
    inspector = db.inspect(db.engine)
    existing_columns = {c['name'] for c in inspector.get_columns('subscription_plans')}

    if 'plan_type' not in existing_columns:
        db.session.execute(text(
            "ALTER TABLE subscription_plans "
            "ADD COLUMN plan_type VARCHAR(30) NOT NULL DEFAULT 'subscription'"
        ))
        db.session.execute(text("ALTER TABLE subscription_plans ADD INDEX ix_plans_plan_type (plan_type)"))
        print("[Migration] Added column plan_type.")
    else:
        print("[Migration] Column plan_type already present.")

    if 'duration_days' not in existing_columns:
        db.session.execute(text(
            "ALTER TABLE subscription_plans ADD COLUMN duration_days INT NULL"
        ))
        print("[Migration] Added column duration_days.")
    else:
        print("[Migration] Column duration_days already present.")

    db.session.commit()


def migrate_catalog():
    app = create_app()
    with app.app_context():
        print("[Migration] Ensuring subscription_plans columns exist...")
        ensure_columns()

        print("[Migration] Applying authoritative plan catalog...")
        for entry in CATALOG:
            plan = db.session.query(SubscriptionPlan).filter_by(plan_code=entry['plan_code']).first()
            if not plan:
                plan = SubscriptionPlan(plan_code=entry['plan_code'])
                db.session.add(plan)

            plan.plan_name = entry['plan_name']
            plan.plan_type = entry['plan_type']
            plan.duration_months = entry['duration_months']
            plan.duration_days = entry['duration_days']
            plan.price_inr = entry['price_inr']
            plan.is_active = True
            plan.is_popular = entry['is_popular']
            plan.features_json = json.dumps(entry['features'])
            print(f"[Migration] Upserted '{entry['plan_name']}' (INR {entry['price_inr']}, {entry['plan_type']}).")

        for code in DISCONTINUED_PLAN_CODES:
            plan = db.session.query(SubscriptionPlan).filter_by(plan_code=code).first()
            if not plan:
                print(f"[Migration] Discontinued plan '{code}' not present. Nothing to deactivate.")
                continue
            if plan.is_active:
                plan.is_active = False
                print(f"[Migration] Deactivated discontinued plan '{plan.plan_name}' (INR {plan.price_inr}). "
                      f"Historical subscriptions and payments are preserved.")
            else:
                print(f"[Migration] Discontinued plan '{code}' already inactive.")

        db.session.commit()

        active_plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).order_by(
            SubscriptionPlan.price_inr.asc()
        ).all()
        print("\n[Verification] Active customer-facing catalog:")
        for p in active_plans:
            print(f"  - {p.plan_name}: INR {p.price_inr} / {p.duration_label} ({p.plan_code})")
        print("[Success] Subscription catalog migration v2 complete.")


if __name__ == '__main__':
    migrate_catalog()
