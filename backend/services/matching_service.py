"""
Resume vs JD Matching Engine
Evaluates 3-way skill matching (Matched, Partial, Missing), TF-IDF cosine similarity,
prioritizes gaps, and computes transparent, mathematically consistent scores.
CareerSense AI - Final Year Engineering Project
"""

import re
from config import Config
from services.skill_analyzer import extract_skills_with_evidence, extract_jd_skills
from services.tfidf_matcher import compute_similarity
from utils.skill_normalizer import get_skill_category

# Duration estimates based on skill complexity
ESTIMATED_DURATIONS = {
    'Programming': '3–4 weeks',
    'Backend': '3–4 weeks',
    'Cloud & DevOps': '2–3 weeks',
    'Frontend': '2–3 weeks',
    'Database': '2–3 weeks',
    'AI & Data Science': '3–4 weeks',
    'Tools & Architecture': '1–2 weeks',
    'Soft Skills': '1–2 weeks'
}

RECOMMENDED_LEARNING = {
    'Docker': 'Learn Docker fundamentals → Dockerfile → Images → Containers → Docker Compose → Deploy containerized application.',
    'AWS': 'Learn Cloud fundamentals → IAM & Security → EC2 & S3 → RDS database connections → Deploy cloud application.',
    'TypeScript': 'Learn Static typing fundamentals → Interfaces & Type Aliases → Generics → React with TypeScript → Build type-safe application.',
    'Node.js': 'Learn Node runtime & event loop → NPM modules → File system & streams → REST API development → Connect database.',
    'Express.js': 'Learn Express router architecture → Custom middleware → RESTful endpoints → Error handling & validation → JWT auth integration.',
    'MongoDB': 'Learn NoSQL document modeling → CRUD operations → Aggregation pipeline → Mongoose ODM → Implement indexing.',
    'React': 'Master Functional components → Hooks (useState, useEffect) → Context API → React Router → Component optimization.',
    'PostgreSQL': 'Learn Relational schema design → Complex SQL joins → Indexing & optimization → ACID transactions → Database pooling.',
    'Redis': 'Learn In-memory data structures → Caching strategies → TTL & expiration → Pub/Sub messaging → Session store integration.',
    'Kubernetes': 'Learn Pods & Services → Deployments & ReplicaSets → ConfigMaps & Secrets → Ingress controllers → Deploy multi-node cluster.',
    'Next.js': 'Learn Server-side rendering (SSR) → App Router & Server Components → Server Actions → Route Handlers → Production deployment.',
    'GraphQL': 'Learn GraphQL Schema Definition → Queries & Mutations → Resolvers → Apollo Client integration → Schema stitching.',
    'Git': 'Master Version control basics → Branching workflows → Merging & pull requests → Conflict resolution → GitHub CI/CD.',
    'CI/CD': 'Learn Continuous integration principles → GitHub Actions workflows → Automated testing pipelines → Container build & push → Deployment automation.',
    'Linux': 'Learn Linux terminal commands → Shell scripting → Permissions & user management → Process monitoring → Systemd services.',
    'Python': 'Master Data structures & OOP → Virtual environments → PyTest unit testing → Async programming → Build CLI tool.',
    'MySQL': 'Learn Relational schema design → Complex SQL joins → Indexing & optimization → ACID transactions → Database pooling.',
    'Flask': 'Learn Flask application factory → Blueprints & routing → SQLAlchemy ORM → JWT authentication → Deploy with WSGI/Gunicorn.',
    'Relational Databases (SQL)': 'Master relational schemas → Normalization (3NF) → Complex SQL queries & indexing → Transactions & ACID guarantees.',
    'NoSQL Databases': 'Study document vs key-value paradigms → MongoDB modeling → Sharding & indexing → Consistency tradeoffs.',
    'Responsive Design': 'Master CSS Flexbox & Grid layouts → Media queries → Mobile-first design → Tailwind CSS or modern CSS framework.',
    'Computer Science Fundamentals': 'Solidify Algorithms & Data Structures → Operating systems concurrency → Computer networking (TCP/IP, HTTP) → System design.',
    'Microservices': 'Study distributed architecture → Service decomposition → API Gateways → Inter-service communication (REST/gRPC) → Resilience patterns.'
}

