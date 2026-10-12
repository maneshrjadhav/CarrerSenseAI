"""
CareerSense AI — Payment Request & Admin Approval Service
Handles manual UPI QR/Bank payment requests, receipt upload validation,
duplicate UTR protection, atomic admin approvals, and audit logging.
CareerSense AI - Final Year Engineering Project
"""

import os
import uuid
import json
import re
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app
from extensions import db
from models.user import User
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.payment_request import PaymentSettings, PaymentRequest, PaymentAuditLog
from services.subscription_service import activate_user_subscription

ALLOWED_RECEIPT_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'pdf'}
ALLOWED_QR_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'svg'}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def allowed_file(filename: str, allowed_set: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set


def ensure_upload_dirs():
    upload_base = current_app.config.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), '..', 'uploads'))
    receipts_dir = os.path.join(upload_base, 'receipts')
    qr_dir = os.path.join(upload_base, 'qr_codes')
    os.makedirs(receipts_dir, exist_ok=True)
    os.makedirs(qr_dir, exist_ok=True)
    return receipts_dir, qr_dir


def get_public_payment_config() -> dict:
    """Returns verified payment account configuration for student checkout."""
    settings = db.session.query(PaymentSettings).filter_by(is_active=True).first()
    if not settings:
        data = {
            "upi_id": "careersense.ai@okhdfcbank",
            "upi_qr_image_url": "",
            "account_holder_name": "CareerSense AI Placement Services",
            "bank_name": "HDFC Bank Ltd",
            "account_number": "50200088991122",
            "ifsc_code": "HDFC0001234",
            "account_type": "Current Account",
            "payment_instructions": (
                "1. Transfer the exact plan amount to the UPI ID or bank account details above.\n"
                "2. Note down your 12-digit UTR / UPI Transaction Reference Number.\n"
                "3. Submit the UTR number below along with an optional receipt screenshot.\n"
                "4. An administrator will verify the payment and activate your subscription."
            ),
            "is_active": True
        }
    else:
        data = settings.to_public_dict()

    razorpay_key = current_app.config.get('RAZORPAY_KEY_ID')
    data['razorpay_enabled'] = bool(razorpay_key)
    data['razorpay_key_id'] = razorpay_key if data['razorpay_enabled'] else None
    data['manual_transfer_enabled'] = True
    return data


def get_admin_payment_settings() -> dict:
    """Returns payment configuration for admin dashboard management."""
    settings = db.session.query(PaymentSettings).first()
    if not settings:
        settings = PaymentSettings(
            upi_id="careersense.ai@okhdfcbank",
            account_holder_name="CareerSense AI Placement Services",
            bank_name="HDFC Bank Ltd",
            account_number="50200088991122",
            ifsc_code="HDFC0001234",
            account_type="Current Account",
            payment_instructions="Transfer the exact amount and submit the UTR for verification."
        )
        db.session.add(settings)
        db.session.commit()
    return settings.to_dict()


def update_admin_payment_settings(admin_user_id: int, form_data: dict, qr_file=None, ip_address: str = None) -> dict:
    """Updates payment account details and optional UPI QR code image."""
    settings = db.session.query(PaymentSettings).first()
    if not settings:
        settings = PaymentSettings()
        db.session.add(settings)

    upi_id = (form_data.get('upi_id') or '').strip()
    account_holder = (form_data.get('account_holder_name') or '').strip()
    bank_name = (form_data.get('bank_name') or '').strip()
    account_number = (form_data.get('account_number') or '').strip()
    ifsc_code = (form_data.get('ifsc_code') or '').strip().upper()
    account_type = (form_data.get('account_type') or 'Current Account').strip()
    instructions = (form_data.get('payment_instructions') or '').strip()

    if upi_id:
        settings.upi_id = upi_id
    if account_holder:
        settings.account_holder_name = account_holder
    if bank_name:
        settings.bank_name = bank_name
    if account_number:
        settings.account_number = account_number
    if ifsc_code:
        settings.ifsc_code = ifsc_code
    if account_type:
        settings.account_type = account_type
    if instructions:
        settings.payment_instructions = instructions

    # Handle QR code image upload
    if qr_file and qr_file.filename:
        if not allowed_file(qr_file.filename, ALLOWED_QR_EXTENSIONS):
            raise ValueError("Invalid QR code format. Allowed extensions: PNG, JPG, JPEG, WEBP, SVG.")
        
        _, qr_dir = ensure_upload_dirs()
        ext = qr_file.filename.rsplit('.', 1)[1].lower()
        unique_name = f"qr_official_{uuid.uuid4().hex[:10]}.{ext}"
        save_path = os.path.join(qr_dir, unique_name)
        qr_file.save(save_path)
        settings.upi_qr_image_url = f"/api/subscription/uploads/qr-code/{unique_name}"

    settings.updated_by_admin_id = admin_user_id
    settings.updated_at = datetime.utcnow()

    # Log audit event
    audit = PaymentAuditLog(
        action='SETTINGS_UPDATED',
        performed_by_user_id=admin_user_id,
        ip_address=ip_address,
        details_json=json.dumps({"upi_id": settings.upi_id, "bank": settings.bank_name})
    )
    db.session.add(audit)
    db.session.commit()

    return settings.to_dict()


