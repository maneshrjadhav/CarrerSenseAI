"""
CareerSense AI — Owner-Authorized Administrator Setup Utility

Grants the 'admin' role to a specific existing account. This is the ONLY
sanctioned way to create an administrator: self-registration through the
public API can never produce an admin account.

Owner authorization model:
  1. The script must be run directly on the server by someone with DB access
     (it uses the same MySQL credentials as the backend).
  2. The target account must already exist (register normally first).
  3. Explicit --confirm flag is required; without it nothing is changed.
  4. If the ADMIN_SETUP_KEY environment variable is set, the operator must
     also pass --owner-key matching it.

Usage:
  python setup_admin.py --email admin@careersense.ai --confirm
  python setup_admin.py --email admin@careersense.ai --confirm --owner-key <key>

CareerSense AI - Final Year Engineering Project
"""

import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from config import Config
from extensions import db
from models.user import User
from models.payment_request import PaymentAuditLog


def promote_to_admin(email: str, owner_key: str = None) -> int:
    expected_owner_key = os.getenv('ADMIN_SETUP_KEY')
    if expected_owner_key and owner_key != expected_owner_key:
        print("ERROR: --owner-key did not match the ADMIN_SETUP_KEY environment variable.")
        return 1

    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        user = db.session.query(User).filter_by(email=email.strip().lower()).first()
        if not user:
            print(f"ERROR: No account found with email '{email}'.")
            print("Register the account through the normal signup flow first, then rerun this script.")
            return 1

        if user.role == 'admin':
            print(f"Account '{user.email}' (id={user.id}) already has the admin role. No change made.")
            return 0

        previous_role = user.role
        user.role = 'admin'

        audit = PaymentAuditLog(
            action='ADMIN_ROLE_GRANTED',
            performed_by_user_id=user.id,
            details_json=(
                '{"source": "setup_admin.py", "previous_role": "' + str(previous_role) + '"}'
            )
        )
        db.session.add(audit)
        db.session.commit()

        print(f"SUCCESS: '{user.email}' (id={user.id}) promoted from '{previous_role}' to 'admin'.")
        print("Sign in again (or call /api/auth/me) to refresh the role in the frontend session.")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Grant the admin role to an existing CareerSense AI account.")
    parser.add_argument('--email', required=True, help="Email of the existing account to promote.")
    parser.add_argument('--confirm', action='store_true', help="Required: explicitly confirms this owner-authorized change.")
    parser.add_argument('--owner-key', default=None, help="Optional owner key; required only when ADMIN_SETUP_KEY is set.")
    args = parser.parse_args()

    if not args.confirm:
        print("REFUSED: This changes account privileges. Re-run with --confirm if you are the project owner.")
        return 1

    return promote_to_admin(args.email, args.owner_key)


if __name__ == '__main__':
    sys.exit(main())
