"""
Authentication Helper & Decorator
Enforces JWT extraction, validation, and user context.
CareerSense AI - Final Year Engineering Project
"""

from functools import wraps
from flask import request, jsonify, current_app
import jwt
from flask_jwt_extended import decode_token
from extensions import db
from models.user import User

def get_authenticated_user_id():
    """Extracts and verifies user_id from Bearer token or query param token."""
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split('Bearer ')[1].strip()
    elif request.args.get('token'):
        token = request.args.get('token')

    if not token:
        return None

    # First attempt: flask_jwt_extended decode_token
    try:
        decoded = decode_token(token)
        sub = decoded.get('sub')
        if sub is not None:
            return int(sub)
    except Exception:
        pass

    # Second attempt: raw jwt decode with secret
    try:
        secret = current_app.config.get('JWT_SECRET_KEY', 'careersense-ai-super-secret-jwt-key-2026')
        decoded = jwt.decode(token, secret, algorithms=['HS256'])
        sub = decoded.get('sub') or decoded.get('identity') or decoded.get('user_id') or decoded.get('id')
        if sub is not None:
            return int(sub)
    except Exception:
        pass

    return None

def token_required(f):
    """Decorator to require valid JWT authentication on API endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({
                "success": False,
                "message": "Authentication required. Please log in."
            }), 401

        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({
                "success": False,
                "message": "Authenticated user not found in database."
            }), 404

        # Pass user to view function
        return f(current_user=user, *args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to require administrator role on protected API endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = kwargs.get('current_user')
        if not current_user:
            user_id = get_authenticated_user_id()
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Authentication required. Please log in."
                }), 401
            current_user = db.session.query(User).filter_by(id=user_id).first()
            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "Authenticated user not found in database."
                }), 404
            kwargs['current_user'] = current_user

        if getattr(current_user, 'role', None) != 'admin':
            return jsonify({
                "success": False,
                "message": "Access denied. Administrator privileges required."
            }), 403

        return f(*args, **kwargs)
    return decorated