def create_student_payment_request(
    user_id: int,
    plan_id: int,
    student_notes: str = None,
    payment_method: str = 'upi_qr',
    ip_address: str = None
) -> dict:
    """
    Creates a pending payment request for a student selecting a subscription plan.
    Server-side validation enforces exact plan price from MySQL.
    """
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        raise ValueError("User not found.")

    plan = db.session.query(SubscriptionPlan).filter_by(id=plan_id, is_active=True).first()
    if not plan:
        raise ValueError("Selected subscription plan is invalid or inactive.")

    # Unique human-readable payment reference (e.g. CS-PAY-20261012-A1B2C3)
    today_str = datetime.utcnow().strftime('%Y%m%d')
    random_hex = uuid.uuid4().hex[:6].upper()
    reference = f"CS-PAY-{today_str}-{random_hex}"

    payment_request = PaymentRequest(
        request_reference=reference,
        user_id=user.id,
        plan_id=plan.id,
        amount_inr=plan.price_inr,  # ALWAYS take from database
        currency='INR',
        payment_method=payment_method or 'upi_qr',
        status='awaiting_payment',
        student_notes=student_notes.strip() if student_notes else None
    )
    db.session.add(payment_request)
    db.session.flush()

    # Audit log
    audit = PaymentAuditLog(
        payment_request_id=payment_request.id,
        action='REQUEST_CREATED',
        performed_by_user_id=user.id,
        ip_address=ip_address,
        previous_status=None,
        new_status='awaiting_payment',
        details_json=json.dumps({
            "plan_id": plan.id,
            "plan_name": plan.plan_name,
            "amount_inr": plan.price_inr
        })
    )
    db.session.add(audit)
    db.session.commit()

    config = get_public_payment_config()

    return {
        "success": True,
        "message": f"Payment request created for {plan.plan_name}. Please complete the payment and submit your UTR.",
        "payment_request": payment_request.to_dict(),
        "payment_config": config
    }


