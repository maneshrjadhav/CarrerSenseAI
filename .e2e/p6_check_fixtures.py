"""Phase 6 fixture-state check (read-only). Prints no banking secrets - only presence flags."""
import sys, os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'd:/CareerSenseAI/backend')
os.chdir('d:/CareerSenseAI/backend')

from app import app
from extensions import db
from models.user import User
from models.resume import Resume
from models.analysis import Analysis
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.payment_request import PaymentSettings, PaymentRequest
from services.subscription_service import get_user_active_subscription, check_feature_access

with app.app_context():
    print("== Users ==")
    for uid in [4, 6, 7, 9, 10, 12]:
        u = User.query.filter_by(id=uid).first()
        if u:
            sub = get_user_active_subscription(u.id)
            print(f"  id={uid} email={u.email} role={u.role} active_sub={'YES' if sub else 'no'}")
        else:
            print(f"  id={uid} MISSING")
    admin = User.query.filter_by(role='admin').all()
    print(f"  admins: {[(a.id, a.email) for a in admin]}")

    print("== User 12 data ==")
    u12 = User.query.filter_by(id=12).first()
    resumes = Resume.query.filter_by(user_id=12).all()
    print(f"  resumes: {[(r.id, getattr(r, 'original_filename', None) or getattr(r, 'filename', None)) for r in resumes]}")
    an = Analysis.query.filter_by(user_id=12).order_by(Analysis.created_at.desc()).first()
    print(f"  latest analysis id: {an.id if an else None}")
    pr = PaymentRequest.query.filter_by(user_id=12).order_by(PaymentRequest.created_at.desc()).all()
    print(f"  payment requests: {[(r.id, r.status) for r in pr]}")
    for feat in ['ats_report', 'career_roadmap', 'skill_gap', 'interview_prep', 'job_match']:
        acc = check_feature_access(12, feat)
        print(f"  feature {feat}: allowed={acc['allowed']} reason={acc.get('reason')}")

    print("== User 7 (unsub) ==")
    for feat in ['ats_report', 'career_roadmap']:
        acc = check_feature_access(7, feat)
        print(f"  feature {feat}: allowed={acc['allowed']} reason={acc.get('reason')}")

    print("== Plans ==")
    plans = SubscriptionPlan.query.filter_by(is_active=True).order_by(SubscriptionPlan.duration_months.asc()).all()
    for p in plans:
        print(f"  id={p.id} code={p.plan_code} type={p.plan_type} name={p.plan_name} price={p.price_inr} months={p.duration_months} days={getattr(p, 'duration_days', None)}")
    inactive = SubscriptionPlan.query.filter_by(is_active=False).all()
    print(f"  inactive plans: {[(p.id, p.plan_code, float(p.price_inr)) for p in inactive]}")

    print("== PaymentSettings (presence only) ==")
    s = PaymentSettings.query.filter_by(is_active=True).first()
    if s:
        print(f"  upi_id_set={bool(s.upi_id)} holder_set={bool(s.account_holder_name)} bank_set={bool(s.bank_name)} acct_set={bool(s.account_number)} ifsc_set={bool(s.ifsc_code)} instructions_set={bool(s.payment_instructions)} qr_url={bool(s.upi_qr_image_url)}")
    else:
        print("  NO active PaymentSettings row!")
