import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  BarChart3,
  Search,
} from 'lucide-react';

export default function ResumeScanDemo() {
  const [scanStep, setScanStep] = useState(0);
  const [isScanning, setIsScanning] = useState(true);

  // Exact 5 AI Understanding Items from Requirement 19
  const aiUnderstandingList = [
    { id: 'text', title: 'Text Extracted', tool: 'PyMuPDF Parser', desc: 'Raw document stream parsed into 420 structural tokens' },
    { id: 'skills', title: 'Skills Identified', tool: 'Entity Recognition', desc: '24 technical skills and frameworks verified' },
    { id: 'exp', title: 'Experience Detected', tool: 'Section Analysis', desc: 'Identified 1.5+ years of software engineering projects' },
    { id: 'edu', title: 'Education Parsed', tool: 'Schema Extraction', desc: 'B.Tech in Computer Science & Engineering detected' },
    { id: 'keywords', title: 'Keywords Found', tool: 'TF-IDF Frequency', desc: 'High-frequency keywords mapped to target job profile' },
  ];

  useEffect(() => {
    if (!isScanning) return;

    const timer = setInterval(() => {
      setScanStep((prev) => {
        if (prev < aiUnderstandingList.length) {
          return prev + 1;
        } else {
          return 1; // Seamless demo restart
        }
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isScanning, aiUnderstandingList.length]);

  const restartScan = () => {
    setScanStep(0);
    setIsScanning(true);
  };

  return (
    <section id="scan-demo" className="landing-section-block bg-slate relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-primary" />
            <span>INTERACTIVE SCAN SIMULATION</span>
          </div>
          <h2 className="section-main-heading">Watch Your Resume Become Career Intelligence</h2>
          <p className="section-sub-heading">
            A realistic demonstration of automated structural text parsing, entity extraction, and profile understanding.
          </p>
        </div>

        {/* Split Section (Requirement 19) */}
        <div className="resume-scan-dual-grid">
          {/* LEFT: Realistic Resume Document UI with Scan Line Contained Inside Sheet */}
          <div className="scan-doc-container">
            <div className="scan-doc-header">
              <div className="doc-type-pill">
                <FileText size={14} className="text-primary" />
                <span>Candidate_Resume.pdf</span>
              </div>
              <button
                type="button"
                className="scan-restart-btn"
                onClick={restartScan}
                title="Restart Scan Simulation"
              >
                <RefreshCw size={13} className="mr-1" />
                Restart Scan
              </button>
            </div>

            {/* The Document Sheet */}
            <div className="scan-sheet-paper relative-overflow">
              {/* Subtle Laser Scan Line Strictly Constrained Within This Document Paper */}
              <motion.div
                className="laser-scan-line-contained"
                animate={{
                  top: ['2%', '95%', '2%'],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Realistic Resume Content Sections: Profile, Education, Skills, Projects, Experience */}
              <div className="simulated-resume-content">
                {/* 1. Profile */}
                <div className="res-header-block">
                  <h3 className="res-candidate-name">Alex Morgan</h3>
                  <p className="res-candidate-meta">Full Stack Developer • alex.morgan@example.com • Bengaluru, India</p>
                  <p className="res-profile-summary">
                    Motivated software developer passionate about building scalable web applications and REST APIs.
                  </p>
                </div>

                {/* 2. Skills */}
                <div className="res-section-block">
                  <h4 className="res-section-title">TECHNICAL SKILLS</h4>
                  <div className="res-skills-list">
                    <span className="res-tag">Python</span>
                    <span className="res-tag">React.js</span>
                    <span className="res-tag">JavaScript (ES6+)</span>
                    <span className="res-tag">Flask</span>
                    <span className="res-tag">MySQL</span>
                    <span className="res-tag">REST APIs</span>
                    <span className="res-tag">Git</span>
                    <span className="res-tag">Tailwind CSS</span>
                  </div>
                </div>

                {/* 3. Experience */}
                <div className="res-section-block">
                  <h4 className="res-section-title">WORK EXPERIENCE</h4>
                  <p className="res-job-title"><strong>Junior Software Developer</strong> — Nexus Labs (2024 - Present)</p>
                  <p className="res-job-bullet">• Developed modular React dashboard interfaces handling live telemetry metrics.</p>
                  <p className="res-job-bullet">• Built REST endpoints in Python Flask backed by relational MySQL schemas.</p>
                </div>

                {/* 4. Projects */}
                <div className="res-section-block">
                  <h4 className="res-section-title">FEATURED PROJECTS</h4>
                  <p className="res-proj-line"><strong>Career Management Portal:</strong> Multi-tenant web platform with JWT auth and document parsing.</p>
                  <p className="res-proj-line"><strong>Inventory Telemetry Service:</strong> Microservice handling event streams with Python and SQL.</p>
                </div>

                {/* 5. Education */}
                <div className="res-section-block">
                  <h4 className="res-section-title">EDUCATION</h4>
                  <p className="res-edu-line"><strong>B.Tech in Computer Science &amp; Engineering</strong> — 2020-2024 (GPA: 8.4/10)</p>
                </div>
              </div>
            </div>

            <div className="scan-doc-footer-note">
              <span>* Contained Interactive Preview • No external personal records are stored.</span>
            </div>
          </div>

          {/* RIGHT: AI Understanding Checklist */}
          <div className="scan-analysis-status-panel">
            <div className="panel-status-header">
              <div className="flex-between">
                <div>
                  <h3 className="panel-title-text">AI Understanding</h3>
                  <span className="panel-sub-text">Live Natural Language Processing Extraction</span>
                </div>
                <div className="panel-live-badge">
                  <span className="live-pulse"></span>
                  <span>Active Analysis</span>
                </div>
              </div>
            </div>

            <div className="scan-steps-checklist">
              {aiUnderstandingList.map((step, idx) => {
                const isPassed = scanStep > idx;
                const isCurrent = scanStep === idx + 1;

                return (
                  <motion.div
                    key={step.id}
                    className={`scan-step-item ${isPassed ? 'step-passed' : ''} ${isCurrent ? 'step-active' : ''}`}
                    animate={isCurrent ? { scale: [1, 1.015, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="step-status-icon-box">
                      {isPassed ? (
                        <CheckCircle2 size={18} className="text-emerald" />
                      ) : isCurrent ? (
                        <div className="step-spinner-dot"></div>
                      ) : (
                        <Clock size={16} className="text-muted" />
                      )}
                    </div>

                    <div className="step-body-info">
                      <div className="step-top-title-row">
                        <strong className="step-name">{step.title}</strong>
                        <span className="step-tech-badge">{step.tool}</span>
                      </div>
                      <p className="step-desc-note">{step.desc}</p>
                    </div>

                    <div className="step-right-indicator">
                      {isPassed ? (
                        <span className="badge-pass">✓ Verified</span>
                      ) : isCurrent ? (
                        <span className="badge-running">Parsing</span>
                      ) : (
                        <span className="badge-queued">Queued</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Summary Score Callout */}
            <div className="scan-bottom-score-box">
              <div className="score-box-left">
                <span className="score-box-label">Aggregated Candidate Readiness</span>
                <strong className="score-box-number">78% Match Score</strong>
              </div>
              <div className="score-box-right">
                <span className="score-status-tag tag-ready">Profile Processed ✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
