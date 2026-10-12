"""
Interview Readiness Decision Service
Centralized evaluation logic for CareerSense AI.
Determines whether a candidate meets the interview-readiness threshold
or should be routed to the Career Roadmap.
"""
from typing import Dict, Any, List

DEFAULT_READINESS_THRESHOLD = 80.0
DEFAULT_MAX_CRITICAL_GAPS = 0

def evaluate_interview_readiness(
    analysis: Any,
    skill_gaps: List[Any],
    threshold: float = None,
    max_critical_gaps: int = None
) -> Dict[str, Any]:
    """
    Evaluates whether a candidate is ready for mock interview preparation.

    Criteria:
    1. Overall Job Match Score >= threshold (default: 80.0%)
    2. Critical missing skills count <= max_critical_gaps (default: 0 HIGH priority gaps)
    
    A high score alone does not grant readiness if critical core skills are missing.
    """
    if threshold is None:
        threshold = DEFAULT_READINESS_THRESHOLD
    if max_critical_gaps is None:
        max_critical_gaps = DEFAULT_MAX_CRITICAL_GAPS

    match_score = 0.0
    if analysis:
        if isinstance(analysis, dict):
            match_score = round(float(analysis.get('match_score', 0) or 0), 1)
        else:
            match_score = round(float(getattr(analysis, 'match_score', 0) or 0), 1)

    # Process gaps
    high_priority_gaps = []
    medium_priority_gaps = []
    low_priority_gaps = []

    for gap in (skill_gaps or []):
        if isinstance(gap, dict):
            p = (gap.get('priority') or 'HIGH').upper()
            name = gap.get('skill_name') or 'Unknown'
        else:
            p = (getattr(gap, 'priority', 'HIGH') or 'HIGH').upper()
            name = getattr(gap, 'skill_name', 'Unknown')

        if p == 'HIGH':
            high_priority_gaps.append(name)
        elif p == 'MEDIUM':
            medium_priority_gaps.append(name)
        else:
            low_priority_gaps.append(name)

    critical_count = len(high_priority_gaps)
    total_gaps_count = len(high_priority_gaps) + len(medium_priority_gaps) + len(low_priority_gaps)

    # Decision logic
    score_meets_threshold = match_score >= threshold
    critical_skills_cleared = critical_count <= max_critical_gaps

    is_ready = score_meets_threshold and critical_skills_cleared

    if is_ready:
        status = "Interview Ready"
        headline = "Great Match! You are Ready for Technical Interview Practice."
        reason = (
            f"Your match score of {match_score}% meets the {threshold}% readiness threshold, "
            f"and you have zero critical missing skills."
        )
        recommended_action = "prepare_interview"
        action_button_label = "Prepare Your Interview →"
    else:
        status = "Skill Improvement Recommended"
        recommended_action = "create_roadmap"
        action_button_label = "Create My Career Roadmap →"
        
        reasons = []
        if not score_meets_threshold:
            reasons.append(f"Match score ({match_score}%) is below the {threshold}% readiness threshold")
        if not critical_skills_cleared:
            reasons.append(f"{critical_count} critical required skill(s) missing: {', '.join(high_priority_gaps[:3])}")
        
        headline = "Skill Remediation Recommended Before Interview Practice."
        reason = " and ".join(reasons) + ". We recommend completing your personalized Career Roadmap first."

    return {
        "is_interview_ready": is_ready,
        "match_score": match_score,
        "threshold": threshold,
        "critical_missing_count": critical_count,
        "critical_missing_skills": high_priority_gaps,
        "total_gaps_count": total_gaps_count,
        "status": status,
        "headline": headline,
        "reason": reason,
        "recommended_action": recommended_action,
        "action_button_label": action_button_label
    }
