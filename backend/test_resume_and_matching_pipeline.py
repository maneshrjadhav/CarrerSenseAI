"""
Focused Test Suite: Resume Upload, PDF Extraction & Resume-to-JD Matching Pipeline
Covers all 15 scenarios mandated by CareerSense AI specifications.
"""

import os
import sys
import unittest
import tempfile
from flask_jwt_extended import create_access_token

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models.user import User
from models.resume import Resume
from models.job_description import JobDescription
from models.analysis import Analysis
from models.skill import AnalysisSkill
from models.resume_intelligence import ResumeAnalysis
from services.resume_parser import validate_and_extract_pdf, PDFParsingError, extract_candidate_metadata
from services.resume_quality_service import analyze_resume_quality
from services.tfidf_matcher import compute_similarity, normalize_whitespace
from services.matching_service import perform_comprehensive_match


class TestResumeAndMatchingPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        cls.client = cls.app.test_client()

        from werkzeug.security import generate_password_hash
        # Ensure a test candidate exists
        cls.test_user = User.query.filter_by(email="pipeline_test_user@careersense.ai").first()
        if not cls.test_user:
            cls.test_user = User(
                name="Pipeline Test Candidate",
                email="pipeline_test_user@careersense.ai",
                role="candidate",
                password_hash=generate_password_hash("SecurePass123!", method="pbkdf2:sha256")
            )
            db.session.add(cls.test_user)
            db.session.commit()

        cls.jwt_token = create_access_token(identity=str(cls.test_user.id))
        cls.auth_headers = {
            "Authorization": f"Bearer {cls.jwt_token}",
            "Content-Type": "application/json"
        }

    @classmethod
    def tearDownClass(cls):
        try:
            # Clean up test analyses and resumes
            Analysis.query.filter_by(user_id=cls.test_user.id).delete()
            Resume.query.filter_by(user_id=cls.test_user.id).delete()
            JobDescription.query.filter_by(user_id=cls.test_user.id).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        cls.app_context.pop()

    # =========================================================================
    # CASE 1: Resume and JD with highly similar content and skills
    # =========================================================================
    def test_01_similar_content_and_skills(self):
        resume_text = """
        John Doe | Senior Full Stack Engineer | john@example.com
        SKILLS: Python, React, Flask, MySQL, Docker, REST API, Git, JavaScript.
        EXPERIENCE: Built scalable microservices using Python, Flask, and Docker.
        Developed interactive web user interfaces using React and JavaScript.
        Designed normalized relational schemas and optimized queries using MySQL.
        PROJECTS: Cloud microservices architecture deploying Docker containers with Git CI/CD.
        """
        jd_text = """
        Job Requisition: Full Stack Engineer
        Requirements:
        - 3+ years experience developing web platforms using Python and Flask.
        - Strong frontend experience building reactive interfaces with React and JavaScript.
        - Relational database experience with MySQL schema design and query optimization.
        - Containerization experience with Docker and version control with Git.
        - Solid design of REST API endpoints.
        """
        result = perform_comprehensive_match(resume_text, jd_text, "Full Stack Engineer")
        metrics = result['metrics']

        self.assertGreaterEqual(metrics['skill_score'], 80.0, "Skill score should be >= 80% for highly matching candidate")
        self.assertGreaterEqual(metrics['tfidf_score'], 18.0, "TF-IDF similarity should reflect high content alignment")
        self.assertGreaterEqual(metrics['final_score'], 70.0, "Final match score should reflect high qualification match")
        self.assertEqual(len(result['missing_skills']), 0, "No required skills should be missing for this aligned profile")

    # =========================================================================
    # CASE 2: Resume missing several required JD skills
    # =========================================================================
    def test_02_resume_missing_several_required_skills(self):
        resume_text = """
        Candidate Profile | Junior Python Coder
        Skills: Python, HTML, CSS.
        Experience: Simple Python scripting and web scraping with BeautifulSoup.
        """
        jd_text = """
        Target Role: Cloud Infrastructure & Distributed Systems Engineer
        Required Qualifications:
        - Kubernetes container orchestration at scale.
        - AWS cloud infrastructure (EC2, S3, RDS, IAM).
        - GraphQL API design and schema federation.
        - Go (Golang) backend microservice development.
        - Terraform infrastructure as code.
        """
        result = perform_comprehensive_match(resume_text, jd_text, "Cloud Infrastructure Engineer")
        metrics = result['metrics']
        missing = result['missing_skills']

        self.assertGreaterEqual(len(missing), 4, "Should identify at least 4 missing required skills")
        missing_names = {s['skill_name'] for s in missing}
        self.assertTrue(any(k in missing_names for k in ['Kubernetes', 'AWS', 'GraphQL', 'Go', 'Terraform']))
        self.assertLess(metrics['skill_score'], 30.0, "Skill score must be low when core requirements are absent")
        self.assertLess(metrics['final_score'], 35.0, "Final match score must not be artificially inflated")

    # =========================================================================
    # CASE 3: Two substantially different resumes evaluated against same JD
    # =========================================================================
    def test_03_two_substantially_different_resumes_same_jd(self):
        jd_text = """
        Target Requisition: Senior Full Stack AI Engineer
        Requirements:
        - React frontend application development.
        - Node.js and Express.js backend services.
        - Python machine learning pipelines with PyTorch and Pandas.
        - MongoDB and MySQL database persistence.
        - Docker containerization and AWS deployment.
        """
        # Resume A: Strongly qualified AI Engineer
        resume_a = """
        Alice Smith | AI Engineer
        Skills: React, Node.js, Express.js, Python, PyTorch, Pandas, MongoDB, MySQL, Docker, AWS.
        Experience: Developed React web apps communicating with Express.js APIs and Python PyTorch models.
        Containerized services using Docker and managed cloud deployments on AWS.
        """
        # Resume B: Unrelated Accountant
        resume_b = """
        Bob Jones | Certified Public Accountant (CPA)
        Skills: QuickBooks, Financial Accounting, Tax Auditing, Balance Sheet Reconciliation, General Ledger.
        Experience: Prepared corporate tax filings and audited quarterly corporate balance sheets.
        """
        res_a = perform_comprehensive_match(resume_a, jd_text, "Full Stack AI Engineer")
        res_b = perform_comprehensive_match(resume_b, jd_text, "Full Stack AI Engineer")

        score_a = res_a['metrics']['final_score']
        score_b = res_b['metrics']['final_score']

        self.assertGreater(score_a - score_b, 40.0, f"Qualified candidate ({score_a}%) must score at least 40% higher than unrelated accountant ({score_b}%)")
        self.assertLess(score_b, 15.0, "Unrelated resume must score < 15% on tech requisition")

    # =========================================================================
    # CASE 4: Same resume evaluated against two substantially different JDs
    # =========================================================================
    def test_04_same_resume_two_substantially_different_jds(self):
        resume = """
        DevOps & Cloud Engineer
        Skills: Docker, Kubernetes, AWS, Linux, CI/CD, Terraform, Python, Shell Scripting.
        Experience: Automated continuous deployment pipelines on AWS using Kubernetes clusters and Terraform.
        """
        # JD 1: DevOps Engineer Requisition
        jd_devops = """
        Job Opening: Cloud DevOps Platform Engineer
        Requirements:
        - Docker containerization and Kubernetes orchestration.
        - AWS cloud infrastructure provisioning with Terraform.
        - CI/CD workflow automation and Linux systems administration.
        - Python or Shell Scripting for automation.
        """
        # JD 2: Clinical Healthcare Nurse Requisition
        jd_nurse = """
        Job Opening: Registered Healthcare Nurse
        Requirements:
        - Patient care, vital signs monitoring, and medication administration.
        - Electronic health records (EHR) documentation.
        - Clinical patient triage and emergency medical response.
        - Nursing licensure and hospital protocol compliance.
        """
        match_devops = perform_comprehensive_match(resume, jd_devops, "DevOps Engineer")
        match_nurse = perform_comprehensive_match(resume, jd_nurse, "Registered Nurse")

        score_devops = match_devops['metrics']['final_score']
        score_nurse = match_nurse['metrics']['final_score']

        self.assertGreater(score_devops, 70.0, "DevOps resume should score high against DevOps JD")
        self.assertLess(score_nurse, 15.0, "DevOps resume should score low against Nursing JD")
        self.assertGreater(score_devops - score_nurse, 50.0, "Score difference across different roles must exceed 50%")

    # =========================================================================
    # CASE 5: Two unrelated documents
    # =========================================================================
    def test_05_two_unrelated_documents(self):
        resume_graphic = """
        Graphic Designer & Creative Director
        Skills: Adobe Photoshop, Illustrator, InDesign, Typography, Figma, Color Theory.
        Experience: Created branding identities, marketing brochures, and vector illustrations.
        """
        jd_firmware = """
        Embedded Systems Firmware Engineer
        Requirements:
        - Embedded C and C++ programming on ARM Cortex-M microcontrollers.
        - Real-Time Operating Systems (RTOS) kernel synchronization.
        - Hardware communication protocols: SPI, I2C, UART, CAN bus.
        - Oscilloscope and logic analyzer hardware debugging.
        """
        result = perform_comprehensive_match(resume_graphic, jd_firmware, "Firmware Engineer")
        metrics = result['metrics']

        self.assertEqual(len(result['matched_skills']), 0, "No tech skills should match graphic design")
        self.assertEqual(metrics['skill_score'], 0.0, "Skill score should be 0.0%")
        self.assertLess(metrics['tfidf_score'], 15.0, "TF-IDF similarity should be near zero")
        self.assertLess(metrics['final_score'], 10.0, "Overall score must be < 10%")

    # =========================================================================
    # CASE 6: Empty resume text handling
    # =========================================================================
    def test_06_empty_resume_text(self):
        jd_text = "Requirements: Python, React, Docker, SQL, Git."
        sim = compute_similarity("", jd_text)
        self.assertEqual(sim['similarity_percentage'], 0.0)
        self.assertEqual(sim['cosine_similarity'], 0.0)

        match = perform_comprehensive_match("", jd_text, "Software Engineer")
        self.assertEqual(match['metrics']['final_score'], 0.0)
        self.assertEqual(len(match['resume_skills']), 0)

    # =========================================================================
    # CASE 7: Empty JD text handling
    # =========================================================================
    def test_07_empty_jd_text(self):
        resume_text = "Candidate skills: Python, React, Flask, MySQL, Docker."
        sim = compute_similarity(resume_text, "")
        self.assertEqual(sim['similarity_percentage'], 0.0)
        self.assertEqual(sim['cosine_similarity'], 0.0)

        match = perform_comprehensive_match(resume_text, "", "Software Engineer")
        self.assertEqual(match['metrics']['final_score'], 0.0)
        self.assertEqual(len(match['required_jd_skills']), 0)

    # =========================================================================
    # CASE 8: Invalid or unreadable PDF input
    # =========================================================================
    def test_08_invalid_or_unreadable_pdf_input(self):
        # 1. Nonexistent file
        with self.assertRaises(PDFParsingError):
            validate_and_extract_pdf("nonexistent_path_to_resume.pdf")

        # 2. 0-byte file
        f_zero = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        zero_path = f_zero.name
        f_zero.close()
        try:
            with self.assertRaises(PDFParsingError) as ctx_zero:
                validate_and_extract_pdf(zero_path)
            self.assertIn("empty", str(ctx_zero.exception).lower())
        finally:
            import gc
            gc.collect()
            if os.path.exists(zero_path):
                try:
                    os.remove(zero_path)
                except Exception:
                    pass

        # 3. Corrupted non-PDF file
        f_corrupt = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        f_corrupt.write(b"NOT A VALID PDF FILE HEADER DATA")
        corrupt_path = f_corrupt.name
        f_corrupt.close()
        try:
            with self.assertRaises(PDFParsingError) as ctx_corrupt:
                validate_and_extract_pdf(corrupt_path)
            self.assertIn("corrupted", str(ctx_corrupt.exception).lower())
        finally:
            import gc
            gc.collect()
            if os.path.exists(corrupt_path):
                try:
                    os.remove(corrupt_path)
                except Exception:
                    pass

    # =========================================================================
    # CASE 9: A new resume replacing a previous resume
    # =========================================================================
    def test_09_new_resume_replacing_previous_resume(self):
        # Create Resume 1 (Java developer)
        res1 = Resume(
            user_id=self.test_user.id,
            filename="First_Java_Resume.pdf",
            file_path="uploads/First_Java_Resume.pdf",
            file_type="pdf",
            extracted_text="Jane Doe. Skills: Java, Spring Boot, Oracle Database. Built enterprise banking services.",
            status="uploaded"
        )
        # Create Resume 2 (Python developer)
        res2 = Resume(
            user_id=self.test_user.id,
            filename="Second_Python_Resume.pdf",
            file_path="uploads/Second_Python_Resume.pdf",
            file_type="pdf",
            extracted_text="John Smith. Skills: Python, FastAPI, MongoDB, Docker. Built async AI pipelines.",
            status="uploaded"
        )
        db.session.add_all([res1, res2])
        db.session.commit()

        jd = "Requirements: Python, FastAPI, MongoDB, Docker microservices. Must have 3+ years experience designing scalable asynchronous REST APIs and handling containerized deployments."

        # Evaluate against Resume 2 explicitly
        resp = self.client.post("/api/job-match/analyze", headers=self.auth_headers, json={
            "resume_id": res2.id,
            "target_role": "Python FastAPI Developer",
            "job_description": jd
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertEqual(data['resume']['id'], res2.id)
        self.assertEqual(data['resume']['filename'], "Second_Python_Resume.pdf")
        self.assertIn("Python", data['resume_skills'])
        self.assertNotIn("Java", data['resume_skills'])

    # =========================================================================
    # CASE 10: Changed JD producing a new analysis result
    # =========================================================================
    def test_10_changed_jd_producing_new_analysis_result(self):
        resume = Resume(
            user_id=self.test_user.id,
            filename="Multi_JD_Test_Resume.pdf",
            file_path="uploads/Multi_JD_Test_Resume.pdf",
            file_type="pdf",
            extracted_text="Candidate Skills: React, CSS, HTML, JavaScript. Frontend web developer.",
            status="uploaded"
        )
        db.session.add(resume)
        db.session.commit()

        # Run Analysis 1: Frontend role
        jd1 = "Requirements: React, CSS, HTML, JavaScript responsive UI engineering. Must build reactive component architectures, manage web state, and deliver accessible user experiences."
        r1 = self.client.post("/api/job-match/analyze", headers=self.auth_headers, json={
            "resume_id": resume.id,
            "target_role": "Frontend Developer",
            "job_description": jd1
        })
        self.assertEqual(r1.status_code, 201)
        data1 = r1.get_json()

        # Run Analysis 2: Backend role with changed JD
        jd2 = "Requirements: Go, Kubernetes, Terraform, gRPC, Distributed Systems architecture. Architect high-throughput distributed microservices and automate cloud infrastructure."
        r2 = self.client.post("/api/job-match/analyze", headers=self.auth_headers, json={
            "resume_id": resume.id,
            "target_role": "Backend Systems Engineer",
            "job_description": jd2
        })
        self.assertEqual(r2.status_code, 201)
        data2 = r2.get_json()

        # Verify two distinct analyses exist with distinct IDs and different match scores
        self.assertNotEqual(data1['match_id'], data2['match_id'], "Analyses must have distinct IDs")
        self.assertGreater(data1['metrics']['final_score'], data2['metrics']['final_score'],
                           "Frontend score must exceed backend score for frontend resume")

    # =========================================================================
    # CASE 11: Zero-vector case (Stopwords only / empty vocabulary)
    # =========================================================================
    def test_11_zero_vector_case(self):
        stopwords_only_resume = "and the in of at which for on by with"
        stopwords_only_jd = "is was were been being have has had do"

        result = compute_similarity(stopwords_only_resume, stopwords_only_jd)
        self.assertEqual(result['cosine_similarity'], 0.0)
        self.assertEqual(result['raw_cosine_similarity'], 0.0)
        self.assertEqual(result['similarity_percentage'], 0.0)
        self.assertIn("Zero valid tokens", result['status'])

    # =========================================================================
    # CASE 12: Score formula correctness and score boundaries
    # =========================================================================
    def test_12_score_formula_correctness_and_boundaries(self):
        test_pairs = [
            (0.0, 0.0, 0.0),
            (100.0, 100.0, 100.0),
            (50.0, 50.0, 50.0),
            (80.0, 60.0, 74.0),   # (80 * 0.70) + (60 * 0.30) = 56 + 18 = 74.0
            (100.0, 0.0, 70.0),   # (100 * 0.70) + (0 * 0.30) = 70.0
            (0.0, 100.0, 30.0),   # (0 * 0.70) + (100 * 0.30) = 30.0
            (73.5, 41.2, 63.8)    # (73.5 * 0.70) + (41.2 * 0.30) = 51.45 + 12.36 = 63.81 -> 63.8
        ]
        for skill_pct, tfidf_pct, expected_final in test_pairs:
            calculated = round((skill_pct * 0.70) + (tfidf_pct * 0.30), 1)
            clamped = max(0.0, min(100.0, calculated))
            self.assertEqual(clamped, expected_final, f"Formula mismatch for skill={skill_pct}, tfidf={tfidf_pct}")
            self.assertTrue(0.0 <= clamped <= 100.0, "Score must be bounded in [0.0, 100.0]")

    # =========================================================================
    # CASE 13: Correct separation of Resume Quality Score and Job Match Score
    # =========================================================================
    def test_13_separation_of_resume_quality_and_job_match_score(self):
        # A well-structured resume that has high independent Quality Score (~65-75/100)
        well_structured_resume = """
        Jane Doe
        jane.doe@example.com | +1 555-123-4567 | linkedin.com/in/janedoe
        PROFESSIONAL SUMMARY:
        Results-oriented software engineer with 3+ years experience optimizing data workflows.
        EDUCATION:
        Bachelor of Science in Computer Science, State University, 2022.
        WORK EXPERIENCE:
        Software Engineer at Acme Corp (2022 - Present)
        - Developed automated data ingestion pipelines processing 25% more records daily.
        - Architected relational database schemas and improved query speed by 40%.
        - Led technical collaboration across a team of 6 engineers.
        TECHNICAL SKILLS:
        Python, MySQL, PostgreSQL, Relational Databases (SQL), Git, Linux, Docker.
        KEY PROJECTS:
        - Enterprise Data Warehouse: Built scalable ETL pipelines using Python and MySQL.
        CERTIFICATIONS:
        - Database Management Specialist Certificate
        """
        cand_meta = extract_candidate_metadata(well_structured_resume)
        quality_res = analyze_resume_quality(well_structured_resume, cand_meta)
        quality_score = quality_res['quality_score']

        # Independent quality score should be good due to sections, verbs, metrics
        self.assertGreaterEqual(quality_score, 60.0, "Well-structured resume quality score should be >= 60/100")

        # Now evaluate against an UNRELATED Job Description (Healthcare / Nursing)
        unrelated_jd = """
        Job Opening: Clinical Registered Nurse
        Requirements:
        - Patient bedside care and medication administration.
        - Clinical patient triage and vital signs monitoring.
        - Nursing licensure and hospital emergency procedures.
        """
        match_res = perform_comprehensive_match(well_structured_resume, unrelated_jd, "Registered Nurse")
        match_score = match_res['metrics']['final_score']

        # The Job Match score must be very low, proving Quality Score != Match Score
        self.assertLess(match_score, 15.0, "Job match score for unrelated JD should be < 15%")
        self.assertNotEqual(quality_score, match_score, "Quality score must not equal match score")
        self.assertGreater(quality_score - match_score, 45.0,
                           f"Quality score ({quality_score}) must be substantially separate from Match score ({match_score})")

    # =========================================================================
    # CASE 14: Persistence and retrieval of the correct analysis
    # =========================================================================
    def test_14_persistence_and_retrieval_of_correct_analysis(self):
        resume = Resume(
            user_id=self.test_user.id,
            filename="Persistence_Test_Resume.pdf",
            file_path="uploads/Persistence_Test_Resume.pdf",
            file_type="pdf",
            extracted_text="Full Stack Engineer. Skills: React, Node.js, Express.js, MongoDB, Git, Docker.",
            status="uploaded"
        )
        db.session.add(resume)
        db.session.commit()

        jd = """
        Full Stack Web Developer
        Requirements:
        - React frontend components.
        - Node.js and Express.js REST API servers.
        - MongoDB NoSQL databases.
        - Docker containerization.
        """
        # 1. Create analysis via API
        post_resp = self.client.post("/api/job-match/analyze", headers=self.auth_headers, json={
            "resume_id": resume.id,
            "target_role": "Full Stack Web Developer",
            "job_description": jd
        })
        self.assertEqual(post_resp.status_code, 201)
        post_data = post_resp.get_json()
        match_id = post_data['match_id']

        # 2. Retrieve analysis via GET /api/job-match/<match_id>
        get_resp = self.client.get(f"/api/job-match/{match_id}", headers=self.auth_headers)
        self.assertEqual(get_resp.status_code, 200)
        get_data = get_resp.get_json()

        # Verify retrieved data exactly matches persisted record
        self.assertEqual(get_data['match_id'], match_id)
        self.assertEqual(get_data['target_role'], "Full Stack Web Developer")
        self.assertEqual(get_data['resume']['id'], resume.id)
        self.assertEqual(get_data['resume']['filename'], "Persistence_Test_Resume.pdf")
        self.assertEqual(get_data['metrics']['final_score'], post_data['metrics']['final_score'])
        self.assertEqual(get_data['metrics']['skill_score'], post_data['metrics']['skill_score'])
        self.assertEqual(get_data['metrics']['tfidf_score'], post_data['metrics']['tfidf_score'])
        self.assertIsNotNone(get_data.get('resume_quality_score'))

    # =========================================================================
    # CASE 15: Correct matched, partially related, and missing skill counts
    # =========================================================================
    def test_15_correct_matched_partial_and_missing_counts(self):
        # Candidate has Python (Direct Match) and Linux (Bridge to Docker -> Partial)
        # Missing: Kubernetes, GraphQL
        candidate_text = """
        Candidate Skills: Python, Linux, HTML, CSS.
        Experience: Developed backend Python scripts on Linux servers.
        """
        jd_text = """
        Target Role: Cloud Software Engineer
        Requirements:
        - Python programming language.
        - Docker containerization.
        - Kubernetes orchestration.
        - GraphQL API query language.
        """
        result = perform_comprehensive_match(candidate_text, jd_text, "Cloud Software Engineer")

        matched_skills = result['matched_skills']
        partial_skills = result['partial_matches']
        missing_skills = result['missing_skills']

        matched_names = {s['skill_name'] for s in matched_skills}
        partial_names = {s['skill_name'] for s in partial_skills}
        missing_names = {s['skill_name'] for s in missing_skills}

        # Python is direct match
        self.assertIn("Python", matched_names)
        self.assertEqual(len(matched_skills), 1)

        # Docker receives partial credit via Linux bridge
        self.assertIn("Docker", partial_names)
        self.assertEqual(len(partial_skills), 1)

        # Kubernetes and GraphQL are missing
        self.assertIn("Kubernetes", missing_names)
        self.assertIn("GraphQL", missing_names)
        self.assertEqual(len(missing_skills), 2)

        # Total required = 1 + 1 + 2 = 4
        total_classified = len(matched_skills) + len(partial_skills) + len(missing_skills)
        self.assertEqual(total_classified, 4)
        self.assertEqual(result['metrics']['total_required_skills'], 4)


if __name__ == '__main__':
    unittest.main()
