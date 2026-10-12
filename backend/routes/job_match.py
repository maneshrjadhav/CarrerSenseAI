"""
Resume & Job Match Intelligence Routes
Handles JD intake, NLP matching, skill gap prioritization, roadmap synthesis,
re-analysis tracking, and ReportLab PDF career reports.
CareerSense AI - Final Year Engineering Project Phase 2
"""

import os
from sqlalchemy import func
from flask import Blueprint, request, jsonify, current_app, send_file
from extensions import db
from models import (
    User, Resume, JobDescription, Analysis, AnalysisSkill,
    SkillGap, Roadmap, RoadmapItem, Report
)
from utils.auth_helper import token_required, get_authenticated_user_id
from services.matching_service import perform_comprehensive_match
from services.roadmap_generator import generate_personalized_roadmap, generate_daily_tasks, SKILL_CURRICULUM
from services.resume_parser import extract_candidate_metadata
from services.report_service import generate_pdf_report
from services.readiness_service import evaluate_interview_readiness
from services.subscription_service import check_feature_access, get_user_active_subscription, subscription_required
from models.subscription import SubscriptionPlan

job_match_bp = Blueprint('job_match', __name__)

def build_full_analysis_dict(analysis_id: int) -> dict:
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis:
        return None

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=analysis_id).all()
    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
    roadmap = db.session.query(Roadmap).filter_by(analysis_id=analysis_id).first()
    jd = db.session.query(JobDescription).filter_by(id=analysis.job_description_id).first()

    data = analysis.to_dict()
    data['company_name'] = jd.company_name if jd else None
    data['job_description_text'] = jd.description if jd else ""
    data['skills'] = [s.to_dict() for s in skills]
    data['skill_gaps'] = [g.to_dict() for g in skill_gaps]
    data['roadmap'] = roadmap.to_dict() if roadmap else None
    return data

# 1. Create Job Description
@job_match_bp.route('/job-description', methods=['POST'])
@token_required
def create_job_description(current_user):
    data = request.get_json(silent=True) or {}
    job_title = (data.get('target_role') or data.get('job_title') or '').strip()
    company_name = (data.get('company_name') or data.get('company') or '').strip() or None
    description = (data.get('job_description') or data.get('description') or '').strip()

    if not job_title:
        return jsonify({"success": False, "message": "Target job role is required."}), 400
    if not description or len(description) < 100:
        return jsonify({
            "success": False,
            "message": "Please enter a complete job description for accurate analysis (minimum 100 characters)."
        }), 400

    jd = JobDescription(
        user_id=current_user.id,
        job_title=job_title,
        company_name=company_name,
        description=description
    )
    db.session.add(jd)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Job description saved successfully.",
        "job_id": jd.id,
        "job_description": jd.to_dict()
    }), 201

