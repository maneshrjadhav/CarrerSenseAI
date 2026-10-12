"""
CareerSense AI — AI Mock Interview Route Handlers
Enforces interview readiness checks, self-introduction management, question generation,
pedagogical answer evaluation, and final performance reporting.
"""
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models import Analysis, SkillGap, Resume, User
from models.interview import InterviewSession, InterviewQuestion
from utils.auth_helper import token_required
from services.readiness_service import evaluate_interview_readiness
from services.subscription_service import check_feature_access
from models.subscription import SubscriptionPlan
from services.interview_generator import (
    generate_mock_interview_questions,
    evaluate_candidate_answer
)

interview_bp = Blueprint('interview', __name__)

@interview_bp.route('/readiness/<int:analysis_id>', methods=['GET'])
@token_required
def check_interview_readiness(current_user, analysis_id):
    """
    Evaluates whether the candidate meets the interview-readiness threshold
    for a specific Job Match analysis, and checks subscription entitlement.
    """
    analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
    if not analysis or analysis.user_id != current_user.id:
        return jsonify({
            "success": False,
            "message": "Analysis record not found or access forbidden."
        }), 404

    skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
    
    threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
    max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)

    readiness = evaluate_interview_readiness(
        analysis=analysis,
        skill_gaps=skill_gaps,
        threshold=threshold,
        max_critical_gaps=max_critical
    )

    # Entitlement check
    sub_access = check_feature_access(current_user.id, 'interview_prep')
    readiness['has_subscription'] = sub_access['allowed']
    readiness['subscription'] = sub_access['subscription']

    return jsonify({
        "success": True,
        "analysis_id": analysis.id,
        "target_role": analysis.target_role,
        "readiness": readiness
    }), 200


@interview_bp.route('/session', methods=['POST'])
@token_required
def create_or_resume_session(current_user):
    """
    Initializes or resumes a mock interview session for a candidate.
    Enforces subscription entitlement AND validates readiness threshold.
    """
    # 1. Enforce Subscription Entitlement Check
    sub_access = check_feature_access(current_user.id, 'interview_prep')
    if not sub_access['allowed']:
        plans = db.session.query(SubscriptionPlan).filter_by(is_active=True).all()
        return jsonify({
            "success": False,
            "access_denied": True,
            "subscription_required": True,
            "feature": "interview_prep",
            "reason": sub_access["reason"],
            "message": sub_access["message"],
            "upgrade_url": "/pricing",
            "available_plans": [p.to_dict() for p in plans]
        }), 403

    data = request.get_json(silent=True) or {}
    analysis_id = data.get('analysis_id')
    force_practice = bool(data.get('force_practice', False))
    interview_type = data.get('interview_type', 'Technical')
    difficulty = data.get('difficulty', 'Intermediate')

    analysis = None
    target_role = data.get('target_role') or 'Software Engineer'
    company_name = data.get('company_name') or 'Target Tech Organization'
    resume_id = data.get('resume_id')
    candidate_skills = []
    missing_skills = []
    job_desc_text = ""

    if analysis_id:
        analysis = db.session.query(Analysis).filter_by(id=analysis_id).first()
        if not analysis or analysis.user_id != current_user.id:
            return jsonify({
                "success": False,
                "message": "Analysis requisition not found or forbidden."
            }), 404

        target_role = analysis.target_role or target_role
        resume_id = analysis.resume_id or resume_id
        if analysis.job_description:
            company_name = analysis.job_description.company_name or company_name
            job_desc_text = analysis.job_description.description or ""

        skill_gaps = db.session.query(SkillGap).filter_by(analysis_id=analysis_id).all()
        missing_skills = [g.skill_name for g in skill_gaps]

        # Extract verified candidate skills from analysis skills
        for s in (analysis.skills or []):
            if s.match_status in ['matched', 'partial']:
                candidate_skills.append(s.skill_name)

        # Check readiness decision logic
        threshold = current_app.config.get('INTERVIEW_READINESS_THRESHOLD', 80.0)
        max_critical = current_app.config.get('MAX_CRITICAL_GAPS_ALLOWED', 0)
        readiness = evaluate_interview_readiness(
            analysis=analysis,
            skill_gaps=skill_gaps,
            threshold=threshold,
            max_critical_gaps=max_critical
        )

        if not readiness['is_interview_ready'] and not force_practice:
            return jsonify({
                "success": False,
                "is_interview_ready": False,
                "message": f"Candidate does not meet the interview readiness threshold ({analysis.match_score}% / {threshold}%). We recommend completing your Career Roadmap first.",
                "readiness": readiness,
                "action_recommended": "create_roadmap",
                "roadmap_url": f"/career-roadmap/{analysis.id}"
            }), 400

    # If no analysis_id provided, check for candidate's latest analysis
    if not analysis and not candidate_skills:
        latest = db.session.query(Analysis).filter_by(user_id=current_user.id).order_by(Analysis.created_at.desc()).first()
        if latest:
            analysis = latest
            target_role = latest.target_role or target_role
            resume_id = latest.resume_id or resume_id

    # Check if there is an existing in-progress session for this analysis/role
    existing_session = None
    if analysis_id:
        existing_session = db.session.query(InterviewSession).filter_by(
            user_id=current_user.id,
            analysis_id=analysis_id,
            status='in_progress'
        ).first()

    if existing_session and len(existing_session.questions) >= 5:
        return jsonify({
            "success": True,
            "session": existing_session.to_dict(),
            "resumed": True
        }), 200

    # Create new session
    session = InterviewSession(
        user_id=current_user.id,
        analysis_id=analysis.id if analysis else None,
        resume_id=resume_id,
        target_role=target_role,
        company_name=company_name,
        interview_type=interview_type,
        difficulty=difficulty,
        status='pending_intro'
    )
    db.session.add(session)
    db.session.flush()

    # Generate 5 interview questions
    generated_questions = generate_mock_interview_questions(
        session=session,
        candidate_skills=candidate_skills,
        target_role=target_role,
        job_description_text=job_desc_text,
        interview_type=interview_type,
        difficulty=difficulty,
        missing_skills=missing_skills
    )

    for q in generated_questions:
        db.session.add(InterviewQuestion(
            session_id=session.id,
            question_index=q["question_index"],
            skill_name=q["skill_name"],
            category=q.get("category", "Technical Domain"),
            difficulty=q.get("difficulty", difficulty),
            question_text=q["question_text"],
            time_guidance=q.get("time_guidance", "2-3 minutes"),
            evaluation={
                "evaluation_criteria": q.get("evaluation_criteria", []),
                "model_answer": q.get("model_answer", ""),
                "why_stronger": q.get("why_stronger", ""),
                "follow_up_questions": q.get("follow_up_questions", []),
                "learning_resources": q.get("learning_resources", [])
            }
        ))

    db.session.commit()
    db.session.refresh(session)

    return jsonify({
        "success": True,
        "message": "AI Mock Interview session created successfully.",
        "session": session.to_dict(include_solutions=False)
    }), 201


