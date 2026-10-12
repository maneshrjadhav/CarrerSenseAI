"""
Smart Time-Based Career Roadmap Generator
Generates dependency-aware, personalized learning milestones dynamically based on:
1. Missing skills & partial skills
2. Skill priority (HIGH, MEDIUM, LOW)
3. Job Description requirements & candidate baseline
4. Candidate timeline (e.g., 2, 4, 6, 8, 12 weeks)
5. Daily study commitment (e.g., 0.5h, 1h, 2h, 3h)
6. Study days per week (3 to 7 days)
7. Learning style (Balanced, Intensive, Project-Based)

CareerSense AI - Final Year Engineering Project
"""

import math
import re

from services.curriculum_data import (
    SKILL_PREREQUISITES,
    SKILL_CURRICULUM,
    get_skill_curriculum
)

def order_missing_skills_by_dependencies(skills_input: list) -> list:
    """
    Sorts missing/partial skills respecting prerequisite dependencies
    so students learn foundational concepts before advanced integrations.
    """
    skill_items = []
    for s in skills_input:
        if isinstance(s, dict):
            skill_items.append(s)
        else:
            skill_items.append({'skill_name': str(s), 'priority': 'HIGH', 'category': 'Technical'})

    skill_dict = {s['skill_name']: s for s in skill_items}
    ordered = []
    visited = set()
    visiting = set()

    def visit(name):
        if name in visited:
            return
        if name in visiting:
            # Prevent circular reference
            return
        visiting.add(name)

        # Check prerequisites
        prereqs = SKILL_PREREQUISITES.get(name, [])
        for p in prereqs:
            # If prerequisite is also among the missing skills, place it first
            if p in skill_dict and p not in visited:
                visit(p)

        visiting.remove(name)
        visited.add(name)
        if name in skill_dict and skill_dict[name] not in ordered:
            ordered.append(skill_dict[name])

    # Visit in order of priority: HIGH first, then MEDIUM, then LOW
    priority_weights = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    sorted_by_prio = sorted(skill_items, key=lambda x: priority_weights.get(x.get('priority', 'MEDIUM'), 3))

    for item in sorted_by_prio:
        visit(item['skill_name'])

    # Add any remaining
    for item in skill_items:
        if item not in ordered:
            ordered.append(item)

    return ordered

def generate_daily_tasks(skill_name: str, duration_weeks_num: int, study_days_per_week: int, topics: list, learning_style: str, start_week: int = 1, daily_study_hours: float = 1.0) -> list:
    """
    Generates structured, day-by-day actionable study tasks tailored to the student's weekly study days.
    """
    tasks = []
    task_templates_week1 = [
        ("Core Fundamentals & Concept Overview", f"Study core architecture, terminology, and foundational concepts of {skill_name}."),
        ("Environment Setup & Hello-World", f"Configure local development environment, tooling, and run first working {skill_name} example."),
        ("Syntax & Essential APIs", f"Practice key syntax patterns, methods, and configurations in {skill_name}."),
        ("Hands-on Coding Exercises", f"Complete guided coding exercises implementing {topics[0] if len(topics) > 0 else 'core modules'}."),
        ("Mini Integration Lab", f"Connect {skill_name} with an external library or data source and test functionality."),
        ("Code Review & Error Handling", f"Review common gotchas, implement proper error boundaries and logging for {skill_name}."),
        ("Weekly Milestone Checkpoint", f"Commit weekly lab code to GitHub and summarize learnings in technical notes.")
    ]

    task_templates_week2 = [
        ("Advanced Architectural Patterns", f"Deep-dive into {topics[1] if len(topics) > 1 else 'advanced patterns'} in {skill_name}."),
        ("Performance & Best Practices", f"Apply security hardening, optimization techniques, and clean code principles."),
        ("Portfolio Mini-Project: Architecture", f"Plan and scaffold the project: define requirements, data structures, and interfaces."),
        ("Portfolio Mini-Project: Implementation", f"Code core features of the portfolio project utilizing {skill_name}."),
        ("Testing & Verification", f"Write unit and integration tests verifying all edge cases in your implementation."),
        ("Documentation & Readme", f"Write comprehensive README with setup instructions, architectural diagrams, and screenshots."),
        ("Milestone Demo & Self-Assessment", f"Test your deployed project end-to-end and review checklist against job requirements.")
    ]

    # For project-based learning style, tilt towards practical build tasks
    if learning_style == 'project_based':
        task_templates_week1[2] = ("Project Scaffolding", f"Initialize the repository and architect component structure for {skill_name}.")
        task_templates_week1[3] = ("Feature Sprint 1", f"Build the primary interface and core logic in {skill_name}.")
        task_templates_week2[1] = ("Feature Sprint 2", f"Integrate database, authentication, and error handling.")

    total_days = duration_weeks_num * study_days_per_week
    day_counter = 1

    for w in range(duration_weeks_num):
        template_pool = task_templates_week1 if w == 0 else task_templates_week2
        current_week_num = start_week + w
        for d in range(study_days_per_week):
            t_idx = d % len(template_pool)
            title, desc = template_pool[t_idx]
            tasks.append({
                "day": day_counter,
                "week": current_week_num,
                "title": f"Day {day_counter}: {title}",
                "task_title": title,
                "description": desc,
                "allocated_hours": round(float(daily_study_hours), 1),
                "status": "Not Started",
                "is_completed": False
            })
            day_counter += 1

    return tasks

