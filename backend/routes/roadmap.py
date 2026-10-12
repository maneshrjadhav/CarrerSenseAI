"""
Personalized Career Roadmap Routes
Handles roadmap progress tracking, milestone updates, sequential progression,
and assessment quiz grading in MySQL.
CareerSense AI - Final Year Engineering Project
"""

from flask import Blueprint, request, jsonify
from extensions import db
from models.roadmap import Roadmap, RoadmapItem
from models.subscription import SubscriptionPlan
from utils.auth_helper import token_required
from services.subscription_service import check_feature_access

roadmap_bp = Blueprint('roadmap', __name__)

def update_item_progress_internal(current_user, item_id):
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

    item = db.session.query(RoadmapItem).filter_by(id=item_id).first()
    if not item:
        return jsonify({"success": False, "message": "Roadmap milestone not found."}), 404

    roadmap = db.session.query(Roadmap).filter_by(id=item.roadmap_id).first()
    if not roadmap or roadmap.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot modify this roadmap."}), 403

    data = request.get_json(silent=True) or {}
    new_progress = data.get('progress') if data.get('progress') is not None else data.get('progress_percentage')
    new_status = data.get('status')
    new_tasks = data.get('tasks') if data.get('tasks') is not None else data.get('daily_tasks_completed')

    # Sequential progression & prerequisite locking check:
    # Milestones with order_index > 1 require all earlier milestones to be 'Completed'
    all_roadmap_items = db.session.query(RoadmapItem)\
        .filter_by(roadmap_id=roadmap.id)\
        .order_by(RoadmapItem.order_index.asc())\
        .all()

    prior_uncompleted = [
        it for it in all_roadmap_items
        if it.order_index < item.order_index and it.status != 'Completed'
    ]

    is_trying_to_advance = (
        new_status in ['In Progress', 'Completed'] or
        (new_progress is not None and int(new_progress) > 0) or
        (new_tasks is not None and any(isinstance(t, dict) and t.get('is_completed') for t in new_tasks))
    )

    if prior_uncompleted and is_trying_to_advance:
        prior_names = ", ".join([f"Phase {it.phase_number} ({it.skill_name})" for it in prior_uncompleted])
        return jsonify({
            "success": False,
            "locked": True,
            "message": f"Phase {item.phase_number} ({item.skill_name}) is locked. You must complete {prior_names} (all daily tasks + quiz >= 80%) before starting this phase."
        }), 400

    if new_progress is not None:
        try:
            val = int(new_progress)
            val = max(0, min(100, val))
            item.progress = val
            if not new_status:
                if val == 100:
                    item.status = 'Completed'
                elif val > 0:
                    item.status = 'In Progress'
                else:
                    item.status = 'Not Started'
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid progress percentage."}), 400

    if new_status:
        if new_status in ['Not Started', 'In Progress', 'Completed']:
            item.status = new_status
            if new_status == 'Completed' and (new_progress is None or item.progress < 100):
                item.progress = 100
            elif new_status == 'Not Started' and (new_progress is None or item.progress > 0):
                item.progress = 0
            elif new_status == 'In Progress' and item.progress == 0:
                item.progress = 25

    if new_tasks is not None:
        if isinstance(new_tasks, list) and len(new_tasks) > 0 and isinstance(new_tasks[0], int):
            existing_t = [dict(t) for t in (item.tasks or [])]
            for idx, t in enumerate(existing_t):
                if isinstance(t, dict):
                    t['is_completed'] = (idx in new_tasks)
            item.tasks = existing_t
        else:
            item.tasks = new_tasks

        if new_progress is None and isinstance(item.tasks, list) and len(item.tasks) > 0:
            done_t = len([t for t in item.tasks if isinstance(t, dict) and t.get('is_completed')])
            calc_prog = int(round((done_t / len(item.tasks)) * 100))
            item.progress = calc_prog
            if calc_prog == 100:
                item.status = 'Completed'
            elif calc_prog > 0:
                item.status = 'In Progress'
            else:
                item.status = 'Not Started'

    # Recalculate Roadmap overall progress
    all_items = db.session.query(RoadmapItem).filter_by(roadmap_id=roadmap.id).all()
    if all_items:
        total_prog = sum(i.progress for i in all_items)
        roadmap.overall_progress = int(round(total_prog / len(all_items)))
    else:
        roadmap.overall_progress = 0

    try:
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Milestone progress updated successfully.",
            "item": item.to_dict(),
            "roadmap_id": roadmap.id,
            "overall_progress": roadmap.overall_progress
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Database error updating progress: {str(e)}"
        }), 500

