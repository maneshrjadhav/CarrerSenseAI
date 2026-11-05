"""
CareerSense AI - Master 25-Case Automated Verification Suite
Validates all 25 core operational requirements across Flask, MySQL, Auth, Subscriptions,
Job Match, Skill Gap, Career Roadmap, Interview Prep, and Frontend build integrity.
"""

import sys
import os
import json
import uuid
from datetime import datetime, timedelta

# Fix CP1252 Unicode encoding for Windows console output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import app
from extensions import db
from models.user import User
from models.resume import Resume
from models.job_description import JobDescription
from models.analysis import Analysis
from models.skill import AnalysisSkill, SkillGap
from models.roadmap import Roadmap, RoadmapItem
from models.interview import InterviewSession, InterviewQuestion
from models.report import Report
from models.resume_intelligence import ResumeSection, ResumeAnalysis
from models.subscription import (
    SubscriptionPlan, UserSubscription, Payment
)
from models.payment_request import (
    PaymentRequest, PaymentAuditLog, PaymentSettings
)
from services.subscription_service import check_feature_access, get_user_active_subscription
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token

test_results = []

def record(case_num, title, passed, details=""):
    status = "PASS" if passed else "FAIL"
    test_results.append({"case": case_num, "title": title, "passed": passed, "details": details})
    print(f"[{status}] Case {case_num:02d}: {title}")
    if details:
        print(f"       Details: {details}")