# Related Skill Bridges: Allows recognized partial credit when candidate possesses
# foundational technologies in the same ecosystem
RELATED_SKILL_BRIDGES = {
    'Relational Databases (SQL)': [
        ('MySQL', 'Candidate demonstrates relational database competency via MySQL coursework and projects.'),
        ('PostgreSQL', 'Candidate has relational database experience via PostgreSQL.'),
        ('SQLite', 'Candidate has relational database experience via SQLite.'),
        ('Database Management Systems (DBMS)', 'Candidate has academic foundation in relational DBMS principles.')
    ],
    'NoSQL Databases': [
        ('MongoDB', 'Candidate demonstrates NoSQL competency via MongoDB document store.'),
        ('Redis', 'Candidate demonstrates NoSQL key-value caching experience via Redis.')
    ],
    'Express.js': [
        ('Node.js', 'Candidate knows Node.js runtime; needs focused Express middleware and routing patterns.')
    ],
    'Node.js': [
        ('JavaScript', 'Candidate knows JavaScript; needs Node.js runtime and asynchronous server development.')
    ],
    'Redux': [
        ('React', 'Candidate has React component foundation; needs state management patterns with Redux Toolkit.')
    ],
    'Next.js': [
        ('React', 'Candidate knows React; needs Next.js SSR and Server Components training.')
    ],
    'Django': [
        ('Python', 'Candidate knows Python; needs Django MVC architecture and ORM training.')
    ],
    'FastAPI': [
        ('Python', 'Candidate knows Python; needs FastAPI async endpoints and Pydantic validation training.')
    ],
    'Spring Boot': [
        ('Java', 'Candidate knows Java OOP; needs Spring Boot application context and REST patterns.')
    ],
    'Docker': [
        ('Linux', 'Candidate has Linux systems familiarity; needs Docker containerization training.')
    ],
    'Kubernetes': [
        ('Docker', 'Candidate knows container basics with Docker; needs Kubernetes cluster orchestration.')
    ],
    'Responsive Design': [
        ('HTML', 'Candidate knows HTML/CSS; needs CSS Flexbox/Grid and responsive design framework experience.'),
        ('CSS', 'Candidate knows HTML/CSS; needs CSS Flexbox/Grid and responsive design framework experience.')
    ],
    'TypeScript': [
        ('JavaScript', 'Candidate knows JavaScript; needs TypeScript static typing and generics training.')
    ],
    'Computer Science Fundamentals': [
        ('Data Structures & Algorithms', 'Candidate demonstrates foundational computer science via DSA coursework.'),
        ('Database Management Systems (DBMS)', 'Candidate has core computer science coursework in DBMS and systems.')
    ]
}

def get_skill_recommendation(skill_name: str, category: str) -> str:
    if skill_name in RECOMMENDED_LEARNING:
        return RECOMMENDED_LEARNING[skill_name]
    return f"Learn {skill_name} core concepts & syntax → Study ecosystem best practices → Build a focused project → Integrate into application."

def determine_skill_priority(skill_name: str, category: str, is_required: bool, jd_text: str) -> str:
    """
    Calculates priority (HIGH, MEDIUM, LOW) based on:
    - Required vs Preferred status
    - Frequency of occurrence in JD
    - Architectural criticality of the domain category
    """
    if not is_required:
        return 'LOW'

    occurrences = len(re.findall(r'\b' + re.escape(skill_name.lower()) + r'\b', jd_text.lower()))

    # Core architectural foundations
    core_categories = ['Backend', 'Programming', 'Cloud & DevOps']
    if category in core_categories or occurrences >= 2:
        return 'HIGH'

    if category in ['Frontend', 'Database', 'AI & Data Science']:
        return 'HIGH' if occurrences >= 2 else 'MEDIUM'

    return 'MEDIUM'

