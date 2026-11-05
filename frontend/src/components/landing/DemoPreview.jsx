import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Award,
  Cpu,
  FileCheck2,
} from 'lucide-react';
import Button from '../common/Button';

export default function DemoPreview() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('Full Stack AI Engineer');

  const demoPresets = {
    'Full Stack AI Engineer': {
      title: 'Full Stack AI Engineer',
      candidateName: 'Alex Morgan',
      resumeScore: 86,
      atsCompliance: 'Sample Quality: 86/100',
      matchScore: 82,
      skillOverlapPct: 84,
      cosineSimilarityPct: 77,
      readinessIndex: 88,
      verifiedSkills: ['Python', 'React.js', 'Flask', 'MySQL', 'REST APIs', 'Git', 'NLTK', 'Scikit-Learn'],
      missingSkills: ['Docker Containerization', 'AWS Cloud (EC2/RDS)', 'Redis Caching'],
      strongestDomain: 'NLP Parsing & Full-Stack API Integration (High Affinity)',
      priorityRemediation: 'Containerize microservices with Docker Compose (+8% match boost)',
      recommendedStep: 'Complete Milestone Phase 2: Docker Containerization Architecture',
    },
    'Frontend Developer': {
      title: 'Frontend Developer',
      candidateName: 'Sarah Chen',
      resumeScore: 84,
      atsCompliance: 'Sample Quality: 84/100',
      matchScore: 78,
      skillOverlapPct: 80,
      cosineSimilarityPct: 73,
      readinessIndex: 82,
      verifiedSkills: ['React.js', 'JavaScript (ES6+)', 'HTML5 / CSS3', 'Tailwind CSS', 'REST APIs', 'Git'],
      missingSkills: ['TypeScript Generics', 'Next.js App Router', 'Vite Bundle Optimization'],
      strongestDomain: 'Modern Reactive Component Architecture (High Affinity)',
      priorityRemediation: 'Adopt TypeScript strict typing in frontend state models (+12% match boost)',
      recommendedStep: 'Complete Milestone Phase 2: TypeScript Generics & Type Systems',
    },
    'Python Backend Engineer': {
      title: 'Python Backend Engineer',
      candidateName: 'David Kumar',
      resumeScore: 81,
      atsCompliance: 'Sample Quality: 81/100',
      matchScore: 75,
      skillOverlapPct: 76,
      cosineSimilarityPct: 72,
      readinessIndex: 79,
      verifiedSkills: ['Python', 'Flask', 'SQL / MySQL', 'Database Schema Design', 'RESTful Endpoints', 'Postman'],
      missingSkills: ['Docker Containerization', 'AWS EC2 / S3', 'Celery Background Tasks', 'PyTest Automation'],
      strongestDomain: 'Relational Database Optimization & API Endpoints (High Affinity)',
      priorityRemediation: 'Deploy containerized services with automated unit test suites (+14% match boost)',
      recommendedStep: 'Complete Milestone Phase 1: Microservice Dockerization & PyTest CI',
    },
  };

  const active = demoPresets[selectedRole];

  return (
    <section id="analytics" className="landing-section-block bg-white relative-overflow">
      <div className="section-container">
        {/* Section Header */}
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={13} className="text-primary" />
            <span>INTERACTIVE DEMO CONSOLE</span>
          </div>
          <h2 className="section-main-heading">Analytical Precision Dashboard</h2>
          <p className="section-sub-heading">
            Sample output illustrating explainable 70/30 matching, differential skill matrix isolation, and milestone readiness.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="analytics-role-tabs-row" role="tablist" aria-label="Demo Role Presets">
          {Object.keys(demoPresets).map((role) => (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={selectedRole === role}
              className={`analytics-tab-btn ${selectedRole === role ? 'tab-active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <Briefcase size={14} />
              <span>{role}</span>
            </button>
          ))}
        </div>

        {/* Precision Dashboard Mockup Container */}
        <div className="precision-dashboard-window">
          {/* Window Chrome Header Bar */}
          <div className="precision-window-header">
            <div className="window-dots-wrap">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="window-address-pill">
              <span>careersense.ai / preview / sample-assessment</span>
            </div>
            <div className="window-algorithm-badge">
              <span>SIMULATED ASSESSMENT</span>
            </div>
          </div>

          {/* Candidate Profile Summary Strip */}
          <div className="precision-profile-banner">
            <div className="profile-identity-group">
              <div className="profile-avatar-box">
                {active.candidateName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="profile-name-row">
                  <h3 className="profile-display-name">{active.candidateName}</h3>
                  <span className="profile-verified-tag">
                    Sample Candidate (Demo)
                  </span>
                </div>
                <span className="profile-target-role">
                  Target Requisition: <strong>{active.title}</strong>
                </span>
              </div>
            </div>

            <div className="profile-quick-stats">
              <div className="quick-stat-badge">
                <FileCheck2 size={14} className="text-primary" />
                <span>{active.atsCompliance}</span>
              </div>
              <div className="quick-stat-badge">
                <Cpu size={14} className="text-teal" />
                <span>Weighted Matching Model</span>
              </div>
            </div>
          </div>

          {/* Dashboard Two-Column Grid */}
          <div className="precision-grid-stage">
            {/* Left Column: Quantitative Match Breakdown */}
            <div className="precision-column-left">
              {/* ATS Resume Score Card */}
              <div className="precision-card ats-score-card">
                <div className="precision-card-header">
                  <span className="precision-card-label">SAMPLE ATS AUDIT SCORE</span>
                  <span className="precision-pill-green">Quality Score</span>
                </div>
                <div className="ats-score-display">
                  <div className="ats-score-number">{active.resumeScore}</div>
                  <div className="ats-score-meta">
                    <span className="ats-score-max">/ 100 Sample Score</span>
                    <p className="ats-score-desc">
                      Formatting structure, section boundaries, and verified skill density.
                    </p>
                  </div>
                </div>
                <div className="ats-progress-bar-track">
                  <div className="ats-progress-bar-fill" style={{ width: `${active.resumeScore}%` }} />
                </div>
              </div>

              {/* Match Confidence Card */}
              <div className="precision-card math-fit-card">
                <div className="precision-card-header">
                  <span className="precision-card-label">MATCH CONFIDENCE BREAKDOWN</span>
                  <span className="precision-score-badge">{active.matchScore}% Sample Fit</span>
                </div>

                <div className="math-fit-breakdown">
                  {/* Skill Overlap (70% Weight) */}
                  <div className="math-component-row">
                    <div className="math-row-label">
                      <strong>Skill Coverage (70% Weight)</strong>
                      <span>Direct entity match ratio against required tech</span>
                    </div>
                    <div className="math-row-val text-primary">{active.skillOverlapPct}%</div>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-fill bg-primary" style={{ width: `${active.skillOverlapPct}%` }} />
                  </div>

                  {/* TF-IDF Cosine Similarity (30% Weight) */}
                  <div className="math-component-row">
                    <div className="math-row-label">
                      <strong>TF-IDF Cosine Similarity (30% Weight)</strong>
                      <span>Semantic vector space angle between resume &amp; JD</span>
                    </div>
                    <div className="math-row-val text-teal">{active.cosineSimilarityPct}%</div>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-fill bg-teal" style={{ width: `${active.cosineSimilarityPct}%` }} />
                  </div>
                </div>

                <div className="math-equation-banner">
                  <code>Score = (0.70 × {active.skillOverlapPct}%) + (0.30 × {active.cosineSimilarityPct}%) = {active.matchScore}%</code>
                </div>
              </div>

              {/* Career Readiness Index */}
              <div className="precision-card readiness-card">
                <div className="precision-card-header">
                  <span className="precision-card-label">READINESS ASSESSMENT</span>
                  <span className="precision-pill-emerald">{active.readinessIndex}% Readiness</span>
                </div>
                <p className="readiness-summary-p">
                  Candidate meets foundational hiring benchmarks for junior/associate tier positions. Completing recommended milestones unlocks senior candidacy.
                </p>
              </div>
            </div>

            {/* Right Column: Skill Matrix & Actionable Roadmap */}
            <div className="precision-column-right">
              {/* Skill Coverage Matrix Card */}
              <div className="precision-card skill-matrix-card">
                <div className="precision-card-header">
                  <span className="precision-card-label">DIFFERENTIAL SKILL MATRIX</span>
                  <span className="precision-count-tag">
                    {active.verifiedSkills.length} Matched • {active.missingSkills.length} Gaps
                  </span>
                </div>

                {/* Verified Skills */}
                <div className="matrix-sub-block">
                  <span className="matrix-sub-title text-emerald">
                    <CheckCircle2 size={13} /> Extracted Proficiencies ({active.verifiedSkills.length})
                  </span>
                  <div className="matrix-chips-cluster">
                    {active.verifiedSkills.map((sk) => (
                      <span key={sk} className="skill-chip chip-verified">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="matrix-sub-block">
                  <span className="matrix-sub-title text-amber">
                    <AlertCircle size={13} /> Prerequisite Skill Gaps ({active.missingSkills.length})
                  </span>
                  <div className="matrix-chips-cluster">
                    {active.missingSkills.map((sk) => (
                      <span key={sk} className="skill-chip chip-gap">
                        + {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Insights Card */}
              <div className="precision-card insights-card">
                <div className="precision-card-header">
                  <span className="precision-card-label">STRATEGIC CAREER INSIGHTS</span>
                </div>

                <div className="insight-callout callout-strength">
                  <div className="callout-icon-wrap bg-primary-light text-primary">
                    <Award size={16} />
                  </div>
                  <div className="callout-text">
                    <strong>Strongest Competency Domain</strong>
                    <span>{active.strongestDomain}</span>
                  </div>
                </div>

                <div className="insight-callout callout-opportunity">
                  <div className="callout-icon-wrap bg-amber-light text-amber">
                    <TrendingUp size={16} />
                  </div>
                  <div className="callout-text">
                    <strong>Highest ROI Skill Upgrade</strong>
                    <span>{active.priorityRemediation}</span>
                  </div>
                </div>
              </div>

              {/* Actionable Next Step Card */}
              <div className="precision-card next-action-card">
                <div className="next-action-header">
                  <div className="action-step-chip">RECOMMENDED MILESTONE</div>
                  <Link to="/analyze" className="action-explore-link">
                    Start Real Analysis <ArrowRight size={12} />
                  </Link>
                </div>
                <h4 className="next-action-title">{active.recommendedStep}</h4>
                <p className="next-action-desc">
                  Estimated 2-week progression including container setup, microservice deployment, and mock interview practice.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Console Action Footer */}
          <div className="precision-window-footer">
            <div className="console-footer-note">
              <span>Ready to test your real resume against industry job postings?</span>
            </div>
            <div className="console-footer-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/analyze')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Analyze My Resume Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
