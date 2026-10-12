import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

export default function SkillGapVisualizer() {
  const [filter, setFilter] = useState('all'); // 'all', 'matched', 'missing'

  // Exact Skills from Requirement 20
  const candidateSkills = ['Python', 'React', 'JavaScript', 'SQL', 'Git'];
  const jobRequirements = [
    { name: 'Python', status: 'matched' },
    { name: 'React', status: 'matched' },
    { name: 'JavaScript', status: 'matched' },
    { name: 'SQL', status: 'matched' },
    { name: 'Git', status: 'matched' },
    { name: 'Docker', status: 'missing' },
    { name: 'AWS', status: 'missing' },
    { name: 'TypeScript', status: 'missing' },
  ];

  const matchedSkills = jobRequirements.filter((s) => s.status === 'matched');
  const missingSkills = jobRequirements.filter((s) => s.status === 'missing');

  return (
    <section id="skill-gap" className="landing-section-block bg-white relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-teal" />
            <span>DIFFERENTIAL GAP ANALYSIS</span>
          </div>
          <h2 className="section-main-heading">Intelligent Skill Gap Comparison</h2>
          <p className="section-sub-heading">
            Objective set-matrix comparison that isolates verified candidate skills from high-priority job deficits.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="gap-filter-pills-row">
          <button
            type="button"
            className={`gap-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Skills (8 Total)
          </button>
          <button
            type="button"
            className={`gap-filter-pill pill-green ${filter === 'matched' ? 'active' : ''}`}
            onClick={() => setFilter('matched')}
          >
            Matched Skills ({matchedSkills.length})
          </button>
          <button
            type="button"
            className={`gap-filter-pill pill-amber ${filter === 'missing' ? 'active' : ''}`}
            onClick={() => setFilter('missing')}
          >
            Missing Skills ({missingSkills.length})
          </button>
        </div>

        {/* 3-Column Clean Comparison Visualization (Requirement 20) */}
        <div className="skill-gap-comparison-grid">
          {/* Column 1: Candidate Profile Skills */}
          <div className="comparison-side-card">
            <div className="side-card-header">
              <span className="side-card-label">CANDIDATE SKILLS</span>
              <h3 className="side-card-title">Candidate Profile</h3>
              <span className="side-card-count text-emerald">{candidateSkills.length} Verified Proficiencies</span>
            </div>

            <div className="skills-vertical-stack">
              {candidateSkills.map((sk) => (
                <div key={sk} className="skill-item-badge skill-matched">
                  <span className="dot-indicator green"></span>
                  <span className="skill-name-txt">{sk}</span>
                  <span className="skill-status-tag tag-green">Verified ✓</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column: The Matrix Comparison Hub */}
          <div className="comparison-middle-hub">
            <div className="hub-center-badge">
              <Layers size={18} className="text-teal" />
              <span>SKILL MATRIX SUMMARY</span>
            </div>

            <div className="hub-summary-stats">
              <div className="hub-stat-item green-stat">
                <span className="stat-big-val">{matchedSkills.length}</span>
                <span className="stat-sub-label">Matched Skills</span>
              </div>
              <div className="hub-stat-divider"></div>
              <div className="hub-stat-item amber-stat">
                <span className="stat-big-val">{missingSkills.length}</span>
                <span className="stat-sub-label">Missing Skills</span>
              </div>
            </div>

            <div className="hub-legend-callout">
              <p>
                <strong>Gap Analysis Result:</strong> Candidate directly matches 5 of 8 core technical requirements (62.5% direct overlap). Closing the 3 identified cloud and typing gaps bridges the profile to over 90% alignment.
              </p>
            </div>
          </div>

          {/* Column 3: Job Requirements & Missing Gaps */}
          <div className="comparison-side-card">
            <div className="side-card-header">
              <span className="side-card-label">JOB REQUIREMENTS</span>
              <h3 className="side-card-title">Target Requisition</h3>
              <span className="side-card-count">{jobRequirements.length} Prerequisite Criteria</span>
            </div>

            <div className="skills-vertical-stack">
              {jobRequirements
                .filter((item) => {
                  if (filter === 'matched') return item.status === 'matched';
                  if (filter === 'missing') return item.status === 'missing';
                  return true;
                })
                .map((req) => (
                  <motion.div
                    key={req.name}
                    className={`skill-item-badge ${req.status === 'matched' ? 'skill-matched' : 'skill-missing'}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className={`dot-indicator ${req.status === 'matched' ? 'green' : 'amber'}`}></span>
                    <span className="skill-name-txt">{req.name}</span>
                    <span className={`skill-status-tag ${req.status === 'matched' ? 'tag-green' : 'tag-amber'}`}>
                      {req.status === 'matched' ? 'Matched' : 'Missing Gap'}
                    </span>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