@interview_bp.route('/session/<int:session_id>', methods=['GET'])
@token_required
def get_session(current_user, session_id):
    """
    Retrieves the current state of an interview session.
    Protects solutions so unsubmitted questions do not reveal model answers.
    """
    session = db.session.query(InterviewSession).filter_by(id=session_id).first()
    if not session or session.user_id != current_user.id:
        return jsonify({"success": False, "message": "Interview session not found or forbidden."}), 404

    is_completed = session.status == 'completed'
    return jsonify({
        "success": True,
        "session": session.to_dict(include_solutions=is_completed)
    }), 200


@interview_bp.route('/session/<int:session_id>/submit-intro', methods=['POST'])
@token_required
def submit_self_intro(current_user, session_id):
    """
    Submits candidate self-introduction metadata (duration max 3 mins / 180s)
    and transitions session to in_progress to reveal interview questions.
    """
    session = db.session.query(InterviewSession).filter_by(id=session_id).first()
    if not session or session.user_id != current_user.id:
        return jsonify({"success": False, "message": "Interview session not found or forbidden."}), 404

    data = request.get_json(silent=True) or {}
    intro_type = data.get('intro_type', 'video')
    intro_text = data.get('intro_text', '').strip()
    duration_seconds = float(data.get('duration_seconds', 0.0))

    # Strict maximum 3 minutes (180 seconds) ceiling
    if duration_seconds > 185.0:
        duration_seconds = 180.0

    session.intro_type = intro_type
    session.intro_text = intro_text if intro_text else "Self-introduction completed via camera/microphone."
    session.intro_duration_seconds = duration_seconds
    session.intro_completed = True
    session.status = 'in_progress'

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Self-introduction recorded successfully! Proceeding to interview questions.",
        "session": session.to_dict(include_solutions=False)
    }), 200


