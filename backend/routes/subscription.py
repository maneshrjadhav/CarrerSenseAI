"""
CareerSense AI — Subscription & Payment Routes
Endpoints for browsing plans, manual payment requests & UTR submission,
Razorpay order creation, signature verification, and transaction history.
CareerSense AI - Final Year Engineering Project
"""

import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from extensions import db
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.payment_request import PaymentSettings, PaymentRequest
from utils.auth_helper import token_required, get_authenticated_user_id
from services.subscription_service import (
    get_user_active_subscription,
    check_feature_access
)
from services.payment_service import (
    create_payment_order,
    verify_and_capture_payment,
    process_webhook_event
)
from services.payment_request_service import (
    get_public_payment_config,
    create_student_payment_request,
    submit_student_payment_proof,
    get_student_payment_requests,
    get_student_payment_request_by_ref
)

subscription_bp = Blueprint('subscription', __name__)

@subscription_bp.route('/plans', methods=['GET'])
def get_plans():
    """Returns all active CareerSense AI subscription plans."""
    plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).order_by(SubscriptionPlan.duration_months.asc()).all()
    return jsonify({
        "success": True,
        "plans": [p.to_dict() for p in plans]
    }), 200

@subscription_bp.route('/payment-config', methods=['GET'])
def get_payment_config():
    """Returns public UPI ID, QR code image URL, and bank account instructions."""
    config = get_public_payment_config()
    return jsonify({
        "success": True,
        "payment_config": config
    }), 200

@subscription_bp.route('/current', methods=['GET'])
@token_required
def get_current_subscription(current_user):
    """Returns current active subscription status, plan details, and pending payment requests."""
    active_sub = get_user_active_subscription(current_user.id)

    # Check for pending payment requests awaiting admin verification
    pending_req = db.session.query(PaymentRequest).filter_by(
        user_id=current_user.id,
        status='pending_verification'
    ).order_by(PaymentRequest.created_at.desc()).first()

    if not pending_req:
        pending_req = db.session.query(PaymentRequest).filter_by(
            user_id=current_user.id,
            status='awaiting_payment'
        ).order_by(PaymentRequest.created_at.desc()).first()

    # Feature gating status
    modules_access = {
        "skill_gap": bool(active_sub),
        "career_roadmap": bool(active_sub),
        "interview_prep": bool(active_sub),
        "ats_report": bool(active_sub)
    }

    return jsonify({
        "success": True,
        "has_active_subscription": bool(active_sub),
        "subscription": active_sub.to_dict() if active_sub else None,
        "pending_payment_request": pending_req.to_dict() if pending_req else None,
        "features_access": modules_access,
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role
        }
    }), 200

@subscription_bp.route('/check-access/<feature_name>', methods=['GET'])
@token_required
def check_feature(current_user, feature_name):
    """Evaluates access entitlement for a specific paid module."""
    access = check_feature_access(current_user.id, feature_name)
    status_code = 200 if access["allowed"] else 403
    return jsonify({
        "success": access["allowed"],
        **access
    }), status_code

# ============================================================================
# STUDENT PAYMENT REQUEST WORKFLOW
# ============================================================================

@subscription_bp.route('/payment-requests', methods=['POST'])
@token_required
def create_payment_request_endpoint(current_user):
    """
    Initializes a student payment request for a subscription plan.
    Server-side validation enforces exact plan price from MySQL.
    """
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    student_notes = data.get('student_notes')
    payment_method = data.get('payment_method', 'upi_qr')

    if not plan_id:
        return jsonify({"success": False, "message": "Plan ID is required to initiate a payment request."}), 400

    try:
        ip = request.remote_addr
        result = create_student_payment_request(
            user_id=current_user.id,
            plan_id=int(plan_id),
            student_notes=student_notes,
            payment_method=payment_method,
            ip_address=ip
        )
        return jsonify(result), 201
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to create payment request: {str(e)}"}), 500


@subscription_bp.route('/payment-requests/<ref_or_id>/submit-proof', methods=['POST'])
@token_required
def submit_payment_proof_endpoint(current_user, ref_or_id):
    """
    Candidate submits UTR reference and optional receipt screenshot.
    Transitions request to 'pending_verification'.
    Does NOT activate subscription until approved by admin.
    """
    # Accept both JSON or multipart form data
    if request.is_json:
        data = request.get_json(silent=True) or {}
        utr_number = data.get('utr_number')
        payment_time = data.get('payment_time')
        student_notes = data.get('student_notes')
        receipt_file = None
    else:
        utr_number = request.form.get('utr_number')
        payment_time = request.form.get('payment_time')
        student_notes = request.form.get('student_notes')
        receipt_file = request.files.get('receipt')

    if not utr_number:
        return jsonify({"success": False, "message": "UTR or Transaction Reference Number is required."}), 400

    try:
        ip = request.remote_addr
        result = submit_student_payment_proof(
            user_id=current_user.id,
            request_reference_or_id=ref_or_id,
            utr_number=utr_number,
            payment_time=payment_time,
            student_notes=student_notes,
            receipt_file=receipt_file,
            ip_address=ip
        )
        return jsonify(result), 200
    except PermissionError as perm_err:
        return jsonify({"success": False, "message": str(perm_err)}), 403
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to submit payment reference: {str(e)}"}), 500


