import unittest

from services.readiness_service import evaluate_interview_readiness
from utils.score_feedback import (
    get_resume_quality_feedback,
    get_job_match_feedback,
    get_job_match_conditional_action,
)


class ReadinessBoundaryTests(unittest.TestCase):
    def evaluate(self, score, gaps=None):
        analysis = {"match_score": score}
        return evaluate_interview_readiness(analysis, gaps or [])

    def test_score_below_80_routes_to_roadmap(self):
        result = self.evaluate(79.9)
        self.assertFalse(result["is_interview_ready"])
        self.assertEqual(result["recommended_action"], "create_roadmap")

    def test_score_exactly_80_routes_to_interview(self):
        result = self.evaluate(80.0)
        self.assertTrue(result["is_interview_ready"])
        self.assertEqual(result["recommended_action"], "prepare_interview")

    def test_score_above_80_routes_to_interview(self):
        result = self.evaluate(80.1)
        self.assertTrue(result["is_interview_ready"])
        self.assertEqual(result["recommended_action"], "prepare_interview")

    def test_resume_quality_feedback_tiers(self):
        # High >= 80.0
        self.assertIn("🎉 Great work!", get_resume_quality_feedback(80.0))
        self.assertIn("🎉 Great work!", get_resume_quality_feedback(95.0))
        # Moderate 60.0 - 79.9
        self.assertIn("👍 Good start!", get_resume_quality_feedback(79.9))
        self.assertIn("👍 Good start!", get_resume_quality_feedback(60.0))
        # Low < 60.0
        self.assertIn("💪 Don't worry!", get_resume_quality_feedback(59.9))
        self.assertIn("💪 Don't worry!", get_resume_quality_feedback(0.0))

    def test_job_match_feedback_tiers(self):
        # High >= 80.0
        self.assertIn("🎉 Excellent match!", get_job_match_feedback(80.0))
        self.assertIn("🎉 Excellent match!", get_job_match_feedback(88.5))
        # Moderate 60.0 - 79.9
        self.assertIn("🚀 Good progress!", get_job_match_feedback(79.9))
        self.assertIn("🚀 Good progress!", get_job_match_feedback(60.0))
        # Low < 60.0
        self.assertIn("🌱 Every expert starts somewhere!", get_job_match_feedback(59.9))
        self.assertIn("🌱 Every expert starts somewhere!", get_job_match_feedback(15.0))

    def test_job_match_conditional_action_below_80(self):
        action = get_job_match_conditional_action(79.9, match_id=42)
        self.assertFalse(action["is_interview_ready"])
        self.assertEqual(action["button_text"], "Build My Career Roadmap")
        self.assertEqual(action["route"], "/career-roadmap/42")
        self.assertEqual(action["action"], "career_roadmap")
        self.assertIn("🚀 You can improve your match!", action["encouraging_message"])

    def test_job_match_conditional_action_at_80(self):
        action = get_job_match_conditional_action(80.0, match_id=42)
        self.assertTrue(action["is_interview_ready"])
        self.assertEqual(action["button_text"], "Start Interview Preparation")
        self.assertEqual(action["route"], "/interview-prep/42")
        self.assertEqual(action["action"], "interview_prep")
        self.assertIn("🎉 Excellent match!", action["encouraging_message"])


if __name__ == "__main__":
    unittest.main()