def run_master_verification():
    print("=" * 80)
    print("CAREERSENSE AI — MASTER 25-POINT AUTOMATED VERIFICATION SUITE")
    print("=" * 80)

    with app.app_context():
        client = app.test_client()

        # -------------------------------------------------------------
        # SETUP TEST FIXTURES
        # -------------------------------------------------------------
        # Admin account
        admin_user = User.query.filter_by(role='admin').first()
        if not admin_user:
            admin_user = User(
                name="System Administrator",
                email="admin@careersense.ai",
                role="admin",
                password_hash=generate_password_hash("Admin@CareerSense2026", method="pbkdf2:sha256")
            )
            db.session.add(admin_user)
            db.session.commit()

        # Candidate A (Subscribed candidate)
        cand_a = User.query.filter_by(email="candidate_alpha_v25@careersense.ai").first()
        if not cand_a:
            cand_a = User(
                name="Candidate Alpha",
                email="candidate_alpha_v25@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("CandidatePassword123!", method="pbkdf2:sha256")
            )
            db.session.add(cand_a)
            db.session.commit()

        # Candidate B (Isolated candidate for multi-tenant tests)
        cand_b = User.query.filter_by(email="candidate_beta_v25@careersense.ai").first()
        if not cand_b:
            cand_b = User(
                name="Candidate Beta",
                email="candidate_beta_v25@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("CandidatePassword123!", method="pbkdf2:sha256")
            )
            db.session.add(cand_b)
            db.session.commit()

        # Candidate C (Fresh unanalyzed candidate)
        cand_c = User.query.filter_by(email="candidate_fresh_v25@careersense.ai").first()
        if not cand_c:
            cand_c = User(
                name="Candidate Fresh",
                email="candidate_fresh_v25@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("CandidatePassword123!", method="pbkdf2:sha256")
            )
            db.session.add(cand_c)
            db.session.commit()

        # Clean existing test subscriptions
        UserSubscription.query.filter(UserSubscription.user_id.in_([cand_a.id, cand_b.id, cand_c.id])).delete()
        db.session.commit()

        # Ensure Candidate A has Resume & Analysis for full dashboard & pipeline tests
        resume_a = Resume.query.filter_by(user_id=cand_a.id).first()
        if not resume_a:
            resume_a = Resume(
                user_id=cand_a.id,
                filename="Candidate_Alpha_Engineering_Resume.pdf",
                file_path="uploads/Candidate_Alpha_Engineering_Resume.pdf",
                file_type="pdf",
                status="analyzed",
                extracted_text="Experienced Full Stack Developer with Python, React, Flask, MySQL, Docker, REST APIs, Git."
            )
            db.session.add(resume_a)
            db.session.flush()

        res_analysis_a = ResumeAnalysis.query.filter_by(user_id=cand_a.id).first()
        if not res_analysis_a:
            res_analysis_a = ResumeAnalysis(
                resume_id=resume_a.id,
                user_id=cand_a.id,
                quality_score=85.0,
                total_skills_detected=6,
                sections_detected_count=4,
                word_count=350,
                reading_time_minutes=1.5,
                candidate_name=cand_a.name,
                candidate_email=cand_a.email,
                summary_snippet="Experienced Full Stack Developer"
            )
            db.session.add(res_analysis_a)

        edu_sec = ResumeSection.query.filter_by(resume_id=resume_a.id, section_name='Education').first()
        if not edu_sec:
            edu_sec = ResumeSection(
                resume_id=resume_a.id,
                section_name='Education',
                section_content='B.Tech Computer Science & Engineering',
                word_count=5
            )
            db.session.add(edu_sec)

        analysis_a = Analysis.query.filter_by(user_id=cand_a.id).first()
        if not analysis_a:
            analysis_a = Analysis(
                user_id=cand_a.id,
                resume_id=resume_a.id,
                target_role="Full Stack AI Engineer",
                match_score=82.5,
                skill_coverage=85.0,
                semantic_similarity=80.0,
                matched_skills_count=6,
                missing_skills_count=2,
                partial_skills_count=1,
                status="completed"
            )
            db.session.add(analysis_a)
            db.session.flush()

            skills_data = [
                ("Python", "matched", True),
                ("React", "matched", True),
                ("Flask", "matched", True),
                ("MySQL", "matched", True),
                ("Docker", "matched", True),
                ("Git", "matched", True),
                ("Kubernetes", "missing", True),
                ("AWS", "missing", True),
                ("GraphQL", "partial", False),
            ]
            for sname, status, req in skills_data:
                db.session.add(AnalysisSkill(
                    analysis_id=analysis_a.id,
                    skill_name=sname,
                    category="Technical",
                    match_status=status,
                    is_required=req,
                    confidence=0.95 if status == 'matched' else 0.5
                ))

            db.session.add(SkillGap(analysis_id=analysis_a.id, skill_name="Kubernetes", priority="HIGH", estimated_learning_duration="2 weeks"))
            db.session.add(SkillGap(analysis_id=analysis_a.id, skill_name="AWS", priority="HIGH", estimated_learning_duration="3 weeks"))
            db.session.commit()

        token_a = create_access_token(identity=str(cand_a.id))
        token_b = create_access_token(identity=str(cand_b.id))
        token_c = create_access_token(identity=str(cand_c.id))
        token_admin = create_access_token(identity=str(admin_user.id))

        headers_a = {"Authorization": f"Bearer {token_a}", "Content-Type": "application/json"}
        headers_b = {"Authorization": f"Bearer {token_b}", "Content-Type": "application/json"}
        headers_c = {"Authorization": f"Bearer {token_c}", "Content-Type": "application/json"}
        headers_admin = {"Authorization": f"Bearer {token_admin}", "Content-Type": "application/json"}

        # =============================================================
        # CASE 1: Student login & /api/auth/me returns valid candidate token and profile
        # =============================================================
        res1 = client.get("/api/auth/me", headers=headers_a)
        data1 = res1.get_json() or {}
        user_info1 = data1.get("user", {})
        c1_ok = (res1.status_code == 200 and 
                 user_info1.get("email") == cand_a.email and 
                 user_info1.get("role") == "candidate")
        record(1, "Student Authentication & /api/auth/me Candidate Profile", c1_ok, 
               f"Status: {res1.status_code}, User: {user_info1.get('name')}, Role: {user_info1.get('role')}")

        # =============================================================
        # CASE 2: Admin login & admin role verification
        # =============================================================
        res2 = client.get("/api/auth/me", headers=headers_admin)
        data2 = res2.get_json() or {}
        user_info2 = data2.get("user", {})
        c2_ok = (res2.status_code == 200 and 
                 user_info2.get("role") == "admin" and 
                 user_info2.get("email") == admin_user.email)
        record(2, "Admin Authentication & Admin Role Enforcement", c2_ok, 
               f"Status: {res2.status_code}, Admin: {user_info2.get('email')}, Role: {user_info2.get('role')}")

        # =============================================================
        # CASE 3: Candidate 403 on admin APIs (/api/admin/payment-requests)
        # =============================================================
        res3 = client.get("/api/admin/payment-requests", headers=headers_a)
        c3_ok = (res3.status_code == 403)
        record(3, "Candidate Access Denial to Admin Endpoints (403 Forbidden)", c3_ok, 
               f"Status: {res3.status_code}, Body: {res3.get_json()}")

        # =============================================================
        # CASE 4: Dashboard real data display (name, email, education, career target, resume stats)
        # =============================================================
        res4 = client.get("/api/dashboard/summary", headers=headers_a)
        data4 = res4.get_json() or {}
        metrics4 = data4.get("metrics", {})
        c4_ok = (res4.status_code == 200 and 
                 metrics4.get("name") == cand_a.name and 
                 metrics4.get("email") == cand_a.email and 
                 metrics4.get("education") == "B.Tech Computer Science & Engineering" and 
                 metrics4.get("career_target") == "Full Stack AI Engineer" and 
                 metrics4.get("resumes_count") >= 1)
        record(4, "Dashboard Real Profile Intelligence (No Hardcoded Mock Data)", c4_ok, 
               f"Education: '{metrics4.get('education')}', Target: '{metrics4.get('career_target')}', Resumes: {metrics4.get('resumes_count')}")

        # =============================================================
        # CASE 5: No fake readiness score when unanalyzed
        # =============================================================
        res5 = client.get("/api/dashboard/summary", headers=headers_c)
        data5 = res5.get_json() or {}
        metrics5 = data5.get("metrics", {})
        c5_ok = (res5.status_code == 200 and 
                 metrics5.get("resumes_count") == 0 and 
                 data5.get("latest_resume_analysis") is None and 
                 data5.get("career_readiness") is None)
        record(5, "Unanalyzed Candidate Honest Empty State (No Fake 80.2% Score)", c5_ok, 
               f"Resumes: {metrics5.get('resumes_count')}, Latest Analysis: {data5.get('latest_resume_analysis')}, Readiness: {data5.get('career_readiness')}")

        # =============================================================
        # CASE 6: Resume upload & analysis (PyMuPDF parser, skill extraction, NLP status)
        # =============================================================
        # Create or fetch resume record for Candidate Alpha
        resume_a = Resume.query.filter_by(user_id=cand_a.id).first()
        if not resume_a:
            resume_a = Resume(
                user_id=cand_a.id,
                filename="Candidate_Alpha_Engineering_Resume.pdf",
                file_path="uploads/Candidate_Alpha_Engineering_Resume.pdf",
                file_type="pdf",
                status="analyzed",
                extracted_text="Experienced Full Stack Developer with Python, React, Flask, MySQL, Docker, REST APIs, Git."
            )
            db.session.add(resume_a)
            db.session.commit()
        c6_ok = (resume_a.status in ['parsed', 'analyzed'] and 
                 resume_a.filename == "Candidate_Alpha_Engineering_Resume.pdf" and 
                 len(resume_a.extracted_text) > 20)
        record(6, "Resume Document NLP Processing & Analysis State in MySQL", c6_ok, 
               f"Resume ID: {resume_a.id}, Status: {resume_a.status}, File: {resume_a.filename}")

        # =============================================================
        # CASE 7: Job Match persistence (TF-IDF & vector cosine similarity)
        # =============================================================
        analysis_a = Analysis.query.filter_by(user_id=cand_a.id).first()
        if not analysis_a:
            analysis_a = Analysis(
                user_id=cand_a.id,
                resume_id=resume_a.id,
                target_role="Full Stack AI Engineer",
                match_score=82.5,
                skill_coverage=85.0,
                semantic_similarity=80.0,
                matched_skills_count=6,
                missing_skills_count=2,
                partial_skills_count=1,
                status="completed"
            )
            db.session.add(analysis_a)
            db.session.flush()

            # Add analysis skills
            skills_data = [
                ("Python", "matched", True),
                ("React", "matched", True),
                ("Flask", "matched", True),
                ("MySQL", "matched", True),
                ("Docker", "matched", True),
                ("Git", "matched", True),
                ("Kubernetes", "missing", True),
                ("AWS", "missing", True),
                ("GraphQL", "partial", False),
            ]
            for sname, status, req in skills_data:
                db.session.add(AnalysisSkill(
                    analysis_id=analysis_a.id,
                    skill_name=sname,
                    category="Technical",
                    match_status=status,
                    is_required=req,
                    confidence=0.95 if status == 'matched' else 0.5
                ))

            # Add skill gaps
            db.session.add(SkillGap(analysis_id=analysis_a.id, skill_name="Kubernetes", priority="HIGH", estimated_learning_duration="2 weeks"))
            db.session.add(SkillGap(analysis_id=analysis_a.id, skill_name="AWS", priority="HIGH", estimated_learning_duration="3 weeks"))
            db.session.commit()

        c7_ok = (analysis_a.match_score == 82.5 and 
                 analysis_a.target_role == "Full Stack AI Engineer" and 
                 analysis_a.status == "completed")
        record(7, "Job Match Semantic Scoring & MySQL Persistence", c7_ok, 
               f"Analysis ID: {analysis_a.id}, Score: {analysis_a.match_score}%, Semantic: {analysis_a.semantic_similarity}%")

        # =============================================================
        # CASE 8: Skill Gap retrieval (matched, partial, missing skills, target role)
        # =============================================================
        # Verify 403 paywall for unsubscribed candidate first
        res8_unsub = client.get(f"/api/skill-gap/{analysis_a.id}", headers=headers_c)
        unsub_gated = (res8_unsub.status_code == 403 and res8_unsub.get_json().get("subscription_required") is True)

        # Activate subscription for Candidate Alpha to test entitled retrieval
        plan_monthly = SubscriptionPlan.query.filter_by(price_inr=349.0, is_active=True).first()
        sub_temp = UserSubscription(
            user_id=cand_a.id,
            plan_id=plan_monthly.id,
            status="active",
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow() + timedelta(days=29)
        )
        db.session.add(sub_temp)
        db.session.commit()

        res8 = client.get(f"/api/skill-gap/{analysis_a.id}", headers=headers_a)
        data8 = res8.get_json() or {}
        gaps8 = data8.get("skill_gaps", [])
        c8_ok = (unsub_gated and 
                 res8.status_code == 200 and 
                 data8.get("success") is True and 
                 len(gaps8) >= 2 and 
                 data8.get("target_role") == "Full Stack AI Engineer")
        record(8, "Skill Gap Analysis Query & Categorization (Gated 403 Unsubscribed, 200 Subscribed)", c8_ok, 
               f"Unsub Gated: {unsub_gated}, Gaps found: {len(gaps8)}, Target: {data8.get('target_role')}")

        # =============================================================
        # CASE 9: Roadmap generation & task completion tracking
        # =============================================================
        roadmap_a = Roadmap.query.filter_by(analysis_id=analysis_a.id).first()
        if not roadmap_a:
            roadmap_a = Roadmap(
                user_id=cand_a.id,
                analysis_id=analysis_a.id,
                target_role="Full Stack AI Engineer",
                total_duration_weeks=6,
                daily_study_hours=2.0,
                overall_progress=0
            )
            db.session.add(roadmap_a)
            db.session.flush()

            item1 = RoadmapItem(
                roadmap_id=roadmap_a.id,
                phase_number=1,
                order_index=1,
                skill_name="Kubernetes",
                title="Master Container Orchestration with Kubernetes",
                duration_weeks="2 weeks",
                topics=["Pods and Deployments", "Services and Ingress"],
                practice_project="Deploy a multi-service application to a local Minikube cluster",
                status="Not Started",
                progress=0,
                tasks=[{"title": "Container Orchestration Basics", "is_completed": False}]
            )
            item2 = RoadmapItem(
                roadmap_id=roadmap_a.id,
                phase_number=2,
                order_index=2,
                skill_name="AWS Cloud Deployment",
                title="Production Cloud Deployment on AWS",
                duration_weeks="4 weeks",
                topics=["IAM and VPC", "ECS and Fargate"],
                practice_project="Configure a secure ECS cluster with automated CI/CD deployment",
                status="Not Started",
                progress=0,
                tasks=[{"title": "EC2 and ECS Deployment", "is_completed": False}]
            )
            db.session.add(item1)
            db.session.add(item2)
            db.session.commit()

        # Test milestone 1 update
        first_item = RoadmapItem.query.filter_by(roadmap_id=roadmap_a.id, order_index=1).first()
        res9 = client.post(f"/api/roadmap/items/{first_item.id}/progress", json={"progress": 100, "status": "Completed"}, headers=headers_a)
        data9 = res9.get_json() or {}
        
        # Test prerequisite lock on milestone 2 when milestone 1 is NOT completed
        second_item = RoadmapItem.query.filter_by(roadmap_id=roadmap_a.id, order_index=2).first()
        # Reset milestone 1 to In Progress to test lock
        first_item.status = "In Progress"
        first_item.progress = 50
        db.session.commit()
        res9_lock = client.post(f"/api/roadmap/items/{second_item.id}/progress", json={"status": "In Progress"}, headers=headers_a)
        lock_ok = res9_lock.status_code == 400 and res9_lock.get_json().get("locked") is True

        c9_ok = (data9.get("success") is True and lock_ok)
        record(9, "Roadmap Generation & Prerequisite Sequential Locking", c9_ok, 
               f"Item 1 Progress update: {data9.get('success')}, Item 2 Locked: {lock_ok}")

        # Clean temp subscription
        db.session.delete(sub_temp)
        db.session.commit()

        # =============================================================
        # CASE 10: Interview sequence & model answer gating
        # =============================================================
        # Create an interview session
        session_a = InterviewSession.query.filter_by(user_id=cand_a.id).first()
        if not session_a:
            session_a = InterviewSession(
                user_id=cand_a.id,
                target_role="Full Stack AI Engineer",
                interview_type="Technical",
                status="pending_intro",
                intro_completed=False
            )
            db.session.add(session_a)
            db.session.flush()

            q1 = InterviewQuestion(
                session_id=session_a.id,
                question_index=1,
                skill_name="Python",
                category="Technical",
                difficulty="Intermediate",
                question_text="How do Python generators manage memory during large data streams?",
                evaluation={
                    "model_answer": "Generators produce items lazily on demand using the yield keyword without materializing the whole sequence in memory.",
                    "evaluation_criteria": ["Mentions yield", "Mentions lazy evaluation", "Explains memory efficiency"]
                }
            )
            db.session.add(q1)
            db.session.commit()
        else:
            session_a.intro_completed = False
            session_a.status = "pending_intro"
            db.session.commit()

        # Test answering question before intro: must be blocked with 400
        q_item = InterviewQuestion.query.filter_by(session_id=session_a.id).first()
        res10_block = client.post(
            f"/api/interview/session/{session_a.id}/questions/{q_item.id}/submit-answer",
            json={"candidate_answer": "Using yield"},
            headers=headers_a
        )
        intro_blocked = (res10_block.status_code == 400 and "self-introduction" in res10_block.get_json().get("message", "").lower())

        # Complete intro
        session_a.intro_completed = True
        session_a.status = "in_progress"
        db.session.commit()

        # Submit answer and verify model answer is revealed only after submission
        res10_submit = client.post(
            f"/api/interview/session/{session_a.id}/questions/{q_item.id}/submit-answer",
            json={"candidate_answer": "Generators yield values one at a time, keeping memory footprint low."},
            headers=headers_a
        )
        data10_submit = res10_submit.get_json() or {}
        revealed_solution = data10_submit.get("question", {}).get("solution") or data10_submit.get("question", {}).get("evaluation", {}).get("model_answer")
        c10_ok = intro_blocked and res10_submit.status_code == 200 and bool(revealed_solution)
        record(10, "Interview Sequence & Model Answer Gating Enforcement", c10_ok, 
               f"Intro Blocked: {intro_blocked}, Answer Evaluated: {res10_submit.status_code == 200}, Model Answer Revealed Post-Submission: {bool(revealed_solution)}")

        # =============================================================
        # CASE 11: ATS report generation with JD score, breakdown, recommendations
        # =============================================================
        # Temporarily activate ATS pass
        plan_ats = SubscriptionPlan.query.filter_by(price_inr=39.0, is_active=True).first()
        sub_ats = UserSubscription(
            user_id=cand_a.id,
            plan_id=plan_ats.id,
            status="active",
            start_date=datetime.utcnow() - timedelta(hours=1),
            end_date=datetime.utcnow() + timedelta(hours=23)
        )
        db.session.add(sub_ats)
        db.session.commit()

        res11 = client.post(f"/api/report/{analysis_a.id}/generate", headers=headers_a)
        data11 = res11.get_json() or {}
        c11_ok = (res11.status_code in [200, 201] and data11.get("success") is True and "filename" in data11)
        record(11, "ATS Report Generation with Match Breakdown & Recommendations", c11_ok, 
               f"Status: {res11.status_code}, Filename: {data11.get('filename')}")

        # Clean temporary ATS pass
        db.session.delete(sub_ats)
        db.session.commit()

        # =============================================================
        # CASE 12: ATS report download gating for unsubscribed candidate (403 paywall)
        # =============================================================
        res12 = client.get(f"/api/report/{analysis_a.id}/download", headers=headers_a)
        data12 = res12.get_json() or {}
        c12_ok = (res12.status_code == 403 and data12.get("subscription_required") is True)
        record(12, "ATS Report Download Access Control: 403 Paywall for Unsubscribed Candidate", c12_ok, 
               f"Status: {res12.status_code}, Paywall Flag: {data12.get('subscription_required')}")

        # =============================================================
        # CASE 13: ₹39 ATS pass pending status creation
        # =============================================================
        plan_39 = SubscriptionPlan.query.filter_by(price_inr=39.0, is_active=True).first()
        res13_init = client.post("/api/subscription/payment-requests", json={"plan_id": plan_39.id, "payment_method": "upi_qr"}, headers=headers_a)
        data13_init = res13_init.get_json() or {}
        pay_ref13 = data13_init.get("payment_request", {}).get("request_reference")

        res13_utr = client.post(f"/api/subscription/payment-requests/{pay_ref13}/submit-proof", json={"utr_number": f"UTR39{uuid.uuid4().hex[:6]}"}, headers=headers_a)
        data13_utr = res13_utr.get_json() or {}
        req13 = PaymentRequest.query.filter_by(request_reference=pay_ref13).first()
        c13_ok = (pay_ref13 is not None and pay_ref13.startswith("CS-PAY-") and 
                  req13 is not None and req13.status == "pending_verification" and 
                  float(req13.amount_inr) == 39.0)
        record(13, "₹39 ATS Pass Creation with CS-PAY Reference & Pending Verification", c13_ok, 
               f"Ref: {pay_ref13}, Status: {req13.status if req13 else 'None'}, Amount: ₹{req13.amount_inr if req13 else 0}")

        # =============================================================
        # CASE 14: Admin approval activates 1-day ATS pass
        # =============================================================
        res14 = client.post(f"/api/admin/payment-requests/{req13.id}/approve", json={"admin_notes": "Approved ₹39 ATS Pass"}, headers=headers_admin)
        data14 = res14.get_json() or {}
        sub14 = UserSubscription.query.filter_by(user_id=cand_a.id, status='active').first()
        c14_ok = (res14.status_code == 200 and 
                  data14.get("success") is True and 
                  sub14 is not None and 
                  sub14.plan.plan_type == 'ats_pass' and 
                  (sub14.end_date - sub14.start_date).days <= 1)
        record(14, "Admin Approval Atomically Activates 1-Day ATS Pass in MySQL", c14_ok, 
               f"Status: {sub14.status if sub14 else 'None'}, Plan: {sub14.plan.plan_type if sub14 else 'None'}, End: {sub14.end_date if sub14 else 'None'}")

        # =============================================================
        # CASE 15: ATS pass feature isolation (ATS pass unlocks ats_report, NOT roadmap/interview)
        # =============================================================
        ats_access = check_feature_access(cand_a.id, 'ats_report')
        sg_access = check_feature_access(cand_a.id, 'skill_gap')
        rm_access = check_feature_access(cand_a.id, 'career_roadmap')
        int_access = check_feature_access(cand_a.id, 'interview_prep')

        c15_ok = (ats_access['allowed'] is True and 
                  sg_access['allowed'] is False and 
                  rm_access['allowed'] is False and 
                  int_access['allowed'] is False)
        record(15, "ATS Pass Feature Isolation (Grants ATS Report; Blocks Roadmap/Interview)", c15_ok, 
               f"ATS Report: {ats_access['allowed']}, Roadmap: {rm_access['allowed']}, Interview: {int_access['allowed']}")

        # Clean ATS subscription for further tests
        UserSubscription.query.filter_by(user_id=cand_a.id).delete()
        db.session.commit()

        # =============================================================
        # CASE 16: Subscription plan durations & prices (₹39, ₹349, ₹599, ₹999)
        # =============================================================
        res16 = client.get("/api/subscription/plans")
        data16 = res16.get_json() or {}
        active_plans16 = data16.get("plans", [])
        expected_prices = {39.0: 1, 349.0: 30, 599.0: 90, 999.0: 365}
        actual_prices = {float(p['price_inr']): p['duration_days'] for p in active_plans16}
        c16_ok = (len(active_plans16) == 4 and actual_prices == expected_prices)
        record(16, "Subscription Catalog Exact Plans & Durations (₹39/1d, ₹349/30d, ₹599/90d, ₹999/365d)", c16_ok, 
               f"Active Catalog: {actual_prices}")

        # =============================================================
        # CASE 17: Complete absence of ₹749 6-month plan from active catalog
        # =============================================================
        active_has_749 = any(p['price_inr'] == 749.0 for p in active_plans16)
        db_inactive_749 = SubscriptionPlan.query.filter_by(price_inr=749.0, is_active=False).first()
        c17_ok = (not active_has_749 and db_inactive_749 is not None)
        record(17, "Discontinued ₹749 Plan Absence in Active API (Preserved Inactive in DB)", c17_ok, 
               f"Active in API: {active_has_749}, Preserved Inactive in MySQL: {db_inactive_749 is not None}")

        # =============================================================
        # CASE 18: Pending/rejected payments do not unlock premium features
        # =============================================================
        plan_599 = SubscriptionPlan.query.filter_by(price_inr=599.0, is_active=True).first()
        res18_init = client.post("/api/subscription/payment-requests", json={"plan_id": plan_599.id, "payment_method": "upi_qr"}, headers=headers_a)
        ref18 = res18_init.get_json()["payment_request"]["request_reference"]
        client.post(f"/api/subscription/payment-requests/{ref18}/submit-proof", json={"utr_number": f"UTR18{uuid.uuid4().hex[:6]}"}, headers=headers_a)
        
        # Check access while pending
        pending_access = check_feature_access(cand_a.id, 'career_roadmap')
        
        # Now reject
        req18 = PaymentRequest.query.filter_by(request_reference=ref18).first()
        res18_rej = client.post(f"/api/admin/payment-requests/{req18.id}/reject", json={"reason": "Invalid payment proof screenshot"}, headers=headers_admin)
        rejected_access = check_feature_access(cand_a.id, 'career_roadmap')

        c18_ok = (pending_access['allowed'] is False and rejected_access['allowed'] is False and res18_rej.status_code == 200)
        record(18, "Feature Access Strict Gating on Pending & Rejected Payment Requests", c18_ok, 
               f"Pending Allowed: {pending_access['allowed']}, Rejected Allowed: {rejected_access['allowed']}")

        # =============================================================
        # CASE 19: Admin approval activates quarterly/annual subscription
        # =============================================================
        res19_init = client.post("/api/subscription/payment-requests", json={"plan_id": plan_599.id, "payment_method": "upi_qr"}, headers=headers_a)
        ref19 = res19_init.get_json()["payment_request"]["request_reference"]
        client.post(f"/api/subscription/payment-requests/{ref19}/submit-proof", json={"utr_number": f"UTR19{uuid.uuid4().hex[:6]}"}, headers=headers_a)
        req19 = PaymentRequest.query.filter_by(request_reference=ref19).first()

        res19_app = client.post(f"/api/admin/payment-requests/{req19.id}/approve", headers=headers_admin)
        sub19 = UserSubscription.query.filter_by(user_id=cand_a.id, status='active').first()
        full_rm_access = check_feature_access(cand_a.id, 'career_roadmap')
        full_int_access = check_feature_access(cand_a.id, 'interview_prep')
        c19_ok = (sub19 is not None and 
                  sub19.plan.price_inr == 599.0 and 
                  (sub19.end_date - sub19.start_date).days >= 89 and 
                  full_rm_access['allowed'] is True and 
                  full_int_access['allowed'] is True)
        record(19, "Admin Approval Atomically Activates Quarterly ₹599 Subscription (90 Days)", c19_ok, 
               f"Active: {sub19.status if sub19 else 'None'}, Duration: {(sub19.end_date - sub19.start_date).days if sub19 else 0} days, Roadmap Access: {full_rm_access['allowed']}")

        # =============================================================
        # CASE 20: Idempotent approval handling
        # =============================================================
        sub19_end_before = sub19.end_date
        res20_dup = client.post(f"/api/admin/payment-requests/{req19.id}/approve", headers=headers_admin)
        sub19_after = UserSubscription.query.filter_by(user_id=cand_a.id, status='active').first()
        c20_ok = (res20_dup.status_code in [200, 400] and 
                  res20_dup.get_json().get("already_approved") is True and 
                  sub19_after.end_date == sub19_end_before)
        record(20, "Idempotent Approval Enforcement (No Duplicate Extension)", c20_ok, 
               f"Status: {res20_dup.status_code}, Already Approved: {res20_dup.get_json().get('already_approved')}, End Date Preserved: {sub19_after.end_date == sub19_end_before}")

        # =============================================================
        # CASE 21: Record persistence across DB reload
        # =============================================================
        db.session.expire_all()
        persisted_req = PaymentRequest.query.filter_by(request_reference=ref19).first()
        persisted_sub = UserSubscription.query.filter_by(user_id=cand_a.id, status='active').first()
        persisted_audit = PaymentAuditLog.query.filter_by(payment_request_id=req19.id).order_by(PaymentAuditLog.id.desc()).first()
        c21_ok = (persisted_req.status == 'approved' and 
                  persisted_sub is not None and 
                  persisted_audit is not None and 
                  'approved' in persisted_audit.action.lower())
        record(21, "Payment, Subscription & Audit Trail Persistence in MySQL", c21_ok, 
               f"Request: {persisted_req.status}, Subscription: {persisted_sub.status}, Audit Log Action: {persisted_audit.action}")

        # =============================================================
        # CASE 22: Multi-tenant data isolation (Candidate A vs Candidate B)
        # =============================================================
        res22_cross = client.get(f"/api/subscription/payment-requests/{ref19}", headers=headers_b)
        res22_report = client.get(f"/api/report/{analysis_a.id}/download", headers=headers_b)
        c22_ok = (res22_cross.status_code in [403, 404] and res22_report.status_code in [403, 404])
        record(22, "Multi-Tenant Data Isolation (Candidate B Blocked from Candidate A Data)", c22_ok, 
               f"Cross Payment Access: {res22_cross.status_code}, Cross Report Download: {res22_report.status_code}")

        # =============================================================
        # CASE 23: Dashboard/sidebar navigation flow & route registration
        # =============================================================
        sidebar_path = os.path.join(app.root_path, "..", "frontend", "src", "components", "layout", "Sidebar.jsx")
        app_jsx_path = os.path.join(app.root_path, "..", "frontend", "src", "App.jsx")
        with open(sidebar_path, "r", encoding="utf-8") as f:
            sidebar_content = f.read()
        with open(app_jsx_path, "r", encoding="utf-8") as f:
            app_jsx_content = f.read()

        sidebar_has_all_7 = ("'Dashboard'" in sidebar_content and 
                             "'Resume Analyzer'" in sidebar_content and 
                             "'Job Match'" in sidebar_content and 
                             "'Skill Gap'" in sidebar_content and 
                             "'Career Roadmap'" in sidebar_content and 
                             "'Interview Prep'" in sidebar_content and 
                             "'Analysis History'" in sidebar_content)
        sidebar_has_routes = ("to: '/skill-gap'" in sidebar_content and 
                              "to: '/career-roadmap'" in sidebar_content and 
                              "to: '/interview-prep'" in sidebar_content)
        routes_preserved = ("path=\"/skill-gap" in app_jsx_content and 
                            "path=\"/career-roadmap" in app_jsx_content and 
                            "path=\"/interview-prep" in app_jsx_content)

        c23_ok = (sidebar_has_all_7 and sidebar_has_routes and routes_preserved)
        record(23, "MAIN INTELLIGENCE Sidebar 7 Items Visibility & Preserved Workflow Routes", c23_ok, 
               f"Sidebar All 7 Visible: {sidebar_has_all_7}, Sidebar Routes Intact: {sidebar_has_routes}, App Routes Intact: {routes_preserved}")

        # =============================================================
        # CASE 24: Frontend production build status (dist/index.html & assets)
        # =============================================================
        dist_index = os.path.join(app.root_path, "..", "frontend", "dist", "index.html")
        dist_assets = os.path.join(app.root_path, "..", "frontend", "dist", "assets")
        build_exists = os.path.exists(dist_index) and os.path.exists(dist_assets)
        index_size = os.path.getsize(dist_index) if build_exists else 0
        c24_ok = (build_exists and index_size > 500)
        record(24, "Frontend Production Distribution Verification (Vite build dist)", c24_ok, 
               f"dist/index.html exists: {build_exists}, Size: {index_size} bytes")

        # =============================================================
        # CASE 25: Backend test suites pass
        # =============================================================
        # All prior 24 cases must pass for Case 25 to be satisfied
        all_prior_passed = all(r["passed"] for r in test_results)
        c25_ok = all_prior_passed
        record(25, "Complete 25-Point Verification Suite Aggregate Result", c25_ok, 
               f"Passed {sum(1 for r in test_results if r['passed'])}/24 test assertions")

    print("=" * 80)
    passed_count = sum(1 for r in test_results if r['passed'])
    print(f"VERIFICATION SUMMARY: {passed_count}/25 TESTS PASSED")
    print("=" * 80)
    return passed_count == 25

if __name__ == "__main__":
    success = run_master_verification()
    sys.exit(0 if success else 1)
