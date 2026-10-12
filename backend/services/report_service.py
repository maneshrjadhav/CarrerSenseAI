"""
PDF Report Generator Service (ReportLab)
Generates comprehensive, professional executive PDF reports for resume intelligence analyses.
CareerSense AI - Final Year Engineering Project
"""

import os
import uuid
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)

def generate_pdf_report(analysis_dict: dict, upload_dir: str) -> dict:
    """
    Generates a professional multi-page PDF analysis report using ReportLab.
    
    Returns:
    {
        "filename": str,
        "file_path": str,
        "file_size": int
    }
    """
    reports_dir = os.path.join(upload_dir, 'reports')
    os.makedirs(reports_dir, exist_ok=True)

    report_id = f"CS-{uuid.uuid4().hex[:8].upper()}"
    filename = f"CareerSense_Report_{analysis_dict.get('id', 'temp')}_{report_id}.pdf"
    file_path = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0284c7")     # Ocean Cyan
    dark_color = colors.HexColor("#0f172a")        # Slate 900
    gray_color = colors.HexColor("#64748b")        # Slate 500
    green_color = colors.HexColor("#059669")       # Emerald 600
    amber_color = colors.HexColor("#d97706")       # Amber 600
    red_color = colors.HexColor("#dc2626")         # Red 600
    light_bg = colors.HexColor("#f8fafc")          # Slate 50
    border_color = colors.HexColor("#e2e8f0")      # Slate 200

    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=dark_color
    )

    brand_style = ParagraphStyle(
        'BrandHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=primary_color
    )

    sub_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=gray_color
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=dark_color,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_color
    )

    small_style = ParagraphStyle(
        'ReportSmall',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=gray_color
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("CAREERSENSE AI • RESUME INTELLIGENCE PLATFORM", brand_style),
            Paragraph(f"<b>REPORT ID:</b> {report_id}", small_style)
        ],
        [
            Paragraph("Candidate Career Intelligence &amp; Skill Gap Report", title_style),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", small_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[380, 150])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=8, spaceAfter=14))

    # 2. Candidate Metadata Card
    cand_name = analysis_dict.get('candidate_name') or "Candidate"
    cand_email = analysis_dict.get('candidate_email') or "Not provided"
    cand_phone = analysis_dict.get('candidate_phone') or "Not provided"
    target_role = analysis_dict.get('target_role') or "Target Engineering Role"

    meta_table_data = [
        [
            Paragraph(f"<b>Candidate Name:</b> {cand_name}", body_style),
            Paragraph(f"<b>Target Role:</b> {target_role}", body_style)
        ],
        [
            Paragraph(f"<b>Email Address:</b> {cand_email}", body_style),
            Paragraph(f"<b>Contact Phone:</b> {cand_phone}", body_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[265, 265])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 3. Overall Score & Benchmark Summary
    story.append(Paragraph("Executive Match Summary", h2_style))
    match_score = analysis_dict.get('match_score', 0)
    skill_coverage = analysis_dict.get('skill_coverage', 0)
    semantic_sim = analysis_dict.get('semantic_similarity', 0)
    tot_req = analysis_dict.get('total_required_skills', 0)
    matched_count = analysis_dict.get('matched_skills_count', 0)
    missing_count = analysis_dict.get('missing_skills_count', 0)

    score_card_data = [
        [
            Paragraph(f"<font size=20><b>{match_score}%</b></font><br/><b>Overall Match Score</b>", ParagraphStyle('ScoreC', alignment=1, textColor=primary_color)),
            Paragraph(f"<font size=16><b>{skill_coverage}%</b></font><br/>Skill Coverage", ParagraphStyle('ScoreC2', alignment=1, textColor=dark_color)),
            Paragraph(f"<font size=16><b>{semantic_sim}%</b></font><br/>Semantic Similarity", ParagraphStyle('ScoreC3', alignment=1, textColor=dark_color)),
            Paragraph(f"<font size=16><b>{matched_count} / {tot_req}</b></font><br/>Skills Matched", ParagraphStyle('ScoreC4', alignment=1, textColor=green_color)),
            Paragraph(f"<font size=16><b>{missing_count}</b></font><br/>Identified Gaps", ParagraphStyle('ScoreC5', alignment=1, textColor=red_color))
        ]
    ]
    score_table = Table(score_card_data, colWidths=[110, 105, 110, 105, 100])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4") if match_score >= 70 else colors.HexColor("#fefce8")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 14))

    # 4. Matched Skills Table
    story.append(Paragraph("Matched Competencies (Verified Evidence)", h2_style))
    matched_skills = [s for s in analysis_dict.get('skills', []) if s.get('match_status') == 'matched']
    
    if matched_skills:
        match_table_rows = [
            [
                Paragraph("<b>Skill Name</b>", table_header_style),
                Paragraph("<b>Category</b>", table_header_style),
                Paragraph("<b>Confidence</b>", table_header_style),
                Paragraph("<b>Resume Text Evidence</b>", table_header_style)
            ]
        ]
        for s in matched_skills[:12]: # Show up to 12 in PDF
            ev = s.get('evidence_text') or "Verified in profile text."
            match_table_rows.append([
                Paragraph(f"✓ <b>{s.get('skill_name')}</b>", body_style),
                Paragraph(s.get('category', 'Technical'), small_style),
                Paragraph(f"{int(s.get('confidence', 1.0) * 100)}%", small_style),
                Paragraph(ev, small_style)
            ])
        match_t = Table(match_table_rows, colWidths=[110, 95, 65, 260])
        match_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(match_t)
    else:
        story.append(Paragraph("<i>No directly matching skills were detected in the resume text for this requisition.</i>", body_style))

    story.append(Spacer(1, 14))

    # 5. Missing Skills (Skill Gaps) Table
    story.append(Paragraph("Identified Skill Gaps &amp; Priority Remediation", h2_style))
    skill_gaps = analysis_dict.get('skill_gaps', [])
    
    if skill_gaps:
        gap_table_rows = [
            [
                Paragraph("<b>Skill Gap</b>", table_header_style),
                Paragraph("<b>Priority</b>", table_header_style),
                Paragraph("<b>Estimated Duration</b>", table_header_style),
                Paragraph("<b>Relevance &amp; Gap Rationale</b>", table_header_style)
            ]
        ]
        for g in skill_gaps:
            prio = g.get('priority', 'HIGH')
            prio_color = red_color if prio == 'HIGH' else amber_color if prio == 'MEDIUM' else gray_color
            gap_table_rows.append([
                Paragraph(f"✕ <b>{g.get('skill_name')}</b>", body_style),
                Paragraph(f"<b>{prio}</b>", ParagraphStyle('Pr', parent=small_style, textColor=prio_color)),
                Paragraph(g.get('estimated_learning_duration', '2–3 weeks'), small_style),
                Paragraph(g.get('reason', 'Required by job requisition.'), small_style)
            ])
        gap_t = Table(gap_table_rows, colWidths=[110, 65, 105, 250])
        gap_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), dark_color),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(gap_t)
    else:
        story.append(Paragraph("<i>No critical missing skill gaps detected! Excellent alignment with job description.</i>", body_style))

    story.append(Spacer(1, 14))

    # 6. Personalized Career Roadmap
    story.append(Paragraph("Personalized Career Roadmap &amp; Learning Timeline", h2_style))
    roadmap = analysis_dict.get('roadmap')
    roadmap_items = roadmap.get('items', []) if roadmap else []

    if roadmap:
        r_dur = roadmap.get('total_duration_weeks', 8)
        r_hours = roadmap.get('daily_study_hours', 1.0)
        r_days = roadmap.get('study_days_per_week', 5)
        r_style = (roadmap.get('learning_style') or 'Balanced').capitalize()
        r_prog = roadmap.get('overall_progress', 0)
        r_total_h = roadmap.get('total_learning_hours', round(r_dur * r_hours * r_days, 1))

        timeline_meta_table = Table([
            [
                Paragraph("<b>Selected Timeline</b>", small_style),
                Paragraph("<b>Daily Study Time</b>", small_style),
                Paragraph("<b>Schedule</b>", small_style),
                Paragraph("<b>Learning Style</b>", small_style),
                Paragraph("<b>Total Capacity</b>", small_style),
                Paragraph("<b>Roadmap Progress</b>", small_style)
            ],
            [
                Paragraph(f"<b>{r_dur} Weeks</b>", body_style),
                Paragraph(f"<b>{r_hours} hr/day</b>", body_style),
                Paragraph(f"<b>{r_days} days/week</b>", body_style),
                Paragraph(f"<b>{r_style}</b>", body_style),
                Paragraph(f"<b>{r_total_h} hrs</b>", body_style),
                Paragraph(f"<b>{r_prog}% Done</b>", ParagraphStyle('Prg', parent=body_style, textColor=primary_color))
            ]
        ], colWidths=[85, 85, 85, 90, 85, 100])
        timeline_meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(timeline_meta_table)
        story.append(Spacer(1, 8))

    if roadmap_items:
        for it in roadmap_items:
            topics_txt = ", ".join(it.get('topics', [])[:5])
            phase_card = [
                [
                    Paragraph(f"<b>{it.get('title', 'Phase')}</b>", ParagraphStyle('PhH', parent=body_style, textColor=primary_color)),
                    Paragraph(f"Duration: <b>{it.get('duration_weeks')}</b>", small_style)
                ],
                [
                    Paragraph(f"<b>Topics:</b> {topics_txt}", small_style),
                    Paragraph(f"Status: <b>{it.get('status', 'Not Started')} ({it.get('progress', 0)}%)</b>", small_style)
                ],
                [
                    Paragraph(f"<b>Practice Project:</b> {it.get('practice_project')}", small_style),
                    Paragraph(f"<b>Expected Outcome:</b> {it.get('expected_outcome', 'Portfolio proof of competency')}", small_style)
                ]
            ]
            pt = Table(phase_card, colWidths=[330, 200])
            pt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), light_bg),
                ('BOX', (0,0), (-1,-1), 0.5, border_color),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            story.append(pt)
            story.append(Spacer(1, 6))

    # 7. Final Recommendations & Verification
    story.append(Spacer(1, 8))
    rec_text = (
        f"<b>Career Readiness Recommendation:</b> For target role <i>{target_role}</i>, focus immediately on the HIGH priority "
        f"skill gaps identified above. Completing the recommended practice tasks and updating your resume accordingly will substantially "
        f"boost ATS ranking and technical interview performance."
    )
    story.append(Paragraph(rec_text, body_style))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=4, spaceAfter=8))
    footer_text = (
        f"Generated by CareerSense AI Candidate Career Intelligence System • "
        f"Document ID: {report_id} • Strictly Confidential Candidate Assessment"
    )
    story.append(Paragraph(footer_text, small_style))

    doc.build(story)

    file_size = os.path.getsize(file_path)
    return {
        "report_id": report_id,
        "filename": filename,
        "file_path": file_path,
        "file_size": file_size
    }


