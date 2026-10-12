/**
 * CareerSense AI — Centralized Interview Readiness Decision Helper
 * Synchronized with backend readiness_service.py logic:
 * - Match Score threshold: 80.0%
 * - Critical missing skills: 0 HIGH-priority gaps allowed
 */

export const READINESS_THRESHOLD = 80.0;
export const MAX_CRITICAL_GAPS = 0;

export function evaluateReadiness(score = 0, skillGaps = []) {
  const matchScore = parseFloat(score || 0);

  const highPriorityGaps = (skillGaps || []).filter(g => {
    const priority = (g.priority || '').toUpperCase();
    return priority === 'HIGH';
  });

  const criticalCount = highPriorityGaps.length;
  const scoreMeetsThreshold = matchScore >= READINESS_THRESHOLD;
  const criticalCleared = criticalCount <= MAX_CRITICAL_GAPS;

  const isReady = scoreMeetsThreshold && criticalCleared;

  return {
    isReady,
    matchScore,
    threshold: READINESS_THRESHOLD,
    criticalCount,
    criticalGaps: highPriorityGaps.map(g => g.skill_name || g.name || 'Skill'),
    totalGapsCount: (skillGaps || []).length,
    status: isReady ? 'Interview Ready' : 'Skill Improvement Recommended',
    badgeVariant: isReady ? 'success' : 'warning',
    actionLabel: isReady ? 'Prepare Your Interview →' : 'Create My Career Roadmap →',
    actionRoute: (id) => isReady ? `/interview-prep/${id}` : `/career-roadmap/${id}`,
    headline: isReady
      ? 'Great Match! You are Ready for Technical Interview Practice.'
      : 'Skill Remediation Recommended Before Interview Practice.',
    reason: isReady
      ? `Your match score of ${matchScore.toFixed(1)}% meets the ${READINESS_THRESHOLD}% readiness threshold with zero critical skill gaps.`
      : (!scoreMeetsThreshold && !criticalCleared)
        ? `Match score (${matchScore.toFixed(1)}%) is below ${READINESS_THRESHOLD}% and ${criticalCount} critical core skill(s) are missing.`
        : !scoreMeetsThreshold
          ? `Match score (${matchScore.toFixed(1)}%) is below the ${READINESS_THRESHOLD}% readiness threshold.`
          : `${criticalCount} critical core skill(s) must be acquired before formal interviews.`
  };
}