def submit_student_payment_proof(
    user_id: int,
    request_reference_or_id,
    utr_number: str,
    payment_time: str = None,
    student_notes: str = None,
    receipt_file=None,
    ip_address: str = None
) -> dict:
    """
    Records student's UTR and optional receipt screenshot.
    Transitions request to 'pending_verification'.
    DOES NOT ACTIVATE SUBSCRIPTION until admin approval.
    """
    # Locate request by ID or reference string
    query = db.session.query(PaymentRequest)
    if isinstance(request_reference_or_id, int) or (isinstance(request_reference_or_id, str) and request_reference_or_id.isdigit()):
        req = query.filter_by(id=int(request_reference_or_id)).first()
    else:
        req = query.filter_by(request_reference=str(request_reference_or_id)).first()

    if not req:
        raise ValueError("Payment request not found.")

    # Ownership check
    if req.user_id != user_id:
        raise PermissionError("Unauthorized: You do not own this payment request.")

    if req.status == 'approved':
        raise ValueError("This payment request has already been approved and activated.")

    if req.status == 'rejected':
        raise ValueError("This payment request was rejected. Please initiate a new payment request.")

    # Clean & validate UTR number
    cleaned_utr = (utr_number or '').strip().replace(' ', '').upper()
    if not cleaned_utr or len(cleaned_utr) < 6:
        raise ValueError("Please provide a valid UTR or Transaction Reference Number (minimum 6 characters).")

    # Anti-duplicate check: Prevent reuse of UTR across approved or pending requests
    dup_query = db.session.query(PaymentRequest).filter(
        PaymentRequest.utr_number == cleaned_utr,
        PaymentRequest.id != req.id,
        PaymentRequest.status.in_(['approved', 'pending_verification'])
    ).first()
    if dup_query:
        raise ValueError("This UTR / Transaction Reference has already been submitted for another request. Please verify your reference.")

    # Handle receipt file upload if provided
    receipt_url = req.receipt_file_url
    if receipt_file and getattr(receipt_file, 'filename', None):
        if not allowed_file(receipt_file.filename, ALLOWED_RECEIPT_EXTENSIONS):
            raise ValueError("Invalid receipt file type. Allowed formats: PNG, JPG, JPEG, WEBP, PDF.")

        receipts_dir, _ = ensure_upload_dirs()
        ext = receipt_file.filename.rsplit('.', 1)[1].lower()
        secure_name = f"rcpt_{req.id}_{uuid.uuid4().hex[:8]}.{ext}"
        save_path = os.path.join(receipts_dir, secure_name)
        receipt_file.save(save_path)
        receipt_url = f"/api/subscription/uploads/receipt/{secure_name}"

    old_status = req.status
    req.utr_number = cleaned_utr
    req.payment_time = payment_time.strip() if payment_time else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    req.receipt_file_url = receipt_url
    if student_notes:
        req.student_notes = student_notes.strip()
    req.status = 'pending_verification'
    req.updated_at = datetime.utcnow()

    # Audit log
    audit = PaymentAuditLog(
        payment_request_id=req.id,
        action='UTR_SUBMITTED',
        performed_by_user_id=user_id,
        ip_address=ip_address,
        previous_status=old_status,
        new_status='pending_verification',
        details_json=json.dumps({"utr_number": cleaned_utr, "receipt_url": receipt_url})
    )
    db.session.add(audit)
    db.session.commit()

    return {
        "success": True,
        "message": "Payment reference submitted successfully. Your payment is currently under admin verification.",
        "payment_request": req.to_dict()
    }


def get_student_payment_requests(user_id: int) -> list:
    """Returns all payment requests belonging to the authenticated student."""
    requests = db.session.query(PaymentRequest).filter_by(user_id=user_id).order_by(PaymentRequest.created_at.desc()).all()
    return [r.to_dict() for r in requests]


def get_student_payment_request_by_ref(user_id: int, ref_or_id, is_admin: bool = False) -> dict:
    """Retrieves payment request details with strict ownership verification."""
    query = db.session.query(PaymentRequest)
    if isinstance(ref_or_id, int) or (isinstance(ref_or_id, str) and ref_or_id.isdigit()):
        req = query.filter_by(id=int(ref_or_id)).first()
    else:
        req = query.filter_by(request_reference=str(ref_or_id)).first()

    if not req:
        raise ValueError("Payment request not found.")

    if not is_admin and req.user_id != user_id:
        raise PermissionError("Unauthorized: You do not own this payment request.")

    return req.to_dict()


def list_all_payment_requests_admin(status: str = None, search: str = None) -> list:
    """Lists payment requests for the administration approval dashboard."""
    query = db.session.query(PaymentRequest).order_by(PaymentRequest.created_at.desc())

    if status and status.lower() != 'all':
        query = query.filter(PaymentRequest.status == status.lower())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.join(User).filter(
            db.or_(
                PaymentRequest.request_reference.ilike(term),
                PaymentRequest.utr_number.ilike(term),
                User.full_name.ilike(term),
                User.email.ilike(term)
            )
        )

    requests = query.all()
    return [r.to_dict() for r in requests]


