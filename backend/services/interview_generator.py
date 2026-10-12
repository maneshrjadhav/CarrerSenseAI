"""
CareerSense AI — Interview Question Generator & Pedagogical Answer Evaluation Service
Generates targeted mock interview questions tailored to candidate resume, job match,
and provides structured, honest AI evaluation with teaching feedback.
"""
import os
import json
import urllib.request
import re
from typing import List, Dict, Any, Optional

# Fallback Question Bank categorized by technical skill and behavioral competency
FALLBACK_QUESTIONS_BY_SKILL = {
    "node.js": {
        "question_text": "Explain the Node.js event loop and how asynchronous non-blocking I/O is handled under the hood using libuv.",
        "category": "Backend Architecture",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Single-threaded event loop", "libuv thread pool", "Call stack, Event queue, Microtask queue", "Process.nextTick vs setImmediate"],
        "model_answer": "Node.js operates on a single-threaded event loop powered by libuv for asynchronous I/O. When an asynchronous operation (like file I/O or a network call) is invoked, Node offloads it to the libuv thread pool or OS kernel. Once completed, the callback is placed in the task queue or microtask queue (e.g. process.nextTick and Promise callbacks). The event loop continuously checks if the call stack is empty before pushing queued callbacks onto the stack for execution.",
        "why_stronger": "Clearly distinguishes between the main JS thread and libuv thread pool, and explains callback queue prioritization without hand-waving.",
        "follow_up_questions": ["What happens if CPU-heavy computations block the main thread?", "How does Node.js cluster module handle multi-core parallelism?"],
        "learning_resources": ["Official Node.js Event Loop Architecture Guide", "libuv Documentation"]
    },
    "express.js": {
        "question_text": "How does Express.js middleware chaining work, and how should error-handling middleware be implemented correctly?",
        "category": "API Engineering",
        "time_guidance": "2 minutes",
        "evaluation_criteria": ["Middleware signature (req, res, next)", "Call to next()", "4-argument error handler (err, req, res, next)", "Order of execution in pipeline"],
        "model_answer": "Express middleware functions have access to req, res, and the next middleware function. They execute sequentially in the order registered via app.use(). If a middleware does not end the request-response cycle, it must call next() to pass control to the next handler; otherwise, the request hangs. Error-handling middleware is uniquely defined by taking four parameters: (err, req, res, next), and should be mounted at the very end of the routing pipeline.",
        "why_stronger": "Highlights both the flow mechanism of next() and the strict four-parameter requirement that distinguishes error middleware from standard handlers.",
        "follow_up_questions": ["How do asynchronous errors in Express 4 vs Express 5 differ?", "What are best practices for securing Express with Helmet and CORS?"],
        "learning_resources": ["Express.js Routing & Middleware Guides", "MDN Express Tutorial"]
    },
    "rest apis": {
        "question_text": "What makes an API truly RESTful? Compare idempotent HTTP methods and explain when you would return HTTP 400 versus 422.",
        "category": "System Design",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Statelessness & resource-oriented URLs", "Idempotence: GET, PUT, DELETE vs POST", "HTTP status code semantics (400 vs 422)", "Standardized representation"],
        "model_answer": "A RESTful API adheres to statelessness, uniform interfaces, and resource-based URI naming using standard HTTP verbs. An idempotent HTTP method produces the identical server state whether executed once or multiple times—GET, PUT, and DELETE are idempotent, whereas POST creates new state each time. HTTP 400 Bad Request indicates malformed syntax (e.g., invalid JSON), whereas HTTP 422 Unprocessable Entity means the syntax is valid JSON but fails business validation rules.",
        "why_stronger": "Explicitly contrasts idempotency semantics and provides precise RFC status code differences rather than generic error descriptions.",
        "follow_up_questions": ["How would you implement API versioning effectively?", "What role do ETags play in HTTP caching and concurrency?"],
        "learning_resources": ["RESTful API Guidelines (RFC 7231)", "HTTP Status Code Specifications"]
    },
    "docker": {
        "question_text": "How do Docker images and containers differ under the hood, and how do multi-stage builds optimize production container size and security?",
        "category": "DevOps & Cloud",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Image as read-only layers vs Container writable layer", "Linux namespaces and cgroups", "Multi-stage builds separating build tools from runtime", "Attack surface minimization"],
        "model_answer": "A Docker image is an immutable, read-only template made of stacked union filesystem layers. A container is a runnable, isolated instance of an image with a thin read-write layer on top, sandboxed using Linux namespaces and cgroups. Multi-stage Dockerfiles use multiple FROM instructions: an early stage compiles the code with heavy build tools, and a minimal production stage (e.g. alpine or distroless) copies only compiled artifacts. This cuts image size by up to 90% and eliminates build tool vulnerabilities in production.",
        "why_stronger": "Explains underlying OS isolation mechanisms (namespaces/cgroups) and gives concrete security benefits of multi-stage artifacts.",
        "follow_up_questions": ["What is the difference between ENTRYPOINT and CMD?", "How does Docker layer caching work and how should Dockerfile instructions be ordered?"],
        "learning_resources": ["Official Docker Multi-stage Builds Documentation", "Docker Security Best Practices"]
    },
    "microservices": {
        "question_text": "What are the trade-offs of microservices compared to monolithic architectures, and how do you handle data consistency across independent services?",
        "category": "Distributed Systems",
        "time_guidance": "3 minutes",
        "evaluation_criteria": ["Monolith vs Microservices pros/cons", "Database-per-service pattern", "Eventual consistency vs ACID", "Saga Pattern (Orchestration vs Choreography)"],
        "model_answer": "Microservices offer independent scalability, decoupled deployments, and technology flexibility, but introduce operational complexity, network latency, distributed tracing challenges, and data consistency hurdles. Because each service owns its database, distributed ACID transactions are avoided in favor of eventual consistency. We maintain consistency using the Saga Pattern—either via choreography (events published to a broker like Kafka) or orchestration (a central coordinator invoking compensating actions if a step fails).",
        "why_stronger": "Directly tackles the distributed data consistency challenge with practical patterns (Sagas and compensating transactions) rather than theoretical generalizations.",
        "follow_up_questions": ["What is the Circuit Breaker pattern and when would you apply it?", "How do API gateways handle authentication and rate limiting?"],
        "learning_resources": ["Microservices Patterns by Chris Richardson", "Martin Fowler Microservice Architecture"]
    },
    "aws": {
        "question_text": "Compare AWS Lambda serverless architecture with containerized deployment on ECS/EKS. What factors determine your choice?",
        "category": "Cloud Architecture",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Cold starts and execution duration limits", "Cost model: per-request vs provisioned instances", "Portability & vendor lock-in", "Workload predictability and latency sensitivity"],
        "model_answer": "AWS Lambda is ideal for event-driven, bursty, or unpredictable workloads where paying per millisecond of compute avoids idle resource waste. However, Lambda has execution time limits (15 minutes), potential cold-start latency, and proprietary runtime bindings. For sustained high-throughput workloads, long-running processes, complex stateful applications, or multi-cloud portability, containerized architectures on ECS or EKS provide predictable cost, custom OS kernels, and seamless local-to-cloud parity.",
        "why_stronger": "Balances financial cost, operational characteristics, and engineering trade-offs rather than simply declaring one superior.",
        "follow_up_questions": ["How do you secure serverless functions using IAM roles and VPC endpoints?", "What is AWS Well-Architected Framework's Reliability pillar?"],
        "learning_resources": ["AWS Well-Architected Framework", "AWS Serverless vs Containers Architecture Whitepaper"]
    },
    "ci/cd": {
        "question_text": "Walk through the stages of a robust CI/CD pipeline from git push to production deployment. How do you implement zero-downtime deployments?",
        "category": "DevOps & Delivery",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Stages: Linting, Unit/Integration tests, Container build, Security scan, Deploy", "Artifact immutability", "Zero-downtime strategies: Blue/Green or Rolling/Canary", "Automated rollbacks on health check failure"],
        "model_answer": "A production CI/CD pipeline triggers on git push with: 1) Static analysis and linting; 2) Automated unit and integration tests; 3) Docker image build with vulnerability scanning (e.g. Trivy); 4) Staging deployment for smoke testing; 5) Production release using Blue-Green or Canary deployment. In Blue-Green deployment, the new version deploys to an idle 'green' environment. Once passing synthetic health checks, traffic is switched at the load balancer instantly, allowing zero downtime and instant rollback if errors occur.",
        "why_stronger": "Covers both the progressive testing gate and the explicit traffic routing mechanism for zero-downtime cutover.",
        "follow_up_questions": ["What are the advantages of GitOps using tools like ArgoCD?", "How do you securely manage production secrets in CI/CD?"],
        "learning_resources": ["GitHub Actions CI/CD Best Practices", "Martin Fowler Continuous Delivery"]
    },
    "react": {
        "question_text": "How does React's virtual DOM reconciliation algorithm work, and how does React 18 Concurrent Mode improve rendering performance?",
        "category": "Frontend Architecture",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Virtual DOM diffing O(n) heuristic", "Fiber architecture work units", "Keys for list reconciliation", "Concurrent rendering and transitions (useTransition)"],
        "model_answer": "React maintains an in-memory Virtual DOM tree. When state changes, a new tree is created and diffed against the previous tree using the Fiber reconciliation algorithm with an O(n) heuristic based on component types and stable keys. React 18 introduced Concurrent Mode, which breaks rendering work into interruptible units. Urgent updates (like typing in an input) can interrupt non-urgent renders (like rendering a large data table) using useTransition, preventing UI thread freezing.",
        "why_stronger": "Correctly references Fiber work units and explains Concurrent Mode interruptibility instead of outdated stack reconciler descriptions.",
        "follow_up_questions": ["When should you use useMemo and useCallback vs avoiding premature optimization?", "How does React Server Components change the client-server boundary?"],
        "learning_resources": ["React.dev Documentation: Reconciliation & Fiber", "React 18 Concurrent Features Guide"]
    },
    "python": {
        "question_text": "Explain Python's Global Interpreter Lock (GIL). How does it impact multithreading, and when should you use multiprocessing or asyncio instead?",
        "category": "Language Internals",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["GIL mutex preventing concurrent execution of Python bytecodes", "Impact on CPU-bound vs I/O-bound threads", "multiprocessing for true CPU parallelism", "asyncio for single-threaded cooperative concurrency"],
        "model_answer": "The Global Interpreter Lock (GIL) is a mutex in CPython that protects access to Python objects, preventing multiple native threads from executing Python bytecodes concurrently. For I/O-bound tasks (like database queries or HTTP calls), multithreading or asyncio is effective because threads release the GIL while waiting for I/O. However, for CPU-bound tasks (data analysis, machine learning), threads compete for the GIL, resulting in zero speedup; here, the multiprocessing module must be used to bypass the GIL via separate process memory spaces.",
        "why_stronger": "Accurately distinguishes I/O-bound vs CPU-bound performance implications and recommends appropriate concurrency primitives.",
        "follow_up_questions": ["How does Python's cyclic garbage collector handle circular references?", "What are Python generators and how does memory usage compare with lists?"],
        "learning_resources": ["Python Docs: Threading, Multiprocessing & AsyncIO", "Real Python GIL Explained"]
    },
    "sql": {
        "question_text": "How do database indexes (B-Tree) work internally, and what are the trade-offs of adding multiple indexes to high-write tables?",
        "category": "Database Engineering",
        "time_guidance": "2 minutes",
        "evaluation_criteria": ["B-Tree self-balancing structure O(log n)", "Leaf nodes, pointers to table pages", "Read query acceleration vs Write throughput penalty", "Composite indexes and leftmost prefix rule"],
        "model_answer": "B-Tree indexes organize sorted keys in a balanced tree structure where leaf nodes contain pointers to actual table data rows, enabling O(log n) lookups instead of O(n) full table scans. While indexes dramatically speed up SELECT queries with WHERE and ORDER BY clauses, every INSERT, UPDATE, and DELETE statement requires updating the B-Tree structure and maintaining balance. On write-heavy tables, excessive indexing causes severe write latency, index fragmentation, and increased storage overhead.",
        "why_stronger": "Highlights both read optimization mathematics and the write amplification trade-off essential for production DB tuning.",
        "follow_up_questions": ["What is an index scan vs index seek?", "How does EXPLAIN ANALYZE help identify query performance bottlenecks?"],
        "learning_resources": ["Use The Index, Luke! Guide to Database Performance", "MySQL 8.0 Reference Manual: Optimization"]
    }
}