# 2. Run Job Match Analysis
@job_match_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_job_match(current_user):
    data = request.get_json(silent=True) or {}

    resume_id = data.get('resume_id')
    target_role = (data.get('target_role') or '').strip()
    job_description_text = (data.get('job_description') or data.get('jd_text') or '').strip()
    company_name = (data.get('company_name') or data.get('company') or '').strip() or None

    # If no resume_id passed, fallback to user's latest uploaded resume
    if not resume_id:
        latest_res = db.session.query(Resume).filter_by(user_id=current_user.id).order_by(Resume.uploaded_at.desc()).first()
        if latest_res:
            resume_id = latest_res.id
        else:
            return jsonify({
                "success": False,
                "message": "Please upload a resume PDF first."
            }), 400

    if not target_role:
        return jsonify({
            "success": False,
            "message": "Target Job Role is required."
        }), 400

    if not job_description_text or len(job_description_text) < 100:
        return jsonify({
            "success": False,
            "message": "Please enter a complete job description for accurate analysis (minimum 100 characters)."
        }), 400

    # Verify resume ownership
    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume:
        return jsonify({"success": False, "message": "Resume record not found."}), 404
    if resume.user_id != current_user.id:
        return jsonify({"success": False, "message": "Access denied: You do not have permission for this resume."}), 403

    resume_text = resume.extracted_text or ""
    if not resume_text.strip():
        return jsonify({
            "success": False,
            "message": "No readable text found in this resume. Please upload a readable text PDF resume."
        }), 422

    try:
        # Save JobDescription in MySQL
        jd = JobDescription(
            user_id=current_user.id,
            job_title=target_role,
            company_name=company_name,
            description=job_description_text
        )
        db.session.add(jd)
        db.session.flush()

        # Execute NLP matching, TF-IDF cosine similarity, skill taxonomy normalization
        match_result = perform_comprehensive_match(
            resume_text=resume_text,
            jd_text=job_description_text,
            target_role=target_role
        )
        metrics = match_result['metrics']

        # Candidate profile metadata
        cand_meta = extract_candidate_metadata(resume_text)
        cand_name = cand_meta.get('candidate_name') or current_user.full_name
        cand_email = cand_meta.get('email') or current_user.email
        cand_phone = cand_meta.get('phone') or current_user.phone

        # Create Analysis record in MySQL
        analysis = Analysis(
            user_id=current_user.id,
            resume_id=resume.id,
            job_description_id=jd.id,
            target_role=target_role,
            match_score=metrics['overall_match_score'],
            skill_coverage=metrics['skill_coverage'],
            semantic_similarity=metrics['semantic_similarity'],
            candidate_name=cand_name,
            candidate_email=cand_email,
            candidate_phone=cand_phone,
            total_required_skills=metrics['total_required_skills'],
            matched_skills_count=metrics['matched_skills_count'],
            missing_skills_count=metrics['missing_skills_count'],
            partial_skills_count=metrics['partial_skills_count'],
            status='completed'
        )
        db.session.add(analysis)
        db.session.flush()

        # Save AnalysisSkills in MySQL
        for s in match_result['matched_skills']:
            db.session.add(AnalysisSkill(
                analysis_id=analysis.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='matched',
                is_required=s['is_required'],
                confidence=s['confidence'],
                evidence_text=s.get('evidence_text'),
                recommended_improvement=None
            ))
        for s in match_result['missing_skills']:
            db.session.add(AnalysisSkill(
                analysis_id=analysis.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='missing',
                is_required=s['is_required'],
                confidence=s['confidence'],
                evidence_text=None,
                recommended_improvement=s.get('recommendation')
            ))
        for s in match_result['partial_matches']:
            db.session.add(AnalysisSkill(
                analysis_id=analysis.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='partial',
                is_required=s.get('is_required', True),
                confidence=s.get('confidence', 0.85),
                evidence_text=s.get('evidence_text'),
                recommended_improvement=s.get('recommendation') or s.get('recommended_improvement')
            ))
        for s in match_result['extra_skills']:
            db.session.add(AnalysisSkill(
                analysis_id=analysis.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='extra',
                is_required=False,
                confidence=s['confidence'],
                evidence_text=s.get('evidence_text')
            ))

        # Save SkillGap records with prioritized recommendations in MySQL
        for g in match_result['skill_gaps']:
            db.session.add(SkillGap(
                analysis_id=analysis.id,
                skill_name=g['skill_name'],
                priority=g['priority'],
                reason=g['reason'],
                recommendation=g.get('recommendation'),
                estimated_learning_duration=g['estimated_learning_duration'],
                category=g['category']
            ))

        # Synthesize personalized Roadmap targeting ONLY missing and partial skills
        roadmap_data = generate_personalized_roadmap(
            missing_skills=match_result['skill_gaps'],
            target_role=target_role,
            duration_weeks=8,
            daily_study_hours=1.0,
            study_days_per_week=5,
            learning_style='balanced',
            partial_skills=match_result.get('partial_matches', [])
        )
        roadmap = Roadmap(
            analysis_id=analysis.id,
            user_id=current_user.id,
            target_role=target_role,
            total_duration_weeks=roadmap_data['total_duration_weeks'],
            daily_study_hours=roadmap_data.get('daily_study_hours', 1.0),
            study_days_per_week=roadmap_data.get('study_days_per_week', 5),
            learning_style=roadmap_data.get('learning_style', 'balanced'),
            total_learning_hours=roadmap_data.get('total_learning_hours', 40.0),
            overall_progress=0
        )
        db.session.add(roadmap)
        db.session.flush()

        for item in roadmap_data['items']:
            db.session.add(RoadmapItem(
                roadmap_id=roadmap.id,
                phase_number=item['phase_number'],
                skill_name=item['skill_name'],
                title=item['title'],
                duration_weeks=item['duration_weeks'],
                priority=item['priority'],
                topics=item['topics'],
                practice_project=item['practice_project'],
                expected_outcome=item.get('expected_outcome'),
                tasks=item.get('tasks', []),
                resource_categories=item.get('resource_categories', []),
                status='Not Started',
                progress=0,
                order_index=item['order_index']
            ))

        resume.status = 'analyzed'
        db.session.commit()

        threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
        max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)
        readiness = evaluate_interview_readiness(analysis, match_result['skill_gaps'], threshold, max_critical)

        return jsonify({
            "success": True,
            "message": "Job match analysis completed successfully.",
            "match_id": analysis.id,
            "analysis_id": analysis.id,
            "analysis": analysis.to_dict(),
            "target_role": target_role,
            "company_name": company_name,
            "metrics": metrics,
            "matched_skills": match_result['matched_skills'],
            "missing_skills": match_result['missing_skills'],
            "partial_matches": match_result['partial_matches'],
            "extra_skills": match_result['extra_skills'],
            "skill_gaps": match_result['skill_gaps'],
            "roadmap": roadmap.to_dict(),
            "interview_readiness": readiness
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Job match analysis failed: {str(e)}"
        }), 500

