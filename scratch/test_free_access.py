import urllib.request
import json
import ssl
import sys
import os

# Add backend to sys.path to generate authoritative token with app context
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app import app
from flask_jwt_extended import create_access_token

USER_ID = 28 # manesh21@gmail.com
with app.app_context():
    token = create_access_token(identity=str(USER_ID))

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "http://127.0.0.1:5000/api"

def make_req(path, data=None, token=None, method=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx) as res:
            return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"HTTP ERROR {e.code}: {body}")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body

print("="*65)
print("CAREERSENSE AI - FREE UNRESTRICTED ACCESS VERIFICATION SUITE")
print("="*65)

print(f"[OK] Generated valid token for Candidate User ID {USER_ID} (manesh21@gmail.com)")

# Test 1: /api/subscription/current
status, sub_resp = make_req("/subscription/current", token=token)
print(f"\n[Test 1] GET /api/subscription/current:")
print(f"  Status Code: {status}")
print(f"  has_active_subscription: {sub_resp.get('has_active_subscription')}")
print(f"  pending_payment_request: {sub_resp.get('pending_payment_request')}")
print(f"  features_access: {sub_resp.get('features_access')}")
assert status == 200, f"Expected 200, got {status}"
assert sub_resp.get('has_active_subscription') is True, "Expected True"
assert sub_resp.get('pending_payment_request') is None, "Expected None"
for f in ['skill_gap', 'career_roadmap', 'interview_prep', 'ats_report']:
    assert sub_resp.get('features_access', {}).get(f) is True, f"Feature {f} not True!"
print("  --> [PASS] User has active free access without any pending payments!")

# Test 2: Check access for all 4 gated modules
features = ['career_roadmap', 'skill_gap', 'interview_prep', 'ats_report']
print(f"\n[Test 2] Feature Gating Endpoints (/api/subscription/check-access/<feat>):")
for feat in features:
    status, res = make_req(f"/subscription/check-access/{feat}", token=token)
    print(f"  - Feature '{feat}': status={status}, allowed={res.get('allowed')}, reason={res.get('reason')}")
    assert status == 200, f"Expected 200 for {feat}, got {status}"
    assert res.get('allowed') is True, f"Expected allowed=True for {feat}"
print("  --> [PASS] All 4 feature gates return 200 OK and allowed=True!")

# Test 3: Roadmap active endpoint
status, road_resp = make_req("/roadmap/active", token=token)
print(f"\n[Test 3] GET /api/roadmap/active:")
print(f"  Status Code: {status}, has_roadmap={road_resp.get('has_roadmap')}")
assert status == 200, f"Expected 200 for /roadmap/active, got {status}"
assert road_resp.get('success') is True, "Expected success=True"
print("  --> [PASS] Roadmap access granted without paywall!")

# Test 4: Interview history endpoint
status, int_resp = make_req("/interview/history", token=token)
print(f"\n[Test 4] GET /api/interview/history:")
print(f"  Status Code: {status}, history count={len(int_resp.get('history', []))}")
assert status == 200, f"Expected 200 for /interview/history, got {status}"
assert int_resp.get('success') is True, "Expected success=True"
print("  --> [PASS] Mock interview access granted without paywall!")

# Test 5: Verify Frontend on Port 5275
front_url = "http://localhost:5275/pricing"
front_req = urllib.request.Request(front_url)
with urllib.request.urlopen(front_req) as f_res:
    front_html = f_res.read().decode('utf-8')
    print(f"\n[Test 5] GET http://localhost:5275/pricing:")
    print(f"  Status Code: {f_res.status}, Length: {len(front_html)} bytes")
    assert f_res.status == 200
    print("  --> [PASS] Frontend /pricing served successfully!")

print("\n" + "="*65)
print("ALL VERIFICATION SUITE TESTS PASSED SUCCESSFULLY! [OK]")
print("="*65)
