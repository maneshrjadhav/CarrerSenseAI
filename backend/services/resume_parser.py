"""
Resume Parser Service (PyMuPDF / fitz)
Extracts raw text, metadata, and structured entities from uploaded resume PDFs.
CareerSense AI - Final Year Engineering Project
"""

import os
import re
import fitz  # PyMuPDF

from services.nlp_processor import normalize_text_artifacts

class PDFParsingError(Exception):
    """Custom exception for resume PDF extraction failures."""
    pass

def validate_and_extract_pdf(file_path: str) -> dict:
    """
    Validates a PDF file and extracts text, structured blocks, and candidate metadata.
    
    Checks:
    - File exists and is non-empty
    - Password protection / encryption
    - File corruption
    - Minimum readable text threshold (detects scanned image PDFs requiring OCR)
    """
    if not os.path.exists(file_path):
        raise PDFParsingError("Resume file not found on server.")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise PDFParsingError("The uploaded PDF file is empty (0 bytes).")
    if file_size > 10 * 1024 * 1024:
        raise PDFParsingError("File size exceeds the 10 MB limit.")

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise PDFParsingError(f"Corrupted or invalid PDF document: {str(e)}")

    try:
        if doc.is_encrypted:
            raise PDFParsingError("The uploaded PDF is password-protected. Please upload an unencrypted file.")

        page_count = len(doc)
        if page_count == 0:
            raise PDFParsingError("The uploaded PDF contains no pages.")

        full_text_pages = []
        blocks_data = []
        has_images = False

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text("text")
            full_text_pages.append(page_text)
            
            # Check for images on page
            if len(page.get_images()) > 0:
                has_images = True

            # Extract structured text blocks for layout preservation
            page_blocks = page.get_text("blocks")
            for b in page_blocks:
                # b = (x0, y0, x1, y1, text, block_no, block_type)
                if len(b) >= 5 and b[4].strip():
                    blocks_data.append(b[4].strip())

        raw_joined = "\n".join(full_text_pages).strip()
        full_raw_text = normalize_text_artifacts(raw_joined)

        # Check for unreadable / scanned PDF
        if len(full_raw_text) < 50:
            if has_images:
                raise PDFParsingError(
                    "Scanned or image-based PDF detected. Please upload a searchable text-based PDF resume "
                    "(OCR processing is required for flat image documents)."
                )
            raise PDFParsingError(
                "We couldn't extract readable text from this PDF. "
                "Please upload a standard text-based resume PDF (not a scanned flat image)."
            )

        # Extract structured candidate information
        candidate_meta = extract_candidate_metadata(full_raw_text, blocks_data)

        return {
            "success": True,
            "raw_text": full_raw_text,
            "page_count": page_count,
            "file_size": file_size,
            "candidate_meta": candidate_meta
        }

    finally:
        doc.close()

def extract_candidate_metadata(raw_text: str, blocks: list = None) -> dict:
    """
    Extracts Candidate Name, Email, Phone, Social Profiles, and structured sections from resume text.
    """
    # 1. Email extraction
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', raw_text)
    email = email_match.group(0) if email_match else None

    # 2. Phone extraction (international and standard formats)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
    phone = phone_match.group(0).strip() if phone_match else None

    # 3. Social links (LinkedIn, GitHub)
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)', raw_text, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else None

    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)', raw_text, re.IGNORECASE)
    github = github_match.group(0) if github_match else None

    # 4. Candidate Name extraction (heuristic: first clean lines before contact info)
    candidate_name = None
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    ignore_name_tokens = [
        'resume', 'curriculum', 'vitae', 'cv', 'page', 'email', 'phone', 'contact',
        'linkedin', 'github', 'portfolio', 'about', 'student', 'engineer', 'developer'
    ]
    
    for line in lines[:8]:
        clean_line = re.sub(r'^[^\w\s]+', '', line).strip()
        words = clean_line.split()
        # Look for 2-4 words, alphabet only, excluding initials like "PJ" or short tokens
        if 2 <= len(words) <= 4 and re.match(r'^[A-Za-z\s.\'-]+$', clean_line):
            low = clean_line.lower()
            if not any(token in low for token in ignore_name_tokens):
                # Filter out lines that look like addresses or roles
                if not any(kw in low for kw in ['street', 'road', 'nagar', 'city', 'pune', 'maharashtra', 'india']):
                    # Format neatly: if ALL CAPS, convert to Title Case
                    if clean_line.isupper():
                        candidate_name = clean_line.title()
                    else:
                        candidate_name = clean_line
                    break

    # 5. Sections detection
    sections = {}
    current_section = "summary"
    section_headers = {
        'education': ['education', 'academic background', 'qualification', 'academics', 'degrees'],
        'experience': ['experience', 'work experience', 'employment history', 'internships', 'work history', 'professional experience'],
        'projects': ['projects', 'academic projects', 'key projects', 'personal projects'],
        'skills': ['technical skills', 'skills', 'technologies', 'core competencies', 'skills & tools', 'technical proficiencies', 'soft skills'],
        'certifications': ['certifications', 'licenses', 'courses', 'certificates'],
        'achievements': ['achievements', 'awards', 'honors', 'accomplishments', 'extra-curricular activities', 'extracurricular'],
        'summary': ['professional summary', 'about me', 'objective', 'career objective', 'summary']
    }

    section_lines = {k: [] for k in section_headers}

    for line in lines:
        line_clean = line.strip()
        # Strip leading icons and bullets to examine header
        header_candidate = re.sub(r'^[^\w\s]+', '', line_clean).strip().lower()
        header_candidate = re.sub(r'[:\-–—]+$', '', header_candidate).strip()
        
        # Check if line matches a known section header
        is_header = False
        if len(header_candidate) < 40:
            for sec_name, keywords in section_headers.items():
                if any(header_candidate == kw or header_candidate.startswith(kw + ' ') for kw in keywords):
                    current_section = sec_name
                    is_header = True
                    break

        if not is_header and current_section in section_lines:
            section_lines[current_section].append(line_clean)

    for sec_name, content_list in section_lines.items():
        sections[sec_name] = "\n".join(content_list).strip()

    return {
        "candidate_name": candidate_name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "sections": sections
    }

def parse_pdf(file_path: str) -> str:
    """Legacy compatibility helper: returns raw text from a PDF resume."""
    result = validate_and_extract_pdf(file_path)
    return result["raw_text"]

