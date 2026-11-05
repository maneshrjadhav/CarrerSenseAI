"""
Phase 6 — Consolidated Live-API Verification Suite (CareerSense AI)
Runs against the live Flask backend at http://127.0.0.1:5000 and covers the
required integration scenarios end-to-end over real HTTP + MySQL.

Safety rules honored by this suite:
  - Mutating operations are limited to isolated fixture accounts:
      * a fresh user registered through /api/auth/register (p6_pass_<ts>@...)
      * fixture user 12 (p5_test_...@careersense.ai) for roadmap/cross-user checks
  - Real owner accounts (id 4, id 6) are never touched.
  - Payment settings are never written with fabricated values (read-only here).
  - Bank/UPI values are asserted but never printed.
"""
import sys
import os
import time
import uuid
from datetime import datetime, timezone

import requests

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:5000/api"
RESUME_FILE = "d:/CareerSenseAI/backend/uploads/resumes/user_12_407879c8b0_test_resume.pdf"
FIXTURE_USER_12_EMAIL = "p5_test_1791806455@careersense.ai"
FIXTURE_OWN_MATCH = 39       # belongs to fixture user 12
REAL_OWNER_MATCH = 40        # belongs to real owner (id 4) - read-only isolation check
ROADMAP39_ITEMS = {563: 1, 564: 2, 565: 3}  # item_id -> order_index (roadmap for match 39)

JD_TEXT = (
    "We are hiring a Backend Developer with strong Python, Flask, and MySQL experience. "
    "The role requires building REST APIs, optimizing SQL queries, writing unit tests with pytest, "
    "and deploying services on AWS. Familiarity with Docker, React, and CI/CD pipelines is a plus. "
    "You will collaborate with a cross-functional team and own features end to end."
)

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok)))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f"  | {detail}" if detail else ""))
    return bool(ok)


def jget(path, token=None, timeout=60):
    h = {'Authorization': f'Bearer {token}'} if token else {}
    return requests.get(f"{BASE}{path}", headers=h, timeout=timeout)


def jpost(path, token=None, json=None, data=None, files=None, timeout=180):
    h = {'Authorization': f'Bearer {token}'} if token else {}
    return requests.post(f"{BASE}{path}", headers=h, json=json, data=data, files=files, timeout=timeout)


def jpatch(path, token=None, json=None, timeout=60):
    h = {'Authorization': f'Bearer {token}'} if token else {}
    return requests.patch(f"{BASE}{path}", headers=h, json=json, timeout=timeout)


def solve_captcha_login(email, password):
    cap = jget('/auth/captcha').json()
    return jpost('/auth/login', json={
        'email': email,
        'password': password,
        'captcha': cap.get('captcha_code'),
        'captcha_token': cap.get('captcha_token'),
    })