BEHAVIORAL_QUESTIONS = [
    {
        "question_text": "Tell me about a time when you encountered a high-severity bug or system failure during an active project. How did you diagnose, resolve, and prevent it from recurring?",
        "skill_name": "Problem Solving & Incident Management",
        "category": "Behavioral (STAR Method)",
        "difficulty": "Intermediate",
        "time_guidance": "3 minutes",
        "evaluation_criteria": ["Situation & Task context", "Systematic debugging / Root cause analysis", "Action taken & rollback/fix", "Measurable Result and Post-mortem prevention"],
        "model_answer": "In our team's web application, users experienced HTTP 500 errors during sudden traffic surges. Situation: Our database connection pool was exhausting connections during unclosed transaction branches. Action: I reproduced the issue under simulated load, identified unclosed DB sessions using query logging, implemented connection pool timeouts, and wrapped operations in context managers. Result: Error rates dropped to 0%, query latency improved by 40%, and I added automated load testing to CI to prevent regressions.",
        "why_stronger": "Follows the STAR methodology with a specific technical root cause, concrete action, and quantified outcome.",
        "follow_up_questions": ["How did you communicate system status to non-technical stakeholders?", "What monitoring alerts did you set up?"],
        "learning_resources": ["STAR Interview Technique Guide", "Google SRE Postmortem Culture"]
    },
    {
        "question_text": "Describe a scenario where you had a technical disagreement with a team member regarding an architectural decision. How did you handle it?",
        "skill_name": "Collaboration & Technical Communication",
        "category": "Behavioral & Teamwork",
        "difficulty": "Intermediate",
        "time_guidance": "2-3 minutes",
        "evaluation_criteria": ["Active listening to differing viewpoints", "Objective benchmarking and evidence-based decision making", "Professional consensus building", "Shared commitment to outcome"],
        "model_answer": "During our final year project, a teammate wanted to use MongoDB for all data persistence, while I advocated for MySQL given our relational schema. Rather than debating opinions, I proposed building a quick proof-of-concept benchmarking our entity relationships and join queries. The benchmark clearly showed relational integrity and foreign keys saved hundreds of lines of manual consistency checks in our codebase. My teammate agreed with the data, and we established an RFC process for future architectural decisions.",
        "why_stronger": "Transforms disagreement into an evidence-based engineering evaluation without personal friction.",
        "follow_up_questions": ["What if consensus cannot be reached?", "How do you commit to a decision you initially disagreed with?"],
        "learning_resources": ["Amazon Leadership Principles: Have Backbone; Disagree and Commit", "High Output Management"]
    }
]


