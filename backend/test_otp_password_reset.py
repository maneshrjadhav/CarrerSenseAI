import os
import sys
from datetime import datetime, timedelta
import requests

BASE_URL = "http://127.0.0.1:5000/api/auth"

def test_flow():
    print("=================================================================")
    print("TESTING SECURE EMAIL OTP FORGOT & RESET PASSWORD WORKFLOW")
    print("=================================================================")
    
    test_email = "candidate_alpha_v25@careersense.ai"
    test_user_initial_pwd = "CandidatePassword123!"
    new_pwd = "CandidateNewPassword2026!"
    
    # 1. Unregistered Email Test (Must return generic 200, no enumeration)
    print("\n[Case 1] Requesting OTP for unregistered email...")
    resp = requests.post(f"{BASE_URL}/forgot-password", json={"email": "nonexistent_candidate@careersense.ai"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data["success"] is True
    assert "verification code has been sent" in data["message"]
    print("  [OK] Passed: Generic message returned, zero email enumeration.")

    # 2. Registered Email Test (Valid candidate)
    print("\n[Case 2] Requesting OTP for registered candidate...")
    resp = requests.post(f"{BASE_URL}/forgot-password", json={"email": test_email}, headers={"X-Test-Runner": "true"})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    otp_code = data.get("_dev_otp")
    assert otp_code and len(otp_code) == 6, f"Invalid OTP: {otp_code}"
    print(f"  [OK] Passed: 6-digit OTP generated: {otp_code}")

    # 3. Cooldown / Rate Limiting Test (Immediate request should trigger 429)
    print("\n[Case 3] Requesting OTP immediately again (Cooldown test)...")
    resp = requests.post(f"{BASE_URL}/forgot-password", json={"email": test_email})
    assert resp.status_code == 429, f"Expected 429, got {resp.status_code}"
    print(f"  [OK] Passed: 429 Too Many Requests triggered. Message: {resp.json().get('message')}")

    # 4. Incorrect OTP Verification Test
    print("\n[Case 4] Verifying with incorrect OTP '000000'...")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"email": test_email, "otp": "000000"})
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    assert "Invalid verification code" in resp.json().get("message")
    print(f"  [OK] Passed: Incorrect OTP rejected with remaining attempts tracking: {resp.json().get('message')}")

    # 5. Correct OTP Verification Test
    print(f"\n[Case 5] Verifying with correct OTP '{otp_code}'...")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"email": test_email, "otp": otp_code})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    verify_data = resp.json()
    assert verify_data["success"] is True
    reset_token = verify_data.get("reset_token")
    assert reset_token and len(reset_token) > 20, "Missing or invalid reset_token"
    print(f"  [OK] Passed: OTP verified and single-use reset_token issued.")

    # 6. OTP Reuse Prevention Test (Same OTP should not be reusable)
    print(f"\n[Case 6] Attempting to reuse already consumed OTP '{otp_code}'...")
    resp = requests.post(f"{BASE_URL}/verify-otp", json={"email": test_email, "otp": otp_code})
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    print("  [OK] Passed: Already consumed OTP rejected.")

    # 7. Password Mismatch Test
    print("\n[Case 7] Resetting with mismatched passwords...")
    resp = requests.post(f"{BASE_URL}/reset-password", json={
        "reset_token": reset_token,
        "new_password": new_pwd,
        "confirm_password": "MismatchedPassword123!"
    })
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    assert "Passwords do not match" in resp.json().get("message")
    print("  [OK] Passed: Mismatch rejected.")

    # 8. Password Complexity Test (Too short)
    print("\n[Case 8] Resetting with weak password 'short'...")
    resp = requests.post(f"{BASE_URL}/reset-password", json={
        "reset_token": reset_token,
        "new_password": "short",
        "confirm_password": "short"
    })
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    assert "at least 8 characters" in resp.json().get("message")
    print("  [OK] Passed: Weak password rejected.")

    # 9. Successful Password Reset Test
    print("\n[Case 9] Resetting password with valid new password...")
    resp = requests.post(f"{BASE_URL}/reset-password", json={
        "reset_token": reset_token,
        "new_password": new_pwd,
        "confirm_password": new_pwd
    })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    print("  [OK] Passed: Password reset succeeded in MySQL.")

    # 10. Reset Token Reuse Prevention Test
    print("\n[Case 10] Attempting to reuse consumed reset_token...")
    resp = requests.post(f"{BASE_URL}/reset-password", json={
        "reset_token": reset_token,
        "new_password": new_pwd,
        "confirm_password": new_pwd
    })
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}"
    print("  [OK] Passed: Consumed reset_token rejected.")

    # 11. Old Password Rejection Test on Login
    print("\n[Case 11] Logging in with OLD password (Must fail 401)...")
    captcha_res = requests.get(f"{BASE_URL}/captcha").json()
    resp = requests.post(f"{BASE_URL}/login", json={
        "email": test_email,
        "password": test_user_initial_pwd,
        "captcha": captcha_res["captcha_code"],
        "captcha_token": captcha_res["captcha_token"]
    })
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("  [OK] Passed: Old password rejected.")

    # 12. New Password Login Test
    print("\n[Case 12] Logging in with NEW password (Must succeed 200)...")
    captcha_res = requests.get(f"{BASE_URL}/captcha").json()
    resp = requests.post(f"{BASE_URL}/login", json={
        "email": test_email,
        "password": new_pwd,
        "captcha": captcha_res["captcha_code"],
        "captcha_token": captcha_res["captcha_token"]
    })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    auth_data = resp.json()
    assert auth_data["success"] is True and "access_token" in auth_data
    print("  [OK] Passed: Successfully logged in with new password!")

    # 13. Revert password back to original for test stability
    print("\n[Teardown] Restoring original password for other verification suites...")
    from extensions import db
    from app import app
    from models.user import User
    from routes.auth import hash_password
    with app.app_context():
        u = db.session.query(User).filter_by(email=test_email).first()
        if u:
            u.password_hash = hash_password(test_user_initial_pwd)
            db.session.commit()
    print("  [OK] Restored original candidate password.")

    print("\n=================================================================")
    print("ALL 12 BACKEND SECURITY & LOGIC TESTS PASSED (100%)")
    print("=================================================================")

if __name__ == '__main__':
    test_flow()
