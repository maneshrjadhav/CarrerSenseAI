import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Target,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  Check,
  XCircle,
  Compass,
  ArrowRight,
  Award,
  Zap,
} from 'lucide-react';

export default function PipelinePreview() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pipeline'
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    {
      num: '01',
      id: 'doc',
      name: 'Resume Ingestion',
      engine: 'PyMuPDF Parser',
      status: activeStep === 0 ? 'PROCESSING' : activeStep > 0 ? 'COMPLETE' : 'READY',
      detail: 'Extract text blocks and structural entity tokens',
    },
    {
      num: '02',
      id: 'nlp',
      name: 'NLP Normalization',
      engine: 'NLTK Engine',
      status: activeStep === 1 ? 'PROCESSING' : activeStep > 1 ? 'COMPLETE' : 'READY',
      detail: 'Tokenization, stop-word filtering & lemmatization',
    },
    {
      num: '03',
      id: 'tfidf',
      name: 'TF-IDF Vector Space',
      engine: 'Scikit-Learn',
      status: activeStep === 2 ? 'PROCESSING' : activeStep > 2 ? 'COMPLETE' : 'READY',
      detail: 'Multidimensional feature frequency projection',
    },
    {
      num: '04',
      id: 'skills',
      name: 'Skill Gap Matrix',
      engine: 'Difference Engine',
      status: activeStep === 3 ? 'PROCESSING' : activeStep > 3 ? 'COMPLETE' : 'READY',
      detail: 'Set classification of matched vs missing proficiencies',
    },
    {
      num: '05',
      id: 'score',
      name: 'Match Score',
      engine: 'Cosine θ Angle',
      status: activeStep === 4 ? 'COMPLETE' : activeStep > 3 ? 'COMPLETE' : 'PROCESSING',
      detail: 'Objective mathematical similarity alignment metric',
    },
  ];

  const matchedSkills = ['React.js', 'Python', 'Flask', 'MySQL', 'REST APIs', 'Git'];
  const missingSkills = [
    { name: 'Docker Containerization', priority: 'HIGH' },
    { name: 'AWS Cloud (EC2/RDS)', priority: 'MEDIUM' },
  ];

  return (
    <div className="hero-product-console-wrapper">
      <div className="product-pipeline-mockup ai-live-console-box">
        {/* Window Chrome Header Bar */}
        <div className="mockup-window-header">
          <div className="window-dots-group">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>

          {/* Interactive View Toggle Tabs */}
          <div className="mockup-tab-pills">
            <button
              type="button"
              className={`mockup-tab-btn ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={13} />
              <span>Dashboard Preview</span>
            </button>
            <button
              type="button"
              className={`mockup-tab-btn ${activeTab === 'pipeline' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Cpu size={13} />
              <span>Pipeline Flow</span>
            </button>
          </div>

          <div className="status-live-indicator">
            <span className="demo-label-tag">SIMULATED PREVIEW</span>
          </div>
        </div>

        {/* Tab 1: Product Dashboard Preview */}
        {activeTab === 'dashboard' ? (
          <div className="preview-dashboard-body">
            {/* Dossier Header */}
            <div className="preview-dossier-header">
              <div className="dossier-user-wrap">
                <div className="dossier-avatar-box">AM</div>
                <div>
                  <div className="dossier-name-row">
                    <strong className="dossier-user-name">Alex Morgan</strong>
                    <span className="dossier-verified-badge">Sample Profile (Demo)</span>
                  </div>
                  <span className="dossier-role-text">
                    Target Role: <strong>Full Stack AI Engineer</strong>
                  </span>
                </div>
              </div>
              <div className="dossier-engine-tag">
                <span>SIMULATED OUTPUT</span>
              </div>
            </div>

            {/* 3 Executive Metric Cards */}
            <div className="preview-metrics-grid">
              {/* Card 1: Resume Quality Score */}
              <div className="preview-metric-card">
                <div className="card-top-header">
                  <span className="card-metric-label">ATS Resume Score</span>
                  <Award size={13} className="text-primary" />
                </div>
                <div className="card-value-row">
                  <span className="card-score-number">84</span>
                  <span className="card-score-caption">/ 100 Quality</span>
                </div>
                <div className="card-progress-bar-track">
                  <div className="card-progress-bar-fill fill-blue" style={{ width: '84%' }}></div>
                </div>
              </div>

              {/* Card 2: Job Match Score */}
              <div className="preview-metric-card">
                <div className="card-top-header">
                  <span className="card-metric-label">Role Match Score</span>
                  <Target size={13} className="text-emerald" />
                </div>
                <div className="card-value-row">
                  <span className="card-score-number text-emerald">78%</span>
                  <span className="card-score-caption">Strong Alignment</span>
                </div>
                <div className="card-progress-bar-track">
                  <div className="card-progress-bar-fill fill-green" style={{ width: '78%' }}></div>
                </div>
              </div>

              {/* Card 3: Career Roadmap Progress */}
              <div className="preview-metric-card">
                <div className="card-top-header">
                  <span className="card-metric-label">Roadmap Progress</span>
                  <Compass size={13} className="text-purple" />
                </div>
                <div className="card-value-row">
                  <span className="card-score-number text-purple">65%</span>
                  <span className="card-score-caption">Phase 2 Active</span>
                </div>
                <div className="card-progress-bar-track">
                  <div className="card-progress-bar-fill fill-purple" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            {/* Skills Differential Matrix */}
            <div className="preview-skills-matrix">
              {/* Matched Proficiencies */}
              <div className="matrix-skills-block matched-block">
                <div className="matrix-block-title">
                  <CheckCircle2 size={13} className="text-emerald" />
                  <strong>Matched Competencies ({matchedSkills.length})</strong>
                </div>
                <div className="matrix-tags-wrap">
                  {matchedSkills.map((sk) => (
                    <span key={sk} className="skill-pill-tag matched-tag">
                      <Check size={10} /> {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Identified Missing Gaps */}
              <div className="matrix-skills-block missing-block">
                <div className="matrix-block-title">
                  <XCircle size={13} className="text-red" />
                  <strong>Prerequisite Gaps ({missingSkills.length})</strong>
                </div>
                <div className="matrix-tags-wrap">
                  {missingSkills.map((gap) => (
                    <span key={gap.name} className="skill-pill-tag missing-tag">
                      <span className="gap-dot"></span>
                      {gap.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actionable Next Step Callout */}
            <div className="preview-action-callout">
              <div className="callout-left">
                <div className="callout-icon-box">
                  <Zap size={13} />
                </div>
                <span className="callout-text">
                  <strong>Recommended Next Step:</strong> Complete the <em>Docker Containerization</em> roadmap milestone to boost fit score.
                </span>
              </div>
              <span className="callout-link-badge">
                Phase 2 Milestone <ArrowRight size={11} />
              </span>
            </div>
          </div>
        ) : (
          /* Tab 2: Processing Pipeline Stages */
          <div className="ai-console-stages-list">
            {stages.map((st, idx) => {
              const isCurrent = activeStep === idx;
              const isCompleted = activeStep > idx;

              return (
                <div
                  key={st.id}
                  className={`console-stage-row ${isCurrent ? 'row-active' : ''} ${isCompleted ? 'row-completed' : ''}`}
                >
                  <div className="stage-left-info">
                    <span className="stage-index-bullet">{st.num}</span>
                    <div>
                      <strong className="stage-row-name">{st.name}</strong>
                      <span className="stage-engine-caption">
                        {st.engine} • {st.detail}
                      </span>
                    </div>
                  </div>

                  <div className="stage-right-status">
                    {st.status === 'PROCESSING' && (
                      <span className="status-pill-running">
                        <Loader2 size={11} className="animate-spin mr-1" />
                        PROCESSING
                      </span>
                    )}
                    {st.status === 'COMPLETE' && (
                      <span className="status-pill-done">
                        <Check size={11} className="mr-1" />
                        COMPLETE
                      </span>
                    )}
                    {st.status === 'READY' && (
                      <span className="status-pill-ready">READY</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