def perform_comprehensive_match(resume_text: str, jd_text: str, target_role: str) -> dict:
    """
    Executes the comprehensive comparison between resume and job description.
    
    Features:
    - 3-Way Classification: Matched (1.0), Partial (0.5), Missing (0.0)
    - Full proficiency differentiation: basic/learning flagged for partial credit
    - Related technology bridges for fair ecosystem evaluation
    - TF-IDF Cosine Similarity for semantic context
    - Transparent mathematical scoring formulas
    """
    # 1. Extract candidate skills from resume
    cand_skills = extract_skills_with_evidence(resume_text)

    # 2. Extract JD required & preferred skills + minimum experience
    jd_skills = extract_jd_skills(jd_text)
    required_dict = jd_skills['required']
    preferred_dict = jd_skills['preferred']
    min_exp_years = jd_skills.get('min_experience_years', 0)

    # 3. TF-IDF Cosine Similarity
    tfidf_result = compute_similarity(resume_text, jd_text)
    semantic_sim_score = tfidf_result['similarity_percentage']

    # 4. Compare skills across Required and Preferred sets
    cand_keys = set(cand_skills.keys())

    matched_skills = []
    partial_matches = []
    missing_skills = []
    skill_gaps = []

    # Helper function to classify a single JD requirement
    def evaluate_requirement(s_name: str, s_info: dict, is_required: bool):
        cat = s_info['category']

        # Path 1: Direct match in candidate skills
        if s_name in cand_keys:
            cand_item = cand_skills[s_name]
            prof = cand_item.get('proficiency', 'proficient')

            # Check if candidate explicitly lists basic/learning level
            if prof in ['basic', 'learning']:
                reason = f"Candidate has introductory/learning exposure to {s_name}; production competence expected for this role."
                rec = f"Advance {s_name} from fundamentals to full production implementation."
                item = {
                    "skill_name": s_name,
                    "category": cat,
                    "match_status": "partial",
                    "is_required": is_required,
                    "confidence": 0.85,
                    "weight": 0.5,
                    "evidence_text": cand_item['evidence'],
                    "reason": reason,
                    "recommendation": rec
                }
                partial_matches.append(item)
                skill_gaps.append({
                    "skill_name": s_name,
                    "category": cat,
                    "priority": determine_skill_priority(s_name, cat, is_required, jd_text),
                    "reason": reason,
                    "recommendation": rec,
                    "estimated_learning_duration": ESTIMATED_DURATIONS.get(cat, '2–3 weeks')
                })
                return

            # Full standard or advanced proficiency
            item = {
                "skill_name": s_name,
                "category": cat,
                "match_status": "matched",
                "is_required": is_required,
                "confidence": cand_item.get('confidence', 0.95),
                "weight": 1.0,
                "evidence_text": cand_item['evidence'],
                "recommended_improvement": None
            }
            matched_skills.append(item)
            return

        # Path 2: Related technology bridge / conceptual overlap
        if s_name in RELATED_SKILL_BRIDGES:
            for alt_skill, bridge_reason in RELATED_SKILL_BRIDGES[s_name]:
                if alt_skill in cand_keys:
                    alt_item = cand_skills[alt_skill]
                    rec = f"Leverage existing {alt_skill} competency to master {s_name}."
                    item = {
                        "skill_name": s_name,
                        "category": cat,
                        "match_status": "partial",
                        "is_required": is_required,
                        "confidence": 0.80,
                        "weight": 0.5,
                        "evidence_text": alt_item['evidence'],
                        "reason": bridge_reason,
                        "recommendation": rec
                    }
                    partial_matches.append(item)
                    skill_gaps.append({
                        "skill_name": s_name,
                        "category": cat,
                        "priority": determine_skill_priority(s_name, cat, is_required, jd_text),
                        "reason": bridge_reason,
                        "recommendation": rec,
                        "estimated_learning_duration": ESTIMATED_DURATIONS.get(cat, '2–3 weeks')
                    })
                    return

        # Path 3: Missing Skill
        priority = determine_skill_priority(s_name, cat, is_required, jd_text)
        duration = ESTIMATED_DURATIONS.get(cat, '2–3 weeks')
        rec = get_skill_recommendation(s_name, cat)
        reason = (
            f"Required by '{target_role}' specifications but not detected in resume."
            if is_required else
            "Listed as preferred qualification; adding this improves candidate competitiveness."
        )

        missing_skills.append({
            "skill_name": s_name,
            "category": cat,
            "match_status": "missing",
            "is_required": is_required,
            "confidence": 1.0,
            "weight": 0.0,
            "evidence_text": None,
            "priority": priority,
            "reason": reason,
            "recommendation": rec,
            "estimated_learning_duration": duration
        })
        skill_gaps.append({
            "skill_name": s_name,
            "category": cat,
            "priority": priority,
            "reason": reason,
            "recommendation": rec,
            "estimated_learning_duration": duration
        })

    # Evaluate all required skills
    for s_name, s_info in required_dict.items():
        evaluate_requirement(s_name, s_info, is_required=True)

    # Evaluate all preferred skills
    for s_name, s_info in preferred_dict.items():
        evaluate_requirement(s_name, s_info, is_required=False)

    # 5. Extra Candidate Skills (valuable skills beyond JD requirements)
    all_evaluated_names = set(required_dict.keys()) | set(preferred_dict.keys())
    # Also include skills that were matched directly or through bridges
    bridged_names = {p['skill_name'] for p in partial_matches}
    covered_names = {m['skill_name'] for m in matched_skills} | bridged_names

    extra_skills = []
    for s_name in sorted(list(cand_keys)):
        if s_name not in all_evaluated_names and s_name not in covered_names:
            cand_info = cand_skills[s_name]
            extra_skills.append({
                "skill_name": s_name,
                "category": cand_info["category"],
                "match_status": "extra",
                "is_required": False,
                "confidence": cand_info["confidence"],
                "evidence_text": cand_info["evidence"]
            })

    # 6. Calculate transparent, mathematically consistent Match Scores
    total_required = len(required_dict)
    matched_req_weight = (
        sum(m['weight'] for m in matched_skills if m['is_required']) +
        sum(p['weight'] for p in partial_matches if p['is_required'])
    )

    if total_required > 0:
        req_coverage_score = round((matched_req_weight / total_required) * 100, 1)
    else:
        # Fallback if no required skills were segmented
        total_all_jd = len(all_evaluated_names)
        total_all_weight = sum(m['weight'] for m in matched_skills) + sum(p['weight'] for p in partial_matches)
        req_coverage_score = round((total_all_weight / total_all_jd) * 100, 1) if total_all_jd > 0 else 0.0

    # Preferred coverage
    total_preferred = len(preferred_dict)
    matched_pref_weight = (
        sum(m['weight'] for m in matched_skills if not m['is_required']) +
        sum(p['weight'] for p in partial_matches if not p['is_required'])
    )
    pref_coverage_score = (
        round((matched_pref_weight / total_preferred) * 100, 1) if total_preferred > 0 else 0.0
    )

    # Blend required coverage (85% weight) and preferred coverage (15% weight) if preferred exists
    if total_preferred > 0:
        skill_coverage_score = round((0.85 * req_coverage_score) + (0.15 * pref_coverage_score), 1)
    else:
        skill_coverage_score = req_coverage_score

    # Configurable overall weighting: default 60% skill coverage + 40% semantic similarity
    cov_weight = Config.SKILL_COVERAGE_WEIGHT
    sem_weight = Config.SEMANTIC_SIMILARITY_WEIGHT

    overall_match_score = round((cov_weight * skill_coverage_score) + (sem_weight * semantic_sim_score), 1)
    overall_match_score = max(0.0, min(100.0, overall_match_score))

    # Sort gaps: HIGH first, then MEDIUM, then LOW
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    skill_gaps.sort(key=lambda x: priority_order.get(x['priority'], 3))

    # Experience assessment note
    exp_note = None
    if min_exp_years > 0:
        exp_note = f"Target role specifies {min_exp_years}+ years commercial experience. Prioritize practical projects and internship experience."

    return {
        "metrics": {
            "overall_match_score": overall_match_score,
            "skill_coverage": skill_coverage_score,
            "required_skill_coverage": req_coverage_score,
            "preferred_skill_coverage": pref_coverage_score,
            "semantic_similarity": semantic_sim_score,
            "total_required_skills": total_required if total_required > 0 else len(all_evaluated_names),
            "total_preferred_skills": total_preferred,
            "matched_skills_count": len(matched_skills),
            "missing_skills_count": len(missing_skills),
            "partial_skills_count": len(partial_matches),
            "extra_skills_count": len(extra_skills),
            "min_experience_years": min_exp_years,
            "experience_assessment": exp_note,
            "weights": {
                "skill_coverage_weight": cov_weight,
                "semantic_similarity_weight": sem_weight
            },
            "formula_explanation": (
                f"Overall Score = ({int(cov_weight*100)}% × Skill Coverage {skill_coverage_score}%) + "
                f"({int(sem_weight*100)}% × Semantic Similarity {semantic_sim_score}%) = {overall_match_score}%"
            )
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "skill_gaps": skill_gaps,
        "partial_matches": partial_matches,
        "extra_skills": extra_skills,
        "candidate_skills_total": len(cand_skills),
        "jd_skills_total": len(all_evaluated_names)
    }
