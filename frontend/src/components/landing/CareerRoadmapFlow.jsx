import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  AlertCircle,
  BookOpen,
  FolderGit2,
  Award,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowDown,
} from 'lucide-react';

export default function CareerRoadmapFlow() {
  // Exact 7 Stages from Requirement 22
  const roadmapMilestones = [
    {
      stage: '01',
      title: 'Current Profile',
      tag: 'Baseline Analysis',
      desc: 'Extracted competencies: React, Python, JavaScript, SQL. Baseline match score established at 78%.',
      icon: UserCheck,
      color: '#2563eb',
      duration: 'Day 0',
    },
    {
      stage: '02',
      title: 'Skill Gap',
      tag: 'Deficit Isolation',
      desc: 'Pinpointed 3 key prerequisite gaps: Docker containerization, AWS cloud, and TypeScript typing.',
      icon: AlertCircle,
      color: '#d97706',
      duration: 'Day 1',
    },
    {
      stage: '03',
      title: 'Learning Plan',
      tag: 'Curated Resources',
      desc: 'Structured modular curriculum covering container fundamentals, Dockerfile syntax, and AWS IAM.',
      icon: BookOpen,
      color: '#0891b2',
      duration: 'Weeks 1-2',
    },
    {
      stage: '04',
      title: 'Projects',
      tag: 'Hands-on Building',
      desc: 'Build & containerize a production Flask + React microservice with automated GitHub Actions CI/CD.',
      icon: FolderGit2,
      color: '#0f766e',
      duration: 'Weeks 3-4',
    },
    {
      stage: '05',
      title: 'Certification',
      tag: 'Credentials Prep',
      desc: 'Hands-on verification assessments and AWS Cloud Practitioner curriculum validation.',
      icon: Award,
      color: '#7c3aed',
      duration: 'Week 5',
    },
    {
      stage: '06',
      title: 'Interview',
      tag: 'Mock Preparation',
      desc: 'AI-predicted technical questions on Docker volumes, AWS EC2 architectures, and STAR behavioral answers.',
      icon: HelpCircle,
      color: '#2563eb',
      duration: 'Week 6',
    },
    {
      stage: '07',
      title: 'Job Ready',
      tag: 'Placement Ready',
      desc: 'Candidate Readiness reaches 92%+ with full project portfolio backing and confident interview poise.',
      icon: CheckCircle2,
      color: '#059669',
      duration: 'Goal Achieved ✓',
    },
  ];

  return (
    <section id="roadmap" className="landing-section-block bg-slate relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-purple" />
            <span>PROGRESSIVE CAREER ARCHITECTURE</span>
          </div>
          <h2 className="section-main-heading">Actionable Career Roadmap</h2>
          <p className="section-sub-heading">
            Converting abstract screening results into a tangible 7-stage learning, project, and interview preparation roadmap.
          </p>
        </div>

        {/* Clean Flowing Roadmap Timeline (Requirement 22) */}
        <div className="roadmap-flow-wrapper">
          <div className="roadmap-nodes-timeline">
            {roadmapMilestones.map((m, idx) => {
              const Icon = m.icon;

              return (
                <motion.div
                  key={m.stage}
                  className="roadmap-milestone-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className="milestone-top-meta">
                    <span
                      className="milestone-step-chip"
                      style={{ color: m.color, backgroundColor: `${m.color}15` }}
                    >
                      {m.stage}
                    </span>
                    <span className="milestone-duration-tag">{m.duration}</span>
                  </div>

                  <div
                    className="milestone-icon-bubble"
                    style={{ backgroundColor: `${m.color}15`, color: m.color }}
                  >
                    <Icon size={22} />
                  </div>

                  <span className="milestone-badge-tag">{m.tag}</span>
                  <h4 className="milestone-title">{m.title}</h4>
                  <p className="milestone-desc">{m.desc}</p>

                  <div className="milestone-card-accent" style={{ backgroundColor: m.color }}></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
