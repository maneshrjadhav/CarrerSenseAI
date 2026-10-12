import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Cpu,
  Layers,
  Target,
  Sparkles,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export default function PipelinePreview() {
  const [activeStep, setActiveStep] = useState(1); // 0 = doc, 1 = nlp, 2 = tfidf, 3 = skills, 4 = score

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
      name: 'NLP Processing',
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
      detail: 'Multidimensional sparse frequency vector projection',
    },
    {
      num: '04',
      id: 'skills',
      name: 'Skill Extraction',
      engine: 'Difference Matrix',
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

  return (
    <div className="hero-product-console-wrapper">
      {/* Premium Browser-Window Console (Requirement 12) */}
      <div className="product-pipeline-mockup ai-live-console-box">
        {/* Console Header Bar */}
        <div className="mockup-window-header">
          <div className="window-dots-group">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="console-title-brand">
            <Sparkles size={13} className="text-primary" />
            <span className="console-brand-text">CAREERSENSE AI / LIVE ANALYSIS</span>
          </div>
          <div className="status-live-indicator">
            <span className="live-pulse"></span>
            <span className="demo-label-tag">DEMO UI ONLY</span>
          </div>
        </div>

        {/* Live Processing Pipeline Stages */}
        <div className="ai-console-stages-list">
          {stages.map((st, idx) => {
            const isCurrent = activeStep === idx;
            const isCompleted = activeStep > idx;

            return (
              <React.Fragment key={st.id}>
                <div
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
                        <Loader2 size={12} className="animate-spin mr-1" />
                        PROCESSING
                      </span>
                    )}
                    {st.status === 'COMPLETE' && (
                      <span className="status-pill-complete">
                        <CheckCircle2 size={12} className="mr-1 text-emerald" />
                        COMPLETE
                      </span>
                    )}
                    {st.status === 'READY' && (
                      <span className="status-pill-queued">READY</span>
                    )}
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="console-stage-connector-arrow">
                    <span className="connector-vertical-line"></span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Console Score Display Footer */}
        <div className="console-score-footer">
          <div className="footer-score-label-group">
            <span className="footer-score-title">Candidate Alignment Match</span>
            <span className="footer-score-subtitle">Semantic TF-IDF Cosine Distance cos(θ) = 0.784</span>
          </div>
          <div className="footer-score-badge">
            <span className="score-percentage-txt">78%</span>
            <span className="score-badge-sub">High Fit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