def admin_approve_payment_request(admin_user_id: int, request_id: int, admin_notes: str = None, ip_address: str = None) -> dict:
    """
    Atomically verifies and approves a payment request:
    - Verifies admin role and request status
    - Idempotent: Prevents repeated approval or double-activation
    - Creates captured Payment record
    - Activates candidate subscription with exact duration
    - Records audit log
    """
    admin_user = db.session.query(User).filter_by(id=admin_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        raise PermissionError("Access denied. Only authorized administrators can approve payment requests.")

    req = db.session.query(PaymentRequest).filter_by(id=request_id).with_for_update().first()
    if not req:
        raise ValueError("Payment request not found.")

    # Idempotency check: Already approved requests must not activate subscription again
    if req.status == 'approved':
        existing_sub = None
        if req.activated_subscription_id:
            existing_sub = db.session.query(UserSubscription).filter_by(id=req.activated_subscription_id).first()
        return {
            "success": True,
            "already_approved": True,
            "message": "This payment request has already been approved and activated.",
            "payment_request": req.to_dict(),
            "subscription": existing_sub.to_dict() if existing_sub else None
        }

    now = datetime.utcnow()
    old_status = req.status

    # 1. Update PaymentRequest
    req.status = 'approved'
    req.approved_by_admin_id = admin_user.id
    req.approved_at = now
    if admin_notes:
        req.admin_notes = admin_notes.strip()

    # 2. Record official Payment record in MySQL
    payment_rec = Payment(
        user_id=req.user_id,
        plan_id=req.plan_id,
        gateway_order_id=req.request_reference,
        gateway_payment_id=req.utr_number or f"MANUAL_VERIFIED_{req.id}",
        amount_inr=req.amount_inr,
        currency=req.currency,
        payment_method=req.payment_method,
        payment_status='captured',
        verified_at=now
    )
    db.session.add(payment_rec)
    db.session.flush()

    # 3. Activate User Subscription
    activated_sub = activate_user_subscription(
        user_id=req.user_id,
        plan_id=req.plan_id,
        payment_id=payment_rec.id
    )
    req.activated_subscription_id = activated_sub.id

    # 4. Audit Log
    audit = PaymentAuditLog(
        payment_request_id=req.id,
        action='ADMIN_APPROVED',
        performed_by_user_id=admin_user.id,
        ip_address=ip_address,
        previous_status=old_status,
        new_status='approved',
        details_json=json.dumps({
            "approved_by": admin_user.email,
            "activated_subscription_id": activated_sub.id,
            "plan_id": req.plan_id,
            "amount_inr": req.amount_inr
        })
    )
    db.session.add(audit)

    # Commit atomic transaction
    db.session.commit()

    return {
        "success": True,
        "message": f"Payment request approved successfully. Subscription activated for {req.user.full_name} ({req.plan.plan_name}).",
        "payment_request": req.to_dict(),
        "subscription": activated_sub.to_dict()
    }


def admin_reject_payment_request(
    admin_user_id: int,
    request_id: int,
    rejection_reason: str,
    admin_notes: str = None,
    ip_address: str = None
) -> dict:
    """
    Rejects a payment request:
    - Keeps candidate subscription inactive
    - Saves rejection reason and optional internal admin note
    - Creates audit log
    """
    admin_user = db.session.query(User).filter_by(id=admin_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        raise PermissionError("Access denied. Only authorized administrators can reject payment requests.")

    req = db.session.query(PaymentRequest).filter_by(id=request_id).with_for_update().first()
    if not req:
        raise ValueError("Payment request not found.")

    if req.status == 'approved':
        raise ValueError("Cannot reject a payment request that has already been approved and activated.")

    reason = (rejection_reason or '').strip()
    if not reason:
        raise ValueError("A clear rejection reason must be provided so the candidate knows why verification failed.")

    now = datetime.utcnow()
    old_status = req.status

    req.status = 'rejected'
    req.rejection_reason = reason
    if admin_notes:
        req.admin_notes = admin_notes.strip()
    req.rejected_at = now

    # Audit log
    audit = PaymentAuditLog(
        payment_request_id=req.id,
        action='ADMIN_REJECTED',
        performed_by_user_id=admin_user.id,
        ip_address=ip_address,
        previous_status=old_status,
        new_status='rejected',
        details_json=json.dumps({
            "rejected_by": admin_user.email,
            "reason": reason
        })
    )
    db.session.add(audit)
    db.session.commit()

    return {
        "success": True,
        "message": "Payment request has been rejected. Candidate subscription remains inactive.",
        "payment_request": req.to_dict()
    }
