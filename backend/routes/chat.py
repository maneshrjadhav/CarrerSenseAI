"""
Context-Aware AI Career Assistant Chat Route
Provides intelligent career advising by injecting the candidate's actual
verified resume analysis, job match results, skill gaps, and active roadmap.
CareerSense AI - Final Year Engineering Project
"""

import os
import re
import json
import urllib.request
import urllib.error
from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.user import User
from models.resume import Resume
from models.resume_intelligence import ResumeAnalysis, ResumeSkill, ResumeSuggestion
from models.analysis import Analysis
from models.skill import AnalysisSkill, SkillGap
from models.roadmap import Roadmap, RoadmapItem
from utils.auth_helper import token_required

chat_bp = Blueprint('chat', __name__)

def extract_user_career_context(user_id: int) -> dict:
    """Gathers all candidate career assets from MySQL into structured context."""
    user = db.session.query(User).filter_by(id=user_id).first()

    # 1. Latest Resume Analysis
    latest_resume = db.session.query(Resume).filter_by(user_id=user_id).order_by(Resume.uploaded_at.desc()).first()
    latest_res_analysis = None
    resume_skills = []
    resume_strengths = []
    resume_improvements = []

    if latest_resume:
        latest_res_analysis = db.session.query(ResumeAnalysis).filter_by(resume_id=latest_resume.id).first()
        resume_skills = [
            s.skill_name for s in db.session.query(ResumeSkill).filter_by(resume_id=latest_resume.id).all()
        ]
        suggs = db.session.query(ResumeSuggestion).filter_by(resume_id=latest_resume.id).all()
        resume_strengths = [s.title for s in suggs if s.type == 'strength']
        resume_improvements = [s.title for s in suggs if s.type == 'improvement']

    # 2. Latest Job Match Analysis
    latest_match = db.session.query(Analysis).filter_by(user_id=user_id).order_by(Analysis.created_at.desc()).first()
    matched_skills = []
    partial_skills = []
    missing_skills = []
    high_priority_gaps = []

    if latest_match:
        skills = db.session.query(AnalysisSkill).filter_by(analysis_id=latest_match.id).all()
        matched_skills = [s.skill_name for s in skills if s.match_status == 'matched']
        partial_skills = [s.skill_name for s in skills if s.match_status == 'partial']
        missing_skills = [s.skill_name for s in skills if s.match_status == 'missing']

        gaps = db.session.query(SkillGap).filter_by(analysis_id=latest_match.id).all()
        high_priority_gaps = [g.skill_name for g in gaps if g.priority == 'HIGH']
        if not high_priority_gaps:
            high_priority_gaps = [g.skill_name for g in gaps[:3]]

    # 3. Active Roadmap
    latest_roadmap = db.session.query(Roadmap).filter_by(user_id=user_id).order_by(Roadmap.created_at.desc()).first()
    roadmap_phases = []
    roadmap_progress = 0
    roadmap_weeks = 8

    if latest_roadmap:
        roadmap_progress = latest_roadmap.overall_progress or 0
        roadmap_weeks = getattr(latest_roadmap, 'total_duration_weeks', 8) or 8
        items = db.session.query(RoadmapItem).filter_by(roadmap_id=latest_roadmap.id).order_by(RoadmapItem.order_index).all()
        for it in items:
            roadmap_phases.append({
                "id": it.id,
                "phase_number": it.phase_number,
                "skill_name": it.skill_name,
                "title": it.title,
                "status": it.status,
                "progress": it.progress,
                "order_index": it.order_index,
                "topics": it.topics or [],
                "tasks": it.tasks or [],
                "practice_project": it.practice_project
            })

    # Find the current unlocked phase (first incomplete phase in sequence)
    active_unlocked_phase = None
    for p in roadmap_phases:
        if p["status"] != "Completed":
            active_unlocked_phase = p
            break
    if not active_unlocked_phase and roadmap_phases:
        active_unlocked_phase = roadmap_phases[-1]

    return {
        "candidate_name": user.full_name if user else "Candidate",
        "email": user.email if user else "",
        "resume": {
            "has_resume": bool(latest_resume),
            "filename": latest_resume.filename if latest_resume else None,
            "quality_score": round(latest_res_analysis.quality_score, 1) if latest_res_analysis else None,
            "detected_skills": resume_skills,
            "strengths": resume_strengths,
            "improvements": resume_improvements
        },
        "job_match": {
            "has_match": bool(latest_match),
            "target_role": latest_match.target_role if latest_match else None,
            "company_name": (latest_match.job_description.company_name if (latest_match and latest_match.job_description) else "Target Company") if latest_match else None,
            "match_score": latest_match.match_score if latest_match else None,
            "skill_coverage": latest_match.skill_coverage if latest_match else None,
            "matched_skills": matched_skills,
            "partial_skills": partial_skills,
            "missing_skills": missing_skills,
            "high_priority_gaps": high_priority_gaps
        },
        "roadmap": {
            "has_roadmap": bool(latest_roadmap),
            "title": (getattr(latest_roadmap, 'target_role', None) or 'Personalized Career Roadmap') if latest_roadmap else None,
            "duration_weeks": roadmap_weeks,
            "overall_progress": roadmap_progress,
            "phases": roadmap_phases,
            "active_unlocked_phase": active_unlocked_phase
        }
    }


