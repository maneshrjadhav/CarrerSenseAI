"""
CareerSense AI — Admin Payment Approval & Settings Routes
Endpoints for administrator dashboard: review payment requests, approve/reject transactions,
update bank/UPI QR configuration, and view audit trails.
CareerSense AI - Final Year Engineering Project
"""

from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.payment_request import PaymentRequest, PaymentSettings, PaymentAuditLog
from utils.auth_helper import token_required, admin_required
from services.payment_request_service import (
    get_admin_payment_settings,
    update_admin_payment_settings,
    list_all_payment_requests_admin,
    admin_approve_payment_request,
    admin_reject_payment_request
)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/payment-requests', methods=['GET'])
@token_required
@admin_required
def get_admin_payment_requests(current_user):
    """
    Returns payment requests for the administration approval portal.
    Supports filtering by status ('all', 'pending_verification', 'awaiting_payment', 'approved', 'rejected')
    and search term.
    """
    status_filter = request.args.get('status')
    search_query = request.args.get('search')

    try:
        requests = list_all_payment_requests_admin(status=status_filter, search=search_query)
        return jsonify({
            "success": True,
            "count": len(requests),
            "payment_requests": requests
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to retrieve payment requests: {str(e)}"}), 500


@admin_bp.route('/payment-requests/<int:request_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_payment_request_details(current_user, request_id):
    """Returns single payment request details including related audit logs."""
    req = db.session.query(PaymentRequest).filter_by(id=request_id).first()
    if not req:
        return jsonify({"success": False, "message": "Payment request not found."}), 404

    logs = db.session.query(PaymentAuditLog).filter_by(payment_request_id=request_id).order_by(PaymentAuditLog.created_at.desc()).all()

    return jsonify({
        "success": True,
        "payment_request": req.to_dict(),
        "audit_logs": [l.to_dict() for l in logs]
    }), 200


@admin_bp.route('/payment-requests/<int:request_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_payment_request_endpoint(current_user, request_id):
    """
    Approves candidate payment request:
    - Atomically captures Payment record in MySQL
    - Activates accurate subscription (1, 3, 6, 12 months)
    - Records approving admin ID, timestamp, and audit trail
    - Idempotent: repeated calls do not double-activate or extend
    """
    data = request.get_json(silent=True) or {}
    admin_notes = data.get('admin_notes')
    ip = request.remote_addr

    try:
        result = admin_approve_payment_request(
            admin_user_id=current_user.id,
            request_id=request_id,
            admin_notes=admin_notes,
            ip_address=ip
        )
        return jsonify(result), 200
    except PermissionError as perm_err:
        return jsonify({"success": False, "message": str(perm_err)}), 403
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Approval error: {str(e)}"}), 500


@admin_bp.route('/payment-requests/<int:request_id>/reject', methods=['POST'])
@token_required
@admin_required
def reject_payment_request_endpoint(current_user, request_id):
    """
    Rejects candidate payment request:
    - Keeps candidate subscription inactive
    - Records mandatory rejection reason
    - Records rejecting admin ID and audit trail
    """
    data = request.get_json(silent=True) or {}
    rejection_reason = data.get('rejection_reason') or data.get('reason')
    admin_notes = data.get('admin_notes')
    ip = request.remote_addr

    if not rejection_reason or not rejection_reason.strip():
        return jsonify({
            "success": False,
            "message": "Rejection reason is mandatory so the candidate knows why verification failed."
        }), 400

    try:
        result = admin_reject_payment_request(
            admin_user_id=current_user.id,
            request_id=request_id,
            rejection_reason=rejection_reason,
            admin_notes=admin_notes,
            ip_address=ip
        )
        return jsonify(result), 200
    except PermissionError as perm_err:
        return jsonify({"success": False, "message": str(perm_err)}), 403
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Rejection error: {str(e)}"}), 500


@admin_bp.route('/payment-settings', methods=['GET'])
@token_required
@admin_required
def get_payment_settings_endpoint(current_user):
    """Returns current editable payment settings for admin configuration."""
    try:
        settings_data = get_admin_payment_settings()
        return jsonify({
            "success": True,
            "payment_settings": settings_data
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to retrieve settings: {str(e)}"}), 500


@admin_bp.route('/payment-settings', methods=['POST', 'PUT'])
@token_required
@admin_required
def update_payment_settings_endpoint(current_user):
    """
    Updates UPI ID, Bank Name, Account Number, IFSC, and optional UPI QR Code upload.
    Protected strictly with admin-only authorization.
    """
    if request.is_json:
        form_data = request.get_json(silent=True) or {}
        qr_file = None
    else:
        form_data = request.form.to_dict()
        qr_file = request.files.get('qr_code_image') or request.files.get('qr_image')

    try:
        ip = request.remote_addr
        updated = update_admin_payment_settings(
            admin_user_id=current_user.id,
            form_data=form_data,
            qr_file=qr_file,
            ip_address=ip
        )
        return jsonify({
            "success": True,
            "message": "Payment settings updated successfully.",
            "payment_settings": updated
        }), 200
    except ValueError as val_err:
        return jsonify({"success": False, "message": str(val_err)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update settings: {str(e)}"}), 500


@admin_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_admin_payment_stats(current_user):
    """Returns aggregated stats on pending, approved, and rejected requests."""
    pending_count = db.session.query(PaymentRequest).filter_by(status='pending_verification').count()
    awaiting_count = db.session.query(PaymentRequest).filter_by(status='awaiting_payment').count()
    approved_count = db.session.query(PaymentRequest).filter_by(status='approved').count()
    rejected_count = db.session.query(PaymentRequest).filter_by(status='rejected').count()

    total_revenue = db.session.query(db.func.sum(PaymentRequest.amount_inr)).filter_by(status='approved').scalar() or 0.0

    return jsonify({
        "success": True,
        "stats": {
            "pending_verification": pending_count,
            "awaiting_payment": awaiting_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "total_requests": pending_count + awaiting_count + approved_count + rejected_count,
            "total_verified_revenue_inr": float(total_revenue)
        }
    }), 200

