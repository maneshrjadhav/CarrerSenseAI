"""
Skill Extraction and Gap Analysis Service
Identifies candidate skills with context & proficiency detection,
extracts JD requirements, prevents false-positive matching, and provides evidence snippets.
CareerSense AI - Final Year Engineering Project
"""

import re
from utils.skill_normalizer import (
    SKILL_TAXONOMY,
    NORMALIZATION_MAP,
    normalize_skill,
    get_skill_category
)
from services.nlp_processor import normalize_text_artifacts

# Compile sorted list of all taxonomy terms and normalization aliases
def build_skill_patterns():
    all_terms = set()
    for cat, skills in SKILL_TAXONOMY.items():
        for s in skills:
            all_terms.add(s)
    for k in NORMALIZATION_MAP.keys():
        all_terms.add(k)

    # Sort terms descending by length so multi-word terms match before subwords
    sorted_terms = sorted(list(all_terms), key=lambda x: len(x), reverse=True)
    return sorted_terms

ALL_SKILL_TERMS = build_skill_patterns()

def detect_proficiency(snippet: str) -> str:
    """
    Detects skill proficiency qualifier from text line or surrounding snippet.
    Returns: 'basic', 'intermediate', 'advanced', or 'proficient'.
    """
    low = snippet.lower()
    if re.search(r'\b(basic|learning|beginner|novice|elementary|starter)\b', low):
        return 'basic'
    if re.search(r'\b(intermediate|moderate|working knowledge|familiar with)\b', low):
        return 'intermediate'
    if re.search(r'\b(proficient|advanced|expert|lead|mastery|senior)\b', low):
        return 'advanced'
    return 'proficient'

def extract_statements(text: str) -> list:
    """
    Extracts individual bullet lines or sentences from normalized text,
    merging split modifier lines like '(Learning)' or '(Basic)' into the preceding line.
    """
    if not text:
        return []

    norm = normalize_text_artifacts(text)
    raw_lines = [l.strip() for l in norm.splitlines() if l.strip()]

    # Merge orphaned modifier lines
    merged_lines = []
    for l in raw_lines:
        if re.match(r'^\s*\((?:basic|learning|intermediate|proficient|advanced|beginner)\)\s*$', l, re.IGNORECASE):
            if merged_lines:
                merged_lines[-1] = merged_lines[-1] + " " + l.strip()
                continue
        merged_lines.append(l)

    statements = []
    for line in merged_lines:
        clean = re.sub(r'^[-*•●▪▫◦\uf0b7]\s*', '', line).strip()
        if not clean or len(clean) < 2:
            continue
        # Split sentences if contains period followed by space and uppercase letter
        if re.search(r'\.\s+[A-Z]', clean):
            parts = re.split(r'(?<=\.)\s+(?=[A-Z])', clean)
            for p in parts:
                p_clean = p.strip()
                if len(p_clean) >= 2:
                    statements.append(p_clean)
        else:
            statements.append(clean)

    return statements

def match_skill_term(term: str, text: str, statements: list) -> dict:
    """
    Matches a canonical or alias skill term against text using strict boundary rules
    and negative lookaheads/lookbehinds to prevent false positives.
    
    Prevents:
    - 'R' matching 'R.P. College', 'R&D', initials
    - 'C' matching 'C++', 'C#', 'Grade C', initials
    - 'Go' matching 'go to', 'go through'
    """
    term_lower = term.lower()

    if term_lower == 'r':
        # ONLY match if:
        # 1. 'r programming', 'r language', 'r studio', or 'r-studio'
        # 2. In a programming languages list e.g. 'python, r', 'r, python', 'r / python'
        # MUST NEVER match 'R.P.', 'R. P.', 'R&D', 'R.'
        pattern = r'(?i)(?:\br\s+(?:programming|language|scripting|studio)\b|\b(?:programming\s+languages?)[^\n]*?(?<![A-Za-z0-9_.])r(?![A-Za-z0-9_+#.&])|(?:\bpython\s*,\s*r\b|\br\s*,\s*python\b))'
    elif term_lower == 'c':
        # Must NOT match C++ or C# or .NET or C. or Grade C
        # ONLY match if 'c language', 'c programming', or listed like 'c, c++', 'c / c++', 'java, c,'
        pattern = r'(?i)(?:\bc\s+(?:programming|language)\b|\b(?:programming\s+languages?)[^\n]*?(?<![A-Za-z0-9_])c(?![A-Za-z0-9_+#.])|(?<![A-Za-z0-9_])c\s*(?:/|,)\s*c\+\+|\bc\+\+\s*(?:/|,)\s*c(?![A-Za-z0-9_+#.]))'
    elif term_lower == 'go':
        # Must not match 'go to', 'go forward', 'let\'s go'
        pattern = r'(?i)(?:\bgolang\b|\bgo\s+(?:programming|language)\b|\b(?:programming\s+languages?)[^\n]*?\bgo\b)'
    elif term_lower in ['c++', 'c#', '.net', 'asp.net']:
        pattern = r'(?:^|[\s,;:(/])' + re.escape(term_lower) + r'(?:$|[\s,;:)/])'
    else:
        pattern = r'\b' + re.escape(term_lower) + r'\b'

    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None

    # Collect all matching statements to find the most specific evidence and proficiency
    matching_stmts = []
    for s in statements:
        if re.search(pattern, s, re.IGNORECASE):
            matching_stmts.append(s)

    best_stmt = matching_stmts[0] if matching_stmts else f"Identified in candidate qualifications."
    detected_prof = 'proficient'

    # If any statement explicitly tags basic/learning, prioritize that proficiency
    for s in matching_stmts:
        prof = detect_proficiency(s)
        if prof in ['basic', 'intermediate', 'advanced']:
            detected_prof = prof
            best_stmt = s
            break

    # Truncate evidence statement cleanly if unusually long
    if len(best_stmt) > 180:
        best_stmt = best_stmt[:177] + "..."

    return {
        "matched_term": term,
        "evidence": best_stmt,
        "proficiency": detected_prof
    }

