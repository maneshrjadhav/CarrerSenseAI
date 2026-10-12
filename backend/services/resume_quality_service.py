"""
Resume Quality & Profiling Service
Evaluates resume quality score, section coverage, strengths, and actionable suggestions.
CareerSense AI - Final Year Engineering Project
"""

import re
from services.skill_analyzer import extract_skills_with_evidence
from utils.skill_normalizer import get_skill_category

ACTION_VERBS = {
    'developed', 'built', 'created', 'designed', 'architected', 'implemented',
    'optimized', 'engineered', 'deployed', 'managed', 'led', 'configured',
    'integrated', 'automated', 'refactored', 'resolved', 'spearheaded', 'delivered',
    'maintained', 'scaled', 'enhanced', 'collaborated', 'analyzed', 'executed'
}

def analyze_resume_quality(raw_text: str, candidate_meta: dict) -> dict:
    """
    Computes a transparent, mathematically grounded Resume Quality Score (0–100%)
    based on section completeness, skill density, content depth, and action-verb impact.
    """
    if not raw_text or len(raw_text.strip()) < 20:
        return {
            "quality_score": 0.0,
            "skills": [],
            "sections": {},
            "strengths": [],
            "suggestions": [],
            "word_count": 0,
            "reading_time_minutes": 0.0
        }

    words = raw_text.split()
    word_count = len(words)
    reading_time = round(word_count / 200.0, 1) # ~200 WPM average reading speed

    # 1. Section Completeness (Weight: 30 points)
    sections = candidate_meta.get('sections', {})
    has_contact = bool(candidate_meta.get('email') or candidate_meta.get('phone'))
    has_education = bool(sections.get('education'))
    has_experience = bool(sections.get('experience'))
    has_projects = bool(sections.get('projects'))
    has_skills = bool(sections.get('skills'))
    has_certifications = bool(sections.get('certifications'))

    section_score = 0.0
    if has_contact: section_score += 6.0
    if has_education: section_score += 6.0
    if has_experience: section_score += 7.0
    if has_projects: section_score += 6.0
    if has_skills: section_score += 5.0
    section_score = min(30.0, section_score)

    # 2. Skill Extraction & Density (Weight: 30 points)
    detected_skills_map = extract_skills_with_evidence(raw_text)
    total_skills = len(detected_skills_map)
    
    categories_found = set()
    skills_list = []
    for s_name, s_info in detected_skills_map.items():
        categories_found.add(s_info['category'])
        skills_list.append({
            "skill_name": s_name,
            "category": s_info['category'],
            "confidence": s_info['confidence'],
            "evidence_text": s_info['evidence']
        })

    # Scoring skills: 10 skills across multiple categories gives full 30
    skill_score = min(20.0, total_skills * 2.0) + min(10.0, len(categories_found) * 2.5)
    skill_score = min(30.0, skill_score)

    # 3. Content Depth & Word Count (Weight: 20 points)
    depth_score = 0.0
    if word_count < 100:
        depth_score = 5.0
    elif word_count < 250:
        depth_score = 12.0
    elif 250 <= word_count <= 750:
        depth_score = 20.0
    else:
        # Too verbose
        depth_score = 16.0

    # 4. Action Verbs & Quantifiable Impact (Weight: 20 points)
    lower_text = raw_text.lower()
    
    # Count action verbs
    verb_matches = set()
    for verb in ACTION_VERBS:
        if re.search(r'\b' + verb + r'\b', lower_text):
            verb_matches.add(verb)
    verb_score = min(10.0, len(verb_matches) * 1.5)

    # Count quantifiable metrics (percentages, numbers, dollar/rupee figures)
    metric_matches = re.findall(r'\b\d+(?:\.\d+)?%|\b\d+\+\b|\b\d+x\b|\b\d{2,}\b', raw_text)
    metric_score = min(10.0, len(metric_matches) * 2.0)

    impact_score = verb_score + metric_score

    # Final Combined Quality Score
    final_quality_score = round(section_score + skill_score + depth_score + impact_score, 1)
    final_quality_score = max(5.0, min(100.0, final_quality_score))

    # Generate Strengths
    strengths = []
    if total_skills >= 6:
        strengths.append({
            "type": "strength",
            "title": f"Strong Skill Portfolio ({total_skills} Skills Detected)",
            "description": f"Your resume demonstrates competency across {len(categories_found)} technical domains ({', '.join(list(categories_found)[:3])}).",
            "category": "Skills"
        })
    if len(verb_matches) >= 4:
        strengths.append({
            "type": "strength",
            "title": "Impact-Driven Action Verbs",
            "description": f"Used effective professional action verbs like {', '.join(list(verb_matches)[:4])} to describe technical contributions.",
            "category": "Experience"
        })
    if has_projects:
        strengths.append({
            "type": "strength",
            "title": "Dedicated Technical Projects Section",
            "description": "Showcases hands-on implementations and practical problem solving through academic or personal projects.",
            "category": "Projects"
        })
    if len(metric_matches) >= 2:
        strengths.append({
            "type": "strength",
            "title": "Quantifiable Achievements",
            "description": "Includes measurable figures and metrics to validate technical results and career impact.",
            "category": "Impact"
        })
    if not strengths:
        strengths.append({
            "type": "strength",
            "title": "Readable Text Structure",
            "description": "Document parsed cleanly with standard font encoding and recognizable layout blocks.",
            "category": "Structure"
        })

    # Generate Improvement Suggestions
    suggestions = []
    if total_skills < 6:
        suggestions.append({
            "type": "improvement",
            "title": "Expand Core Technical Skills Section",
            "description": "List explicit programming languages, frameworks, databases, and DevOps tools to boost searchability.",
            "priority": "HIGH",
            "category": "Skills"
        })
    if len(metric_matches) < 2:
        suggestions.append({
            "type": "improvement",
            "title": "Add Measurable Metrics & Percentages",
            "description": "Quantify your achievements (e.g., 'improved query performance by 30%', 'managed database with 50k records').",
            "priority": "HIGH",
            "category": "Impact"
        })
    if not has_experience:
        suggestions.append({
            "type": "improvement",
            "title": "Highlight Work or Internship Experience",
            "description": "Add an Employment or Internships section detailing responsibilities, methodologies, and team accomplishments.",
            "priority": "HIGH",
            "category": "Experience"
        })
    if not has_projects:
        suggestions.append({
            "type": "improvement",
            "title": "Add Academic or Portfolio Projects",
            "description": "Include 2-3 key technical projects highlighting the stack used, architecture decisions, and live GitHub URLs.",
            "priority": "MEDIUM",
            "category": "Projects"
        })
    if not has_certifications:
        suggestions.append({
            "type": "improvement",
            "title": "Add Industry Certifications or Coursework",
            "description": "Include credentials from recognized platforms (AWS, HackerRank, Coursera) to demonstrate continuous learning.",
            "priority": "LOW",
            "category": "Credentials"
        })
    if word_count < 200:
        suggestions.append({
            "type": "improvement",
            "title": "Flesh Out Technical Descriptions",
            "description": "Provide more granular details on specific tools, libraries, and problem-solving methodologies used.",
            "priority": "MEDIUM",
            "category": "Length"
        })

    return {
        "quality_score": final_quality_score,
        "score_breakdown": {
            "section_completeness": round(section_score, 1),
            "skill_density": round(skill_score, 1),
            "content_depth": round(depth_score, 1),
            "impact_metrics": round(impact_score, 1)
        },
        "word_count": word_count,
        "reading_time_minutes": reading_time,
        "skills": skills_list,
        "categories_found": list(categories_found),
        "strengths": strengths,
        "suggestions": suggestions,
        "sections": {k: len(v.split()) for k, v in sections.items() if v}
    }

