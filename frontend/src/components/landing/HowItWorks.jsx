import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Cpu,
  Layers,
  Compass,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function HowItWorks() {
  const [activeHover, setActiveHover] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Upload Resume',
      desc: 'Submit your PDF resume. PyMuPDF streams text data, identifying structural headers and sections.',
      icon: UploadCloud,
      badge: 'Step 1: Ingestion',
      color: '#2563eb',
    },
    {
      num: '02',
      title: 'Add Job Description',
      desc: 'Paste or upload target job qualifications, responsibilities, and prerequisite skill expectations.',
      icon: FileText,
      badge: 'Step 2: Benchmark',
      color: '#0891b2',
    },
    {
      num: '03',
      title: 'AI Analyzes Profile',
      desc: 'Tokenization, stop-word filtering, and lemmatization precede TF-IDF and Cosine Similarity calculation.',
      icon: Cpu,
      badge: 'Step 3: Processing',
      color: '#0f766e',
    },
    {
      num: '04',
      title: 'Discover Skill Gaps',
      desc: 'Entity matching isolates matched vs missing proficiencies, categorizing priority learning needs.',
      icon: Layers,
      badge: 'Step 4: Gap Detection',
      color: '#d97706',
    },
    {
      num: '05',
      title: 'Get Career Roadmap',
      desc: 'Receive tailored weekly milestone action plans, hands-on project milestones, and credential goals.',
      icon: Compass,
      badge: 'Step 5: Action Plan',
      color: '#7c3aed',
    },
    {
      num: '06',
      title: 'Prepare for Interview',
      desc: 'Access predicted domain-specific coding scenarios and behavioral questions with structured tips.',
      icon: HelpCircle,
      badge: 'Step 6: Job Ready',
      color: '#059669',
    },
  ];

  return (
    <section id="how" className="landing-section-block bg-white relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-primary" />
            <span>SEQUENTIAL SYSTEM WORKFLOW</span>
          </div>
          <h2 className="section-main-heading">From Upload to Job-Ready in 6 Steps</h2>
          <p className="section-sub-heading">
            A continuous, verifiable progression that transforms raw resume documents into actionable career readiness.
          </p>
        </div>

        {/* Continuous Connecting Progress Timeline Track */}
        <div className="how-timeline-flow-wrapper">
          {/* Animated Connecting Blue/Cyan Progress Line */}
          <div className="timeline-connecting-track" aria-hidden="true">
            <motion.div
              className="timeline-progress-fill"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
          </div>

          <div className="how-timeline-grid">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              const isHovered = activeHover === idx;

              return (
                <motion.div
                  key={st.num}
                  className={`timeline-step-tile ${isHovered ? 'tile-hovered' : ''}`}
                  onMouseEnter={() => setActiveHover(idx)}
                  onMouseLeave={() => setActiveHover(null)}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: idx * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <div className="step-tile-top">
                    <span className="step-big-number" style={{ color: st.color }}>
                      {st.num}
                    </span>
                    <div
                      className="step-tile-icon-box"
                      style={{ backgroundColor: `${st.color}15`, color: st.color }}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <span
                    className="step-mini-tag"
                    style={{ backgroundColor: `${st.color}10`, color: st.color }}
                  >
                    {st.badge}
                  </span>
                  <h3 className="step-tile-title">{st.title}</h3>
                  <p className="step-tile-desc">{st.desc}</p>

                  <div className="step-tile-progress-indicator" style={{ backgroundColor: st.color }}></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
