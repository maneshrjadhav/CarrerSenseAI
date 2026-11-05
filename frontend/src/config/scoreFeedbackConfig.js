/**
 * CareerSense AI — Shared Score Feedback Configuration
 * Configurable thresholds for Resume Quality and Job Match Scoring.
 * Strictly enforces:
 * - 80% threshold is inclusive (>= 80.0)
 * - Decoupled messages for Resume Quality vs. Job Matching
 */

export const SCORE_THRESHOLDS = {
  HIGH_INCLUSIVE: 80.0,
  MODERATE_INCLUSIVE: 60.0,
};

/**
 * Returns context-aware, friendly encouraging feedback for Resume Quality.
 * @param {number} score - Resume quality score (0 - 100)
 * @returns {string} Friendly message with emoji
 */
export function getResumeQualityFeedback(score) {
  const numScore = parseFloat(score || 0);
  if (numScore >= SCORE_THRESHOLDS.HIGH_INCLUSIVE) {
    return "🎉 Great work! Your resume looks strong. Let's make it even better for your target role!";
  }
  if (numScore >= SCORE_THRESHOLDS.MODERATE_INCLUSIVE) {
    return "👍 Good start! A few improvements can make your resume more effective.";
  }
  return "💪 Don't worry! Let's improve your resume step by step.";
}

/**
 * Returns context-aware, encouraging feedback for Job Match Score.
 * @param {number} score - Final job match score (0 - 100)
 * @returns {string} Friendly message with emoji
 */
export function getJobMatchFeedback(score) {
  const numScore = parseFloat(score || 0);
  if (numScore >= SCORE_THRESHOLDS.HIGH_INCLUSIVE) {
    return "🎉 Excellent match! Your skills align well with this role. You're ready to explore interview preparation.";
  }
  if (numScore >= SCORE_THRESHOLDS.MODERATE_INCLUSIVE) {
    return "🚀 Good progress! Strengthen a few missing skills to improve your alignment.";
  }
  return "🌱 Every expert starts somewhere! Let's build the missing skills with a personalized roadmap.";
}

/**
 * Returns conditional primary CTA and action metadata based on Final Job Match Score.
 * @param {number} score - Final job match score (0 - 100)
 * @param {string|number} matchId - The analysis / match ID
 * @returns {object} Action configuration
 */
export function getJobMatchConditionalAction(score, matchId) {
  const numScore = parseFloat(score || 0);
  const isHighMatch = numScore >= SCORE_THRESHOLDS.HIGH_INCLUSIVE;

  if (isHighMatch) {
    return {
      action: 'interview_prep',
      isInterviewReady: true,
      buttonText: 'Start Interview Preparation',
      route: matchId ? `/interview-prep/${matchId}` : '/interview-prep',
      encouragingMessage: "🎉 Excellent match! Your profile aligns strongly with this job. You're ready to prepare for the interview.",
      badgeLabel: 'Interview Ready',
      badgeVariant: 'emerald',
    };
  }

  return {
    action: 'career_roadmap',
    isInterviewReady: false,
    buttonText: 'Build My Career Roadmap',
    route: matchId ? `/career-roadmap/${matchId}` : '/career-roadmap',
    encouragingMessage: "🚀 You can improve your match! Let's identify your skill gaps and build a focused learning plan.",
    badgeLabel: 'Skill Improvement Recommended',
    badgeVariant: 'amber',
  };
}

