"""
Dashboard API Routes
Returns verified real-time summary statistics for the authenticated candidate.
Every value below is derived from actual MySQL records for this user.
CareerSense AI - Final Year Engineering Project
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import decode_token
from extensions import db
from models.user import User
from models.resume import Resume
from models.job_description import JobDescription
from models.analysis import Analysis
from models.skill import AnalysisSkill, SkillGap
from models.roadmap import Roadmap
from models.resume_intelligence import ResumeAnalysis, ResumeSkill, ResumeSection
from models.interview import InterviewSession
from models.payment_request import PaymentRequest

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
def get_dashboard_summary():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split('Bearer ')[1].strip()
    try:
        decoded = decode_token(token)
        user_id = int(decoded.get('sub'))
    except Exception:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # ------------------------------------------------------------------
    # Real records for this user
    # ------------------------------------------------------------------
    user_resumes = db.session.query(Resume).filter_by(user_id=user_id).order_by(Resume.uploaded_at.desc()).all()
    user_jobs = db.session.query(JobDescription).filter_by(user_id=user_id).order_by(JobDescription.created_at.desc()).all()

    latest_resume_analysis = db.session.query(ResumeAnalysis)\
        .filter_by(user_id=user_id)\
        .order_by(ResumeAnalysis.analyzed_at.desc())\
        .first()

    education_summary = None
    if latest_resume_analysis:
        edu_sec = db.session.query(ResumeSection).filter(
            ResumeSection.resume_id == latest_resume_analysis.resume_id,
            ResumeSection.section_name.ilike('%education%')
        ).first()
        if edu_sec and edu_sec.section_content:
            first_line = edu_sec.section_content.strip().split('\n')[0].strip()
            if first_line:
                education_summary = first_line[:80]

    resume_quality_score = round(latest_resume_analysis.quality_score, 1) if latest_resume_analysis else None
    detected_skills_count = latest_resume_analysis.total_skills_detected if latest_resume_analysis else 0

    latest_analysis = db.session.query(Analysis)\
        .filter_by(user_id=user_id)\
        .order_by(Analysis.created_at.desc())\
        .first()

    user_analyses = db.session.query(Analysis)\
        .filter_by(user_id=user_id)\
        .order_by(Analysis.created_at.desc())\
        .limit(5)\
        .all()

    analyses_count = db.session.query(Analysis).filter_by(user_id=user_id).count()

    latest_roadmap = db.session.query(Roadmap)\
        .filter_by(user_id=user_id)\
        .order_by(Roadmap.created_at.desc())\
        .first()

    # ------------------------------------------------------------------
    # Skill intelligence — extracted (from resume) vs suggested (to learn)
    # ------------------------------------------------------------------
    extracted_skills = []
    if latest_resume_analysis:
        resume_skill_rows = db.session.query(ResumeSkill)\
            .filter_by(resume_id=latest_resume_analysis.resume_id)\
            .order_by(ResumeSkill.category.asc(), ResumeSkill.skill_name.asc())\
            .all()
        extracted_skills = [
            {
                'skill_name': s.skill_name,
                'category': s.category,
                'confidence': round(s.confidence, 2) if s.confidence is not None else None,
                'source': 'extracted'
            }
            for s in resume_skill_rows
        ]

    matched_skills = []
    partial_skills = []
    missing_skills = []
    suggested_skills = []
    skill_gaps = []
    skill_summary = {
        'total_required': 0,
        'matched': 0,
        'partial': 0,
        'missing': 0,
        'high_priority_gaps': 0,
    }

    if latest_analysis:
        analysis_skills = db.session.query(AnalysisSkill).filter_by(analysis_id=latest_analysis.id).all()
        skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=latest_analysis.id).all()

        matched_skills = [s.to_dict() for s in analysis_skills if s.match_status == 'matched']
        partial_skills = [s.to_dict() for s in analysis_skills if s.match_status == 'partial']
        missing_skills = [s.to_dict() for s in analysis_skills if s.match_status == 'missing']

        suggested_skills = [
            {
                'skill_name': s.skill_name,
                'category': s.category,
                'match_status': s.match_status,
                'is_required': s.is_required,
                'recommended_improvement': s.recommended_improvement,
                'source': 'suggested'
            }
            for s in analysis_skills if s.match_status in ('missing', 'partial')
        ]

        skill_summary = {
            'total_required': len(analysis_skills),
            'matched': len(matched_skills),
            'partial': len(partial_skills),
            'missing': len(missing_skills),
            'high_priority_gaps': sum(1 for g in skill_gaps if g.priority == 'HIGH'),
        }

    # ------------------------------------------------------------------
    # Roadmap summary — derived from real roadmap items + daily tasks
    # ------------------------------------------------------------------
    roadmap_summary = None
    roadmap_progress_display = 0
    if latest_roadmap:
        items = latest_roadmap.items or []
        completed_items = [i for i in items if i.status == 'Completed']
        in_progress_items = [i for i in items if i.status == 'In Progress']
        current_item = in_progress_items[0] if in_progress_items else next(
            (i for i in items if i.status != 'Completed'), None
        )

        tasks_total = 0
        tasks_completed = 0
        next_task = None
        for it in items:
            item_tasks = it.tasks if isinstance(it.tasks, list) else []
            for t in item_tasks:
                if not isinstance(t, dict):
                    continue
                tasks_total += 1
                if t.get('is_completed'):
                    tasks_completed += 1
                elif next_task is None and it.status != 'Completed':
                    next_task = {
                        'title': t.get('title') or t.get('task_title') or 'Study task',
                        'phase_number': it.phase_number,
                        'skill_name': it.skill_name,
                    }

        # Never claim 100% unless every phase is genuinely completed.
        roadmap_progress_display = (
            100 if items and len(completed_items) == len(items)
            else min(latest_roadmap.overall_progress or 0, 99)
        )

        roadmap_summary = {
            'total_phases': len(items),
            'completed_phases': len(completed_items),
            'current_phase': current_item.phase_number if current_item else None,
            'current_phase_skill': current_item.skill_name if current_item else None,
            'current_phase_progress': current_item.progress if current_item else None,
            'tasks_total': tasks_total,
            'tasks_completed': tasks_completed,
            'next_task': next_task,
            'total_duration_weeks': latest_roadmap.total_duration_weeks,
        }

    if latest_analysis:
        career_readiness_score = latest_analysis.match_score
        status_label = "Analyzed"
        has_analysis = True
    else:
        career_readiness_score = None
        status_label = "Not Analyzed"
        has_analysis = False

    # ------------------------------------------------------------------
    # Recent activity — real events only, newest first
    # ------------------------------------------------------------------
    activities = []

    for r in user_resumes[:3]:
        if r.uploaded_at:
            activities.append({
                "title": f"Resume uploaded: {r.filename}",
                "description": "Document stored and queued for text extraction.",
                "type": "upload",
                "timestamp": r.uploaded_at.isoformat()
            })

    if latest_resume_analysis and latest_resume_analysis.analyzed_at:
        activities.append({
            "title": "Resume intelligence analysis completed",
            "description": f"Quality score {round(latest_resume_analysis.quality_score, 1)}/100 with "
                           f"{latest_resume_analysis.total_skills_detected} skills detected across "
                           f"{latest_resume_analysis.sections_detected_count} sections.",
            "type": "analysis",
            "timestamp": latest_resume_analysis.analyzed_at.isoformat()
        })

    for a in user_analyses:
        if a.created_at:
            activities.append({
                "title": f"Job match completed against {a.target_role}",
                "description": f"Match score {round(a.match_score, 1)}% — "
                               f"{a.matched_skills_count or 0} matched, {a.missing_skills_count or 0} missing skills.",
                "type": "analysis",
                "timestamp": a.created_at.isoformat()
            })

    if latest_roadmap and latest_roadmap.created_at:
        activities.append({
            "title": f"Career roadmap generated for {latest_roadmap.target_role}",
            "description": f"{len(latest_roadmap.items or [])} learning phases sequenced over "
                           f"{latest_roadmap.total_duration_weeks} weeks.",
            "type": "roadmap",
            "timestamp": latest_roadmap.created_at.isoformat()
        })

    interview_sessions = db.session.query(InterviewSession)\
        .filter_by(user_id=user_id)\
        .order_by(InterviewSession.updated_at.desc())\
        .limit(3)\
        .all()
    for s in interview_sessions:
        ts = s.updated_at or s.created_at
        if not ts:
            continue
        if s.status == 'completed':
            activities.append({
                "title": f"Mock interview completed for {s.target_role}",
                "description": f"Overall score {round(s.overall_score, 1)}/100 across "
                               f"{len(s.questions or [])} questions."
                if s.overall_score is not None
                else f"{len(s.questions or [])} questions answered and evaluated.",
                "type": "interview",
                "timestamp": ts.isoformat()
            })
        elif s.status == 'in_progress':
            activities.append({
                "title": f"Mock interview in progress for {s.target_role}",
                "description": "Session started — complete all questions to receive an evaluation.",
                "type": "interview",
                "timestamp": ts.isoformat()
            })

    payment_requests = db.session.query(PaymentRequest)\
        .filter_by(user_id=user_id)\
        .order_by(PaymentRequest.created_at.desc())\
        .limit(3)\
        .all()
    for pr in payment_requests:
        if pr.approved_at and pr.plan:
            activities.append({
                "title": f"Payment approved — {pr.plan.plan_name} activated",
                "description": f"₹{int(pr.amount_inr)} verified by the administration team.",
                "type": "payment",
                "timestamp": pr.approved_at.isoformat()
            })
        elif pr.status == 'pending_verification':
            activities.append({
                "title": f"Payment submitted for {pr.plan.plan_name if pr.plan else 'a plan'}",
                "description": "Awaiting admin verification — access unlocks automatically once approved.",
                "type": "payment",
                "timestamp": (pr.updated_at or pr.created_at).isoformat() if (pr.updated_at or pr.created_at) else None
            })

    activities = [a for a in activities if a.get("timestamp")]
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    activities = activities[:8]

    return jsonify({
        "success": True,
        "has_analysis": has_analysis,
        "metrics": {
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "career_target": latest_analysis.target_role if latest_analysis else None,
            "resume_quality_score": resume_quality_score,
            "job_match_score": latest_analysis.match_score if latest_analysis else None,
            "latest_job_match": latest_analysis.match_score if latest_analysis else None,
            "career_readiness_score": career_readiness_score,
            "skills_detected_count": detected_skills_count,
            "matched_skills_count": len(matched_skills),
            "missing_skills_count": len(skill_gaps),
            "roadmap_progress": roadmap_progress_display,
            "tasks_completed": roadmap_summary.get('tasks_completed', 0) if roadmap_summary else 0,
            "tasks_total": roadmap_summary.get('tasks_total', 0) if roadmap_summary else 0,
            "analyses_count": analyses_count,
            "resumes_count": len(user_resumes),
            "jobs_count": len(user_jobs),
            "status": status_label,
            "latest_target_role": latest_analysis.target_role if latest_analysis else None,
            "latest_analysis_id": latest_analysis.id if latest_analysis else None,
            "education": education_summary
        },
        "latest_resume_analysis": latest_resume_analysis.to_dict() if latest_resume_analysis else None,
        "resumes": [r.to_dict() for r in user_resumes],
        "matches": [a.to_dict() for a in user_analyses],
        "skills": extracted_skills,
        "suggested_skills": suggested_skills,
        "skill_gaps": [g.to_dict() for g in skill_gaps],
        "skill_summary": skill_summary,
        "roadmap": latest_roadmap.to_dict() if latest_roadmap else None,
        "roadmap_summary": roadmap_summary,
        "activities": activities
    }), 200
