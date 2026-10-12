"""
PDF Analysis Report Generation & Download Routes
CareerSense AI - Final Year Engineering Project
"""

import os
from flask import Blueprint, request, jsonify, send_file, current_app
from extensions import db
from models.analysis import Analysis
from models.skill import AnalysisSkill, SkillGap
from models.roadmap import Roadmap
from models.report import Report
from utils.auth_helper import token_required, get_authenticated_user_id
from services.report_service import generate_pdf_report
from services.subscription_service import subscription_required, check_feature_access
from models.subscription import SubscriptionPlan

reports_bp = Blueprint('reports', __name__)

def build_full_analysis_dict(analysis_id: int) -> dict:
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis:
        return None

    skills = db.session.query(AnalysisSkill).filter_by(analysis_id=analysis_id).all()
    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
    roadmap = db.session.query(Roadmap).filter_by(analysis_id=analysis_id).first()

    data = analysis.to_dict()
    data['skills'] = [s.to_dict() for s in skills]
    data['skill_gaps'] = [g.to_dict() for g in skill_gaps]
    data['roadmap'] = roadmap.to_dict() if roadmap else None
    return data

@reports_bp.route('/<int:analysis_id>/generate', methods=['POST'])
@token_required
@subscription_required('ats_report')
def generate_report(current_user, analysis_id):
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis:
        return jsonify({"success": False, "message": "Analysis not found."}), 404

    if analysis.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot access another candidate's analysis."}), 403

    analysis_data = build_full_analysis_dict(analysis_id)
    upload_dir = current_app.config['UPLOAD_FOLDER']

    try:
        report_meta = generate_pdf_report(analysis_data, upload_dir)

        # Check if report record already exists in DB
        existing_report = db.session.query(Report).filter_by(analysis_id=analysis_id).first()
        if existing_report:
            existing_report.report_filename = report_meta['filename']
            existing_report.file_path = report_meta['file_path']
            existing_report.file_size = report_meta['file_size']
            db.session.commit()
            rep_record = existing_report
        else:
            rep_record = Report(
                analysis_id=analysis_id,
                user_id=current_user.id,
                report_filename=report_meta['filename'],
                file_path=report_meta['file_path'],
                file_size=report_meta['file_size']
            )
            db.session.add(rep_record)
            db.session.commit()

        return jsonify({
            "success": True,
            "message": "PDF report generated successfully.",
            "report_id": rep_record.id,
            "filename": rep_record.report_filename,
            "file_size": rep_record.file_size,
            "download_url": f"/api/report/{analysis_id}/download"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to generate PDF report: {str(e)}"
        }), 500

@reports_bp.route('/<int:analysis_id>/download', methods=['GET'])
def download_report(analysis_id):
    # Support token in Authorization header or in query parameter ?token=...
    user_id = get_authenticated_user_id()
    if not user_id:
        return jsonify({"success": False, "message": "Authentication required to download report."}), 401

    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis:
        return jsonify({"success": False, "message": "Analysis record not found."}), 404

    if analysis.user_id != user_id:
        return jsonify({"success": False, "message": "Forbidden: You cannot download another user's report."}), 403

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

    # Check if report is already generated on disk
    report = db.session.query(Report).filter_by(analysis_id=analysis_id).first()
    if not report or not os.path.exists(report.file_path):
        # Generate on the fly
        analysis_data = build_full_analysis_dict(analysis_id)
        upload_dir = current_app.config['UPLOAD_FOLDER']
        report_meta = generate_pdf_report(analysis_data, upload_dir)

        if not report:
            report = Report(
                analysis_id=analysis_id,
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