def call_external_llm(user_message: str, history: list, context: dict) -> str:
    """Attempts to call Gemini API if GEMINI_API_KEY is configured in env."""
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
        
        system_instruction = (
            f"You are the CareerSense AI Career Advisor, a friendly, authoritative, and encouraging career coach. "
            f"You have direct real-time access to the student's candidate profile and MySQL database records:\n"
            f"- Candidate Name: {context['candidate_name']}\n"
            f"- Resume Quality Score: {context['resume']['quality_score'] or 'Not analyzed yet'}/100\n"
            f"- Resume Skills: {', '.join(context['resume']['detected_skills'][:15]) or 'None'}\n"
            f"- Target Role: {context['job_match']['target_role'] or 'Software Engineer'}\n"
            f"- Hiring Company: {context['job_match']['company_name'] or 'Tech Company'}\n"
            f"- Match Score: {context['job_match']['match_score'] or 'Not matched yet'}%\n"
            f"- Matched Skills: {', '.join(context['job_match']['matched_skills']) or 'None'}\n"
            f"- Missing Skills: {', '.join(context['job_match']['missing_skills']) or 'None'}\n"
            f"- High Priority Gaps: {', '.join(context['job_match']['high_priority_gaps']) or 'None'}\n"
            f"- Active Roadmap: {context['roadmap']['title'] or 'None'} ({context['roadmap']['duration_weeks']} weeks, {context['roadmap']['overall_progress']}% completed)\n\n"
            f"Provide direct, high-value, actionable career advice. Keep replies well-structured using Markdown formatting with bullet points. "
            f"Always refer to their specific skills and target role when relevant."
        )

        contents = []
        for h in history[-6:]:  # last 6 turns
            role = "user" if h.get('role') == 'user' else "model"
            contents.append({
                "role": role,
                "parts": [{"text": h.get('content', '')}]
            })

        contents.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })

        req_body = json.dumps({
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.6,
                "maxOutputTokens": 800
            }
        }).encode('utf-8')

        req = urllib.request.Request(
            url,
            data=req_body,
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get('candidates', [])
            if candidates:
                text_part = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if text_part:
                    return text_part.strip()
    except Exception as e:
        print(f"[Chat LLM Warning] External Gemini API call skipped or failed: {e}")
        return None

    return None


def generate_contextual_advisory(user_message: str, context: dict) -> str:
    """
    Intelligent context-driven rule engine that directly analyzes the candidate's
    actual resume, job match, missing skills, and roadmap to formulate tailored answers.
    """
    msg = user_message.lower().strip()
    cand = context.get('candidate_name', 'there')
    match = context.get('job_match', {})
    resume = context.get('resume', {})
    roadmap = context.get('roadmap', {})

    target_role = match.get('target_role') or 'Software Engineer'
    company = match.get('company_name') or 'target company'
    match_score = match.get('match_score')
    quality_score = resume.get('quality_score')
    matched = match.get('matched_skills', [])
    missing = match.get('missing_skills', [])
    high_gaps = match.get('high_priority_gaps', [])
    progress = roadmap.get('overall_progress', 0)
    duration = roadmap.get('duration_weeks', 8)

    # 1. Missing Skills / Skill Gaps Queries
    if any(k in msg for k in ['gap', 'missing', 'lack', 'need to learn', 'what skill', 'competenc']):
        if missing:
            gaps_list = ", ".join([f"**{s}**" for s in missing[:6]])
            high_list = ", ".join([f"**{s}**" for s in high_gaps[:3]]) or gaps_list
            return (
                f"### 🎯 Skill Gap Analysis for **{target_role}**\n\n"
                f"Based on your latest screening against {company}, here are the competencies you should focus on:\n\n"
                f"- **Top Priority Gaps:** {high_list}\n"
                f"- **All Missing Requirements:** {gaps_list}\n\n"
                f"#### 💡 Recommended Next Actions:\n"
                f"1. **Follow your Roadmap:** Your active roadmap already has tailored learning milestones for these competencies.\n"
                f"2. **Build Portfolio Proof:** Recruiters prioritize verifiable projects. For example, implement a hands-on project integrating {high_gaps[0] if high_gaps else 'the missing tool'}.\n"
                f"3. **Update Resume Keywords:** Once you complete a milestone, add that skill under your technical stack to increase your score!"
            )
        else:
            return (
                f"Great news! Your profile currently has **0 missing skills** for {target_role}! "
                f"You've matched the primary requirements. Focus on building real-world projects and preparing for system design & behavioral interviews."
            )

    # 2. Score / Match Rating Queries
    if any(k in msg for k in ['score', 'percent', 'match', 'rating', 'evaluate', 'how did i do', 'how good']):
        res_info = f"Resume Quality Score: **{quality_score}/100**" if quality_score else "Resume Quality: *Under analysis*"
        match_info = f"Job Match Score: **{match_score}%** for **{target_role}**" if match_score else "Job Match: *Not yet run for a JD*"
        
        advice = ""
        if match_score and match_score >= 80:
            advice = "Your profile shows **strong alignment**! You meet the majority of hard technical criteria. Polish your project impact metrics and practice technical problem-solving."
        elif match_score and match_score >= 60:
            advice = f"You have a **solid foundation**, but closing your top gaps in {', '.join(high_gaps[:2]) if high_gaps else 'core requirements'} will push your score into the 85%+ recruiter shortlist range."
        else:
            advice = "You have noticeable gaps between your resume keywords and the job description. Follow the personalized roadmap to methodically bridge these gaps."

        return (
            f"### 📊 Your Career Alignment Metrics\n\n"
            f"- 📄 **{res_info}** (independent ATS parsing and structure)\n"
            f"- 🎯 **{match_info}**\n\n"
            f"**Assessment:** {advice}\n\n"
            f"- **Verified Strengths:** {', '.join(matched[:5]) if matched else 'Profile text extracted'}\n"
            f"- **Key Improvements Needed:** {', '.join(missing[:4]) if missing else 'None'}"
        )

    # 3. Today's Lesson / What to Study Next (Sequential Roadmap Enforced)
    if any(k in msg for k in ["today's lesson", "today lesson", "current lesson", "what should i study", "what to study next", "help me study"]):
        active_phase = roadmap.get('active_unlocked_phase')
        if active_phase:
            phase_num = active_phase.get('phase_number', 1)
            skill = active_phase.get('skill_name', 'Full Stack Development')
            title = active_phase.get('title', f'Phase {phase_num}: {skill}')
            topics = active_phase.get('topics', [])
            tasks = active_phase.get('tasks', [])
            pending_tasks = [t for t in tasks if not t.get('is_completed')]

            from services.curriculum_data import get_skill_curriculum
            curriculum = get_skill_curriculum(skill)
            syllabus = curriculum.get('syllabus', [])
            first_mod = syllabus[0] if syllabus else {}

            topics_text = "\n".join([f"  - {t}" for t in topics[:4]]) if topics else f"  - Core {skill} syntax & architecture"
            pending_text = f"**{len(pending_tasks)} pending daily tasks**" if pending_tasks else "All daily tasks completed! Ready for the technical quiz."

            return (
                f"### 📖 Today's Study Guide: Phase {phase_num} — **{skill}**\n\n"
                f"Your active sequential milestone is **{title}**.\n\n"
                f"#### 🎯 Current Syllabus Topics:\n{topics_text}\n\n"
                f"#### 📝 Today's Learning Objective:\n"
                f"{first_mod.get('deep_dive', f'Master practical {skill} architecture, error handling, and production testing.')}\n\n"
                f"#### 🔒 Sequential Progression Rule:\n"
                f"To unlock Phase {phase_num + 1}, you must complete all daily tasks and score **80%+ on the Phase {phase_num} quiz**. You currently have {pending_text}.\n\n"
                f"👉 Open your **[Career Roadmap](/career-roadmap)** and click **Start / Continue Learning** to launch the interactive workspace!"
            )
        else:
            return (
                f"You don't have an active roadmap yet. Run a **[Job Match](/job-match)** to generate your personalized time-based study plan."
            )

    # 4. Code Explanation Queries
    if any(k in msg for k in ['explain this code', 'explain code', 'code example', 'sample code', 'how to code']):
        active_phase = roadmap.get('active_unlocked_phase')
        skill = active_phase.get('skill_name', 'Node.js') if active_phase else 'Node.js'
        
        from services.curriculum_data import get_skill_curriculum
        curriculum = get_skill_curriculum(skill)
        syllabus = curriculum.get('syllabus', [])
        sample_snippet = syllabus[0].get('code_snippet') if syllabus else "// Example\nconsole.log('Production ready code');"

        return (
            f"### 💻 Code Explanation: **{skill}** Architecture\n\n"
            f"Here is a production code pattern from your active **Phase {active_phase.get('phase_number', 1) if active_phase else 1}** curriculum:\n\n"
            f"```javascript\n{sample_snippet}\n```\n\n"
            f"#### 🔍 Key Engineering Takeaways:\n"
            f"1. **Asynchronous Non-Blocking Flow:** Operations delegate I/O to libuv worker threads, keeping the event loop unblocked for high concurrent throughput.\n"
            f"2. **Error Boundaries:** Explicitly wrapping asynchronous calls prevents uncaught exception crashes.\n"
            f"3. **Modular Contracts:** Export clean functions with validated inputs to guarantee predictable service interfaces.\n\n"
            f"You can practice and test this directly in your **Learning Workspace** on the **[Career Roadmap](/career-roadmap)** page!"
        )

    # 5. Roadmap Review & Progress Queries
    if any(k in msg for k in ['roadmap', 'study', 'timeline', 'week', 'schedule', 'task', 'progress', 'what should i do']):
        if roadmap.get('has_roadmap'):
            phases = roadmap.get('phases', [])
            active_phase = roadmap.get('active_unlocked_phase')
            current_title = active_phase.get('title') if active_phase else (phases[0].get('title') if phases else "Foundation Phase")
            completed_count = len([p for p in phases if p.get('status') == 'Completed'])
            total_phases = len(phases)
            
            return (
                f"### 🗺️ Career Roadmap Progress Review\n\n"
                f"- **Overall Progress:** **{progress}% Completed** ({completed_count} of {total_phases} Phases Mastered)\n"
                f"- **Roadmap Duration:** **{duration} Weeks**\n"
                f"- **Current Active Milestone:** **{current_title}**\n\n"
                f"#### 🚀 Your Roadmap Milestones:\n"
                + "\n".join([f"- {'✓' if p.get('status') == 'Completed' else '▶' if p.get('id') == (active_phase.get('id') if active_phase else None) else '🔒'} Phase {p.get('phase_number', idx+1)}: **{p.get('skill_name', p.get('title'))}** — *{p.get('status')}* ({p.get('progress', 0)}%)" for idx, p in enumerate(phases[:6])]) +
                f"\n\n**Next Action:** Continue Phase {active_phase.get('phase_number', 1) if active_phase else 1} tasks. Once finished, pass the assessment quiz to unlock the next milestone!"
            )
        else:
            return (
                f"You haven't generated a career roadmap yet! Run a [Job Match](/job-match) first, and the system will automatically synthesize a personalized time-based study plan."
            )

    # 4. Resume Improvement / ATS Queries
    if any(k in msg for k in ['resume', 'ats', 'cv', 'format', 'improve resume', 'make resume better']):
        strengths = resume.get('strengths', [])
        improvements = resume.get('improvements', [])
        
        str_text = "\n".join([f"- ✓ {s}" for s in strengths[:3]]) if strengths else "- ✓ Clean text structure"
        imp_text = "\n".join([f"- ⚠️ {i}" for i in improvements[:3]]) if improvements else "- ⚠️ Add quantifiable metrics (e.g. 'improved performance by 25%')"

        return (
            f"### 📄 ATS Resume Optimization Tips for **{target_role}**\n\n"
            f"**Current Resume Score:** **{quality_score or 85}/100**\n\n"
            f"#### What ATS parsers like about your resume:\n{str_text}\n\n"
            f"#### High-Impact Improvements to make:\n{imp_text}\n\n"
            f"**Pro Tip:** Download your official **ATS Evaluation Report (PDF)** from the [Resume Intelligence](/resume-analyzer) page for a complete line-by-line structural breakdown!"
        )

    # 5. Interview Preparation Queries
    if any(k in msg for k in ['interview', 'question', 'prep', 'mock', 'behavioral', 'technical interview']):
        tech_to_ask = matched[:3] if matched else ['Data Structures', 'REST APIs', 'System Architecture']
        return (
            f"### 💼 Technical Interview Preparation for **{target_role}**\n\n"
            f"Interviewers will likely test you on the competencies extracted from your profile:\n\n"
            f"1. **Core Technical Concepts:** Expect deep dives into **{', '.join(tech_to_ask)}** (e.g. asynchronous event loop, database indexing, state management).\n"
            f"2. **Addressing Your Gaps:** If asked about **{high_gaps[0] if high_gaps else 'tools you are currently learning'}**, explain your learning plan: *'I have been hands-on building a project using it on my structured development roadmap.'*\n"
            f"3. **STAR Method:** Structure every behavioral answer with Situation, Task, Action, and measurable Result."
        )

    # 6. Default Greeting / General Assistance
    return (
        f"Hello **{cand}**! 👋 I am your **CareerSense AI Career Assistant**.\n\n"
        f"I am connected to your profile and live MySQL database:\n"
        f"- **Target Role:** {target_role}\n"
        f"- **Job Match Score:** {match_score or 'Pending match'}%\n"
        f"- **Roadmap Progress:** {progress}%\n\n"
        f"Here are a few things you can ask me:\n"
        f"- *'What are my biggest skill gaps and how do I fix them?'*\n"
        f"- *'How can I boost my match score to 90%+?'*\n"
        f"- *'What should I focus on this week in my roadmap?'*\n"
        f"- *'How can I improve my resume for ATS screening?'*\n"
        f"- *'What interview questions should I expect for {target_role}?'*"
    )


@chat_bp.route('', methods=['POST'])
@chat_bp.route('/message', methods=['POST'])
@token_required
def chat_message(current_user):
    """
    Main Chatbot endpoint. Receives user message and returns intelligent,
    context-aware career coaching response.
    """
    data = request.get_json(silent=True) or {}
    user_message = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_message:
        return jsonify({
            "success": False,
            "message": "Please provide a valid question or message."
        }), 400

    try:
        # Load real candidate data from MySQL
        context = extract_user_career_context(current_user.id)

        # 1. Attempt External LLM if API key provided in .env
        reply = call_external_llm(user_message, history, context)

        # 2. Intelligent Contextual Advisory Fallback
        if not reply:
            reply = generate_contextual_advisory(user_message, context)

        return jsonify({
            "success": True,
            "reply": reply,
            "context_summary": {
                "candidate_name": context.get('candidate_name'),
                "target_role": context.get('job_match', {}).get('target_role'),
                "match_score": context.get('job_match', {}).get('match_score')
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Career Assistant encountered an error: {str(e)}"
        }), 500
