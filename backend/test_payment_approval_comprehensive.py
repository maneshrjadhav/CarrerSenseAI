"""
Comprehensive End-to-End Test Suite for CareerSense AI Payment Request & Admin Approval Workflow.

Verifies all 14 operational scenarios:
 1. Student selects plan (server enforces exact ₹599 amount)
 2. Payment request created and persisted in MySQL with reference CS-PAY-...
 3. Student submits UTR & optional notes (transitions to pending_verification)
 4. Subscription remains strictly inactive while pending verification
 5. Non-admin student receives 403 Forbidden on admin approval endpoints
 6. Admin lists pending requests and inspects details with audit history
 7. Admin approves request -> atomically activates exact subscription duration
 8. Admin rejects invalid request with reason -> subscription remains inactive
 9. Idempotent approval -> duplicate approval call does not double-activate
10. Data isolation -> Student B cannot access or modify Student A's request (403)
11. Anti-duplicate UTR -> prevents reusing already approved/pending UTR
12. Expired / inactive subscription -> feature access properly gated
13. Admin payment settings -> admin updates UPI / bank info, public endpoint reflects it
14. Public config distinction -> clear UPI QR & Bank transfer support
"""

import sys
import json
import uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

# Fix CP1252 Unicode encoding for Windows console output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import app
from models import (
    db, User, SubscriptionPlan, UserSubscription, Payment,
    PaymentRequest, PaymentAuditLog, PaymentSettings
)
from services.subscription_service import check_feature_access, get_user_active_subscription


