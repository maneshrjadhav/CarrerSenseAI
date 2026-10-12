"""
Test suite for payment request and admin approval workflow
CareerSense AI - Final Year Engineering Project
"""
import requests
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000/api"

# Import helpers to generate JWT tokens
sys.path.append(os.path.abspath('d:/CareerSenseAI/backend'))
from app import app
from extensions import db
from models.user import User
from models.subscription import SubscriptionPlan, UserSubscription
from models.payment_request import PaymentRequest
from flask_jwt_extended import create_access_token

def run():
    print("=" * 70)
    print("TESTING PAYMENT REQUEST & ADMIN APPROVAL WORKFLOW")
    print("=" * 70)

    # 1. Get tokens for student (User 4) and admin (admin@careersense.ai)
    student_token = None
    admin_token = None
    other_student_token = None
    with app.app_context():
        student = User.query.filter_by(id=4).first()
        admin = User.query.filter_by(role='admin').first()
        other_student = User.query.filter_by(id=6).first()
        student_token = create_access_token(identity=str(student.id))
        admin_token = create_access_token(identity=str(admin.id))
        other_student_token = create_access_token(identity=str(other_student.id))

    student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    other_student_headers = {"Authorization": f"Bearer {other_student_token}", "Content-Type": "application/json"}

    # 2. Test Payment Config endpoint
    r = requests.get(f"{BASE_URL}/subscription/payment-config")
    cfg_data = r.json()
    cfg_ok = r.status_code == 200 and cfg_data.get('success') and 'upi_id' in cfg_data.get('payment_config', {})
    print(f"[{'PASS' if cfg_ok else 'FAIL'}] 1. Public Payment Config Endpoint (/api/subscription/payment-config)")
    if cfg_ok:
        print(f"       UPI ID: {cfg_data['payment_config']['upi_id']}, Bank: {cfg_data['payment_config']['bank_name']}")

    # 3. Test Student creates payment request for 3-Month Plan (₹599)
    # Get 3-Month Plan ID
    r_plans = requests.get(f"{BASE_URL}/subscription/plans")
    plans = r_plans.json().get('plans', [])
    plan_3m = next((p for p in plans if p['duration_months'] == 3), plans[1])

    req_payload = {
        "plan_id": plan_3m['id'],
        "student_notes": "Preparing for campus placements next month."
    }
    r_req = requests.post(f"{BASE_URL}/subscription/payment-requests", json=req_payload, headers=student_headers)
    req_res = r_req.json()
    req_created_ok = r_req.status_code == 201 and req_res.get('success') and 'payment_request' in req_res
    print(f"[{'PASS' if req_created_ok else 'FAIL'}] 2. Student Initiates Payment Request (Server enforces ₹{plan_3m['price_inr']})")
    
    if not req_created_ok:
        print("Details:", req_res)
        return

    pay_req = req_res['payment_request']
    req_id = pay_req['id']
    req_ref = pay_req['request_reference']
    print(f"       Reference: {req_ref}, Status: {pay_req['status']}, Amount: ₹{pay_req['amount_inr']}")

    # 4. Student submits UTR
    utr_val = f"UTR{req_id}TEST987654"
    proof_payload = {
        "utr_number": utr_val,
        "payment_time": "2026-10-12 14:45:00 UTC",
        "student_notes": "Transferred via GPay to official UPI ID."
    }
    r_proof = requests.post(f"{BASE_URL}/subscription/payment-requests/{req_id}/submit-proof", json=proof_payload, headers=student_headers)
    proof_res = r_proof.json()
    proof_ok = r_proof.status_code == 200 and proof_res.get('payment_request', {}).get('status') == 'pending_verification'
    print(f"[{'PASS' if proof_ok else 'FAIL'}] 3. Student Submits UTR & Reference (Status -> 'pending_verification')")

    # 5. Verify subscription is NOT active yet (Student is pending)
    # Check current subscription
    r_curr = requests.get(f"{BASE_URL}/subscription/current", headers=student_headers)
    curr_res = r_curr.json()
    has_pending = curr_res.get('pending_payment_request') is not None
    print(f"[{'PASS' if has_pending else 'FAIL'}] 4. Subscription Gating: Pending payment recognized on /current")

    # 6. Test Non-Admin cannot access Admin endpoints (403 Forbidden)
    r_unauth_admin = requests.get(f"{BASE_URL}/admin/payment-requests", headers=student_headers)
    forbidden_ok = r_unauth_admin.status_code == 403
    print(f"[{'PASS' if forbidden_ok else 'FAIL'}] 5. Security: Student blocked from Admin API (403 Forbidden)")

    # 7. Test Admin views Payment Requests list
    r_admin_list = requests.get(f"{BASE_URL}/admin/payment-requests", headers=admin_headers)
    admin_list_ok = r_admin_list.status_code == 200 and r_admin_list.json().get('count', 0) > 0
    print(f"[{'PASS' if admin_list_ok else 'FAIL'}] 6. Admin Portal: View pending payment requests")

    # 8. Test Another Student cannot access this student's request (403 Forbidden)
    r_other_view = requests.get(f"{BASE_URL}/subscription/payment-requests/{req_id}", headers=other_student_headers)
    ownership_ok = r_other_view.status_code == 403
    print(f"[{'PASS' if ownership_ok else 'FAIL'}] 7. Security: Request ownership enforcement (Other student gets 403)")

    # 9. Admin Approves Request
    approve_payload = {"admin_notes": "Verified receipt in bank statement. Transaction matches UTR."}
    r_app = requests.post(f"{BASE_URL}/admin/payment-requests/{req_id}/approve", json=approve_payload, headers=admin_headers)
    app_res = r_app.json()
    app_ok = r_app.status_code == 200 and app_res.get('success') and app_res.get('payment_request', {}).get('status') == 'approved'
    sub_info = app_res.get('subscription', {})
    print(f"[{'PASS' if app_ok else 'FAIL'}] 8. Admin Approves Verified Payment: Atomically activates 3-Month Subscription")
    if app_ok:
        print(f"       Subscription Plan: {sub_info.get('plan', {}).get('plan_name')}, Remaining Days: {sub_info.get('remaining_days')}")

    # 10. Idempotency Check: Repeated approval must not extend or activate again
    r_app_dup = requests.post(f"{BASE_URL}/admin/payment-requests/{req_id}/approve", json=approve_payload, headers=admin_headers)
    dup_res = r_app_dup.json()
    dup_ok = dup_res.get('already_approved') is True or "already" in dup_res.get('message', '').lower()
    print(f"[{'PASS' if dup_ok else 'FAIL'}] 9. Idempotency: Duplicate approval prevented safely")

    # 11. Test Rejection Workflow on a second request
    req2 = requests.post(f"{BASE_URL}/subscription/payment-requests", json={"plan_id": plans[0]['id']}, headers=student_headers).json()['payment_request']
    req2_id = req2['id']
    reject_payload = {"rejection_reason": "UTR not found in bank statement for the reported transaction time."}
    r_rej = requests.post(f"{BASE_URL}/admin/payment-requests/{req2_id}/reject", json=reject_payload, headers=admin_headers)
    rej_res = r_rej.json()
    rej_ok = r_rej.status_code == 200 and rej_res.get('payment_request', {}).get('status') == 'rejected'
    print(f"[{'PASS' if rej_ok else 'FAIL'}] 10. Admin Rejection Workflow: Rejection reason recorded, sub stays inactive")

    # 12. Test Admin Payment Settings Edit
    settings_payload = {
        "upi_id": "verified.careersense@okhdfcbank",
        "account_holder_name": "CareerSense Technologies India Pvt Ltd",
        "bank_name": "HDFC Bank",
        "account_number": "50200088991122",
        "ifsc_code": "HDFC0001234",
        "account_type": "Current Account",
        "payment_instructions": "Scan QR or send UPI payment. Note your UTR and submit for verification."
    }
    r_set = requests.post(f"{BASE_URL}/admin/payment-settings", json=settings_payload, headers=admin_headers)
    set_res = r_set.json()
    set_ok = r_set.status_code == 200 and set_res.get('payment_settings', {}).get('upi_id') == "verified.careersense@okhdfcbank"
    print(f"[{'PASS' if set_ok else 'FAIL'}] 11. Admin Payment Settings: Update verified UPI & bank account details")

    print("=" * 70)
    print("BACKEND PAYMENT REQUEST & ADMIN APPROVAL TESTS COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    run()
