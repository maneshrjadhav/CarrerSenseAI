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

  const scoreMeetsThreshold = matchScore >= READINESS_THRESHOLD;
  const isReady = scoreMeetsThreshold;
  const highPriorityGaps = (skillGaps || []).filter(g => {
    const priority = (g.priority || '').toUpperCase();
    return priority === 'HIGH';
  });
  const criticalCount = highPriorityGaps.length;

  return {
    isReady,
    matchScore,
    threshold: READINESS_THRESHOLD,
    criticalCount,
    criticalGaps: highPriorityGaps.map(g => g.skill_name || g.name || 'Skill'),
    totalGapsCount: (skillGaps || []).length,
    status: isReady ? 'Interview Ready' : 'Skill Improvement Recommended',
    badgeVariant: isReady ? 'success' : 'warning',
    actionLabel: isReady ? 'Start Interview Preparation' : 'Build My Career Roadmap',
    actionRoute: (id) => isReady ? `/interview-prep/${id}` : `/career-roadmap/${id}`,
    headline: isReady
      ? "🎉 Excellent match! Your profile aligns strongly with this job. You're ready to prepare for the interview."
      : "🚀 You can improve your match! Let's identify your skill gaps and build a focused learning plan.",
    encouragingMessage: isReady
      ? "🎉 Excellent match! Your profile aligns strongly with this job. You're ready to prepare for the interview."
      : "🚀 You can improve your match! Let's identify your skill gaps and build a focused learning plan.",
    reason: isReady
      ? `Your match score of ${matchScore.toFixed(1)}% meets the ${READINESS_THRESHOLD}% readiness threshold.`
      : `Match score (${matchScore.toFixed(1)}%) is below the ${READINESS_THRESHOLD}% readiness threshold.`
  };
}