# 3. Get Match Result
@job_match_bp.route('/<int:match_id>', methods=['GET'])
@token_required
def get_job_match(current_user, match_id):
    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis:
        return jsonify({"success": False, "message": "Job match record not found."}), 404
    if analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot access another candidate's match."}), 403

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=match_id).all()
    roadmap = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()
    jd = db.session.query(JobDescription).filter_by(id=analysis.job_description_id).first()
    resume = db.session.query(Resume).filter_by(id=analysis.resume_id).first()

    matched = [s.to_dict() for s in skills if s.match_status == 'matched']
    missing = [s.to_dict() for s in skills if s.match_status == 'missing']
    partial = [s.to_dict() for s in skills if s.match_status == 'partial']
    extra = [s.to_dict() for s in skills if s.match_status == 'extra']

    gap_list = [g.to_dict() for g in skill_gaps]
    existing_gap_names = {g['skill_name'].lower() for g in gap_list}

    # Synthesize missing gaps if table had no records
    for m in missing:
        m_name = m['skill_name']
        if m_name.lower() not in existing_gap_names:
            gap_item = {
                "id": m.get('id'),
                "analysis_id": analysis.id,
                "skill_name": m_name,
                "category": m.get('category', 'Technical'),
                "priority": 'HIGH',
                "estimated_days": 14,
                "recommendation": f"Dedicate focused study to build production proficiency in {m_name}.",
                "learning_resources": [
                    f"Official {m_name} Docs",
                    f"Interactive {m_name} Projects"
                ]
            }
            gap_list.append(gap_item)
            existing_gap_names.add(m_name.lower())

    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    sorted_gaps = sorted(gap_list, key=lambda x: priority_order.get(x.get('priority'), 3))

    threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
    max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)
    readiness = evaluate_interview_readiness(analysis, sorted_gaps, threshold, max_critical)

    return jsonify({
        "success": True,
        "match_id": analysis.id,
        "analysis_id": analysis.id,
        "analysis": analysis.to_dict(),
        "target_role": analysis.target_role,
        "company_name": jd.company_name if jd else None,
        "resume": {
            "id": resume.id if resume else None,
            "filename": resume.filename if resume else "Resume.pdf"
        },
        "has_subscription": bool(get_user_active_subscription(current_user.id)),
        "subscription": get_user_active_subscription(current_user.id).to_dict() if get_user_active_subscription(current_user.id) else None,
        "metrics": {
            "overall_match_score": analysis.match_score,
            "skill_coverage": analysis.skill_coverage,
            "semantic_similarity": analysis.semantic_similarity,
            "total_required_skills": analysis.total_required_skills,
            "matched_skills_count": len(matched),
            "missing_skills_count": len(missing),
            "partial_skills_count": len(partial),
            "extra_skills_count": len(extra)
        },
        "matched_skills": matched,
        "missing_skills": missing,
        "partial_matches": partial,
        "extra_skills": extra,
        "skill_gaps": sorted_gaps,
        "roadmap": roadmap.to_dict() if roadmap else None,
        "interview_readiness": readiness
    }), 200

# 4. Get Match Skills
@job_match_bp.route('/<int:match_id>/skills', methods=['GET'])
@token_required
def get_job_match_skills(current_user, match_id):
    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
    matched = [s.to_dict() for s in skills if s.match_status == 'matched']
    missing = [s.to_dict() for s in skills if s.match_status == 'missing']
    partial = [s.to_dict() for s in skills if s.match_status == 'partial']
    extra = [s.to_dict() for s in skills if s.match_status == 'extra']

    return jsonify({
        "success": True,
        "match_id": match_id,
        "matched_skills": matched,
        "missing_skills": missing,
        "partial_skills": partial,
        "extra_skills": extra,
        "all_skills": [s.to_dict() for s in skills]
    }), 200