def run_comprehensive_tests():
    print("=" * 75)
    print("CAREERSENSE AI - COMPREHENSIVE PAYMENT & ADMIN APPROVAL VERIFICATION")
    print("=" * 75)
    
    with app.app_context():
        # Setup test accounts
        admin_user = User.query.filter_by(email="admin@careersense.ai").first()
        if not admin_user:
            admin_user = User(
                name="System Administrator",
                email="admin@careersense.ai",
                role="admin",
                password_hash=generate_password_hash("Admin@CareerSense2026", method="pbkdf2:sha256")
            )
            db.session.add(admin_user)
            db.session.commit()
            print("  Created Admin Account: admin@careersense.ai")
        else:
            admin_user.role = "admin"
            admin_user.password_hash = generate_password_hash("Admin@CareerSense2026", method="pbkdf2:sha256")
            db.session.commit()

        # Student A
        student_a = User.query.filter_by(email="student_a_test@careersense.ai").first()
        if not student_a:
            student_a = User(
                name="Student Alpha",
                email="student_a_test@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("StudentPassword123!", method="pbkdf2:sha256")
            )
            db.session.add(student_a)
            db.session.commit()
            print("  Created Student A: student_a_test@careersense.ai")
        else:
            student_a.password_hash = generate_password_hash("StudentPassword123!", method="pbkdf2:sha256")
            db.session.commit()

        # Student B
        student_b = User.query.filter_by(email="student_b_test@careersense.ai").first()
        if not student_b:
            student_b = User(
                name="Student Beta",
                email="student_b_test@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("StudentPassword123!", method="pbkdf2:sha256")
            )
            db.session.add(student_b)
            db.session.commit()
            print("  Created Student B: student_b_test@careersense.ai")
        else:
            student_b.password_hash = generate_password_hash("StudentPassword123!", method="pbkdf2:sha256")
            db.session.commit()

        # Reset any existing active subscriptions for test students
        UserSubscription.query.filter(UserSubscription.user_id.in_([student_a.id, student_b.id])).delete()
        db.session.commit()

        client = app.test_client()

        admin_token = create_access_token(identity=str(admin_user.id))
        student_a_token = create_access_token(identity=str(student_a.id))
        student_b_token = create_access_token(identity=str(student_b.id))

        passed_scenarios = 0

        # -------------------------------------------------------------
        # SCENARIO 1: Student creates payment request for 3-Month Plan (₹599)
        # -------------------------------------------------------------
        print("\n[SCENARIO 1] Student selects ₹599 Plan (Quarterly)...")
        plan_3m = SubscriptionPlan.query.filter_by(duration_months=3).first()
        assert plan_3m is not None, "Quarterly plan missing"
        assert float(plan_3m.price_inr) == 599.0, f"Expected 599.0, got {plan_3m.price_inr}"

        resp1 = client.post(
            '/api/subscription/payment-requests',
            headers={'Authorization': f'Bearer {student_a_token}'},
            json={'plan_id': plan_3m.id}
        )
        assert resp1.status_code == 201, f"Failed: {resp1.data}"
        data1 = resp1.get_json()
        assert data1['success'] is True
        req_id_1 = data1['payment_request']['id']
        ref_1 = data1['payment_request']['request_reference']
        assert float(data1['payment_request']['amount_inr']) == 599.0
        assert data1['payment_request']['status'] == 'awaiting_payment'
        assert ref_1.startswith('CS-PAY-')
        print(f"  [PASS] Request created: ID={req_id_1}, Ref={ref_1}, Amount=₹{data1['payment_request']['amount_inr']}")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 2: Verify persistence in MySQL
        # -------------------------------------------------------------
        print("\n[SCENARIO 2] Verifying MySQL persistence of PaymentRequest...")
        db_req_1 = PaymentRequest.query.get(req_id_1)
        assert db_req_1 is not None
        assert db_req_1.user_id == student_a.id
        assert db_req_1.plan_id == plan_3m.id
        assert float(db_req_1.amount_inr) == 599.0
        assert db_req_1.status == 'awaiting_payment'
        print(f"  [PASS] Record verified in MySQL table 'payment_requests': User ID={db_req_1.user_id}")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 3: Student submits UTR & payment details
        # -------------------------------------------------------------
        print("\n[SCENARIO 3] Student submits UTR proof...")
        utr_1 = f"UTR-TEST-{uuid.uuid4().hex[:8].upper()}"
        resp3 = client.post(
            f'/api/subscription/payment-requests/{req_id_1}/submit-proof',
            headers={'Authorization': f'Bearer {student_a_token}'},
            data={
                'utr_number': utr_1,
                'payment_time': '2026-10-12 15:30:00',
                'student_notes': 'Transferred via Google Pay'
            }
        )
        assert resp3.status_code == 200, f"Submit proof failed: {resp3.data}"
        data3 = resp3.get_json()
        assert data3['success'] is True
        assert data3['payment_request']['status'] == 'pending_verification'
        assert data3['payment_request']['utr_number'] == utr_1
        print(f"  [PASS] Proof submitted. Status updated to 'pending_verification' with UTR={utr_1}")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 4: Subscription remains INACTIVE while pending verification
        # -------------------------------------------------------------
        print("\n[SCENARIO 4] Verifying subscription remains inactive during pending verification...")
        resp4 = client.get(
            '/api/subscription/current',
            headers={'Authorization': f'Bearer {student_a_token}'}
        )
        assert resp4.status_code == 200
        data4 = resp4.get_json()
        assert data4['has_active_subscription'] is False
        assert data4['pending_payment_request'] is not None
        assert data4['pending_payment_request']['id'] == req_id_1
        assert data4['pending_payment_request']['status'] == 'pending_verification'

        # Feature gating check
        feat_check = check_feature_access(student_a.id, 'career_roadmap')
        assert feat_check['allowed'] is False
        assert feat_check['reason'] == 'payment_pending_verification'
        print(f"  [PASS] has_active_subscription=False, pending request acknowledged, feature gating enforced ({feat_check['reason']})")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 5: Non-admin student attempts admin action -> 403 Forbidden
        # -------------------------------------------------------------
        print("\n[SCENARIO 5] Non-admin student attempts admin approval endpoint...")
        resp5 = client.post(
            f'/api/admin/payment-requests/{req_id_1}/approve',
            headers={'Authorization': f'Bearer {student_a_token}'},
            json={'admin_notes': 'Unauthorized approval attempt'}
        )
        assert resp5.status_code == 403, f"Expected 403, got {resp5.status_code}: {resp5.data}"
        print(f"  [PASS] Student approval request properly rejected with 403 Forbidden")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 6: Admin lists pending requests and inspects details
        # -------------------------------------------------------------
        print("\n[SCENARIO 6] Admin views pending requests list & audit trail...")
        resp6 = client.get(
            '/api/admin/payment-requests?status=pending_verification',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert resp6.status_code == 200
        data6 = resp6.get_json()
        assert data6['success'] is True
        matching = [r for r in data6.get('payment_requests', []) if r['id'] == req_id_1]
        assert len(matching) == 1, "Created request not in admin list"

        resp6_detail = client.get(
            f'/api/admin/payment-requests/{req_id_1}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert resp6_detail.status_code == 200
        detail_data = resp6_detail.get_json()
        assert detail_data['success'] is True
        assert len(detail_data.get('audit_logs', [])) >= 2 # created + proof submitted
        print(f"  [PASS] Admin retrieved request {req_id_1} with {len(detail_data.get('audit_logs', []))} audit trail entries")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 7: Admin approves request -> 3-Month Subscription Activated
        # -------------------------------------------------------------
        print("\n[SCENARIO 7] Admin approves request -> Activates 3-month subscription...")
        resp7 = client.post(
            f'/api/admin/payment-requests/{req_id_1}/approve',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'admin_notes': 'Payment verified in HDFC statement'}
        )
        assert resp7.status_code == 200, f"Approve failed: {resp7.data}"
        data7 = resp7.get_json()
        assert data7['success'] is True
        assert data7['payment_request']['status'] == 'approved'

        # Verify Student A now has active subscription
        resp7_sub = client.get(
            '/api/subscription/current',
            headers={'Authorization': f'Bearer {student_a_token}'}
        )
        data7_sub = resp7_sub.get_json()
        assert data7_sub['has_active_subscription'] is True
        assert data7_sub['subscription']['plan']['id'] == plan_3m.id
        # Days remaining should be ~90 (3 months)
        days_rem = data7_sub['subscription'].get('remaining_days', 0)
        assert 88 <= days_rem <= 92, f"Expected ~90 days, got {days_rem}"

        # Feature access unlocked
        feat_check_after = check_feature_access(student_a.id, 'career_roadmap')
        assert feat_check_after['allowed'] is True
        print(f"  [PASS] Subscription activated! Days remaining: {days_rem}, roadmap feature unlocked")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 8: Admin rejection workflow
        # -------------------------------------------------------------
        print("\n[SCENARIO 8] Admin rejects invalid request with mandatory reason...")
        plan_1m = SubscriptionPlan.query.filter_by(duration_months=1).first()
        # Student B creates request
        resp8_create = client.post(
            '/api/subscription/payment-requests',
            headers={'Authorization': f'Bearer {student_b_token}'},
            json={'plan_id': plan_1m.id}
        )
        req_id_2 = resp8_create.get_json()['payment_request']['id']

        # Student B submits proof
        client.post(
            f'/api/subscription/payment-requests/{req_id_2}/submit-proof',
            headers={'Authorization': f'Bearer {student_b_token}'},
            data={'utr_number': f'UTR-REJECT-{uuid.uuid4().hex[:6].upper()}'}
        )

        # Admin rejects with reason
        resp8_reject = client.post(
            f'/api/admin/payment-requests/{req_id_2}/reject',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'rejection_reason': 'UTR not found in bank statement for ₹349'}
        )
        assert resp8_reject.status_code == 200
        data8 = resp8_reject.get_json()
        assert data8['payment_request']['status'] == 'rejected'
        assert data8['payment_request']['rejection_reason'] == 'UTR not found in bank statement for ₹349'

        # Verify Student B still has NO active subscription
        resp8_sub = client.get(
            '/api/subscription/current',
            headers={'Authorization': f'Bearer {student_b_token}'}
        )
        assert resp8_sub.get_json()['has_active_subscription'] is False
        print(f"  [PASS] Request {req_id_2} rejected. Student B subscription remains strictly inactive")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 9: Idempotent approval
        # -------------------------------------------------------------
        print("\n[SCENARIO 9] Testing idempotency: Approving already-approved request...")
        sub_before = UserSubscription.query.filter_by(user_id=student_a.id, status='active').first()
        end_date_before = sub_before.end_date

        resp9 = client.post(
            f'/api/admin/payment-requests/{req_id_1}/approve',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'admin_notes': 'Duplicate call test'}
        )
        assert resp9.status_code == 200
        data9 = resp9.get_json()
        assert data9.get('already_approved') is True

        sub_after = UserSubscription.query.filter_by(user_id=student_a.id, status='active').first()
        assert sub_after.end_date == end_date_before, "End date modified on duplicate approval!"
        print(f"  [PASS] Idempotent protection verified: already_approved=True, end_date unchanged")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 10: Student B cannot view or submit proof for Student A's request
        # -------------------------------------------------------------
        print("\n[SCENARIO 10] Cross-student authorization isolation...")
        resp10_view = client.get(
            f'/api/subscription/payment-requests/{req_id_1}',
            headers={'Authorization': f'Bearer {student_b_token}'}
        )
        assert resp10_view.status_code == 403, f"Expected 403, got {resp10_view.status_code}"

        resp10_submit = client.post(
            f'/api/subscription/payment-requests/{req_id_1}/submit-proof',
            headers={'Authorization': f'Bearer {student_b_token}'},
            data={'utr_number': 'HACKED-UTR-1234'}
        )
        assert resp10_submit.status_code == 403, f"Expected 403, got {resp10_submit.status_code}"
        print(f"  [PASS] Student B blocked with 403 Forbidden when attempting to view or modify Student A's request")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 11: Anti-duplicate UTR validation
        # -------------------------------------------------------------
        print("\n[SCENARIO 11] Anti-duplicate UTR protection...")
        # Create a new request for Student B
        resp11_new = client.post(
            '/api/subscription/payment-requests',
            headers={'Authorization': f'Bearer {student_b_token}'},
            json={'plan_id': plan_1m.id}
        )
        req_id_3 = resp11_new.get_json()['payment_request']['id']

        # Attempt to use utr_1 (which belongs to Student A's approved request)
        resp11_dup = client.post(
            f'/api/subscription/payment-requests/{req_id_3}/submit-proof',
            headers={'Authorization': f'Bearer {student_b_token}'},
            data={'utr_number': utr_1}
        )
        assert resp11_dup.status_code == 400, f"Expected 400 for duplicate UTR, got {resp11_dup.status_code}"
        err_msg = resp11_dup.get_json().get('message') or resp11_dup.get_json().get('error', '')
        assert "already been submitted" in err_msg.lower() or "already submitted" in err_msg.lower(), f"Unexpected error message: {err_msg}"
        print(f"  [PASS] Duplicate UTR correctly rejected with 400 Bad Request")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 12: Inactive/expired subscription feature gating
        # -------------------------------------------------------------
        print("\n[SCENARIO 12] Feature gating for candidate without active subscription...")
        # Student B has no active subscription
        for feat in ['skill_gap', 'career_roadmap', 'interview_prep']:
            access = check_feature_access(student_b.id, feat)
            assert access['allowed'] is False
            assert access['reason'] in ['subscription_required', 'payment_pending_verification', 'subscription_expired']
        print(f"  [PASS] All 3 features gated with allowed=False for unsubscribed user")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 13: Admin payment settings update and public config retrieval
        # -------------------------------------------------------------
        print("\n[SCENARIO 13] Admin updates payment settings, public config verified...")
        resp13_update = client.post(
            '/api/admin/payment-settings',
            headers={'Authorization': f'Bearer {admin_token}'},
            data={
                'upi_id': 'careersense.official@okaxis',
                'account_holder_name': 'CareerSense AI EduTech Pvt Ltd',
                'bank_name': 'HDFC Bank',
                'account_number': '50100492817264',
                'ifsc_code': 'HDFC0001234',
                'account_type': 'Current Account',
                'payment_instructions': 'Add Reference ID in UPI remarks for priority 15-min approval.'
            }
        )
        assert resp13_update.status_code == 200, f"Update settings failed: {resp13_update.data}"

        # Verify public config returns the updated settings
        resp13_pub = client.get('/api/subscription/payment-config')
        assert resp13_pub.status_code == 200
        pub_config = resp13_pub.get_json()['payment_config']
        assert pub_config['upi_id'] == 'careersense.official@okaxis'
        assert pub_config['account_holder_name'] == 'CareerSense AI EduTech Pvt Ltd'
        assert pub_config['account_number'] == '50100492817264'
        assert pub_config['bank_name'] == 'HDFC Bank'
        print(f"  [PASS] Settings updated and verified publicly: UPI ID={pub_config['upi_id']}, Bank={pub_config['bank_name']}")
        passed_scenarios += 1

        # -------------------------------------------------------------
        # SCENARIO 14: Razorpay sandbox and Manual Transfer distinction
        # -------------------------------------------------------------
        print("\n[SCENARIO 14] Validating separation between gateway sandbox & manual UPI/Bank transfer...")
        assert 'razorpay_enabled' in pub_config
        assert pub_config['manual_transfer_enabled'] is True
        print(f"  [PASS] Config distinguishes modes: manual_transfer_enabled={pub_config['manual_transfer_enabled']}, razorpay_enabled={pub_config['razorpay_enabled']}")
        passed_scenarios += 1

        print("\n" + "=" * 75)
        print(f"ALL {passed_scenarios}/14 SCENARIOS PASSED WITH ZERO ERRORS!")
        print("=" * 75)


if __name__ == '__main__':
    run_comprehensive_tests()
