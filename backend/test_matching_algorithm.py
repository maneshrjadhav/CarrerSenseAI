"""
CareerSense AI — Focused Resume-to-Job Description Matching Algorithm Unit Tests
Tests:
1. Similar Documents (High TF-IDF cosine similarity & skill overlap)
2. Unrelated Documents (Near-zero similarity, missing skills, honest scoring)
3. Missing Skills Detection (Strict missing classification, zero false-positives)
4. Empty Resume Text (Graceful zero-score handling, no exceptions)
5. Empty Job Description Text (Graceful zero-score handling, no exceptions)
6. Zero-Vector / Stopword-only Documents (Safe vocabulary handling)
7. Exact Formula Verification: final_score = (skill_score * 0.70) + (tfidf_score * 0.30)
8. Skill Normalization & Deduplication (Unique canonical terms)
"""

import sys
import os
import unittest
import math

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.tfidf_matcher import compute_similarity, normalize_whitespace
from services.matching_service import perform_comprehensive_match
from config import Config

class TestMatchingAlgorithm(unittest.TestCase):

    def setUp(self):
        # Sample realistic documents
        self.tech_resume = """
        Manesh Dhanawade
        Full Stack Software Engineer
        Skills: Python, React, Flask, MySQL, Docker, REST APIs, Git, JavaScript.
        Experience:
        - Developed web applications using Python and Flask with MySQL database integration.
        - Built interactive frontend user interfaces using React and JavaScript.
        - Containerized services with Docker and managed source code with Git.
        """

        self.tech_jd_similar = """
        Senior Full Stack Engineer
        We are seeking a talented Full Stack Software Engineer to build robust web services.
        Requirements:
        - Strong proficiency in Python, Flask, and React.
        - Hands-on experience with MySQL relational database design and REST APIs.
        - Experience with Git version control and Docker containerization.
        Responsibilities:
        - Design and implement scalable backend APIs using Flask and Python.
        - Develop responsive, dynamic components in React.
        """

        self.tech_jd_with_gaps = """
        Cloud Full Stack Engineer
        Requirements:
        - Python, Flask, React.
        - Must have deep experience with Kubernetes cluster management and AWS cloud infrastructure.
        - GraphQL API design experience is required.
        """

        self.unrelated_jd = """
        Executive Pastry Chef & Baker
        Requirements:
        - Minimum 5 years of commercial baking and French pastry preparation experience.
        - Expertise in artisanal bread baking, sourdough fermentation, chocolate tempering, and cake decoration.
        - Maintain kitchen hygiene, food sanitation standards, and recipe consistency.
        """

    def test_01_similar_documents(self):
        """Test 1: Similar documents yield high TF-IDF similarity and high skill match."""
        # Test 1A: Identical text yields 1.0 (100%) cosine similarity
        identical_sim = compute_similarity(self.tech_resume, self.tech_resume)
        self.assertAlmostEqual(identical_sim["cosine_similarity"], 1.0, places=2)
        self.assertAlmostEqual(identical_sim["similarity_percentage"], 100.0, places=1)

        # Test 1B: Domain-similar documents yield strong cosine similarity
        sim_res = compute_similarity(self.tech_resume, self.tech_jd_similar)
        self.assertGreater(sim_res["cosine_similarity"], 0.20, "Cosine similarity should reflect meaningful textual overlap")
        self.assertGreater(sim_res["similarity_percentage"], 20.0)
        self.assertGreater(sim_res["vocabulary_size"], 10)

        match_res = perform_comprehensive_match(self.tech_resume, self.tech_jd_similar, "Senior Full Stack Engineer")
        metrics = match_res["metrics"]

        # Component scores
        self.assertGreater(metrics["skill_score"], 60.0, "Skill score should be high for matching skills")
        self.assertGreater(metrics["final_score"], 45.0, "Final match score should reflect high qualification")
        self.assertGreaterEqual(metrics["matched_skills_count"], 4, "Should match core common skills")

        # Verify formula: final_score = (skill_score * 0.70) + (tfidf_score * 0.30)
        expected_final = round((metrics["skill_score"] * 0.70) + (metrics["tfidf_score"] * 0.30), 1)
        self.assertAlmostEqual(metrics["final_score"], expected_final, places=1)

    def test_02_unrelated_documents(self):
        """Test 2: Unrelated documents yield near-zero TF-IDF similarity and zero skill match."""
        sim_res = compute_similarity(self.tech_resume, self.unrelated_jd)
        self.assertLess(sim_res["cosine_similarity"], 0.15, "Cosine similarity must be near zero for unrelated domains")
        self.assertLess(sim_res["similarity_percentage"], 15.0)

        match_res = perform_comprehensive_match(self.tech_resume, self.unrelated_jd, "Pastry Chef")
        metrics = match_res["metrics"]

        # No software engineering skills should falsely match culinary chef requirements
        self.assertEqual(metrics["matched_skills_count"], 0, "No tech skills should match culinary requisition")
        self.assertEqual(metrics["skill_score"], 0.0, "Skill score must be zero when zero requirements are met")
        self.assertLess(metrics["final_score"], 10.0, "Final score must be low for completely unrelated job")

    def test_03_missing_skills_detection(self):
        """Test 3: Missing required skills are correctly identified and never classified as matched."""
        resume_pure_backend = """
        Backend Developer
        Skills: Python, Flask.
        Built REST APIs with Python and Flask.
        """
        match_res = perform_comprehensive_match(resume_pure_backend, self.tech_jd_with_gaps, "Cloud Full Stack Engineer")
        matched_names = {s["skill_name"] for s in match_res["matched_skills"]}
        missing_names = {s["skill_name"] for s in match_res["missing_skills"]}

        # Python and Flask should match
        self.assertIn("Python", matched_names)
        self.assertIn("Flask", matched_names)

        # Kubernetes, AWS, and React must be identified as missing
        self.assertIn("Kubernetes", missing_names, "Kubernetes is missing from candidate resume")
        self.assertIn("AWS", missing_names, "AWS is missing from candidate resume")
        self.assertIn("React", missing_names, "React is missing from candidate resume")

        # Missing skills must NEVER appear in matched skills
        intersection = matched_names.intersection(missing_names)
        self.assertEqual(len(intersection), 0, "Missing skills must never be classified as matched")

        # Verify weights for missing skills are strictly 0.0
        for m in match_res["missing_skills"]:
            self.assertEqual(m["weight"], 0.0, "Missing skill weight must strictly be 0.0")

        # Also verify related technology bridge when candidate has foundational skill (Docker -> Kubernetes)
        bridge_res = perform_comprehensive_match(self.tech_resume, self.tech_jd_with_gaps, "Cloud Full Stack Engineer")
        partial_names = {s["skill_name"] for s in bridge_res["partial_matches"]}
        self.assertIn("Kubernetes", partial_names, "Docker in resume should bridge to Kubernetes as partial match")

    def test_04_empty_resume_text(self):
        """Test 4: Empty or whitespace-only resume text is handled safely with 0 scores and no crashes."""
        empty_variations = ["", "   ", "\n\t  \r\n", None]
        for empty_text in empty_variations:
            sim_res = compute_similarity(empty_text, self.tech_jd_similar)
            self.assertEqual(sim_res["cosine_similarity"], 0.0)
            self.assertEqual(sim_res["similarity_percentage"], 0.0)

            match_res = perform_comprehensive_match(empty_text or "", self.tech_jd_similar, "Software Engineer")
            metrics = match_res["metrics"]
            self.assertEqual(metrics["matched_skills_count"], 0)
            self.assertEqual(metrics["skill_score"], 0.0)
            self.assertEqual(metrics["tfidf_score"], 0.0)
            self.assertEqual(metrics["final_score"], 0.0)

    def test_05_empty_jd_text(self):
        """Test 5: Empty or whitespace-only job description is handled safely with 0 scores and no crashes."""
        empty_variations = ["", "   ", "\n\t  \r\n", None]
        for empty_text in empty_variations:
            sim_res = compute_similarity(self.tech_resume, empty_text)
            self.assertEqual(sim_res["cosine_similarity"], 0.0)
            self.assertEqual(sim_res["similarity_percentage"], 0.0)

            match_res = perform_comprehensive_match(self.tech_resume, empty_text or "", "Software Engineer")
            metrics = match_res["metrics"]
            self.assertEqual(metrics["skill_score"], 0.0)
            self.assertEqual(metrics["tfidf_score"], 0.0)
            self.assertEqual(metrics["final_score"], 0.0)

    def test_06_zero_vector_and_stopword_documents(self):
        """Test 6: Documents containing exclusively stopwords or symbols return safe 0 vectors without error."""
        stopword_doc = "the and or of to in a is that for on with as by at from"
        sim_res = compute_similarity(stopword_doc, stopword_doc)
        self.assertEqual(sim_res["cosine_similarity"], 0.0)
        self.assertEqual(sim_res["similarity_percentage"], 0.0)

    def test_07_weighted_formula_strict_verification(self):
        """Test 7: Validates final_score = (skill_score * 0.70) + (tfidf_score * 0.30) bounds and precision."""
        match_res = perform_comprehensive_match(self.tech_resume, self.tech_jd_similar, "Full Stack Engineer")
        metrics = match_res["metrics"]

        skill_score = metrics["skill_score"]
        tfidf_score = metrics["tfidf_score"]
        final_score = metrics["final_score"]

        # Component scores must be percentages between 0 and 100
        self.assertGreaterEqual(skill_score, 0.0)
        self.assertLessEqual(skill_score, 100.0)
        self.assertGreaterEqual(tfidf_score, 0.0)
        self.assertLessEqual(tfidf_score, 100.0)
        self.assertGreaterEqual(final_score, 0.0)
        self.assertLessEqual(final_score, 100.0)

        # Precise 70/30 mathematical verification
        expected = round((skill_score * 0.70) + (tfidf_score * 0.30), 1)
        self.assertEqual(final_score, expected)

    def test_08_skill_normalization_and_deduplication(self):
        """Test 8: Ensures resume_skills and required_jd_skills contain unique normalized terms without duplicates."""
        resume_with_aliases = """
        Skills: JS, JavaScript, react.js, ReactJS, Python, python3, postgres, PostgreSQL.
        """
        match_res = perform_comprehensive_match(resume_with_aliases, self.tech_jd_similar, "Engineer")

        resume_skills = match_res["resume_skills"]
        # Must be unique
        self.assertEqual(len(resume_skills), len(set(resume_skills)), "resume_skills must not contain duplicate entries")

        # Canonical normalization check
        self.assertIn("JavaScript", resume_skills)
        self.assertIn("React", resume_skills)
        self.assertIn("Python", resume_skills)
        self.assertIn("PostgreSQL", resume_skills)

        # Alias names should not be separate duplicates
        self.assertNotIn("JS", resume_skills)
        self.assertNotIn("react.js", resume_skills)
        self.assertNotIn("ReactJS", resume_skills)
        self.assertNotIn("python3", resume_skills)

        # Check required_jd_skills deduplication
        req_skills = match_res["required_jd_skills"]
        self.assertEqual(len(req_skills), len(set(req_skills)), "required_jd_skills must not contain duplicate entries")

if __name__ == "__main__":
    unittest.main()