def fetch_skill_gap_for_analysis(current_user, match_id):
    # Enforce Subscription Entitlement Check
    sub_access = check_feature_access(current_user.id, 'skill_gap')
    if not sub_access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "skill_gap",
            "reason": sub_access["reason"],
            "message": sub_access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    jd = db.session.query(JobDescription).filter_by(id=analysis.job_description_id).first()
    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=match_id).all()

    matched = [s.to_dict() for s in skills if s.match_status == 'matched']
    missing = [s.to_dict() for s in skills if s.match_status == 'missing']
    partial = [s.to_dict() for s in skills if s.match_status == 'partial']

    gap_list = [g.to_dict() for g in skill_gaps]
    existing_gap_names = {g['skill_name'].lower() for g in gap_list}

    # Synthesize missing gaps if table had no records
    for m in missing:
        m_name = m['skill_name']
        if m_name.lower() not in existing_gap_names:
            gap_item = {
                "id": m.get('id'),
                "analysis_id": analysis.id,
                "skill_name": m_name,
                "category": m.get('category', 'Technical'),
                "priority": 'HIGH',
                "estimated_days": 14,
                "recommendation": f"Dedicate focused study to build production proficiency in {m_name}.",
                "learning_resources": [
                    f"Official {m_name} Docs",
                    f"Interactive {m_name} Projects"
                ]
            }
            gap_list.append(gap_item)
            existing_gap_names.add(m_name.lower())

    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    sorted_gaps = sorted(gap_list, key=lambda x: priority_order.get(x.get('priority'), 3))

    threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
    max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)
    readiness = evaluate_interview_readiness(analysis, sorted_gaps, threshold, max_critical)

    return jsonify({
        "success": True,
        "match_id": match_id,
        "analysis_id": match_id,
        "target_role": analysis.target_role,
        "company_name": jd.company_name if jd else None,
        "job_description_text": jd.description if jd else "",
        "match_score": analysis.match_score,
        "metrics": {
            "overall_match_score": analysis.match_score,
            "skill_coverage": analysis.skill_coverage,
            "semantic_similarity": analysis.semantic_similarity
        },
        "required_skills_count": analysis.total_required_skills,
        "your_skills_count": len(matched),
        "missing_skills_count": len(missing),
        "partial_skills_count": len(partial),
        "matched_skills": matched,
        "missing_skills": missing,
        "partial_skills": partial,
        "skill_gaps": sorted_gaps,
        "interview_readiness": readiness
    }), 200

# 5. Get Skill Gap
@job_match_bp.route('/<int:match_id>/skill-gap', methods=['GET'])
@token_required
def get_job_match_skill_gap(current_user, match_id):
    return fetch_skill_gap_for_analysis(current_user, match_id)

# 6. Re-analyze skills after completing learning milestones
@job_match_bp.route('/<int:match_id>/reanalyze', methods=['POST'])
@token_required
def reanalyze_match_skills(current_user, match_id):
    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    roadmap = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()
    if not roadmap:
        return jsonify({"success": False, "message": "No active roadmap found for this match."}), 404

    # Identify roadmap items completed by candidate
    completed_items = db.session.query(RoadmapItem).filter(
        RoadmapItem.roadmap_id == roadmap.id,
        (RoadmapItem.status == 'Completed') | (RoadmapItem.progress == 100)
    ).all()

    completed_skill_names = {
        item.skill_name.lower()
        for item in completed_items
        if item.skill_name.lower() not in ['capstone project', 'capstone']
    }

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
    updated_count = 0
    improved_skills = []
    for s in skills:
        if s.match_status in ['missing', 'partial']:
            if s.skill_name.lower() in completed_skill_names:
                s.match_status = 'matched'
                s.confidence = 1.0
                improved_skills.append(s.skill_name)
                updated_count += 1

    # Remove resolved gaps from SkillGap table
    if completed_skill_names:
        db.session.query(SkillGap).filter(
            SkillGap.analysis_id == match_id,
            func.lower(SkillGap.skill_name).in_(completed_skill_names)
        ).delete(synchronize_session=False)

    # Recalculate skill coverage
    matched_req = len([s for s in skills if s.match_status == 'matched' and s.is_required])
    total_req = analysis.total_required_skills if analysis.total_required_skills > 0 else 1
    new_coverage = round((matched_req / total_req) * 100, 1)

    # Boost semantic similarity with mastered concepts
    base_sem = float(analysis.semantic_similarity or 50.0)
    boosted_sem = min(98.0, round(base_sem + (len(improved_skills) * 3.5), 1))
    analysis.semantic_similarity = boosted_sem

    cov_weight = current_app.config.get('SKILL_COVERAGE_WEIGHT', 0.60)
    sem_weight = current_app.config.get('SEMANTIC_SIMILARITY_WEIGHT', 0.40)
    new_match_score = round((cov_weight * new_coverage) + (sem_weight * boosted_sem), 1)
    new_match_score = max(0.0, min(100.0, new_match_score))

    previous_score = float(analysis.match_score or 0.0)
    delta = round(new_match_score - previous_score, 1)

    analysis.skill_coverage = new_coverage
    analysis.match_score = new_match_score
    analysis.matched_skills_count = len([s for s in skills if s.match_status == 'matched'])
    analysis.missing_skills_count = len([s for s in skills if s.match_status == 'missing'])
    analysis.partial_skills_count = len([s for s in skills if s.match_status == 'partial'])

    db.session.commit()

    if new_match_score >= 80:
        readiness_status = "Job Ready"
    elif new_match_score >= 60:
        readiness_status = "Developing"
    else:
        readiness_status = "Needs Improvement"

    remaining_missing = [s.skill_name for s in skills if s.match_status in ['missing', 'partial']]

    rem_gaps = db.session.query(SkillGap).filter_by(analysis_id=match_id).all()
    threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
    max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)
    readiness = evaluate_interview_readiness(analysis, rem_gaps, threshold, max_critical)

    return jsonify({
        "success": True,
        "message": f"Great progress! Your job readiness improved by {abs(delta)} points." if delta > 0 else "Skills verified. Keep progressing through your roadmap!",
        "match_id": match_id,
        "previous_score": previous_score,
        "new_score": new_match_score,
        "improvement_delta": delta,
        "career_readiness": {
            "score": new_match_score,
            "status": readiness_status
        },
        "interview_readiness": readiness,
        "skills_improved": improved_skills,
        "still_missing": remaining_missing,
        "completed_skills": list(completed_skill_names),
        "updated_skills_count": updated_count,
        "analysis": analysis.to_dict()
    }), 200

