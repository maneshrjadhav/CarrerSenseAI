import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Compass,
  Lightbulb,
  Award,
  ShieldCheck,
} from 'lucide-react';
import Button from '../common/Button';

export default function DemoPreview() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');

  // Exact 3 tabs & metrics from Requirement 23
  const demoPresets = {
    'Frontend Developer': {
      resumeScore: 78,
      jobMatches: 14,
      skillsMatched: 24,
      skillsMissing: 7,
      careerReadiness: 82,
      matchedList: ['React.js', 'JavaScript (ES6+)', 'HTML5', 'CSS3/Tailwind', 'Git & GitHub', 'REST APIs'],
      missingList: ['TypeScript', 'Next.js SSR', 'Webpack/Vite Build Optimization'],
      roadmapSummary: 'Master TypeScript typing, followed by Next.js App Router and production bundle optimization.',
      strongestArea: 'Component Architecture & Responsive UI (94%)',
      opportunity: 'Modern Full-Stack SSR with Next.js (+15% boost)',
      nextSkill: 'TypeScript Type Systems & Generics',
    },
    'Python Backend Engineer': {
      resumeScore: 74,
      jobMatches: 11,
      skillsMatched: 21,
      skillsMissing: 9,
      careerReadiness: 76,
      matchedList: ['Python', 'Flask', 'SQL / MySQL', 'RESTful API Design', 'Git Version Control'],
      missingList: ['Docker Containerization', 'AWS Cloud (EC2/RDS)', 'Redis Caching', 'Celery Async Workers'],
      roadmapSummary: 'Containerize Flask services with Docker, set up Redis caching layers, and deploy to AWS EC2.',
      strongestArea: 'Relational Database Queries & API Endpoints (88%)',
      opportunity: 'Cloud Infrastructure & Containerization (+20% boost)',
      nextSkill: 'Docker Multi-Stage Builds & Compose',
    },
    'Full Stack Engineer': {
      resumeScore: 71,
      jobMatches: 9,
      skillsMatched: 20,
      skillsMissing: 11,
      careerReadiness: 72,
      matchedList: ['React', 'Python', 'MySQL', 'JavaScript', 'HTML/CSS', 'Postman'],
      missingList: ['Docker', 'System Design Patterns', 'CI/CD Pipelines (GitHub Actions)', 'GraphQL'],
      roadmapSummary: 'Implement automated CI/CD deployment pipelines and study scalable system design architectures.',
      strongestArea: 'Full-Stack Integration & Database Schema Design (86%)',
      opportunity: 'DevOps & Automated Testing Pipelines (+18% boost)',
      nextSkill: 'System Design Patterns & Caching',
    },
  };

  const activeData = demoPresets[selectedRole];

  return (
    <section id="demo" className="landing-section-block bg-white relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-teal" />
            <span>INTERACTIVE DASHBOARD SHOWCASE</span>
          </div>
          <h2 className="section-main-heading">See CareerSense AI in Action</h2>
          <p className="section-sub-heading">
            Experience our candidate intelligence dashboard interface before creating an account.
          </p>
        </div>

        {/* Role Selector Tabs (Requirement 23) */}
        <div className="demo-role-tabs-row">
          {Object.keys(demoPresets).map((role) => (
            <button
              key={role}
              type="button"
              className={`demo-tab-btn ${selectedRole === role ? 'active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <Briefcase size={14} className="mr-1" />
              {role}
            </button>
          ))}
        </div>

        {/* Interactive Dashboard Mockup Card */}
        <motion.div
          className="demo-dashboard-mockup"
          key={selectedRole}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top Demo Bar Labeled INTERACTIVE DEMO */}
          <div className="mockup-window-header">
            <div className="window-dots-group">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="mockup-address-pill">
              <Sparkles size={12} className="text-primary" />
              <span>careersense.ai/dashboard/overview?role={selectedRole.toLowerCase().replace(/ /g, '-')}</span>
            </div>
            <div className="status-live-indicator">
              <span className="live-pulse"></span>
              <span className="demo-badge-txt">INTERACTIVE DEMO</span>
            </div>
          </div>

          {/* Exact 5 Metrics from Requirement 23 */}
          <div className="demo-metrics-grid">
            <div className="demo-metric-pill">
              <span className="demo-m-label">Resume Score</span>
              <span className="demo-m-val text-primary">{activeData.resumeScore}%</span>
            </div>
            <div className="demo-metric-pill">
              <span className="demo-m-label">Job Matches</span>
              <span className="demo-m-val text-emerald">{activeData.jobMatches} Matches</span>
            </div>
            <div className="demo-metric-pill">
              <span className="demo-m-label">Skills Matched</span>
              <span className="demo-m-val text-emerald">{activeData.skillsMatched} Skills</span>
            </div>
            <div className="demo-metric-pill">
              <span className="demo-m-label">Skills Missing</span>
              <span className="demo-m-val text-amber">{activeData.skillsMissing} Gaps</span>
            </div>
            <div className="demo-metric-pill">
              <span className="demo-m-label">Career Readiness</span>
              <span className="demo-m-val text-purple">{activeData.careerReadiness}% Ready</span>
            </div>
          </div>

          {/* AI Insight Cards Strip */}
          <div className="demo-ai-insights-strip">
            <div className="insight-card-item">
              <div className="insight-card-top">
                <ShieldCheck size={16} className="text-emerald" />
                <span className="insight-cat">STRONGEST AREA</span>
              </div>
              <strong className="insight-val">{activeData.strongestArea}</strong>
            </div>

            <div className="insight-card-item">
              <div className="insight-card-top">
                <TrendingUp size={16} className="text-primary" />
                <span className="insight-cat">BIGGEST OPPORTUNITY</span>
              </div>
              <strong className="insight-val">{activeData.opportunity}</strong>
            </div>

            <div className="insight-card-item">
              <div className="insight-card-top">
                <Lightbulb size={16} className="text-amber" />
                <span className="insight-cat">RECOMMENDED NEXT SKILL</span>
              </div>
              <strong className="insight-val">{activeData.nextSkill}</strong>
            </div>

            <div className="insight-card-item">
              <div className="insight-card-top">
                <Award size={16} className="text-purple" />
                <span className="insight-cat">CAREER READINESS</span>
              </div>
              <strong className="insight-val">{activeData.careerReadiness}% Placement Prepared</strong>
            </div>
          </div>

          {/* Dual Preview Cards */}
          <div className="demo-dual-split">
            <div className="demo-preview-box">
              <div className="demo-box-head">
                <CheckCircle2 size={16} className="text-emerald" />
                <strong>Matched Core Proficiencies ({activeData.matchedList.length})</strong>
              </div>
              <div className="demo-chips-flex">
                {activeData.matchedList.map((s) => (
                  <span key={s} className="demo-chip chip-green">✓ {s}</span>
                ))}
              </div>
            </div>

            <div className="demo-preview-box">
              <div className="demo-box-head">
                <AlertCircle size={16} className="text-amber" />
                <strong>Identified Missing Skills &amp; Gaps ({activeData.missingList.length})</strong>
              </div>
              <div className="demo-chips-flex">
                {activeData.missingList.map((s) => (
                  <span key={s} className="demo-chip chip-amber">+ {s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Roadmap Callout */}
          <div className="demo-roadmap-callout">
            <div className="callout-icon-box">
              <Compass size={18} className="text-purple" />
            </div>
            <div>
              <strong className="callout-title">Synthesized Milestone Roadmap for {selectedRole}:</strong>
              <p className="callout-text">{activeData.roadmapSummary}</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="demo-cta-row">
            <div className="demo-caption">
              <span>* Interactive Demo Preview. Ready to analyze your actual resume and live job specifications?</span>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => navigate('/analyze')}
            >
              Analyze Your Resume Now →
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
