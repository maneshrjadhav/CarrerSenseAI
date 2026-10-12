"""
Resume Upload & Independent Resume Intelligence Routes
CareerSense AI - Final Year Engineering Project
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
from extensions import db
from models.resume import Resume
from models.resume_intelligence import (
    ResumeSection, ResumeSkill, ResumeAnalysis, ResumeSuggestion
)
from utils.auth_helper import token_required, get_authenticated_user_id
from services.resume_parser import validate_and_extract_pdf, PDFParsingError, extract_candidate_metadata
from services.resume_quality_service import analyze_resume_quality
from services.report_service import generate_ats_report
from services.subscription_service import subscription_required, check_feature_access
from models.subscription import SubscriptionPlan
from models.targeted_resume import TargetedResume
from services.resume_builder_service import (
    build_initial_targeted_resume, update_targeted_resume_draft, generate_targeted_resume_pdf
)

resume_bp = Blueprint('resume', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@resume_bp.route('/upload', methods=['POST'])
@token_required
def upload_resume(current_user):
    """
    Step 1: Upload Resume PDF
    Validates file format, size, corruption, saves securely to disk,
    and creates a Resume record in MySQL associated with current_user.
    """
    if 'file' not in request.files and 'resume' not in request.files:
        return jsonify({
            "success": False,
            "message": "Please select a valid PDF resume."
        }), 400

    file = request.files.get('file') or request.files.get('resume')

    if not file or not file.filename:
        return jsonify({
            "success": False,
            "message": "Please select a valid PDF resume."
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "message": "Please select a valid PDF resume. Only PDF files are supported."
        }), 400

    # Ensure uploads/resumes directory exists
    resumes_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'resumes')
    os.makedirs(resumes_dir, exist_ok=True)

    # Server-side unique filename
    original_name = secure_filename(file.filename) or "resume.pdf"
    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex[:10]}_{original_name}"
    saved_path = os.path.join(resumes_dir, unique_filename)

    try:
        file.save(saved_path)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Something went wrong while saving your resume. Please try again."
        }), 500

    # Check file size (Max 10 MB)
    file_size = os.path.getsize(saved_path)
    if file_size > 10 * 1024 * 1024:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        return jsonify({
            "success": False,
            "message": "Resume file is too large. Maximum size is 10 MB."
        }), 413

    if file_size == 0:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        return jsonify({
            "success": False,
            "message": "The uploaded file is empty (0 bytes)."
        }), 400

    # Validate PDF and extract text using PyMuPDF
    try:
        extract_result = validate_and_extract_pdf(saved_path)
    except PDFParsingError as pe:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        err_msg = str(pe)
        if "readable text" in err_msg.lower():
            return jsonify({
                "success": False,
                "message": "We couldn't extract readable text from this PDF. Please ensure it is a text-based resume."
            }), 422
        return jsonify({
            "success": False,
            "message": err_msg
        }), 400
    except Exception as ge:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        return jsonify({
            "success": False,
            "message": "Something went wrong while analyzing your resume. Please try again."
        }), 500

    # Persist Resume in MySQL with user_id strictly from JWT
    try:
        resume_record = Resume(
            user_id=current_user.id,
            filename=original_name,
            file_path=saved_path,
            file_type='pdf',
            extracted_text=extract_result['raw_text'],
            status='uploaded'
        )
        db.session.add(resume_record)
        db.session.commit()

        # Update candidate phone if present in metadata and user phone empty
        meta = extract_result.get('candidate_meta', {})
        if meta.get('phone') and not current_user.phone:
            current_user.phone = meta['phone']
            db.session.commit()

        return jsonify({
            "success": True,
            "resume_id": resume_record.id,
            "status": "uploaded",
            "filename": original_name,
            "file_size": file_size,
            "message": "Resume uploaded successfully."
        }), 201

    except Exception as db_err:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Something went wrong while analyzing your resume. Please try again."
        }), 500

@resume_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_resume(current_user):
    """
    Step 2: Resume Intelligence Analysis (Independent of Job Description)
    Extracts candidate profile, skills, calculates quality score, strengths,
    and suggestions, saving results to MySQL.
    """
    data = request.get_json(silent=True) or {}
    resume_id = data.get('resume_id')

    if not resume_id:
        return jsonify({
            "success": False,
            "message": "Please specify a valid resume_id."
        }), 400

    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume:
        return jsonify({
            "success": False,
            "message": "Resume not found."
        }), 404

    # Strict user isolation check
    if resume.user_id != current_user.id:
        return jsonify({
            "success": False,
            "message": "You don't have permission to access this resume."
        }), 403

    raw_text = resume.extracted_text or ""
    if not raw_text.strip():
        # Re-extract if text was missing
        try:
            extracted = validate_and_extract_pdf(resume.file_path)
            raw_text = extracted['raw_text']
            resume.extracted_text = raw_text
            db.session.commit()
        except Exception:
            return jsonify({
                "success": False,
                "message": "We couldn't extract readable text from this PDF."
            }), 422

    try:
        # Extract metadata and sections
        candidate_meta = extract_candidate_metadata(raw_text)
        cand_name = candidate_meta.get('candidate_name') or current_user.full_name
        cand_email = candidate_meta.get('email') or current_user.email
        cand_phone = candidate_meta.get('phone') or current_user.phone
        summary = candidate_meta.get('sections', {}).get('summary', '')

        # Run quality scoring and skill profiling
        quality_result = analyze_resume_quality(raw_text, candidate_meta)

        # 1. Clean previous analysis records for this resume if re-analyzing
        existing_analysis = db.session.query(ResumeAnalysis).filter_by(resume_id=resume.id).first()
        if existing_analysis:
            db.session.delete(existing_analysis)
        db.session.query(ResumeSection).filter_by(resume_id=resume.id).delete()
        db.session.query(ResumeSkill).filter_by(resume_id=resume.id).delete()
        db.session.query(ResumeSuggestion).filter_by(resume_id=resume.id).delete()
        db.session.flush()

        # 2. Save ResumeSections to MySQL
        sections_dict = candidate_meta.get('sections', {})
        for sec_name, sec_content in sections_dict.items():
            if sec_content.strip():
                sec_rec = ResumeSection(
                    resume_id=resume.id,
                    section_name=sec_name.capitalize(),
                    section_content=sec_content.strip(),
                    word_count=len(sec_content.split())
                )
                db.session.add(sec_rec)

        # 3. Save ResumeSkills to MySQL
        for sk in quality_result['skills']:
            skill_rec = ResumeSkill(
                resume_id=resume.id,
                skill_name=sk['skill_name'],
                category=sk['category'],
                confidence=sk['confidence'],
                evidence_text=sk['evidence_text']
            )
            db.session.add(skill_rec)

        # 4. Save ResumeSuggestions (Strengths & Improvements) to MySQL
        for str_item in quality_result['strengths']:
            sug_rec = ResumeSuggestion(
                resume_id=resume.id,
                type='strength',
                title=str_item['title'],
                description=str_item['description'],
                category=str_item.get('category', 'General'),
                priority='HIGH'
            )
            db.session.add(sug_rec)

        for imp_item in quality_result['suggestions']:
            sug_rec = ResumeSuggestion(
                resume_id=resume.id,
                type='improvement',
                title=imp_item['title'],
                description=imp_item['description'],
                category=imp_item.get('category', 'General'),
                priority=imp_item.get('priority', 'MEDIUM')
            )
            db.session.add(sug_rec)

        # 5. Save ResumeAnalysis Master Record to MySQL
        analysis_record = ResumeAnalysis(
            resume_id=resume.id,
            user_id=current_user.id,
            quality_score=quality_result['quality_score'],
            total_skills_detected=len(quality_result['skills']),
            sections_detected_count=len([k for k, v in sections_dict.items() if v.strip()]),
            word_count=quality_result['word_count'],
            reading_time_minutes=quality_result['reading_time_minutes'],
            candidate_name=cand_name,
            candidate_email=cand_email,
            candidate_phone=cand_phone,
            summary_snippet=summary[:300] if summary else None
        )
        db.session.add(analysis_record)

        # 6. Mark resume status as analyzed
        resume.status = 'analyzed'

        db.session.commit()

        return jsonify({
            "success": True,
            "resume_id": resume.id,
            "status": "completed",
            "message": "Resume intelligence analysis completed successfully."
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Something went wrong while analyzing your resume. Please try again."
        }), 500

@resume_bp.route('/analysis/<int:resume_id>', methods=['GET'])
@token_required
def get_resume_analysis(current_user, resume_id):
    """
    Step 3: Retrieve Resume Intelligence Result from MySQL
    """
    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume:
        return jsonify({
            "success": False,
            "message": "Resume record not found."
        }), 404

    # Security verification
    if resume.user_id != current_user.id:
        return jsonify({
            "success": False,
            "message": "You don't have permission to access this resume."
        }), 403

    analysis = db.session.query(ResumeAnalysis).filter_by(resume_id=resume_id).first()
    if not analysis:
        return jsonify({
            "success": False,
            "message": "Analysis unavailable. Please analyze your resume."
        }), 404

    sections = db.session.query(ResumeSection).filter_by(resume_id=resume_id).all()
    skills = db.session.query(ResumeSkill).filter_by(resume_id=resume_id).all()
    suggestions = db.session.query(ResumeSuggestion).filter_by(resume_id=resume_id).all()

    # Group skills by category
    skills_by_category = {}
    for sk in skills:
        cat = sk.category or 'Other'
        if cat not in skills_by_category:
            skills_by_category[cat] = []
        skills_by_category[cat].append(sk.to_dict())

    strengths = [s.to_dict() for s in suggestions if s.type == 'strength']
    improvements = [s.to_dict() for s in suggestions if s.type == 'improvement']

    return jsonify({
        "success": True,
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "uploaded_at": resume.uploaded_at.isoformat() if resume.uploaded_at else None,
            "status": resume.status
        },
        "analysis": analysis.to_dict(),
        "candidate_profile": {
            "name": analysis.candidate_name,
            "email": analysis.candidate_email,
            "phone": analysis.candidate_phone,
            "summary": analysis.summary_snippet
        },
        "metrics": {
            "quality_score": analysis.quality_score,
            "total_skills_detected": analysis.total_skills_detected,
            "sections_detected_count": analysis.sections_detected_count,
            "word_count": analysis.word_count,
            "reading_time_minutes": analysis.reading_time_minutes
        },
        "skills": [sk.to_dict() for sk in skills],
        "skills_by_category": skills_by_category,
        "sections": [sec.to_dict() for sec in sections],
        "strengths": strengths,
        "suggestions": improvements
    }), 200


@resume_bp.route('/list', methods=['GET'])
@token_required
def list_resumes(current_user):
    """Returns list of uploaded resumes for the authenticated user with metadata."""
    resumes = db.session.query(Resume).filter_by(user_id=current_user.id).order_by(Resume.uploaded_at.desc()).all()
    res_list = []
    for r in resumes:
        sz = 0
        try:
            if r.file_path and os.path.exists(r.file_path):
                sz = os.path.getsize(r.file_path)
        except Exception:
            pass
        res_list.append({
            'id': r.id,
            'filename': r.filename,
            'file_size': sz,
            'file_type': r.file_type,
            'uploaded_at': r.uploaded_at.isoformat() if r.uploaded_at else None,
            'status': r.status
        })
    return jsonify({
        "success": True,
        "resumes": res_list
    }), 200


@resume_bp.route('/<int:resume_id>', methods=['DELETE'])
@token_required
def delete_resume(current_user, resume_id):
    """
    Permanently deletes a resume and cascades to associated analyses,
    skills, sections, and suggestions from MySQL and disk.
    """
    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume:
        return jsonify({"success": False, "message": "Resume not found."}), 404

    if resume.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot delete another user's resume."}), 403

    try:
        # Delete file from disk if present
        if resume.file_path and os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except Exception:
                pass

        db.session.delete(resume)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Resume permanently deleted successfully."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to delete resume: {str(e)}"
        }), 500


def build_full_resume_dict(resume_id, user_id):
    resume = db.session.query(Resume).filter_by(id=resume_id).first()
    if not resume or resume.user_id != user_id:
        return None

    analysis = db.session.query(ResumeAnalysis).filter_by(resume_id=resume_id).first()
    if not analysis:
        # Run quick quality analysis if not yet analyzed
        raw_text = resume.extracted_text or ""
        meta = extract_candidate_metadata(raw_text)
        quality_res = analyze_resume_quality(raw_text, meta)
        analysis = ResumeAnalysis(
            resume_id=resume.id,
            user_id=user_id,
            quality_score=quality_res.get('quality_score', 80),
            total_skills_detected=len(quality_res.get('skills', [])),
            sections_detected_count=len(meta.get('sections', {})),
            word_count=quality_res.get('word_count', 250),
            reading_time_minutes=quality_res.get('reading_time_minutes', 1),
            candidate_name=meta.get('candidate_name') or "Candidate",
            candidate_email=meta.get('email') or "",
            candidate_phone=meta.get('phone') or ""
        )
        db.session.add(analysis)
        db.session.commit()

    sections = db.session.query(ResumeSection).filter_by(resume_id=resume_id).all()
    skills = db.session.query(ResumeSkill).filter_by(resume_id=resume_id).all()
    suggestions = db.session.query(ResumeSuggestion).filter_by(resume_id=resume_id).all()

    strengths = [s.to_dict() for s in suggestions if s.type == 'strength']
    improvements = [s.to_dict() for s in suggestions if s.type == 'improvement']

    sz = 0
    try:
        if resume.file_path and os.path.exists(resume.file_path):
            sz = os.path.getsize(resume.file_path)
    except Exception:
        pass

    return {
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "file_size": sz,
            "uploaded_at": resume.uploaded_at.isoformat() if resume.uploaded_at else None,
            "status": resume.status
        },
        "candidate_profile": {
            "name": analysis.candidate_name,
            "email": analysis.candidate_email,
            "phone": analysis.candidate_phone,
            "summary": analysis.summary_snippet
        },
        "metrics": {
            "quality_score": analysis.quality_score,
            "total_skills_detected": analysis.total_skills_detected,
            "sections_detected_count": analysis.sections_detected_count,
            "word_count": analysis.word_count,
            "reading_time_minutes": analysis.reading_time_minutes
        },
        "sections": [sec.to_dict() for sec in sections],
        "skills": [sk.to_dict() for sk in skills],
        "strengths": strengths,
        "suggestions": improvements
    }


@resume_bp.route('/<int:resume_id>/ats-report', methods=['POST'])
@token_required
@subscription_required('ats_report')
def generate_ats_report_endpoint(current_user, resume_id):
    resume_data = build_full_resume_dict(resume_id, current_user.id)
    if not resume_data:
        return jsonify({"success": False, "message": "Resume not found or unauthorized."}), 404

    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        report_meta = generate_ats_report(resume_data, upload_dir)
        return jsonify({
            "success": True,
            "message": "ATS Report generated successfully.",
            "report_id": report_meta['report_id'],
            "filename": report_meta['filename'],
            "file_size": report_meta['file_size'],
            "download_url": f"/api/resume/{resume_id}/ats-report/download"
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to generate ATS Report: {str(e)}"}), 500


@resume_bp.route('/<int:resume_id>/ats-report/download', methods=['GET'])
def download_ats_report_endpoint(resume_id):
    user_id = get_authenticated_user_id()
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required to download report."}), 401

    resume_data = build_full_resume_dict(resume_id, user_id)
    if not resume_data:
        return jsonify({"success": False, "message": "Resume record not found."}), 404

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

    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        report_meta = generate_ats_report(resume_data, upload_dir)
        return send_file(
            report_meta['file_path'],
            as_attachment=True,
            download_name=report_meta['filename'],
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to deliver ATS report: {str(e)}"}), 500


# ============================================================================
# TARGETED RESUME BUILDER ENDPOINTS
# ============================================================================

@resume_bp.route('/targeted/generate', methods=['POST'])
@token_required
def generate_targeted_resume_endpoint(current_user):
    """
    Initializes a job-targeted resume with anti-fabrication tailored sections
    and recalculates original vs revised quality and match scores.
    """
    data = request.get_json(silent=True) or {}
    resume_id = data.get('resume_id')
    target_role = (data.get('target_role') or '').strip()
    job_description = (data.get('job_description') or '').strip()
    company_name = (data.get('company_name') or '').strip() or None
    analysis_id = data.get('analysis_id')

    if not resume_id:
        # Fallback to latest resume
        latest_res = db.session.query(Resume).filter_by(user_id=current_user.id).order_by(Resume.created_at.desc()).first()
        if latest_res:
            resume_id = latest_res.id
        else:
            return jsonify({"success": False, "message": "No resume found. Please upload a resume first."}), 400

    if not target_role:
        target_role = "Software Engineer"

    if not job_description or len(job_description) < 30:
        # Fallback to standard industry requisition if omitted
        job_description = (
            f"Seeking a motivated {target_role} proficient in core software development, "
            f"API design, database management, and cloud architectures. Candidates should demonstrate "
            f"strong computer science fundamentals and modern version control workflows."
        )

    try:
        result = build_initial_targeted_resume(
            user_id=current_user.id,
            resume_id=resume_id,
            target_role=target_role,
            jd_text=job_description,
            company_name=company_name,
            analysis_id=analysis_id
        )
        return jsonify(result), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to generate targeted resume: {str(e)}"}), 500


@resume_bp.route('/targeted/<int:targeted_id>', methods=['GET'])
@token_required
def get_targeted_resume_endpoint(current_user, targeted_id):
    """Retrieves a targeted resume draft and its comparative metrics."""
    record = db.session.query(TargetedResume).filter_by(id=targeted_id, user_id=current_user.id).first()
    if not record:
        return jsonify({"success": False, "message": "Targeted resume not found."}), 404

    return jsonify({
        "success": True,
        "targeted_resume": record.to_dict()
    }), 200


@resume_bp.route('/targeted/<int:targeted_id>', methods=['PUT', 'PATCH'])
@token_required
def update_targeted_resume_endpoint(current_user, targeted_id):
    """Updates user revisions to the draft and recalculates live comparison scores."""
    data = request.get_json(silent=True) or {}
    resume_data = data.get('resume_data') or {}
    jd_text = data.get('job_description')

    try:
        result = update_targeted_resume_draft(
            targeted_resume_id=targeted_id,
            user_id=current_user.id,
            updated_resume_data=resume_data,
            jd_text=jd_text
        )
        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to update targeted resume: {str(e)}"}), 500


@resume_bp.route('/targeted/<int:targeted_id>/pdf', methods=['POST'])
@token_required
def generate_targeted_pdf_endpoint(current_user, targeted_id):
    """Generates an ATS-compliant PDF for the targeted resume using ReportLab."""
    record = db.session.query(TargetedResume).filter_by(id=targeted_id, user_id=current_user.id).first()
    if not record:
        return jsonify({"success": False, "message": "Targeted resume not found."}), 404

    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        meta = generate_targeted_resume_pdf(targeted_id, upload_dir)
        return jsonify({
            "success": True,
            "message": "Targeted ATS resume PDF synthesized successfully.",
            "filename": meta['filename'],
            "file_size": meta['file_size'],
            "download_url": f"/api/resume/targeted/{targeted_id}/download"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to generate targeted PDF: {str(e)}"}), 500


@resume_bp.route('/targeted/<int:targeted_id>/download', methods=['GET'])
def download_targeted_pdf_endpoint(targeted_id):
    """Streams the generated ATS-compliant PDF."""
    user_id = get_authenticated_user_id()
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required."}), 401

    record = db.session.query(TargetedResume).filter_by(id=targeted_id).first()
    if not record or record.user_id != user_id:
        return jsonify({"success": False, "message": "Targeted resume not found or unauthorized."}), 404

    upload_dir = current_app.config['UPLOAD_FOLDER']
    if not record.pdf_path or not os.path.exists(record.pdf_path):
        meta = generate_targeted_resume_pdf(targeted_id, upload_dir)
        record.pdf_path = meta['file_path']
        record.pdf_filename = meta['filename']

    return send_file(
        record.pdf_path,
        as_attachment=True,
        download_name=record.pdf_filename,
        mimetype='application/pdf'
    )


@resume_bp.route('/targeted/list', methods=['GET'])
@token_required
def list_targeted_resumes_endpoint(current_user):
    """Lists all targeted resume drafts for the current candidate."""
    resumes = db.session.query(TargetedResume).filter_by(user_id=current_user.id).order_by(TargetedResume.created_at.desc()).all()
    return jsonify({
        "success": True,
        "targeted_resumes": [r.to_dict() for r in resumes]
    }), 200

