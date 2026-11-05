"""
CareerSense AI — Shared Score Feedback Configuration (Backend)
Configurable thresholds for Resume Quality and Job Match Scoring.
Strictly enforces:
- 80% threshold is inclusive (>= 80.0)
- Decoupled messages for Resume Quality vs. Job Matching
"""

RESUME_QUALITY_THRESHOLDS = {
    "HIGH": 80.0,
    "MODERATE": 60.0
}

JOB_MATCH_THRESHOLDS = {
    "HIGH": 80.0,
    "MODERATE": 60.0
}

def get_resume_quality_feedback(score: float) -> str:
    """Returns friendly encouraging feedback for Resume Quality."""
    try:
        val = float(score or 0)
    except (ValueError, TypeError):
        val = 0.0

    if val >= RESUME_QUALITY_THRESHOLDS["HIGH"]:
        return "🎉 Great work! Your resume looks strong. Let's make it even better for your target role!"
    elif val >= RESUME_QUALITY_THRESHOLDS["MODERATE"]:
        return "👍 Good start! A few improvements can make your resume more effective."
    else:
        return "💪 Don't worry! Let's improve your resume step by step."

def get_job_match_feedback(score: float) -> str:
    """Returns friendly encouraging feedback for Job Match Score."""
    try:
        val = float(score or 0)
    except (ValueError, TypeError):
        val = 0.0

    if val >= JOB_MATCH_THRESHOLDS["HIGH"]:
        return "🎉 Excellent match! Your skills align well with this role. You're ready to explore interview preparation."
    elif val >= JOB_MATCH_THRESHOLDS["MODERATE"]:
        return "🚀 Good progress! Strengthen a few missing skills to improve your alignment."
    else:
        return "🌱 Every expert starts somewhere! Let's build the missing skills with a personalized roadmap."

def get_job_match_conditional_action(score: float, match_id=None) -> dict:
    """Returns conditional action metadata based on Final Job Match Score."""
    try:
        val = float(score or 0)
    except (ValueError, TypeError):
        val = 0.0

    is_high = val >= JOB_MATCH_THRESHOLDS["HIGH"]
    m_id_str = f"/{match_id}" if match_id else ""

    if is_high:
        return {
            "action": "interview_prep",
            "is_interview_ready": True,
            "button_text": "Start Interview Preparation",
            "route": f"/interview-prep{m_id_str}",
            "encouraging_message": "🎉 Excellent match! Your profile aligns strongly with this job. You're ready to prepare for the interview.",
            "status": "Interview Ready"
        }
    else:
        return {
            "action": "career_roadmap",
            "is_interview_ready": False,
            "button_text": "Build My Career Roadmap",
            "route": f"/career-roadmap{m_id_str}",
            "encouraging_message": "🚀 You can improve your match! Let's identify your skill gaps and build a focused learning plan.",
            "status": "Skill Improvement Recommended"
        }