# 7. Generate PDF Career Intelligence Report
@job_match_bp.route('/<int:match_id>/report', methods=['POST'])
@token_required
@subscription_required('ats_report')
def generate_match_report(current_user, match_id):
    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    analysis_data = build_full_analysis_dict(match_id)
    upload_dir = current_app.config['UPLOAD_FOLDER']

    try:
        report_meta = generate_pdf_report(analysis_data, upload_dir)

        existing = db.session.query(Report).filter_by(analysis_id=match_id).first()
        if existing:
            existing.report_filename = report_meta['filename']
            existing.file_path = report_meta['file_path']
            existing.file_size = report_meta['file_size']
            rep_record = existing
        else:
            rep_record = Report(
                analysis_id=match_id,
                user_id=current_user.id,
                report_filename=report_meta['filename'],
                file_path=report_meta['file_path'],
                file_size=report_meta['file_size']
            )
            db.session.add(rep_record)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Career Intelligence Report generated.",
            "report_id": rep_record.id,
            "filename": rep_record.report_filename,
            "file_size": rep_record.file_size,
            "download_url": f"/api/job-match/{match_id}/report/download"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to generate report: {str(e)}"
        }), 500

# 8. Download PDF Report
@job_match_bp.route('/<int:match_id>/report/download', methods=['GET'])
def download_match_report(match_id):
    user_id = get_authenticated_user_id()
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required."}), 401

    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != user_id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    # Enforce Subscription Access Control for ATS Report Download
    access = check_feature_access(user_id, 'ats_report')
    if not access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "ats_report",
            "reason": access["reason"],
            "message": access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    report = db.session.query(Report).filter_by(analysis_id=match_id).first()
    if not report or not os.path.exists(report.file_path):
        # Generate dynamically if file is missing
        analysis_data = build_full_analysis_dict(match_id)
        upload_dir = current_app.config['UPLOAD_FOLDER']
        report_meta = generate_pdf_report(analysis_data, upload_dir)
        if not report:
            report = Report(
                analysis_id=match_id,
                user_id=user_id,
                report_filename=report_meta['filename'],
                file_path=report_meta['file_path'],
                file_size=report_meta['file_size']
            )
            db.session.add(report)
        else:
            report.file_path = report_meta['file_path']
            report.report_filename = report_meta['filename']
            report.file_size = report_meta['file_size']
        db.session.commit()

    return send_file(
        report.file_path,
        as_attachment=True,
        download_name=report.report_filename,
        mimetype='application/pdf'
    )

# Dedicated Skill Gap Blueprint for /api/skill-gap/:matchId
skill_gap_bp = Blueprint('skill_gap', __name__)

@skill_gap_bp.route('', methods=['GET'])
@skill_gap_bp.route('/', methods=['GET'])
@skill_gap_bp.route('/latest', methods=['GET'])
@token_required
def get_latest_standalone_skill_gap(current_user):
    sub_access = check_feature_access(current_user.id, 'skill_gap')
    if not sub_access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "skill_gap",
            "reason": sub_access["reason"],
            "message": sub_access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    latest = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        return jsonify({
            "success": True,
            "match_id": None,
            "analysis_id": None,
            "target_role": "Target Role",
            "company_name": None,
            "match_score": 0,
            "metrics": {
                "overall_match_score": 0,
                "skill_coverage": 0,
                "semantic_similarity": 0
            },
            "skill_gaps": [],
            "matched_skills": [],
            "missing_skills": [],
            "partial_skills": [],
            "message": "No job match analysis performed yet."
        }), 200
    return fetch_skill_gap_for_analysis(current_user, latest.id)

@skill_gap_bp.route('/<int:match_id>', methods=['GET'])
@token_required
def get_standalone_skill_gap(current_user, match_id):
    return fetch_skill_gap_for_analysis(current_user, match_id)