def generate_ats_report(resume_data: dict, upload_dir: str) -> dict:
    """
    Generates a dedicated ATS Resume Evaluation PDF report using ReportLab.
    Focuses on parsing quality, section completeness, detected competencies,
    formatting readability, strengths, and ATS actionable improvements.

    Returns:
    {
        "report_id": str,
        "filename": str,
        "file_path": str,
        "file_size": int
    }
    """
    reports_dir = os.path.join(upload_dir, 'reports')
    os.makedirs(reports_dir, exist_ok=True)

    resume_info = resume_data.get('resume', {})
    resume_id = resume_info.get('id', 'temp')
    report_id = f"ATS-{uuid.uuid4().hex[:8].upper()}"
    filename = f"CareerSense_ATS_Audit_{resume_id}_{report_id}.pdf"
    file_path = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Colors
    primary_color = colors.HexColor("#0284c7")     # Ocean Cyan
    dark_color = colors.HexColor("#0f172a")        # Slate 900
    gray_color = colors.HexColor("#64748b")        # Slate 500
    green_color = colors.HexColor("#059669")       # Emerald 600
    amber_color = colors.HexColor("#d97706")       # Amber 600
    red_color = colors.HexColor("#dc2626")         # Red 600
    light_bg = colors.HexColor("#f8fafc")          # Slate 50
    border_color = colors.HexColor("#e2e8f0")      # Slate 200

    title_style = ParagraphStyle(
        'ATSTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=dark_color
    )

    brand_style = ParagraphStyle(
        'ATSBrand',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=primary_color
    )

    sub_style = ParagraphStyle(
        'ATSSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=gray_color
    )

    h2_style = ParagraphStyle(
        'ATSH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=dark_color,
        spaceBefore=12,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'ATSBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=dark_color
    )

    small_style = ParagraphStyle(
        'ATSSmall',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=gray_color
    )

    table_header_style = ParagraphStyle(
        'ATSTableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("CAREERSENSE AI • ATS RESUME EVALUATION AUDIT", brand_style),
            Paragraph(f"<b>REPORT ID:</b> {report_id}", small_style)
        ],
        [
            Paragraph("Candidate ATS Parseability &amp; Content Quality Audit", title_style),
            Paragraph(f"<b>Audit Date:</b> {datetime.now().strftime('%B %d, %Y')}", small_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[380, 150])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=6, spaceAfter=12))

    # 2. Candidate & Document Profile Card
    profile = resume_data.get('candidate_profile', {})
    cand_name = profile.get('name') or "Candidate"
    cand_email = profile.get('email') or "Not provided"
    cand_phone = profile.get('phone') or "Not provided"
    filename_val = resume_info.get('filename') or "Resume.pdf"

    meta_table_data = [
        [
            Paragraph(f"<b>Candidate Name:</b> {cand_name}", body_style),
            Paragraph(f"<b>Target Document:</b> {filename_val}", body_style)
        ],
        [
            Paragraph(f"<b>Email Address:</b> {cand_email}", body_style),
            Paragraph(f"<b>Contact Phone:</b> {cand_phone}", body_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[265, 265])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Overall ATS Metrics Scorecard
    story.append(Paragraph("ATS Parseability &amp; Quality Scorecard", h2_style))
    metrics = resume_data.get('metrics', {})
    quality_score = round(metrics.get('quality_score', 0))
    skills_count = metrics.get('total_skills_detected', 0)
    sections_count = metrics.get('sections_detected_count', 0)
    word_count = metrics.get('word_count', 0)
    read_time = metrics.get('reading_time_minutes', 1)

    score_color = green_color if quality_score >= 80 else (amber_color if quality_score >= 60 else red_color)
    ats_status = "Optimal Parseability" if quality_score >= 80 else ("Moderate Compliance" if quality_score >= 60 else "Requires Optimization")

    score_card_data = [
        [
            Paragraph(f"<font size=20><b>{quality_score}/100</b></font><br/><b>Resume Quality Score</b>", ParagraphStyle('ScoreQ', alignment=1, textColor=score_color)),
            Paragraph(f"<font size=14><b>{ats_status}</b></font><br/>ATS Compliance Tier", ParagraphStyle('ScoreQ2', alignment=1, textColor=dark_color)),
            Paragraph(f"<font size=15><b>{skills_count}</b></font><br/>Skills Detected", ParagraphStyle('ScoreQ3', alignment=1, textColor=primary_color)),
            Paragraph(f"<font size=15><b>{sections_count} Sections</b></font><br/>Structure Completeness", ParagraphStyle('ScoreQ4', alignment=1, textColor=green_color)),
            Paragraph(f"<font size=15><b>{word_count}</b></font><br/>Words (~{read_time} min)", ParagraphStyle('ScoreQ5', alignment=1, textColor=gray_color))
        ]
    ]
    score_table = Table(score_card_data, colWidths=[110, 120, 95, 110, 95])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4") if quality_score >= 75 else colors.HexColor("#fefce8")),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 10))

    # 4. Detected Sections Audit
    story.append(Paragraph("ATS Structural Section Audit", h2_style))
    sections = resume_data.get('sections', [])
    if sections:
        sec_table_rows = [
            [
                Paragraph("<b>Detected Section</b>", table_header_style),
                Paragraph("<b>Word Count</b>", table_header_style),
                Paragraph("<b>Content Preview</b>", table_header_style)
            ]
        ]
        for sec in sections:
            preview = sec.get('section_content', '')[:110]
            if len(sec.get('section_content', '')) > 110:
                preview += "..."
            sec_table_rows.append([
                Paragraph(f"✓ <b>{sec.get('section_name')}</b>", body_style),
                Paragraph(f"{sec.get('word_count', 0)} words", small_style),
                Paragraph(preview, small_style)
            ])
        sec_t = Table(sec_table_rows, colWidths=[130, 80, 320])
        sec_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(sec_t)
    else:
        story.append(Paragraph("<i>No standard resume sections could be clearly isolated. Consider using standard headers like Experience, Education, and Skills.</i>", body_style))

    story.append(Spacer(1, 10))

    # 5. Detected Technical & Domain Skills
    story.append(Paragraph("Detected Competencies &amp; Keyword Taxonomy", h2_style))
    skills = resume_data.get('skills', [])
    if skills:
        sk_rows = [
            [
                Paragraph("<b>Competency</b>", table_header_style),
                Paragraph("<b>Category</b>", table_header_style),
                Paragraph("<b>Confidence</b>", table_header_style),
                Paragraph("<b>Contextual Evidence in Document</b>", table_header_style)
            ]
        ]
        for sk in skills[:15]:  # Top 15 in report
            ev = sk.get('evidence_text') or "Verified in profile context."
            conf = int(sk.get('confidence', 1.0) * 100) if isinstance(sk.get('confidence'), (int, float)) else 90
            sk_rows.append([
                Paragraph(f"<b>{sk.get('skill_name')}</b>", body_style),
                Paragraph(sk.get('category', 'Technical'), small_style),
                Paragraph(f"{conf}%", small_style),
                Paragraph(ev[:120], small_style)
            ])
        sk_t = Table(sk_rows, colWidths=[120, 90, 60, 260])
        sk_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('BOX', (0,0), (-1,-1), 0.5, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(sk_t)
    else:
        story.append(Paragraph("<i>No technical competencies detected. Check if your resume contains clear skill keywords.</i>", body_style))

    story.append(Spacer(1, 10))

    # 6. ATS Strengths
    strengths = resume_data.get('strengths', [])
    if strengths:
        story.append(Paragraph("ATS Parser Strengths Detected", h2_style))
        for st in strengths[:4]:
            t_title = st.get('title') or "Verified Profile Quality"
            t_desc = st.get('description') or ""
            story.append(Paragraph(f"• <b>{t_title}:</b> {t_desc}", body_style))
            story.append(Spacer(1, 3))

    # 7. ATS Optimization Suggestions
    suggestions = resume_data.get('suggestions', [])
    if suggestions:
        story.append(Spacer(1, 6))
        story.append(Paragraph("ATS Actionable Optimization Recommendations", h2_style))
        for sg in suggestions[:5]:
            p_title = sg.get('title') or "Improvement Opportunity"
            p_desc = sg.get('description') or ""
            p_prio = sg.get('priority', 'MEDIUM')
            p_badge = f"<font color='#dc2626'><b>[{p_prio}]</b></font>" if p_prio == 'HIGH' else f"<font color='#d97706'><b>[{p_prio}]</b></font>"
            story.append(Paragraph(f"• {p_badge} <b>{p_title}:</b> {p_desc}", body_style))
            story.append(Spacer(1, 3))

    # 8. Footer
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=4, spaceAfter=8))
    footer_text = (
        f"CareerSense AI ATS Audit Engine • Report Document ID: {report_id} • "
        f"Verified PyMuPDF &amp; Rule-Based NLP Pipeline • Confidential"
    )
    story.append(Paragraph(footer_text, small_style))

    doc.build(story)

    file_size = os.path.getsize(file_path)
    return {
        "report_id": report_id,
        "filename": filename,
        "file_path": file_path,
        "file_size": file_size
    }

