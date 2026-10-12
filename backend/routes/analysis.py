"""
Resume Intelligence & Job Matching Routes
CareerSense AI - Final Year Engineering Project
"""

import os
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import (
    User, Resume, JobDescription, Analysis, AnalysisSkill,
    SkillGap, Roadmap, RoadmapItem, Report
)
from utils.auth_helper import token_required
from services.matching_service import perform_comprehensive_match
from services.roadmap_generator import generate_personalized_roadmap
from services.resume_parser import extract_candidate_metadata

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/create', methods=['POST'])
@token_required
def create_analysis(current_user):
    data = request.get_json(silent=True) or {}

    resume_id = data.get('resume_id')
    target_role = (data.get('target_role') or '').strip()
    job_description_text = (data.get('job_description') or data.get('jd_text') or '').strip()
    company_name = (data.get('company_name') or '').strip() or None

    if not resume_id:
        return jsonify({
            "success": False,
            "message": "Please specify a valid uploaded resume ID."
        }), 400

    if not target_role:
        target_role = "Software Engineer"

    if not job_description_text:
        return jsonify({
            "success": False,
            "message": "Please paste or enter the target Job Description."
        }), 400

    if len(job_description_text) < 20:
        return jsonify({
            "success": False,
            "message": "The Job Description is too short. Please provide a more detailed requisition (minimum 20 characters)."
        }), 400

    # 1. Fetch Resume & verify ownership
    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume:
        return jsonify({
            "success": False,
            "message": "Resume record not found."
        }), 404

    if resume.user_id != current_user.id:
        return jsonify({
            "success": False,
            "message": "Access denied: you do not have permission to analyze this resume."
        }), 403

    resume_text = resume.extracted_text or ""
    if not resume_text.strip():
        return jsonify({
            "success": False,
            "message": "No readable text found in this resume. Please upload a readable PDF resume."
        }), 400

    try:
        # 2. Save JobDescription to MySQL
        jd_record = JobDescription(
            user_id=current_user.id,
            job_title=target_role,
            company_name=company_name,
            description=job_description_text
        )
        db.session.add(jd_record)
        db.session.flush()

        # 3. Perform Comprehensive Resume vs JD Comparison & TF-IDF Cosine Matching
        match_result = perform_comprehensive_match(
            resume_text=resume_text,
            jd_text=job_description_text,
            target_role=target_role
        )
        metrics = match_result['metrics']

        # Extract candidate metadata from resume text
        cand_meta = extract_candidate_metadata(resume_text)
        cand_name = cand_meta.get('candidate_name') or current_user.full_name
        cand_email = cand_meta.get('email') or current_user.email
        cand_phone = cand_meta.get('phone') or current_user.phone

        # 4. Create Analysis record in MySQL
        analysis_record = Analysis(
            user_id=current_user.id,
            resume_id=resume.id,
            job_description_id=jd_record.id,
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
        db.session.add(analysis_record)
        db.session.flush()

        # 5. Save AnalysisSkill records
        # Matched skills
        for s in match_result['matched_skills']:
            skill_entry = AnalysisSkill(
                analysis_id=analysis_record.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='matched',
                is_required=s['is_required'],
                confidence=s['confidence'],
                evidence_text=s['evidence_text'],
                recommended_improvement=None
            )
            db.session.add(skill_entry)

        # Missing skills
        for s in match_result['missing_skills']:
            skill_entry = AnalysisSkill(
                analysis_id=analysis_record.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='missing',
                is_required=s['is_required'],
                confidence=s['confidence'],
                evidence_text=None,
                recommended_improvement=f"Acquire {s['skill_name']} to fulfill {target_role} requirements."
            )
            db.session.add(skill_entry)

        # Partial skills
        for s in match_result['partial_matches']:
            skill_entry = AnalysisSkill(
                analysis_id=analysis_record.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='partial',
                is_required=True,
                confidence=0.85,
                evidence_text=s.get('evidence_text'),
                recommended_improvement=s.get('recommended_improvement')
            )
            db.session.add(skill_entry)

        # Extra skills
        for s in match_result['extra_skills']:
            skill_entry = AnalysisSkill(
                analysis_id=analysis_record.id,
                skill_name=s['skill_name'],
                category=s['category'],
                match_status='extra',
                is_required=False,
                confidence=s['confidence'],
                evidence_text=s.get('evidence_text'),
                recommended_improvement=None
            )
            db.session.add(skill_entry)

        # 6. Save SkillGap records
        for g in match_result['skill_gaps']:
            gap_entry = SkillGap(
                analysis_id=analysis_record.id,
                skill_name=g['skill_name'],
                priority=g['priority'],
                reason=g['reason'],
                estimated_learning_duration=g['estimated_learning_duration'],
                category=g['category']
            )
            db.session.add(gap_entry)

        # 7. Generate Personalized Career Roadmap based dynamically on missing skills
        roadmap_data = generate_personalized_roadmap(
            missing_skills=match_result['skill_gaps'],
            target_role=target_role
        )

        roadmap_record = Roadmap(
            analysis_id=analysis_record.id,
            user_id=current_user.id,
            target_role=target_role,
            total_duration_weeks=roadmap_data['total_duration_weeks'],
            overall_progress=0
        )
        db.session.add(roadmap_record)
        db.session.flush()

        for item in roadmap_data['items']:
            rm_item = RoadmapItem(
                roadmap_id=roadmap_record.id,
                phase_number=item['phase_number'],
                skill_name=item['skill_name'],
                title=item['title'],
                duration_weeks=item['duration_weeks'],
                priority=item['priority'],
                topics=item['topics'],
                practice_project=item['practice_project'],
                resource_categories=item.get('resource_categories', []),
                status='Not Started',
                progress=0,
                order_index=item['order_index']
            )
            db.session.add(rm_item)

        # 8. Mark resume as analyzed
        resume.status = 'analyzed'

        db.session.commit()

        # Build full response payload
        return jsonify({
            "success": True,
            "message": "Resume and Job Description analysis completed successfully.",
            "analysis_id": analysis_record.id,
            "analysis": analysis_record.to_dict(),
            "metrics": metrics,
            "matched_skills": match_result['matched_skills'],
            "missing_skills": match_result['missing_skills'],
            "skill_gaps": match_result['skill_gaps'],
            "partial_matches": match_result['partial_matches'],
            "extra_skills": match_result['extra_skills'],
            "roadmap": roadmap_record.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Analysis failed due to an internal error: {str(e)}"
        }), 500

@analysis_bp.route('/<int:analysis_id>', methods=['GET'])
@token_required
def get_analysis_detail(current_user, analysis_id):
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis:
        return jsonify({"success": False, "message": "Analysis not found."}), 404

    # Security check: User can only access their own analyses
    if analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot access another user's analysis."}), 403

    # Load skills
    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=analysis_id).all()
    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
    roadmap = db.session.query(Roadmap).filter_by(analysis_id=analysis_id).first()
    reports = db.session.query(Report).filter_by(analysis_id=analysis_id).all()

    matched = [s.to_dict() for s in skills if s.match_status == 'matched']
    missing = [s.to_dict() for s in skills if s.match_status == 'missing']
    partial = [s.to_dict() for s in skills if s.match_status == 'partial']
    extra = [s.to_dict() for s in skills if s.match_status == 'extra']

    cov_weight = current_app.config.get('SKILL_COVERAGE_WEIGHT', 0.60)
    sem_weight = current_app.config.get('SEMANTIC_SIMILARITY_WEIGHT', 0.40)

    return jsonify({
        "success": True,
        "analysis": analysis.to_dict(),
        "metrics": {
            "overall_match_score": analysis.match_score,
            "skill_coverage": analysis.skill_coverage,
            "semantic_similarity": analysis.semantic_similarity,
            "total_required_skills": analysis.total_required_skills,
            "matched_skills_count": analysis.matched_skills_count,
            "missing_skills_count": analysis.missing_skills_count,
            "partial_skills_count": analysis.partial_skills_count,
            "extra_skills_count": len(extra),
            "weights": {
                "skill_coverage_weight": cov_weight,
                "semantic_similarity_weight": sem_weight
            },
            "formula_explanation": (
                f"Overall Score = ({int(cov_weight*100)}% × Skill Coverage {analysis.skill_coverage}%) + "
                f"({int(sem_weight*100)}% × Semantic Similarity {analysis.semantic_similarity}%) = {analysis.match_score}%"
            )
        },
        "matched_skills": matched,
        "missing_skills": missing,
        "skill_gaps": [g.to_dict() for g in skill_gaps],
        "partial_matches": partial,
        "extra_skills": extra,
        "roadmap": roadmap.to_dict() if roadmap else None,
        "reports": [r.to_dict() for r in reports]
    }), 200