def submit_quiz_internal(current_user, item_id):
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

    item = db.session.query(RoadmapItem).filter_by(id=item_id).first()
    if not item:
        return jsonify({"success": False, "message": "Roadmap milestone not found."}), 404

    roadmap = db.session.query(Roadmap).filter_by(id=item.roadmap_id).first()
    if not roadmap or roadmap.user_id != current_user.id:
        return jsonify({"success": False, "message": "Forbidden: You cannot modify this roadmap."}), 403

    # Check prerequisite locking
    all_roadmap_items = db.session.query(RoadmapItem)\
        .filter_by(roadmap_id=roadmap.id)\
        .order_by(RoadmapItem.order_index.asc())\
        .all()

    prior_uncompleted = [
        it for it in all_roadmap_items
        if it.order_index < item.order_index and it.status != 'Completed'
    ]
    if prior_uncompleted:
        prior_names = ", ".join([f"Phase {it.phase_number} ({it.skill_name})" for it in prior_uncompleted])
        return jsonify({
            "success": False,
            "locked": True,
            "message": f"Phase {item.phase_number} is locked. You must complete {prior_names} before taking this assessment."
        }), 400

    from services.curriculum_data import get_skill_curriculum
    curriculum = get_skill_curriculum(item.skill_name)
    quiz_questions = curriculum.get('quiz', [])

    if not quiz_questions:
        return jsonify({"success": False, "message": "No assessment quiz found for this milestone."}), 404

    data = request.get_json(silent=True) or {}
    submitted_answers = data.get('answers', {})
    if isinstance(submitted_answers, list):
        submitted_answers = {
            q.get('id'): (submitted_answers[idx] if idx < len(submitted_answers) else None)
            for idx, q in enumerate(quiz_questions)
        }

    total_questions = len(quiz_questions)
    correct_count = 0
    question_results = []

    for q in quiz_questions:
        q_id = str(q.get('id'))
        user_choice = submitted_answers.get(q_id)
        if user_choice is None:
            user_choice = submitted_answers.get(q.get('id'))

        is_correct = (user_choice is not None and int(user_choice) == int(q.get('correct_index', 0)))
        if is_correct:
            correct_count += 1

        question_results.append({
            "id": q.get('id'),
            "question": q.get('question'),
            "selected_index": user_choice,
            "correct_index": q.get('correct_index'),
            "is_correct": is_correct,
            "explanation": q.get('explanation')
        })

    score_percent = int(round((correct_count / total_questions) * 100))
    passed = score_percent >= 80

    current_tasks = item.tasks if isinstance(item.tasks, list) else []
    all_tasks_completed = len(current_tasks) == 0 or all(
        bool(t.get('is_completed')) for t in current_tasks if isinstance(t, dict)
    )

    if passed and all_tasks_completed:
        item.status = 'Completed'
        item.progress = 100
    elif passed:
        item.status = 'In Progress'
        if item.progress < 75:
            item.progress = 75
    else:
        if item.status == 'Not Started':
            item.status = 'In Progress'
            if item.progress < 25:
                item.progress = 25

    next_item = next((it for it in all_roadmap_items if it.order_index == item.order_index + 1), None)
    next_unlocked = bool(item.status == 'Completed' and next_item)

    total_prog = sum(i.progress for i in all_roadmap_items)
    roadmap.overall_progress = int(round(total_prog / len(all_roadmap_items))) if all_roadmap_items else 0

    try:
        db.session.commit()
        return jsonify({
            "success": True,
            "score": score_percent,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "passed": passed,
            "threshold": 80,
            "all_tasks_completed": all_tasks_completed,
            "phase_completed": item.status == 'Completed',
            "item_status": item.status,
            "next_unlocked": next_unlocked,
            "next_phase": next_item.to_dict() if (next_unlocked and next_item) else None,
            "results": question_results,
            "item": item.to_dict(),
            "overall_progress": roadmap.overall_progress
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Database error saving quiz: {str(e)}"}), 500

@roadmap_bp.route('/items/<int:item_id>', methods=['PATCH', 'POST'])
@roadmap_bp.route('/items/<int:item_id>/progress', methods=['PATCH', 'POST'])
@token_required
def update_item_progress(current_user, item_id):
    return update_item_progress_internal(current_user, item_id)

@roadmap_bp.route('/items/<int:item_id>/quiz-submit', methods=['POST'])
@token_required
def submit_quiz_route(current_user, item_id):
    return submit_quiz_internal(current_user, item_id)

@roadmap_bp.route('/active', methods=['GET'])
@token_required
def get_active_roadmap(current_user):
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

    roadmap = db.session.query(Roadmap)\
        .filter_by(user_id=current_user.id)\
        .order_by(Roadmap.created_at.desc())\
        .first()

    if not roadmap:
        return jsonify({
            "success": True,
            "has_roadmap": False,
            "roadmap": None,
            "message": "No active career roadmap found."
        }), 200

    return jsonify({
        "success": True,
        "has_roadmap": True,
        "roadmap": roadmap.to_dict()
    }), 200


