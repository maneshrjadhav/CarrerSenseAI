"""
Migration Script: Payment Requests & Admin Settings Schema
Creates payment_settings, payment_requests, and payment_audit_logs tables in MySQL.
Seeds default payment configuration and ensures an admin user exists.
CareerSense AI - Final Year Engineering Project
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from extensions import db
from models.user import User
from models.payment_request import PaymentSettings, PaymentRequest, PaymentAuditLog
from werkzeug.security import generate_password_hash
from sqlalchemy import text

def run_migration():
    print("=" * 70)
    print("MIGRATION: Payment Requests & Admin Payment Settings")
    print("=" * 70)

    with app.app_context():
        # 1. Create tables safely using SQLAlchemy metadata
        print("[1/4] Ensuring MySQL tables exist...")
        db.create_all()
        print("      Tables verified/created: payment_settings, payment_requests, payment_audit_logs")

        # 2. Check and seed default payment settings if table is empty
        print("[2/4] Verifying PaymentSettings configuration...")
        existing_settings = db.session.query(PaymentSettings).first()
        if not existing_settings:
            default_settings = PaymentSettings(
                upi_id='careersense.ai@okhdfcbank',
                upi_qr_image_url='',
                account_holder_name='CareerSense AI Placement Services',
                bank_name='HDFC Bank Ltd',
                account_number='50200088991122',
                ifsc_code='HDFC0001234',
                account_type='Current Account',
                payment_instructions=(
                    "1. Scan the official UPI QR code or transfer to the verified bank account details above.\n"
                    "2. Pay the exact subscription amount for your selected plan.\n"
                    "3. Copy the 12-digit UTR / UPI Transaction Reference Number from your payment app (Google Pay, PhonePe, Paytm, BHIM, Bank App).\n"
                    "4. Submit the UTR number and an optional payment receipt screenshot below.\n"
                    "5. Our administration team will verify the bank transaction and immediately activate your subscription."
                ),
                is_active=True
            )
            db.session.add(default_settings)
            db.session.commit()
            print("      Default PaymentSettings seeded successfully.")
        else:
            print(f"      Existing PaymentSettings found (UPI: {existing_settings.upi_id}).")

        # 3. Ensure an active Administrator user exists in MySQL
        print("[3/4] Verifying Admin account...")
        admin_user = db.session.query(User).filter_by(role='admin').first()
        if not admin_user:
            # Check if admin email already exists
            admin_email = 'admin@careersense.ai'
            user_by_email = db.session.query(User).filter_by(email=admin_email).first()
            if user_by_email:
                user_by_email.role = 'admin'
                db.session.commit()
                admin_user = user_by_email
                print(f"      Promoted existing user {admin_email} to 'admin'.")
            else:
                new_admin = User(
                    email=admin_email,
                    full_name='System Administrator',
                    password_hash=generate_password_hash('Admin@CareerSense2026', method='pbkdf2:sha256'),
                    role='admin',
                    phone='9876543210'
                )
                db.session.add(new_admin)
                db.session.commit()
                admin_user = new_admin
                print(f"      Created new Admin account: {admin_email} (Password: Admin@CareerSense2026)")
        else:
            print(f"      Active Admin account verified: ID {admin_user.id} ({admin_user.email}).")

        # 4. Verification summary
        req_count = db.session.query(PaymentRequest).count()
        audit_count = db.session.query(PaymentAuditLog).count()
        print(f"[4/4] Verification complete. Existing requests: {req_count}, audit logs: {audit_count}.")
        print("=" * 70)
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 70)

if __name__ == '__main__':
    run_migration()