@interview_bp.route('/session/<int:session_id>/questions/<int:question_id>/submit-answer', methods=['POST'])
@token_required
def submit_question_answer(current_user, session_id, question_id):
    """
    Submits and evaluates candidate answer for an individual question.
    Only reveals the model answer and teaching explanation AFTER submission!
    """
    session = db.session.query(InterviewSession).filter_by(id=session_id).first()
    if not session or session.user_id != current_user.id:
        return jsonify({"success": False, "message": "Interview session not found or forbidden."}), 404

    question = db.session.query(InterviewQuestion).filter_by(id=question_id, session_id=session_id).first()
    if not question:
        return jsonify({"success": False, "message": "Question not found in this session."}), 404

    data = request.get_json(silent=True) or {}
    candidate_answer = (data.get('candidate_answer') or '').strip()
    answer_mode = data.get('answer_mode', 'text')

    if not candidate_answer:
        return jsonify({
            "success": False,
            "message": "Answer text is required for submission."
        }), 400

    existing_eval = question.evaluation or {}
    evaluation_criteria = existing_eval.get("evaluation_criteria", [])
    model_answer = existing_eval.get("model_answer", "")
    why_stronger = existing_eval.get("why_stronger", "")

    # Perform honest AI evaluation
    eval_result = evaluate_candidate_answer(
        question_text=question.question_text,
        candidate_answer=candidate_answer,
        skill_name=question.skill_name,
        difficulty=question.difficulty,
        evaluation_criteria=evaluation_criteria,
        model_answer=model_answer,
        why_stronger=why_stronger
    )

    question.candidate_answer = candidate_answer
    question.answer_mode = answer_mode
    question.is_submitted = True
    question.submitted_at = db.func.now()
    question.score = eval_result["score"]
    question.evaluation = eval_result

    # Recalculate session overall score
    submitted_scores = [
        q.score for q in session.questions if q.score is not None
    ]
    if eval_result["score"] is not None:
        submitted_scores.append(eval_result["score"])
    
    if submitted_scores:
        session.overall_score = round(sum(submitted_scores) / len(submitted_scores), 1)

    db.session.commit()
    db.session.refresh(question)

    return jsonify({
        "success": True,
        "message": "Answer evaluated successfully.",
        "question": question.to_dict(include_solution=True),
        "session_overall_score": session.overall_score
    }), 200


@interview_bp.route('/session/<int:session_id>/complete', methods=['POST'])
@token_required
def complete_interview_session(current_user, session_id):
    """
    Finalizes the mock interview and compiles the Mock Interview Performance Report.
    """
    session = db.session.query(InterviewSession).filter_by(id=session_id).first()
    if not session or session.user_id != current_user.id:
        return jsonify({"success": False, "message": "Interview session not found or forbidden."}), 404

    # Calculate overall metrics
    questions = session.questions
    scores = [q.score for q in questions if q.score is not None]
    overall_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Aggregate competency breakdown
    competency_map = {}
    strong_areas = []
    missing_areas = []

    for q in questions:
        c_name = q.skill_name
        if q.score is not None:
            competency_map[c_name] = q.score
            if q.score >= 75:
                strong_areas.append(f"{c_name} (Score: {q.score}%)")
            else:
                missing_areas.append(f"{c_name} (Score: {q.score}%)")

    # Determine readiness tier
    if overall_score >= 80:
        readiness_verdict = "Interview Ready — High Likelihood of Technical Clearance"
    elif overall_score >= 60:
        readiness_verdict = "Developing Candidate — Solid Foundations with Key Gaps"
    else:
        readiness_verdict = "Remediation Recommended — Targeted Study Required"

    summary = {
        "overall_score": overall_score,
        "readiness_verdict": readiness_verdict,
        "total_questions": len(questions),
        "evaluated_questions": len(scores),
        "competency_scores": competency_map,
        "strong_areas": strong_areas if strong_areas else ["General communication consistency"],
        "areas_for_improvement": missing_areas if missing_areas else ["Deep dive into system scale & edge cases"],
        "recommended_next_steps": [
            f"Review flagged question answers and study the pedagogical model explanations.",
            f"Practice targeted coding exercises in your Career Roadmap.",
            f"Retake this mock interview in 1-2 weeks to verify score progression."
        ]
    }

    session.overall_score = overall_score
    session.performance_summary = summary
    session.status = 'completed'

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Mock interview completed successfully! Executive performance report generated.",
        "session": session.to_dict(include_solutions=True),
        "summary": summary
    }), 200


@interview_bp.route('/history', methods=['GET'])
@token_required
def get_interview_history(current_user):
    """
    Returns candidate's past interview session attempts for progress tracking.
    """
    sessions = db.session.query(InterviewSession).filter_by(
        user_id=current_user.id
    ).order_by(InterviewSession.created_at.desc()).all()

    return jsonify({
        "success": True,
        "history": [s.to_dict(include_solutions=True) for s in sessions]
    }), 200