def get_match_roadmap(current_user, match_id):
    # Enforce Subscription Entitlement Check
    sub_access = check_feature_access(current_user.id, 'career_roadmap')
    if not sub_access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "career_roadmap",
            "reason": sub_access["reason"],
            "message": sub_access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Analysis not found or forbidden."}), 404

    roadmap = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()
    if not roadmap:
        skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=match_id).all()
        skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
        partial_skills = [s.to_dict() for s in skills if s.match_status == 'partial']

        roadmap_data = generate_personalized_roadmap(
            missing_skills=[g.to_dict() for g in skill_gaps],
            target_role=analysis.target_role,
            duration_weeks=8,
            daily_study_hours=1.0,
            study_days_per_week=5,
            learning_style='balanced',
            partial_skills=partial_skills
        )
        roadmap = Roadmap(
            analysis_id=analysis.id,
            user_id=current_user.id,
            target_role=analysis.target_role,
            total_duration_weeks=roadmap_data['total_duration_weeks'],
            daily_study_hours=roadmap_data['daily_study_hours'],
            study_days_per_week=roadmap_data['study_days_per_week'],
            learning_style=roadmap_data['learning_style'],
            total_learning_hours=roadmap_data['total_learning_hours'],
            overall_progress=0
        )
        db.session.add(roadmap)
        db.session.flush()

        for item in roadmap_data['items']:
            db.session.add(RoadmapItem(
                roadmap_id=roadmap.id,
                phase_number=item['phase_number'],
                skill_name=item['skill_name'],
                title=item['title'],
                duration_weeks=item['duration_weeks'],
                priority=item['priority'],
                topics=item['topics'],
                practice_project=item['practice_project'],
                expected_outcome=item.get('expected_outcome'),
                tasks=item.get('tasks', []),
                resource_categories=item.get('resource_categories', []),
                status='Not Started',
                progress=0,
                order_index=item['order_index']
            ))
        db.session.commit()
        db.session.refresh(roadmap)

    return jsonify({
        "success": True,
        "has_roadmap": True,
        "roadmap_id": roadmap.id,
        "match_id": match_id,
        "duration_weeks": roadmap.total_duration_weeks,
        "daily_study_hours": roadmap.daily_study_hours or 1.0,
        "study_days_per_week": roadmap.study_days_per_week or 5,
        "learning_style": roadmap.learning_style or 'balanced',
        "total_learning_hours": roadmap.total_learning_hours or (roadmap.total_duration_weeks * (roadmap.daily_study_hours or 1.0) * (roadmap.study_days_per_week or 5)),
        "is_intensive": (roadmap.total_duration_weeks <= 4),
        "intensity_warning": "Your selected timeline is intensive. Expect a higher weekly learning workload." if (roadmap.total_duration_weeks <= 4) else None,
        "overall_progress": roadmap.overall_progress,
        "roadmap": roadmap.to_dict()
    }), 200