@analysis_bp.route('/<int:analysis_id>/skills', methods=['GET'])
@token_required
def get_analysis_skills(current_user, analysis_id):
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=analysis_id).all()
    return jsonify({
        "success": True,
        "skills": [s.to_dict() for s in skills]
    }), 200

@analysis_bp.route('/<int:analysis_id>/skill-gaps', methods=['GET'])
@token_required
def get_analysis_skill_gaps(current_user, analysis_id):
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
    return jsonify({
        "success": True,
        "skill_gaps": [g.to_dict() for g in gaps]
    }), 200

@analysis_bp.route('/<int:analysis_id>/roadmap', methods=['GET'])
@token_required
def get_analysis_roadmap(current_user, analysis_id):
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Not found or forbidden."}), 403

    roadmap = db.session.query(Roadmap).filter_by(analysis_id=analysis_id).first()
    return jsonify({
        "success": True,
        "roadmap": roadmap.to_dict() if roadmap else None
    }), 200

@analysis_bp.route('/history', methods=['GET'])
@token_required
def get_analysis_history(current_user):
    analyses = db.session.query(Analysis)\
        .filter_by(user_id=current_user.id)\
        .order_by(Analysis.created_at.desc())\
        .all()

    result = []
    for a in analyses:
        resume = db.session.query(Resume).filter_by(id=a.resume_id).first()
        result.append({
            "id": a.id,
            "target_role": a.target_role,
            "match_score": a.match_score,
            "skill_coverage": a.skill_coverage,
            "semantic_similarity": a.semantic_similarity,
            "matched_skills_count": a.matched_skills_count,
            "missing_skills_count": a.missing_skills_count,
            "resume_filename": resume.filename if resume else "Resume.pdf",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "status": a.status
        })

    return jsonify({
        "success": True,
        "count": len(result),
        "history": result
    }), 200