@subscription_bp.route('/payment-requests/my', methods=['GET'])
@token_required
def get_my_payment_requests_endpoint(current_user):
    """Returns all payment requests for the logged-in candidate."""
    try:
        reqs = get_student_payment_requests(current_user.id)
        return jsonify({
            "success": True,
            "payment_requests": reqs
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch payment requests: {str(e)}"}), 500


@subscription_bp.route('/payment-requests/<ref_or_id>', methods=['GET'])
@token_required
def get_payment_request_details_endpoint(current_user, ref_or_id):
    """Returns details of a specific payment request. Enforces user ownership."""
    try:
        is_admin = (getattr(current_user, 'role', None) == 'admin')
        req_data = get_student_payment_request_by_ref(
            user_id=current_user.id,
            ref_or_id=ref_or_id,
            is_admin=is_admin
        )
        return jsonify({
            "success": True,
            "payment_request": req_data
        }), 200
    except PermissionError as perm_err:
        return jsonify({"success": False, "message": str(perm_err)}), 403
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"Error loading request: {str(e)}"}), 500


# ============================================================================
# SAFE STATIC FILE SERVING FOR QR CODES & RECEIPTS
# ============================================================================

@subscription_bp.route('/uploads/qr-code/<filename>', methods=['GET'])
def serve_qr_code_file(filename):
    """Serves the uploaded UPI QR code image."""
    upload_base = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    qr_dir = os.path.join(upload_base, 'qr_codes')
    return send_from_directory(qr_dir, filename)


@subscription_bp.route('/uploads/receipt/<filename>', methods=['GET'])
def serve_receipt_file(filename):
    """Serves receipt screenshot, enforcing ownership or admin authorization."""
    user_id = get_authenticated_user_id()
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required to access receipt."}), 401

    # Check if user is admin or owner of the receipt
    req = db.session.query(PaymentRequest).filter(
        PaymentRequest.receipt_file_url.like(f"%{filename}")
    ).first()

    if req:
        from models.user import User
        user = db.session.query(User).filter_by(id=user_id).first()
        is_admin = (user and user.role == 'admin')
        if not is_admin and req.user_id != user_id:
            return jsonify({"success": False, "message": "Unauthorized: Receipt belongs to another candidate."}), 403

    upload_base = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    receipts_dir = os.path.join(upload_base, 'receipts')
    return send_from_directory(receipts_dir, filename)


# ============================================================================
# RAZORPAY / GATEWAY ENDPOINTS (PRESERVED FOR TEST & LIVE MODES)
# ============================================================================

@subscription_bp.route('/create-order', methods=['POST'])
@token_required
def create_order(current_user):
    """Validates selected plan and creates payment order with Razorpay."""
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    plan_code = data.get('plan_code')

    if not plan_id and plan_code:
        plan = db.session.query(SubscriptionPlan).filter_by(plan_code=plan_code).first()
        if plan:
            plan_id = plan.id

    if not plan_id:
        return jsonify({"success": False, "message": "Subscription plan selection is required."}), 400

    try:
        order_info = create_payment_order(user_id=current_user.id, plan_id=plan_id)
        return jsonify(order_info), 200
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Order creation failed: {str(e)}"}), 500

@subscription_bp.route('/verify-payment', methods=['POST'])
@token_required
def verify_payment(current_user):
    """Verifies payment signature from gateway checkout and activates subscription."""
    data = request.get_json(silent=True) or {}
    order_id = data.get('razorpay_order_id') or data.get('order_id')
    payment_id = data.get('razorpay_payment_id') or data.get('payment_id')
    signature = data.get('razorpay_signature') or data.get('signature')
    payment_method = data.get('payment_method', 'upi')

    if not order_id or not payment_id or not signature:
        return jsonify({
            "success": False,
            "message": "Missing required verification fields (order_id, payment_id, signature)."
        }), 400

    try:
        result = verify_and_capture_payment(
            user_id=current_user.id,
            order_id=order_id,
            payment_id=payment_id,
            signature=signature,
            payment_method=payment_method
        )
        status_code = 200 if result.get('success') else 400
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({"success": False, "message": f"Verification error: {str(e)}"}), 500

@subscription_bp.route('/webhook', methods=['POST'])
def payment_webhook():
    """Webhook callback endpoint for Razorpay."""
    raw_data = request.get_data()
    sig_header = request.headers.get('X-Razorpay-Signature', '')
    res = process_webhook_event(raw_data, sig_header)
    return jsonify(res), 200

@subscription_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    """Retrieves payment transactions and subscription history for the user."""
    payments = db.session.query(Payment).filter_by(user_id=current_user.id).order_by(Payment.created_at.desc()).all()
    subs = db.session.query(UserSubscription).filter_by(user_id=current_user.id).order_by(UserSubscription.created_at.desc()).all()

    return jsonify({
        "success": True,
        "payments": [p.to_dict() for p in payments],
        "subscriptions": [s.to_dict() for s in subs]
    }), 200
