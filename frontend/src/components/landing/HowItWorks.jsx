import React, { useState } from 'react';
import {
  UploadCloud,
  Cpu,
  Layers,
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Resume Ingestion & Parsing',
      badge: 'Step 1: Text Extraction',
      desc: 'Submit your PDF resume. PyMuPDF streams and decodes multi-column documents, extracting structural contact info, work history, credentials, and raw technical skills.',
      icon: UploadCloud,
      color: '#2563eb',
      tech: 'PyMuPDF Stream Parser',
      metrics: 'Structural Entity Extraction',
    },
    {
      num: '02',
      title: 'NLP & Vector Space Matching',
      badge: 'Step 2: Vector Modeling',
      desc: 'Linguistic normalization filters stop-words and tokenizes terms. The algorithm computes transparent mathematical Cosine Similarity alongside strict skill set overlap.',
      icon: Cpu,
      color: '#0891b2',
      tech: 'TF-IDF + Cosine Vector Space',
      metrics: '70% Skill + 30% Semantic Fit',
    },
    {
      num: '03',
      title: 'Differential Skill Gap Isolation',
      badge: 'Step 3: Deficit Analysis',
      desc: 'Objective set-matrix comparison isolates verified candidate proficiencies from prerequisite job expectations, pinpointing high-priority technical gaps.',
      icon: Layers,
      color: '#0f766e',
      tech: 'Set Matrix Difference Engine',
      metrics: 'Matched vs Missing Competencies',
    },
    {
      num: '04',
      title: 'Roadmap & Placement Readiness',
      badge: 'Step 4: Career Acceleration',
      desc: 'Translates identified skill deficiencies into progressive weekly learning milestones, hands-on containerized project goals, and tailored STAR interview simulations.',
      icon: Compass,
      color: '#7c3aed',
      tech: 'Milestone Progression Engine',
      metrics: 'Job-Ready Career Readiness Index',
    },
  ];

  return (
    <section id="how-it-works" className="landing-section-block bg-slate relative-overflow">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-primary" />
            <span>SEQUENTIAL SYSTEM WORKFLOW</span>
          </div>
          <h2 className="section-main-heading">From Upload to Job-Ready in 4 Steps</h2>
          <p className="section-sub-heading">
            A continuous, verifiable progression that transforms raw resume documents into actionable career readiness.
          </p>
        </div>

        {/* 4-Step Progressive Timeline Grid */}
        <div className="how-four-steps-grid">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isSelected = activeStep === idx;

            return (
              <div
                key={st.num}
                className={`step-card-four ${isSelected ? 'step-selected' : ''}`}
                onMouseEnter={() => setActiveStep(idx)}
                tabIndex={0}
                role="button"
                aria-label={`Step ${st.num}: ${st.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveStep(idx);
                  }
                }}
              >
                {/* Step Header with Number & Icon */}
                <div className="step-card-top-row">
                  <div className="step-number-badge" style={{ color: st.color }}>
                    {st.num}
                  </div>
                  <div className="step-icon-bubble" style={{ background: `${st.color}14`, color: st.color }}>
                    <Icon size={20} />
                  </div>
                </div>

                {/* Badge Tag */}
                <span className="step-phase-tag">{st.badge}</span>

                {/* Title & Description */}
                <h3 className="step-card-headline">{st.title}</h3>
                <p className="step-card-paragraph">{st.desc}</p>

                {/* Technical Metric Footer */}
                <div className="step-card-footer-meta">
                  <span className="step-tech-pill">{st.tech}</span>
                  <div className="step-check-bullet">
                    <CheckCircle2 size={13} style={{ color: st.color }} />
                    <span>{st.metrics}</span>
                  </div>
                </div>

                {/* Accent Bottom Line */}
                <div className="step-accent-line" style={{ background: st.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