def generate_personalized_roadmap(
    missing_skills: list,
    target_role: str,
    duration_weeks: int = 8,
    daily_study_hours: float = 1.0,
    study_days_per_week: int = 5,
    learning_style: str = "balanced",
    partial_skills: list = None
) -> dict:
    """
    Intelligently generates a personalized, time-based learning roadmap.
    Allocates available study weeks and learning capacity across missing & partial skills.
    Ensures zero skills are dropped, regardless of timeline duration.
    """
    # Sanitize inputs
    duration_weeks = max(2, min(52, int(duration_weeks or 8)))
    daily_study_hours = max(0.5, min(8.0, float(daily_study_hours or 1.0)))
    study_days_per_week = max(3, min(7, int(study_days_per_week or 5)))
    learning_style = (learning_style or "balanced").lower()
    if learning_style not in ['balanced', 'intensive', 'project_based']:
        learning_style = 'balanced'

    weekly_study_hours = round(daily_study_hours * study_days_per_week, 1)
    total_learning_hours = round(weekly_study_hours * duration_weeks, 1)

    # Combine missing skills and partial skills
    all_target_skills = []
    if missing_skills:
        for s in missing_skills:
            if isinstance(s, dict):
                item = dict(s)
            else:
                item = {'skill_name': str(s), 'priority': 'HIGH', 'category': 'Technical'}
            item['is_partial'] = False
            all_target_skills.append(item)

    if partial_skills:
        for p in partial_skills:
            if isinstance(p, dict):
                item = dict(p)
            else:
                item = {'skill_name': str(p), 'priority': 'MEDIUM', 'category': 'Technical'}
            item['is_partial'] = True
            if not any(x['skill_name'].lower() == item['skill_name'].lower() for x in all_target_skills):
                all_target_skills.append(item)

    # Empty state: Candidate matched everything!
    if not all_target_skills:
        half_dur = max(1, duration_weeks // 2)
        rem_dur = duration_weeks - half_dur
        items = [
            {
                "phase_number": 1,
                "skill_name": "Advanced System Design",
                "title": f"Phase 1: Advanced Distributed System Design (Weeks 1–{half_dur})",
                "duration_weeks": f"Weeks 1–{half_dur}" if half_dur > 1 else "Week 1",
                "duration_weeks_num": half_dur,
                "priority": "HIGH",
                "topics": ["Microservices Communication", "Distributed Caching with Redis", "Event-Driven Message Queues", "High Availability & Fault Tolerance"],
                "practice_project": "Design and architect a high-throughput microservices system with asynchronous event pub-sub.",
                "expected_outcome": "Ability to present high-level architectural designs for enterprise distributed systems.",
                "resource_categories": ["System Design Primer", "Enterprise Architecture Blueprints"],
                "tasks": generate_daily_tasks("System Design", half_dur, study_days_per_week, ["Microservices", "Event Queues"], learning_style, start_week=1, daily_study_hours=daily_study_hours),
                "status": "Not Started",
                "progress": 0,
                "order_index": 1
            },
            {
                "phase_number": 2,
                "skill_name": "Technical Interview Mastery",
                "title": f"Phase 2: Senior Technical & Behavioral Interview Preparation (Weeks {half_dur + 1}–{duration_weeks})",
                "duration_weeks": f"Weeks {half_dur + 1}–{duration_weeks}" if rem_dur > 1 else f"Week {duration_weeks}",
                "duration_weeks_num": rem_dur,
                "priority": "HIGH",
                "topics": ["Data Structures & Algorithms Problem Solving", "Live Coding Under Time Pressure", "STAR Method Behavioral Case Studies", "Architectural Whiteboarding"],
                "practice_project": "Complete mock interview sessions for senior engineering positions.",
                "expected_outcome": "Demonstrated confidence tackling live whiteboarding, algorithms, and behavioral interview challenges.",
                "resource_categories": ["LeetCode Engineering Roadmaps", "Behavioral Interview Guides"],
                "tasks": generate_daily_tasks("Interview Prep", rem_dur, study_days_per_week, ["Algorithms", "Behavioral"], learning_style, start_week=half_dur + 1, daily_study_hours=daily_study_hours),
                "status": "Not Started",
                "progress": 0,
                "order_index": 2
            }
        ]
        return {
            "target_role": target_role,
            "total_duration_weeks": duration_weeks,
            "daily_study_hours": daily_study_hours,
            "study_days_per_week": study_days_per_week,
            "learning_style": learning_style,
            "weekly_study_hours": weekly_study_hours,
            "total_learning_hours": total_learning_hours,
            "is_intensive": duration_weeks <= 4,
            "intensity_warning": "Your selected timeline is intensive. Expect a focused weekly learning workload." if duration_weeks <= 4 else None,
            "overall_progress": 0,
            "items": items
        }

    # Order skills respecting prerequisite graph
    sorted_skills = order_missing_skills_by_dependencies(all_target_skills)

    # NEVER drop skills: all missing and partial skills must be included in the roadmap
    selected_skills = list(sorted_skills)
    num_skills = len(selected_skills)

    # Decide if capstone should be appended: only if duration provides headroom for it
    include_capstone = (duration_weeks >= 4 and num_skills <= duration_weeks - 1 and num_skills <= 4)
    skill_weeks_pool = duration_weeks - (1 if include_capstone else 0)
    skill_weeks_pool = max(1, skill_weeks_pool)

    # Calculate allocated weeks and labels for each skill
    allocated_schedule = []  # list of (dur_w, dur_label, start_w)

    if num_skills <= skill_weeks_pool:
        # We have at least 1 week per skill. Distribute by priority weight.
        prio_weights = {'HIGH': 3.0, 'MEDIUM': 2.0, 'LOW': 1.0}
        weights = [prio_weights.get(s.get('priority', 'HIGH'), 2.0) for s in selected_skills]
        total_weight = sum(weights) if sum(weights) > 0 else 1.0

        allocated_weeks = []
        for w in weights:
            share = (w / total_weight) * skill_weeks_pool
            wk = max(1, int(round(share)))
            allocated_weeks.append(wk)

        # Normalize sum to skill_weeks_pool
        while sum(allocated_weeks) > skill_weeks_pool and max(allocated_weeks) > 1:
            max_idx = allocated_weeks.index(max(allocated_weeks))
            allocated_weeks[max_idx] -= 1

        while sum(allocated_weeks) < skill_weeks_pool:
            min_idx = allocated_weeks.index(min(allocated_weeks))
            allocated_weeks[min_idx] += 1

        cur_w = 1
        for aw in allocated_weeks:
            start_w = cur_w
            end_w = cur_w + aw - 1
            cur_w += aw
            dur_label = f"Week {start_w}" if start_w == end_w else f"Weeks {start_w}–{end_w}"
            allocated_schedule.append((aw, dur_label, start_w))
    else:
        # More skills than available weeks: allocate across weeks in intensive sprints
        # Every skill is preserved!
        for idx in range(num_skills):
            assigned_week = min(duration_weeks, 1 + int((idx / num_skills) * duration_weeks))
            dur_label = f"Week {assigned_week} (Sprint)"
            allocated_schedule.append((1, dur_label, assigned_week))

    # Build timeline items
    items = []
    phase_counter = 1

    for idx, skill in enumerate(selected_skills):
        s_name = skill['skill_name'] if isinstance(skill, dict) else skill
        cat = skill.get('category', 'Technical') if isinstance(skill, dict) else 'Technical'
        priority = skill.get('priority', 'HIGH') if isinstance(skill, dict) else 'HIGH'
        dur_w, dur_label, start_w = allocated_schedule[idx]

        # Look up rich curriculum or construct tailored module
        if s_name in SKILL_CURRICULUM:
            c = SKILL_CURRICULUM[s_name]
            title = f"Phase {phase_counter}: {c['title']}"
            topics = list(c['topics'])
            project = c['project']
            outcome = c['outcome']
            resources = list(c['resources'])
        else:
            title = f"Phase {phase_counter}: {s_name} Engineering Mastery"
            topics = [
                f"{s_name} Core Architecture & Syntax",
                f"{s_name} Standard Library & Ecosystem",
                f"Design Patterns & Best Practices in {s_name}",
                f"Testing, Debugging & Performance Optimization in {s_name}"
            ]
            project = f"Build a practical {s_name} mini-project demonstrating core capabilities required for {target_role}."
            outcome = f"Demonstrated practical competency in {s_name} with functional, reviewed portfolio code."
            resources = [f"Official {s_name} Documentation", f"Modern {s_name} Guide for Developers", "Community Hands-on Exercises"]

        # Generate day-by-day actionable task plan
        daily_tasks = generate_daily_tasks(
            s_name,
            dur_w,
            study_days_per_week,
            topics,
            learning_style,
            start_week=start_w,
            daily_study_hours=daily_study_hours
        )

        items.append({
            "phase_number": phase_counter,
            "skill_name": s_name,
            "title": title,
            "duration_weeks": dur_label,
            "duration_weeks_num": dur_w,
            "priority": priority,
            "category": cat,
            "topics": topics,
            "practice_project": project,
            "expected_outcome": outcome,
            "resource_categories": resources,
            "tasks": daily_tasks,
            "status": "Not Started",
            "progress": 0,
            "order_index": phase_counter
        })
        phase_counter += 1

    # Capstone Integration Project
    if include_capstone:
        capstone_dur = 1
        cap_start = duration_weeks
        cap_label = f"Week {cap_start}"

        core_skills_str = ", ".join([it['skill_name'] for it in items[:3]])
        capstone_topics = [
            f"Full-Stack Integration ({core_skills_str})",
            "Automated Testing & End-to-End Test Suite",
            "Production Cloud Deployment & Monitoring",
            "Portfolio Documentation & Technical Presentation"
        ]

        items.append({
            "phase_number": phase_counter,
            "skill_name": "Capstone Project",
            "title": f"Phase {phase_counter}: End-to-End Capstone Project for {target_role}",
            "duration_weeks": cap_label,
            "duration_weeks_num": capstone_dur,
            "priority": "HIGH",
            "category": "Integration",
            "topics": capstone_topics,
            "practice_project": f"Build and deploy a comprehensive, production-ready portfolio application integrating {core_skills_str} for {target_role}.",
            "expected_outcome": f"Live deployed portfolio project demonstrating full end-to-end competency tailored for {target_role}.",
            "resource_categories": ["Production Readiness Checklist", "Full-Stack Deployment Guides", "Portfolio Architecture Showcase"],
            "tasks": generate_daily_tasks("Capstone Project", capstone_dur, study_days_per_week, capstone_topics, learning_style, start_week=cap_start, daily_study_hours=daily_study_hours),
            "status": "Not Started",
            "progress": 0,
            "order_index": phase_counter
        })

    is_intensive = (duration_weeks <= 4) or (len(selected_skills) / max(1, duration_weeks) >= 1.5)
    intensity_warning = (
        "Your selected timeline is intensive. Expect a higher weekly learning workload."
        if is_intensive else None
    )

    return {
        "target_role": target_role,
        "total_duration_weeks": duration_weeks,
        "daily_study_hours": daily_study_hours,
        "study_days_per_week": study_days_per_week,
        "learning_style": learning_style,
        "weekly_study_hours": weekly_study_hours,
        "total_learning_hours": total_learning_hours,
        "is_intensive": is_intensive,
        "intensity_warning": intensity_warning,
        "overall_progress": 0,
        "items": items
    }

def generate_roadmap(missing_skills: list, target_role: str) -> list:
    """Legacy helper compatibility function."""
    result = generate_personalized_roadmap(missing_skills, target_role)
    return result["items"]