def generate_match_roadmap(current_user, match_id, params=None):
    # Enforce Subscription Entitlement Check
    sub_access = check_feature_access(current_user.id, 'career_roadmap')
    if not sub_access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "career_roadmap",
            "reason": sub_access["reason"],
            "message": sub_access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Analysis not found or forbidden."}), 404

    data = params if params is not None else (request.get_json(silent=True) or {})
    duration_weeks = int(data.get('duration_weeks') or 8)
    daily_study_hours = float(data.get('daily_study_hours') or 1.0)
    study_days_per_week = int(data.get('study_days_per_week') or 5)
    learning_style = str(data.get('learning_style') or 'balanced')

    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=match_id).all()
    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=match_id).all()
    partial_skills = [s.to_dict() for s in skills if s.match_status == 'partial']

    roadmap_data = generate_personalized_roadmap(
        missing_skills=[g.to_dict() for g in skill_gaps],
        target_role=analysis.target_role,
        duration_weeks=duration_weeks,
        daily_study_hours=daily_study_hours,
        study_days_per_week=study_days_per_week,
        learning_style=learning_style,
        partial_skills=partial_skills
    )

    existing = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()
    completed_skills = set()
    if existing:
        old_items = db.session.query(RoadmapItem).filter_by(roadmap_id=existing.id).all()
        for oi in old_items:
            if oi.status == 'Completed' or oi.progress == 100:
                completed_skills.add(oi.skill_name.lower())
        db.session.query(RoadmapItem).filter_by(roadmap_id=existing.id).delete()
        roadmap = existing
        roadmap.target_role = analysis.target_role
        roadmap.total_duration_weeks = roadmap_data['total_duration_weeks']
        roadmap.daily_study_hours = roadmap_data['daily_study_hours']
        roadmap.study_days_per_week = roadmap_data['study_days_per_week']
        roadmap.learning_style = roadmap_data['learning_style']
        roadmap.total_learning_hours = roadmap_data['total_learning_hours']
    else:
        roadmap = Roadmap(
            analysis_id=analysis.id,
            user_id=current_user.id,
            target_role=analysis.target_role,
            total_duration_weeks=roadmap_data['total_duration_weeks'],
            daily_study_hours=roadmap_data['daily_study_hours'],
            study_days_per_week=roadmap_data['study_days_per_week'],
            learning_style=roadmap_data['learning_style'],
            total_learning_hours=roadmap_data['total_learning_hours'],
            overall_progress=0
        )
        db.session.add(roadmap)
        db.session.flush()

    total_prog = 0
    items_count = len(roadmap_data['items'])
    for item in roadmap_data['items']:
        s_lower = item['skill_name'].lower()
        is_completed = s_lower in completed_skills
        it_status = 'Completed' if is_completed else 'Not Started'
        it_progress = 100 if is_completed else 0
        total_prog += it_progress

        db.session.add(RoadmapItem(
            roadmap_id=roadmap.id,
            phase_number=item['phase_number'],
            skill_name=item['skill_name'],
            title=item['title'],
            duration_weeks=item['duration_weeks'],
            priority=item['priority'],
            topics=item['topics'],
            practice_project=item['practice_project'],
            expected_outcome=item.get('expected_outcome'),
            tasks=item.get('tasks', []),
            resource_categories=item.get('resource_categories', []),
            status=it_status,
            progress=it_progress,
            order_index=item['order_index']
        ))

    roadmap.overall_progress = int(round(total_prog / items_count)) if items_count > 0 else 0
    db.session.commit()
    db.session.refresh(roadmap)

    return jsonify({
        "success": True,
        "message": f"Personalized {duration_weeks}-week roadmap generated successfully.",
        "roadmap_id": roadmap.id,
        "match_id": match_id,
        "duration_weeks": roadmap.total_duration_weeks,
        "daily_study_hours": roadmap.daily_study_hours,
        "study_days_per_week": roadmap.study_days_per_week,
        "learning_style": roadmap.learning_style,
        "weekly_hours": roadmap_data['weekly_study_hours'],
        "total_hours": roadmap_data['total_learning_hours'],
        "is_intensive": roadmap_data['is_intensive'],
        "intensity_warning": roadmap_data['intensity_warning'],
        "overall_progress": roadmap.overall_progress,
        "roadmap": roadmap.to_dict()
    }), 201

