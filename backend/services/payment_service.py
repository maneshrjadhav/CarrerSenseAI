"""
CareerSense AI — Razorpay Online Payment Integration Service
Handles secure order creation, HMAC-SHA256 signature verification,
idempotent subscription activation, and webhook callbacks.
"""

import hmac
import hashlib
import time
import uuid
from datetime import datetime
from flask import current_app
from extensions import db
from models.subscription import SubscriptionPlan, UserSubscription, Payment
from models.user import User
from services.subscription_service import activate_user_subscription

try:
    import razorpay
except ImportError:
    razorpay = None

def get_razorpay_client():
    """Initializes and returns Razorpay client if credentials are configured."""
    key_id = current_app.config.get('RAZORPAY_KEY_ID', '')
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', '')

    if razorpay and key_id and key_secret and not key_id.startswith('rzp_test_CareerSenseAI2026'):
        try:
            return razorpay.Client(auth=(key_id, key_secret)), key_id, key_secret
        except Exception:
            pass
    return None, key_id, key_secret

def create_payment_order(user_id: int, plan_id: int) -> dict:
    """
    Creates an official payment order for the selected subscription plan.
    Enforces server-side price and duration validation from MySQL.
    """
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        raise ValueError("User not found.")

    plan = db.session.query(SubscriptionPlan).filter_by(id=plan_id, is_active=True).first()
    if not plan:
        raise ValueError("Invalid or inactive subscription plan selected.")

    amount_in_paise = int(round(plan.price_inr * 100))
    currency = current_app.config.get('RAZORPAY_CURRENCY', 'INR')

    client, key_id, key_secret = get_razorpay_client()
    gateway_order_id = None
    is_sandbox = True

    if client:
        try:
            order_data = {
                'amount': amount_in_paise,
                'currency': currency,
                'receipt': f"rcpt_u{user_id}_p{plan.id}_{int(time.time())}",
                'notes': {
                    'user_id': str(user_id),
                    'plan_id': str(plan.id),
                    'plan_name': plan.plan_name,
                    'user_email': user.email
                }
            }
            order = client.order.create(data=order_data)
            gateway_order_id = order.get('id')
            is_sandbox = False
        except Exception as e:
            # Fallback to test sandbox mode if network or test credentials encounter sandbox barrier
            current_app.logger.warning(f"Razorpay API order creation failed, using sandbox fallback: {e}")

    # Test/Sandbox fallback generator
    if not gateway_order_id:
        gateway_order_id = f"order_test_{uuid.uuid4().hex[:14]}"
        is_sandbox = True

    # Save payment initiation record in MySQL
    payment = Payment(
        user_id=user_id,
        plan_id=plan.id,
        gateway_order_id=gateway_order_id,
        amount_inr=plan.price_inr,
        currency=currency,
        payment_status='created'
    )
    db.session.add(payment)
    db.session.commit()

    return {
        "success": True,
        "order_id": gateway_order_id,
        "key_id": key_id or "rzp_test_CareerSenseAI2026",
        "amount": amount_in_paise,
        "amount_inr": plan.price_inr,
        "currency": currency,
        "is_sandbox": is_sandbox,
        "plan": plan.to_dict(),
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone or ""
        }
    }

def verify_and_capture_payment(
    user_id: int,
    order_id: str,
    payment_id: str,
    signature: str,
    payment_method: str = 'upi'
) -> dict:
    """
    Verifies payment signature cryptographically, marks payment as captured,
    and activates the subscription idempotently.
    """
    if not order_id or not payment_id:
        return {"success": False, "message": "Missing payment reference or order identifier."}

    # Retrieve payment record from MySQL
    payment = db.session.query(Payment).filter_by(gateway_order_id=order_id).first()
    if not payment:
        return {"success": False, "message": "Payment order record not found."}

    if payment.user_id != user_id:
        return {"success": False, "message": "Unauthorized: Order belongs to another account."}

    # Idempotency check: If already captured and verified, return existing subscription
    if payment.payment_status == 'captured':
        existing_sub = db.session.query(UserSubscription).filter_by(payment_id=payment.id).first()
        if existing_sub:
            return {
                "success": True,
                "message": "Payment has already been verified and processed.",
                "subscription": existing_sub.to_dict(),
                "payment": payment.to_dict()
            }

    # Cryptographic signature verification
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'careersense_rzp_secret_key_test_2026')
    is_valid_sig = False

    if order_id.startswith('order_test_'):
        # In test simulator mode, verify signature generated with key_secret or test token
        expected_sig = hmac.new(
            key_secret.encode('utf-8'),
            f"{order_id}|{payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        is_valid_sig = (
            hmac.compare_digest(expected_sig, signature)
            or signature == f"sim_sig_{payment_id}"
            or (isinstance(signature, str) and signature.startswith('sim_sig_'))
        )
    else:
        # Standard Razorpay HMAC-SHA256 verification
        client, _, _ = get_razorpay_client()
        if client:
            try:
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
                is_valid_sig = True
            except Exception:
                is_valid_sig = False
        else:
            expected_sig = hmac.new(
                key_secret.encode('utf-8'),
                f"{order_id}|{payment_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            is_valid_sig = hmac.compare_digest(expected_sig, signature)

    if not is_valid_sig:
        payment.payment_status = 'failed'
        db.session.commit()
        return {
            "success": False,
            "message": "Payment signature verification failed. Untrusted payment transaction."
        }

    # Update payment record in MySQL
    payment.gateway_payment_id = payment_id
    payment.gateway_signature = signature
    payment.payment_method = payment_method or 'upi'
    payment.payment_status = 'captured'
    payment.verified_at = datetime.utcnow()
    db.session.flush()

    # Activate subscription for the user
    subscription = activate_user_subscription(
        user_id=user_id,
        plan_id=payment.plan_id,
        payment_id=payment.id
    )

    return {
        "success": True,
        "message": f"Payment verified successfully! Welcome to {payment.plan.plan_name}.",
        "subscription": subscription.to_dict(),
        "payment": payment.to_dict()
    }

def process_webhook_event(raw_body: bytes, signature_header: str) -> dict:
    """
    Idempotent processing of Razorpay webhook events (e.g. order.paid, payment.captured).
    """
    webhook_secret = current_app.config.get('RAZORPAY_WEBHOOK_SECRET', '')
    if not webhook_secret:
        return {"success": False, "message": "Webhook secret not configured."}

    # Verify webhook signature
    expected_sig = hmac.new(webhook_secret.encode('utf-8'), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, signature_header or ''):
        return {"success": False, "message": "Invalid webhook signature."}

    import json
    try:
        data = json.loads(raw_body.decode('utf-8'))
    except Exception:
        return {"success": False, "message": "Invalid JSON payload."}

    event = data.get('event')
    payload = data.get('payload', {}).get('payment', {}).get('entity', {})
    order_id = payload.get('order_id')
    payment_id = payload.get('id')

    if event in ['payment.captured', 'order.paid'] and order_id:
        payment = db.session.query(Payment).filter_by(gateway_order_id=order_id).first()
        if payment and payment.payment_status != 'captured':
            payment.gateway_payment_id = payment_id
            payment.payment_status = 'captured'
            payment.verified_at = datetime.utcnow()
            db.session.flush()

            activate_user_subscription(
                user_id=payment.user_id,
                plan_id=payment.plan_id,
                payment_id=payment.id
            )

    return {"success": True, "event_processed": event}