def call_gemini_api(prompt: str, system_prompt: str = "") -> Optional[str]:
    """Calls Gemini REST API if GEMINI_API_KEY is configured."""
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        req_payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json"
            }
        }
        if system_prompt:
            req_payload["system_instruction"] = {"parts": [{"text": system_prompt}]}

        req_body = json.dumps(req_payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_body, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                text_part = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                return text_part.strip()
    except Exception as e:
        print(f"[Interview LLM Warning] External Gemini API call failed: {e}")
        return None


def generate_mock_interview_questions(
    session: Any = None,
    candidate_skills: List[str] = None,
    target_role: str = "Software Engineer",
    job_description_text: str = "",
    interview_type: str = "Technical",
    difficulty: str = "Intermediate",
    missing_skills: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Generates 5 structured interview questions tailored to candidate's skills and target role.
    Attempts LLM generation first; falls back to verified question bank.
    """
    candidate_skills = candidate_skills or []
    missing_skills = missing_skills or []
    target_role = target_role or "Software Engineer"
    
    # Try dynamic Gemini LLM generation if configured
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        sys_prompt = (
            "You are an expert technical interviewer at a top tech company. "
            "Generate exactly 5 realistic, high-quality, practical interview questions tailored to the candidate's profile. "
            "Do NOT ask generic trivia. Ask deep conceptual, architectural, and problem-solving questions. "
            "Format the output strictly as a JSON list of 5 objects with keys: "
            "question_index, skill_name, category, difficulty, question_text, time_guidance, evaluation_criteria (list of 4 strings), "
            "model_answer, why_stronger, follow_up_questions (list of 2 strings), learning_resources (list of 2 strings)."
        )
        user_prompt = (
            f"Target Role: {target_role}\n"
            f"Interview Type: {interview_type}\n"
            f"Difficulty: {difficulty}\n"
            f"Candidate Verified Skills: {', '.join(candidate_skills[:12]) if candidate_skills else 'Python, React, Node.js, SQL'}\n"
            f"Target Requisition Context: {job_description_text[:600] if job_description_text else 'Full stack production engineering'}\n"
            f"Missing Skills to Test Growth Mindset on: {', '.join(missing_skills[:3]) if missing_skills else 'None'}\n\n"
            "Return JSON array containing 5 objects matching the required schema."
        )
        llm_resp = call_gemini_api(user_prompt, sys_prompt)
        if llm_resp:
            try:
                # Strip markdown codeblocks if present
                clean_json = re.sub(r'^```json\s*', '', llm_resp.strip(), flags=re.MULTILINE)
                clean_json = re.sub(r'```$', '', clean_json.strip(), flags=re.MULTILINE)
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) >= 5:
                    result = []
                    for idx, q in enumerate(parsed[:5], start=1):
                        result.append({
                            "question_index": idx,
                            "skill_name": q.get("skill_name") or "Technical Engineering",
                            "category": q.get("category") or "Technical Domain",
                            "difficulty": q.get("difficulty") or difficulty,
                            "question_text": q.get("question_text"),
                            "time_guidance": q.get("time_guidance") or "2-3 minutes",
                            "evaluation_criteria": q.get("evaluation_criteria") or [],
                            "model_answer": q.get("model_answer"),
                            "why_stronger": q.get("why_stronger"),
                            "follow_up_questions": q.get("follow_up_questions") or [],
                            "learning_resources": q.get("learning_resources") or []
                        })
                    return result
            except Exception as pe:
                print(f"[Interview LLM Parse Error] Could not parse LLM JSON: {pe}")

    # Fallback Generation using Candidate Skill Mapping
    questions = []
    
    # 1. Match technical skills
    matched_keys = []
    lower_skills = [s.lower() for s in (candidate_skills + missing_skills)]
    for sk_key in FALLBACK_QUESTIONS_BY_SKILL:
        if any(sk_key in s for s in lower_skills):
            matched_keys.append(sk_key)

    # Ensure at least 5 technical skills
    default_keys = ["node.js", "docker", "rest apis", "aws", "react", "python", "sql", "ci/cd", "microservices"]
    for dk in default_keys:
        if dk not in matched_keys and len(matched_keys) < 5:
            matched_keys.append(dk)

    # Build questions based on interview_type
    itype = (interview_type or "mixed").lower()
    q_idx = 1
    if itype in ["hr", "behavioral", "hr/behavioral"]:
        for b_q in BEHAVIORAL_QUESTIONS:
            questions.append({
                "question_index": q_idx,
                "skill_name": b_q["skill_name"],
                "category": b_q["category"],
                "difficulty": difficulty,
                "question_text": b_q["question_text"],
                "time_guidance": b_q["time_guidance"],
                "evaluation_criteria": b_q["evaluation_criteria"],
                "model_answer": b_q["model_answer"],
                "why_stronger": b_q["why_stronger"],
                "follow_up_questions": b_q["follow_up_questions"],
                "learning_resources": b_q["learning_resources"]
            })
            q_idx += 1
        # Add 3 additional behavioral questions
        extra_b = [
            ("Explain a project where requirements shifted mid-development and how you adapted.", "Adaptability & Agile"),
            ("How do you manage code reviews when receiving critical feedback from senior engineers?", "Continuous Growth & Code Quality"),
            ("Why are you interested in this target role and how does your engineering background align?", "Company Alignment & Motivation")
        ]
        for text, skill in extra_b:
            if q_idx > 5: break
            questions.append({
                "question_index": q_idx,
                "skill_name": skill,
                "category": "Behavioral",
                "difficulty": difficulty,
                "question_text": text,
                "time_guidance": "2 minutes",
                "evaluation_criteria": ["Context clarity", "Professional self-awareness", "Actionable reflection"],
                "model_answer": "I frame my experience around clear impact, active listening, and continuous learning.",
                "why_stronger": "Focuses on personal accountability and technical adaptability.",
                "follow_up_questions": ["What would you do differently in retrospect?"],
                "learning_resources": ["Behavioral Interview Best Practices"]
            })
            q_idx += 1
    elif itype in ["mixed", "both"]:
        # 3 Technical + 2 Behavioral
        for key in matched_keys[:3]:
            q_data = FALLBACK_QUESTIONS_BY_SKILL[key]
            questions.append({
                "question_index": q_idx,
                "skill_name": key.title(),
                "category": q_data["category"],
                "difficulty": difficulty,
                "question_text": q_data["question_text"],
                "time_guidance": q_data["time_guidance"],
                "evaluation_criteria": q_data["evaluation_criteria"],
                "model_answer": q_data["model_answer"],
                "why_stronger": q_data["why_stronger"],
                "follow_up_questions": q_data["follow_up_questions"],
                "learning_resources": q_data["learning_resources"]
            })
            q_idx += 1
        for b_q in BEHAVIORAL_QUESTIONS[:2]:
            questions.append({
                "question_index": q_idx,
                "skill_name": b_q["skill_name"],
                "category": b_q["category"],
                "difficulty": difficulty,
                "question_text": b_q["question_text"],
                "time_guidance": b_q["time_guidance"],
                "evaluation_criteria": b_q["evaluation_criteria"],
                "model_answer": b_q["model_answer"],
                "why_stronger": b_q["why_stronger"],
                "follow_up_questions": b_q["follow_up_questions"],
                "learning_resources": b_q["learning_resources"]
            })
            q_idx += 1
    else: # Technical
        for key in matched_keys[:5]:
            q_data = FALLBACK_QUESTIONS_BY_SKILL[key]
            questions.append({
                "question_index": q_idx,
                "skill_name": key.title(),
                "category": q_data["category"],
                "difficulty": difficulty,
                "question_text": q_data["question_text"],
                "time_guidance": q_data["time_guidance"],
                "evaluation_criteria": q_data["evaluation_criteria"],
                "model_answer": q_data["model_answer"],
                "why_stronger": q_data["why_stronger"],
                "follow_up_questions": q_data["follow_up_questions"],
                "learning_resources": q_data["learning_resources"]
            })
            q_idx += 1

    return questions[:5]


def evaluate_candidate_answer(
    question_text: str,
    candidate_answer: str,
    skill_name: str = "Technical",
    difficulty: str = "Intermediate",
    evaluation_criteria: List[str] = None,
    model_answer: str = "",
    why_stronger: str = "",
    **kwargs
) -> Dict[str, Any]:
    """
    Evaluates candidate's actual answer against target technical question and criteria.
    Returns honest pedagogical feedback with score, strengths, missed concepts, and model answer.
    """
    candidate_answer = (candidate_answer or "").strip()
    evaluation_criteria = evaluation_criteria or []
    
    if not candidate_answer:
        return {
            "score": 0.0,
            "strengths": [],
            "missing_concepts": evaluation_criteria if evaluation_criteria else ["No answer was provided."],
            "improvement_tips": ["Provide an answer explaining the core technical concepts and implementation details."],
            "model_answer": model_answer,
            "why_stronger": why_stronger,
            "follow_up_questions": ["How would you approach this problem in a production environment?"],
            "learning_resources": ["Official Documentation & Reference Tutorials"]
        }

    # Attempt Gemini evaluation if API key is present
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key and len(candidate_answer) > 10:
        sys_prompt = (
            "You are an expert technical interviewer and computer science professor evaluating a candidate's interview response. "
            "Evaluate the answer with genuine academic honesty and rigor. "
            "Do NOT award full marks simply for keyword matches. Assess true depth, technical correctness, and practical understanding. "
            "Return strictly a JSON object with keys: "
            "score (float between 0 and 100), "
            "strengths (list of 2-3 specific points the candidate explained correctly), "
            "missing_concepts (list of 2-3 essential concepts the candidate missed or explained inaccurately), "
            "improvement_tips (list of 2 actionable tips to elevate this response), "
            "follow_up_questions (list of 1-2 relevant follow-up questions)."
        )
        user_prompt = (
            f"Question: {question_text}\n"
            f"Target Skill: {skill_name} ({difficulty})\n"
            f"Evaluation Criteria: {', '.join(evaluation_criteria)}\n"
            f"Standard Model Answer for Reference: {model_answer}\n\n"
            f"Candidate's Submitted Answer: \"{candidate_answer}\"\n\n"
            "Provide your honest structured JSON evaluation."
        )
        llm_resp = call_gemini_api(user_prompt, sys_prompt)
        if llm_resp:
            try:
                clean_json = re.sub(r'^```json\s*', '', llm_resp.strip(), flags=re.MULTILINE)
                clean_json = re.sub(r'```$', '', clean_json.strip(), flags=re.MULTILINE)
                parsed = json.loads(clean_json)
                if isinstance(parsed, dict) and "score" in parsed:
                    return {
                        "score": round(float(parsed.get("score", 70)), 1),
                        "strengths": parsed.get("strengths") or ["Communicated core concept."],
                        "missing_concepts": parsed.get("missing_concepts") or [],
                        "improvement_tips": parsed.get("improvement_tips") or ["Add real-world implementation examples."],
                        "model_answer": model_answer,
                        "why_stronger": why_stronger,
                        "follow_up_questions": parsed.get("follow_up_questions") or ["How does this scale in high-load systems?"],
                        "learning_resources": ["Official Documentation & Best Practices"]
                    }
            except Exception as pe:
                print(f"[Evaluation Parse Error] {pe}")

    # Robust Heuristic Evaluation Engine (Fallback when LLM is unavailable)
    answer_lower = candidate_answer.lower()
    words = candidate_answer.split()
    word_count = len(words)

    if not evaluation_criteria and model_answer:
        model_tokens = [w.lower() for w in re.findall(r'\b[A-Za-z0-9_+-]{4,}\b', model_answer)]
        stopwords = {'which', 'there', 'their', 'about', 'would', 'could', 'should', 'these', 'those', 'where', 'while'}
        seen = set()
        for tok in model_tokens:
            if tok not in stopwords and tok not in seen:
                seen.add(tok)
                evaluation_criteria.append(tok.capitalize())
                if len(evaluation_criteria) >= 4:
                    break

    matched_criteria = []
    unmatched_criteria = []

    for crit in evaluation_criteria:
        crit_tokens = [w.lower() for w in re.findall(r'\b[A-Za-z0-9_+-]+\b', crit) if len(w) > 3]
        if any(token in answer_lower for token in crit_tokens):
            matched_criteria.append(crit)
        else:
            unmatched_criteria.append(crit)

    # Score calculation based on criteria match and answer depth
    coverage_ratio = len(matched_criteria) / max(1, len(evaluation_criteria))
    depth_multiplier = min(1.0, max(0.4, word_count / 40.0))

    calculated_score = round((coverage_ratio * 70.0) + (depth_multiplier * 30.0), 1)
    # Clamp score sensibly
    calculated_score = min(96.0, max(25.0, calculated_score))

    strengths = []
    if matched_criteria:
        strengths = [f"Correctly referenced: {c}" for c in matched_criteria[:3]]
    else:
        strengths = ["Demonstrated willingness to articulate a solution structure."]

    missing = []
    if unmatched_criteria:
        missing = [f"Could detail: {c}" for c in unmatched_criteria[:3]]
    else:
        missing = ["Could provide deeper architectural edge cases or benchmarking numbers."]

    tips = [
        "Structure technical answers with the Problem → Root Cause → Resolution mechanism.",
        "Include concrete production examples and mention trade-offs or performance implications."
    ]

    return {
        "score": calculated_score,
        "score_breakdown": {
            "overall_score": calculated_score,
            "domain_relevance": round(coverage_ratio * 100.0, 1),
            "depth_multiplier": round(depth_multiplier * 100.0, 1)
        },
        "strengths": strengths,
        "missing_concepts": missing,
        "improvement_tips": tips,
        "model_answer": model_answer,
        "why_stronger": why_stronger or "The model answer explains internal mechanisms clearly and articulates production trade-offs.",
        "follow_up_questions": ["What happens if this component fails under sudden spike load?"],
        "learning_resources": [f"Official {skill_name} Documentation", "System Design Primer"]
    }