def add_skill_to_match_roadmap(current_user, match_id, data):
    skill_name = (data.get('skill_name') or '').strip()
    if not skill_name:
        return jsonify({"success": False, "message": "skill_name is required."}), 400

    analysis = db.session.query(Analysis).filter_by(id=match_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Analysis not found or forbidden."}), 404

    roadmap = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()
    if not roadmap:
        get_match_roadmap(current_user, match_id)
        roadmap = db.session.query(Roadmap).filter_by(analysis_id=match_id).first()

    existing_items = db.session.query(RoadmapItem).filter_by(roadmap_id=roadmap.id).all()
    for item in existing_items:
        if item.skill_name.lower() == skill_name.lower():
            return jsonify({
                "success": True,
                "already_exists": True,
                "message": f"'{skill_name}' is already included in your career roadmap.",
                "roadmap": roadmap.to_dict()
            }), 200

    phase_num = len(existing_items) + 1
    if skill_name in SKILL_CURRICULUM:
        c = SKILL_CURRICULUM[skill_name]
        title = f"Phase {phase_num}: {c['title']}"
        topics = list(c['topics'])
        project = c['project']
        outcome = c['outcome']
        resources = list(c['resources'])
    else:
        title = f"Phase {phase_num}: {skill_name} Applied Engineering"
        topics = [
            f"{skill_name} Fundamentals & Architecture",
            f"{skill_name} Core Patterns & Practical Syntax",
            f"Production Implementation & Testing with {skill_name}"
        ]
        project = f"Build a practical demonstration project leveraging {skill_name}."
        outcome = f"Verified hands-on competence in {skill_name}."
        resources = [f"Official {skill_name} Docs", f"Modern {skill_name} Handbook"]

    start_week = (roadmap.total_duration_weeks or 8) + 1
    dur_label = f"Week {start_week}"
    daily_tasks = generate_daily_tasks(
        skill_name,
        1,
        roadmap.study_days_per_week or 5,
        topics,
        roadmap.learning_style or 'balanced',
        start_week=start_week,
        daily_study_hours=roadmap.daily_study_hours or 1.0
    )

    new_item = RoadmapItem(
        roadmap_id=roadmap.id,
        phase_number=phase_num,
        skill_name=skill_name,
        title=title,
        duration_weeks=dur_label,
        priority=data.get('priority', 'HIGH'),
        topics=topics,
        practice_project=project,
        expected_outcome=outcome,
        tasks=daily_tasks,
        resource_categories=resources,
        status='Not Started',
        progress=0,
        order_index=phase_num
    )
    db.session.add(new_item)
    roadmap.total_duration_weeks = start_week
    roadmap.total_learning_hours = round(roadmap.total_duration_weeks * (roadmap.daily_study_hours or 1.0) * (roadmap.study_days_per_week or 5), 1)

    all_items = existing_items + [new_item]
    roadmap.overall_progress = int(round(sum(it.progress for it in all_items) / len(all_items)))

    db.session.commit()
    db.session.refresh(roadmap)

    return jsonify({
        "success": True,
        "already_exists": False,
        "message": f"'{skill_name}' successfully added to your career roadmap!",
        "roadmap": roadmap.to_dict()
    }), 201

# Dedicated Career Roadmap Blueprint for /api/career-roadmap
career_roadmap_bp = Blueprint('career_roadmap', __name__)

@career_roadmap_bp.route('', methods=['GET'])
@career_roadmap_bp.route('/', methods=['GET'])
@career_roadmap_bp.route('/latest', methods=['GET'])
@token_required
def get_latest_standalone_roadmap(current_user):
    roadmap = db.session.query(Roadmap).filter_by(user_id=current_user.id).order_by(Roadmap.created_at.desc()).first()
    if roadmap:
        return get_match_roadmap(current_user, roadmap.analysis_id)
    latest_analysis = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
    if latest_analysis:
        return get_match_roadmap(current_user, latest_analysis.id)
    return jsonify({"success": False, "has_roadmap": False, "message": "No roadmap or analysis found."}), 404

@career_roadmap_bp.route('/<int:match_id>', methods=['GET'])
@token_required
def get_standalone_roadmap(current_user, match_id):
    return get_match_roadmap(current_user, match_id)

@career_roadmap_bp.route('/generate', methods=['POST'])
@token_required
def generate_roadmap_direct(current_user):
    data = request.get_json(silent=True) or {}
    match_id = data.get('match_id')
    if not match_id:
        latest = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
        if not latest:
            return jsonify({"success": False, "message": "No job match found to generate roadmap for."}), 404
        match_id = latest.id
    return generate_match_roadmap(current_user, match_id, data)

@career_roadmap_bp.route('/regenerate', methods=['POST'])
@token_required
def regenerate_roadmap_direct(current_user):
    data = request.get_json(silent=True) or {}
    match_id = data.get('match_id')
    if not match_id:
        latest = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
        if not latest:
            return jsonify({"success": False, "message": "No job match found to regenerate roadmap for."}), 404
        match_id = latest.id
    return generate_match_roadmap(current_user, match_id, data)

@career_roadmap_bp.route('/<int:match_id>/generate', methods=['POST'])
@token_required
def generate_standalone_roadmap(current_user, match_id):
    return generate_match_roadmap(current_user, match_id)

@career_roadmap_bp.route('/<int:match_id>/regenerate', methods=['POST'])
@token_required
def regenerate_standalone_roadmap(current_user, match_id):
    return generate_match_roadmap(current_user, match_id)

@career_roadmap_bp.route('/<int:match_id>/recalculate', methods=['POST'])
@token_required
def recalculate_standalone_roadmap(current_user, match_id):
    return reanalyze_match_skills(current_user, match_id)

@career_roadmap_bp.route('/add-skill', methods=['POST'])
@token_required
def add_skill_direct(current_user):
    data = request.get_json(silent=True) or {}
    match_id = data.get('match_id')
    if not match_id:
        latest = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
        if not latest:
            return jsonify({"success": False, "message": "No job match found."}), 404
        match_id = latest.id
    return add_skill_to_match_roadmap(current_user, match_id, data)

@career_roadmap_bp.route('/<int:match_id>/add-skill', methods=['POST'])
@token_required
def add_skill_to_roadmap(current_user, match_id):
    data = request.get_json(silent=True) or {}
    return add_skill_to_match_roadmap(current_user, match_id, data)

@career_roadmap_bp.route('/items/<int:item_id>', methods=['PATCH', 'POST'])
@career_roadmap_bp.route('/items/<int:item_id>/progress', methods=['PATCH', 'POST'])
@token_required
def update_standalone_roadmap_item(current_user, item_id):
    from routes.roadmap import update_item_progress_internal
    return update_item_progress_internal(current_user, item_id)

@career_roadmap_bp.route('/tasks/<int:item_id>', methods=['PATCH', 'POST'])
@token_required
def update_standalone_task_item(current_user, item_id):
    from routes.roadmap import update_item_progress_internal
    return update_item_progress_internal(current_user, item_id)

@career_roadmap_bp.route('/items/<int:item_id>/quiz-submit', methods=['POST'])
@token_required
def submit_standalone_quiz(current_user, item_id):
    from routes.roadmap import submit_quiz_internal
    return submit_quiz_internal(current_user, item_id)