def parse_iso(dt_str):
    if not dt_str:
        return None
    s = dt_str.replace('Z', '+00:00')
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def main():
    print("=" * 78)
    print("PHASE 6 — CONSOLIDATED LIVE-API VERIFICATION (CareerSense AI)")
    print("=" * 78)

    # ---------------------------------------------------------------
    # 1. Health + captcha + admin login
    # ---------------------------------------------------------------
    r = jget('/health')
    check("1. Backend health & MySQL connectivity", r.status_code == 200 and r.json().get('status') == 'healthy', r.json().get('message', ''))

    cap = jget('/auth/captcha').json()
    check("2. Captcha endpoint issues code+token", bool(cap.get('captcha_code')) and bool(cap.get('captcha_token')))

    admin_login_resp = solve_captcha_login('admin@careersense.ai', 'Admin@CareerSense2026')
    admin_login_ok = (admin_login_resp.status_code == 200
                      and admin_login_resp.json().get('user', {}).get('role') == 'admin')
    check("3. Admin login via real /auth/login (captcha-solved)", admin_login_ok,
          f"status={admin_login_resp.status_code}")

    # In-process tokens for fixture accounts (never for real accounts)
    sys.path.insert(0, 'd:/CareerSenseAI/backend')
    os.chdir('d:/CareerSenseAI/backend')
    from app import app
    from models.user import User
    from flask_jwt_extended import create_access_token
    with app.app_context():
        fixture12 = User.query.filter_by(email=FIXTURE_USER_12_EMAIL).first()
        assert fixture12 is not None, "Fixture user 12 missing"
        token12 = create_access_token(identity=str(fixture12.id))
        admin_user = User.query.filter_by(role='admin').first()
        admin_fallback_token = create_access_token(identity=str(admin_user.id))

    admin_token = admin_login_resp.json().get('access_token') or admin_login_resp.json().get('token') if admin_login_ok else admin_fallback_token
    if not admin_login_ok:
        print("       NOTE: admin HTTP login failed -> admin operations use in-process token; result reported honestly above.")

    # ---------------------------------------------------------------
    # 2. Fresh isolated user: register + login + auth edge cases
    # ---------------------------------------------------------------
    ts = int(time.time())
    fresh_email = f"p6_pass_{ts}@careersense.ai"
    fresh_password = "P6Pass!2026xyz"

    r = jpost('/auth/register', json={
        'full_name': 'Phase Six Pass Tester',
        'email': fresh_email,
        'phone': '9876543210',
        'dob': '2002-05-15',
        'password': fresh_password,
    })
    reg_ok = r.status_code == 201 and r.json().get('success') is True
    check("4. Fresh isolated user registration via API", reg_ok, f"status={r.status_code}")

    fresh_login = solve_captcha_login(fresh_email, fresh_password)
    fresh_ok = fresh_login.status_code == 200 and bool(fresh_login.json().get('access_token') or fresh_login.json().get('token'))
    check("5. Fresh user login via real /auth/login (captcha-solved)", fresh_ok, f"status={fresh_login.status_code}")
    if not fresh_ok:
        print("ABORT: cannot continue without fresh user token")
        summarize()
        return
    fresh_token = fresh_login.json().get('access_token') or fresh_login.json().get('token')

    r = solve_captcha_login(fresh_email, "WrongPassword!999")
    check("6. Wrong password rejected (401)", r.status_code == 401, f"status={r.status_code}")

    bad_cap = jpost('/auth/login', json={'email': fresh_email, 'password': fresh_password, 'captcha': 'WRONG', 'captcha_token': ''})
    check("7. Invalid captcha rejected (400)", bad_cap.status_code == 400, f"status={bad_cap.status_code}")

    r = jpost('/auth/register', json={
        'full_name': 'Duplicate Attempt', 'email': fresh_email, 'phone': '9876543210',
        'dob': '2002-05-15', 'password': fresh_password,
    })
    check("8. Duplicate email registration rejected (409)", r.status_code == 409, f"status={r.status_code}")

    # ---------------------------------------------------------------
    # 3. Catalog + payment config
    # ---------------------------------------------------------------
    plans = jget('/subscription/plans', fresh_token).json().get('plans', [])
    prices = sorted(p['price_inr'] for p in plans)
    durations_m = sorted(p['duration_months'] for p in plans if p['plan_type'] == 'subscription')
    ats_plans = [p for p in plans if p['plan_type'] == 'ats_pass']
    check("9. Catalog has exactly 4 active plans", len(plans) == 4, f"found {len(plans)}")
    check("10. Prices are 39 / 349 / 599 / 999 (₹749 removed)", prices == [39.0, 349.0, 599.0, 999.0], f"{prices}")
    check("11. Subscription durations are 1 / 3 / 12 months",
          durations_m == [1, 3, 12], f"{durations_m}")
    check("12. ATS pass plan: type=ats_pass, ₹39, duration_days=1",
          len(ats_plans) == 1 and ats_plans[0]['price_inr'] == 39.0 and (ats_plans[0].get('duration_days') == 1),
          f"{[(p['plan_code'], p.get('duration_days')) for p in ats_plans]}")
    ats_plan_id = ats_plans[0]['id'] if ats_plans else None

    cfg = jget('/subscription/payment-config').json().get('payment_config', {})
    check("13. Public payment config: manual transfer enabled + gateway flag present",
          cfg.get('manual_transfer_enabled') is True and 'razorpay_enabled' in cfg,
          f"manual={cfg.get('manual_transfer_enabled')} razorpay_flag_present={'razorpay_enabled' in cfg}")
    check("14. Payment config has UPI id configured (value not printed)",
          bool(cfg.get('upi_id')) and bool(cfg.get('account_number')))

    # ---------------------------------------------------------------
    # 4. Fresh user baseline: no subscription, features gated
    # ---------------------------------------------------------------
    cur = jget('/subscription/current', fresh_token).json()
    check("15. Fresh user has NO active subscription", cur.get('has_active_subscription') is False)
    acc = jget('/subscription/check-access/ats_report', fresh_token)
    check("16. ATS report gated before purchase (403 subscription_required)",
          acc.status_code == 403 and acc.json().get('reason') == 'subscription_required',
          f"status={acc.status_code} reason={acc.json().get('reason')}")
    acc_rm = jget('/subscription/check-access/career_roadmap', fresh_token)
    check("17. Career roadmap gated before purchase (403)", acc_rm.status_code == 403, f"status={acc_rm.status_code}")

    # ---------------------------------------------------------------
    # 5. Upload -> analyze -> job match chain (must NOT activate the pass)
    # ---------------------------------------------------------------
    with open(RESUME_FILE, 'rb') as f:
        r = jpost('/resume/upload', token=fresh_token,
                  files={'file': ('p6_test_resume.pdf', f, 'application/pdf')})
    upd = r.json()
    resume_id = upd.get('resume_id') or (upd.get('resume') or {}).get('id')
    check("18. Resume upload succeeds (PDF)", r.status_code in (200, 201) and bool(resume_id), f"status={r.status_code} resume_id={resume_id}")

    if resume_id:
        r = jpost('/resume/analyze', token=fresh_token, json={'resume_id': resume_id})
        an_ok = r.status_code in (200, 201) and r.json().get('success') is True
        check("19. Resume intelligence analysis succeeds", an_ok, f"status={r.status_code}")
        cur2 = jget('/subscription/current', fresh_token).json()
        check("20. CONSTRAINT: upload+analysis did NOT activate the ₹39 pass",
              cur2.get('has_active_subscription') is False)

        r = jpost('/job-match/analyze', token=fresh_token, json={
            'resume_id': resume_id,
            'target_role': 'Backend Developer',
            'company_name': 'Phase6 Systems',
            'job_description': JD_TEXT,
        })
        jd_data = r.json()
        match_id = jd_data.get('match_id')
        jd_ok = r.status_code == 201 and jd_data.get('success') is True and match_id
        check("21. Job match analysis completes with real metrics", jd_ok,
              f"status={r.status_code} match_id={match_id} score={(jd_data.get('metrics') or {}).get('overall_match_score')}")
        cur3 = jget('/subscription/current', fresh_token).json()
        check("22. CONSTRAINT: job match did NOT activate the ₹39 pass",
              cur3.get('has_active_subscription') is False)

        r = jpost(f'/job-match/{match_id}/report', token=fresh_token)
        check("23. ATS report generation locked before purchase (403)",
              r.status_code == 403 and r.json().get('subscription_required') is True, f"status={r.status_code}")

    # ---------------------------------------------------------------
    # 6. ₹39 pass purchase: request -> proof -> still locked
    # ---------------------------------------------------------------
    r = jpost('/subscription/payment-requests', token=fresh_token, json={'plan_id': ats_plan_id})
    pr = r.json().get('payment_request', {})
    pr_id = pr.get('id')
    check("24. Pass payment request created (₹39 server-enforced price)",
          r.status_code == 201 and float(pr.get('amount_inr', 0)) == 39.0 and pr.get('status') == 'awaiting_payment',
          f"status={r.status_code} amount={pr.get('amount_inr')} ref={pr.get('request_reference')}")
    check("25. Request reference format CS-PAY-...", str(pr.get('request_reference', '')).startswith('CS-PAY-'))

    utr = f"P6{ts}UTR{uuid.uuid4().hex[:6].upper()}"
    r = jpost(f'/subscription/payment-requests/{pr_id}/submit-proof', token=fresh_token,
              data={'utr_number': utr, 'payment_time': '2026-10-12 10:00:00 UTC'})
    proof_ok = r.status_code == 200 and r.json().get('payment_request', {}).get('status') == 'pending_verification'
    check("26. UTR submitted -> pending_verification", proof_ok, f"status={r.status_code}")

    cur4 = jget('/subscription/current', fresh_token).json()
    check("27. Subscription still inactive while pending verification",
          cur4.get('has_active_subscription') is False
          and (cur4.get('pending_payment_request') or {}).get('id') == pr_id)
    acc2 = jget('/subscription/check-access/ats_report', fresh_token).json()
    check("28. Feature gating reason = payment_pending_verification",
          acc2.get('reason') == 'payment_pending_verification', f"reason={acc2.get('reason')}")
    if match_id:
        r = jpost(f'/job-match/{match_id}/report', token=fresh_token)
        check("29. Report download STILL locked while payment pending (403)", r.status_code == 403, f"status={r.status_code}")

    # ---------------------------------------------------------------
    # 7. Security: non-admin blocked; cross-user isolation
    # ---------------------------------------------------------------
    r = jget('/admin/payment-requests', fresh_token)
    check("30. Non-admin blocked from admin list (403)", r.status_code == 403, f"status={r.status_code}")
    r = jpost(f'/admin/payment-requests/{pr_id}/approve', token=fresh_token, json={'admin_notes': 'hack'})
    check("31. Non-admin blocked from admin approve (403)", r.status_code == 403, f"status={r.status_code}")

    r = jget(f'/job-match/{FIXTURE_OWN_MATCH}', fresh_token)
    check("32. Cross-user isolation: fresh user -> fixture match 39 (403)", r.status_code == 403, f"status={r.status_code}")
    r = jget(f'/job-match/{REAL_OWNER_MATCH}', fresh_token)
    check("33. Cross-user isolation: fresh user -> real-owner match 40 (403)", r.status_code == 403, f"status={r.status_code}")
    if match_id:
        r = jget(f'/job-match/{match_id}', token12)
        check("34. Cross-user isolation: fixture user 12 -> fresh user's match (403)", r.status_code == 403, f"status={r.status_code}")

    # ---------------------------------------------------------------
    # 8. Admin verification + approval -> 24h pass activation
    # ---------------------------------------------------------------
    r = jget('/admin/payment-requests?status=pending_verification', admin_token)
    listed = [x for x in r.json().get('payment_requests', []) if x['id'] == pr_id]
    check("35. Admin sees the pending request in approval queue", r.status_code == 200 and len(listed) == 1, f"status={r.status_code}")

    r = jget(f'/admin/payment-requests/{pr_id}', admin_token)
    logs = r.json().get('audit_logs', [])
    check("36. Admin detail shows real audit trail (>=2 events)", r.status_code == 200 and len(logs) >= 2, f"audit_logs={len(logs)}")

    r = jpost(f'/admin/payment-requests/{pr_id}/approve', token=admin_token,
              json={'admin_notes': 'Phase6 test: UTR verified in test fixture flow'})
    appr = r.json()
    sub = appr.get('subscription') or {}
    appr_ok = (r.status_code == 200 and appr.get('success') is True
               and appr.get('payment_request', {}).get('status') == 'approved')
    check("37. Admin approves -> request approved + subscription activated", appr_ok, f"status={r.status_code}")

    start_dt = parse_iso(sub.get('start_date'))
    end_dt = parse_iso(sub.get('end_date'))
    now_utc = datetime.utcnow()
    delta_h = (end_dt - start_dt).total_seconds() / 3600 if (start_dt and end_dt) else None
    start_age_s = (now_utc - start_dt).total_seconds() if start_dt else None
    check("38. Pass entitlement window = exactly 24h (UTC start at approval time)",
          delta_h is not None and abs(delta_h - 24.0) < 0.05 and start_age_s is not None and -5 <= start_age_s < 180,
          f"window={delta_h:.3f}h start_age={start_age_s:.0f}s" if delta_h is not None else "no dates")
    check("39. Activated sub is the ₹39 ATS pass", sub.get('plan_id') == ats_plan_id and sub.get('status') == 'active',
          f"plan_id={sub.get('plan_id')} status={sub.get('status')}")

    cur5 = jget('/subscription/current', fresh_token).json()
    check("40. /current now reports active pass (active_ats_pass present)",
          cur5.get('has_active_subscription') is True and cur5.get('active_ats_pass') is not None)
    acc3 = jget('/subscription/check-access/ats_report', fresh_token)
    acc4 = jget('/subscription/check-access/career_roadmap', fresh_token)
    check("41. ATS unlocked after approval; premium features STILL gated (pass != subscription)",
          acc3.status_code == 200 and acc4.status_code == 403,
          f"ats={acc3.status_code} roadmap={acc4.status_code}")

    # ---------------------------------------------------------------
    # 9. ATS report unlocked + idempotency + re-login persistence
    # ---------------------------------------------------------------
    if match_id:
        r = jpost(f'/job-match/{match_id}/report', token=fresh_token)
        check("42. ATS report generation succeeds after pass activation (201)", r.status_code == 201, f"status={r.status_code}")
        r = jget(f'/job-match/{match_id}/report/download', fresh_token)
        pdf_ok = r.status_code == 200 and r.content[:4] == b'%PDF' and len(r.content) > 1000
        check("43. ATS report PDF download succeeds (real PDF bytes)", pdf_ok,
              f"status={r.status_code} size={len(r.content) if r.ok else 0}")

    r = jpost(f'/admin/payment-requests/{pr_id}/approve', token=admin_token, json={'admin_notes': 'duplicate'})
    dup = r.json()
    check("44. Duplicate approval is idempotent (already_approved=True)", dup.get('already_approved') is True and r.status_code == 200)
    r = jget('/subscription/current', fresh_token).json()
    end_after = (r.get('subscription') or {}).get('end_date')
    check("45. Idempotency: end_date unchanged after duplicate approval",
          parse_iso(end_after) == parse_iso(sub.get('end_date')),
          f"{sub.get('end_date')} vs {end_after}")

    fresh_login2 = solve_captcha_login(fresh_email, fresh_password)
    fresh_token2 = fresh_login2.json().get('access_token') or fresh_login2.json().get('token')
    cur6 = jget('/subscription/current', fresh_token2).json()
    dl2 = jget(f'/job-match/{match_id}/report/download', fresh_token2) if match_id else None
    check("46. Persistence across re-login: pass active + report still downloadable",
          fresh_login2.status_code == 200 and cur6.get('has_active_subscription') is True
          and (dl2 is not None and dl2.status_code == 200),
          f"login={fresh_login2.status_code} sub_active={cur6.get('has_active_subscription')}")

    # ---------------------------------------------------------------
    # 10. Roadmap: task sync, progress persistence, sequential/quiz locking
    # ---------------------------------------------------------------
    r = jget('/career-roadmap/39', token12)
    rm = r.json().get('roadmap') or {}
    items = rm.get('items', [])
    check("47. Fixture roadmap for match 39 loads (career_roadmap entitled)", r.status_code == 200 and len(items) >= 3,
          f"status={r.status_code} items={len(items)}")

    item563 = next((i for i in items if i['id'] == 563), None)
    if item563:
        synced = [dict(t, is_completed=True) for t in (item563.get('tasks') or [])]
        r = jpatch('/career-roadmap/items/563', token12, json={'tasks': synced})
        ok = r.status_code == 200 and r.json().get('item', {}).get('progress') == 100
        check("48. Task sync: completing all daily tasks recomputes progress to 100 (data consistency)",
              ok, f"status={r.status_code}")

    r = jpatch('/career-roadmap/items/564', token12, json={'progress': 10})
    pers_ok = r.status_code == 200 and r.json().get('item', {}).get('progress') == 10
    r2 = jget('/career-roadmap/39', token12)
    items2 = (r2.json().get('roadmap') or {}).get('items', [])
    i564 = next((i for i in items2 if i['id'] == 564), None)
    check("49. Roadmap progress PATCH persists across fresh GET", pers_ok and i564 is not None and i564.get('progress') == 10,
          f"patched=10 persisted={i564.get('progress') if i564 else None}")

    r = jpatch('/career-roadmap/items/565', token12, json={'progress': 5})
    check("50. Sequential gate: later phase locked while phase 2 incomplete (400 locked)",
          r.status_code == 400 and r.json().get('locked') is True, f"status={r.status_code} locked={r.json().get('locked')}")

    r = jpost('/career-roadmap/items/565/quiz-submit', token12, json={'answers': {}})
    check("51. Quiz gating: assessment blocked on locked phase (400 locked)",
          r.status_code == 400 and r.json().get('locked') is True, f"status={r.status_code} locked={r.json().get('locked')}")

    # ---------------------------------------------------------------
    # 11. Dashboard real data + guard rails
    # ---------------------------------------------------------------
    dash = jget('/dashboard/summary', token12)
    d = dash.json()
    m = d.get('metrics', {})
    check("52. Dashboard returns real aggregates for fixture user",
          dash.status_code == 200 and d.get('success') is True and m.get('analyses_count', 0) >= 2,
          f"analyses={m.get('analyses_count')} resumes={m.get('resumes_count')}")
    check("53. Dashboard never shows 100% roadmap unless all phases completed",
          (m.get('roadmap_progress') or 0) <= 99, f"roadmap_progress={m.get('roadmap_progress')}")
    acts = d.get('activities', [])
    check("54. Dashboard activities are real DB events (timestamps present)",
          all(a.get('timestamp') for a in acts) and len(acts) >= 1, f"activities={len(acts)}")

    summarize()


def summarize():
    print("=" * 78)
    passed = sum(1 for _, ok in results if ok)
    failed = [(n, ok) for n, ok in results if not ok]
    print(f"RESULT: {passed}/{len(results)} checks passed.")
    if failed:
        print("FAILED CHECKS:")
        for n, _ in failed:
            print(f"  - {n}")
    print("=" * 78)


if __name__ == '__main__':
    main()