def extract_skills_with_evidence(text: str) -> dict:
    """
    Extracts canonical skills from input text along with confidence score,
    detected proficiency, and textual evidence snippet.
    
    Returns:
    {
        "SkillName": {
            "canonical": "SkillName",
            "category": "Programming",
            "confidence": 0.95,
            "proficiency": "basic" | "proficient" | "advanced",
            "evidence": "JavaScript (Basic)"
        }
    }
    """
    if not text:
        return {}

    statements = extract_statements(text)
    detected_skills = {}

    for term in ALL_SKILL_TERMS:
        res = match_skill_term(term, text, statements)
        if res:
            canonical = normalize_skill(term)
            if canonical not in detected_skills:
                category = get_skill_category(canonical)
                detected_skills[canonical] = {
                    "canonical": canonical,
                    "category": category,
                    "confidence": 0.95 if res["evidence"] else 0.85,
                    "proficiency": res["proficiency"],
                    "evidence": res["evidence"]
                }

    # Special heuristic: if candidate mentions Computer Science Engineering / degree,
    # award Computer Science Fundamentals if not already extracted
    if 'Computer Science Fundamentals' not in detected_skills:
        cs_pattern = r'(?i)\b(?:computer\s+science\s+engineering|b\.?\s*tech\s+in\s+computer\s+science|b\.?\s*e\.?\s+in\s+computer|computer\s+science\s+student)\b'
        for s in statements:
            if re.search(cs_pattern, s):
                detected_skills['Computer Science Fundamentals'] = {
                    "canonical": "Computer Science Fundamentals",
                    "category": "Tools & Architecture",
                    "confidence": 0.95,
                    "proficiency": "proficient",
                    "evidence": s[:177] + "..." if len(s) > 180 else s
                }
                break

    return detected_skills

def extract_jd_skills(jd_text: str) -> dict:
    """
    Parses a Job Description into Required Skills vs Preferred Skills
    based on section segmentation heuristics, and detects required experience.
    """
    if not jd_text:
        return {
            "required": {},
            "preferred": {},
            "min_experience_years": 0
        }

    # 1. Detect required years of experience
    min_exp_years = 0
    exp_match = re.search(
        r'(\d+)\+?\s*(?:-\s*\d+)?\s*years?(?:\s+of)?(?:\s+(?:software|engineering|development|work|commercial|professional|relevant))?\s+experience',
        jd_text,
        re.IGNORECASE
    )
    if exp_match:
        try:
            min_exp_years = int(exp_match.group(1))
        except (ValueError, TypeError):
            min_exp_years = 0

    # 2. Section segmentation
    lines = [l.strip() for l in jd_text.splitlines() if l.strip()]
    req_lines = []
    pref_lines = []
    current_mode = "required"  # Default assumption for JD text

    pref_keywords = [
        'preferred', 'nice to have', 'good to have', 'bonus', 'plus',
        'desired', 'preferred qualifications', 'bonus points', 'preferred skills'
    ]
    req_keywords = [
        'required', 'requirements', 'must have', 'qualifications',
        'minimum qualifications', 'essential', 'what you will bring',
        'responsibilities', 'technical skills', 'core requirements'
    ]

    for line in lines:
        lower_line = line.lower()
        if any(kw in lower_line for kw in pref_keywords) and len(line) < 60:
            current_mode = "preferred"
            continue
        elif any(kw in lower_line for kw in req_keywords) and len(line) < 60:
            current_mode = "required"
            continue

        if current_mode == "preferred":
            pref_lines.append(line)
        else:
            req_lines.append(line)

    req_text = "\n".join(req_lines) if req_lines else jd_text
    pref_text = "\n".join(pref_lines)

    required_skills = extract_skills_with_evidence(req_text)
    preferred_skills = extract_skills_with_evidence(pref_text) if pref_text else {}

    # Check for in-sentence preferred indicators in required_skills
    # E.g. "Docker, AWS preferred"
    for s_name, s_info in list(required_skills.items()):
        ev = s_info.get('evidence', '').lower()
        if any(p in ev for p in ['preferred', 'nice to have', 'plus', 'bonus']) and not any(r in ev for r in ['required', 'must have']):
            preferred_skills[s_name] = s_info
            del required_skills[s_name]

    # Ensure required takes precedence over preferred
    for s in list(preferred_skills.keys()):
        if s in required_skills:
            del preferred_skills[s]

    # Fallback: if no required skills were segmented, parse full JD as required
    if not required_skills and not preferred_skills:
        required_skills = extract_skills_with_evidence(jd_text)

    return {
        "required": required_skills,
        "preferred": preferred_skills,
        "min_experience_years": min_exp_years
    }

def analyze_skill_gap(candidate_skills: list, required_skills: list) -> dict:
    """Legacy helper function."""
    cand_set = set(candidate_skills)
    req_set = set(required_skills)
    matched = list(cand_set.intersection(req_set))
    missing = list(req_set.difference(cand_set))
    return {
        "matched": matched,
        "missing": missing,
        "coverage": round((len(matched) / len(req_set) * 100), 1) if req_set else 0.0
    }
