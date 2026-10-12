import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Cpu,
  Layers,
  Compass,
  Award,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function CareerIntelligenceMap() {
  const [activeNode, setActiveNode] = useState(null);

  const candidateSkills = ['Python', 'React', 'JavaScript', 'SQL', 'Git'];
  const missingSkills = ['Docker', 'AWS Cloud', 'TypeScript'];
  const roadmapPillars = [
    { title: 'Learning', desc: 'Guided video modules & documentation' },
    { title: 'Projects', desc: 'Containerized microservice build' },
    { title: 'Certification', desc: 'AWS Cloud Practitioner prep' },
    { title: 'Interview', desc: 'STAR behavioral & system design' },
  ];

  return (
    <section id="semantic-map" className="landing-section-block bg-white relative-overflow">
      <div className="section-container">
        <div className="section-title-wrap text-center">
          <div className="inline-badge-pill">
            <Sparkles size={14} className="text-teal" />
            <span>SEMANTIC KNOWLEDGE GRAPH</span>
          </div>
          <h2 className="section-main-heading">See How CareerSense AI Understands You</h2>
          <p className="section-sub-heading">
            Moving beyond simple keyword counts: a connected graph model linking your competencies, missing prerequisites, learning milestones, and placement readiness.
          </p>
        </div>

        {/* Semantic Visual Network Map */}
        <div className="semantic-map-card">
          <div className="semantic-map-header-bar">
            <div className="map-badge-left">
              <span className="live-pulse"></span>
              <strong>Semantic Graph Inference Engine</strong>
            </div>
            <div className="map-badge-right">
              <Info size={14} className="text-muted" />
              <span>Interactive Nodes — Hover to Inspect Semantic Links</span>
            </div>
          </div>

          <div className="semantic-graph-stage">
            {/* Column 1: Candidate Profile & Detected Skills */}
            <div className="graph-cluster-col">
              <motion.div
                className={`graph-anchor-node candidate-node ${activeNode === 'candidate' ? 'glow-active' : ''}`}
                onMouseEnter={() => setActiveNode('candidate')}
                onMouseLeave={() => setActiveNode(null)}
                whileHover={{ scale: 1.03 }}
              >
                <div className="node-avatar-circle">
                  <UserCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="anchor-node-title">Candidate Profile</h4>
                  <span className="anchor-node-sub">5 Verified Skills Detected</span>
                </div>
              </motion.div>

              <div className="graph-branch-connector">
                <span className="branch-label">Extracted Entities ↓</span>
              </div>

              <div className="skills-chips-cluster">
                {candidateSkills.map((sk) => (
                  <motion.div
                    key={sk}
                    className={`node-skill-pill pill-matched ${activeNode === sk ? 'pill-highlight' : ''}`}
                    onMouseEnter={() => setActiveNode(sk)}
                    onMouseLeave={() => setActiveNode(null)}
                    whileHover={{ y: -3, scale: 1.05 }}
                  >
                    <span className="skill-dot-green"></span>
                    <span>{sk}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Stream 1 */}
            <div className="graph-stream-arrow">
              <svg width="60" height="120" viewBox="0 0 60 120" fill="none" className="stream-svg">
                <path d="M5 60 C30 60, 30 60, 55 60" stroke="#0891b2" strokeWidth="2.5" strokeDasharray="4 4" className="flowing-path-anim" />
                <polygon points="55,56 60,60 55,64" fill="#0891b2" />
              </svg>
            </div>

            {/* Column 2: Skill Gap Detection */}
            <div className="graph-cluster-col">
              <motion.div
                className={`graph-anchor-node gap-node ${activeNode === 'gap' ? 'glow-active' : ''}`}
                onMouseEnter={() => setActiveNode('gap')}
                onMouseLeave={() => setActiveNode(null)}
                whileHover={{ scale: 1.03 }}
              >
                <div className="node-avatar-circle circle-amber">
                  <Layers size={20} className="text-amber" />
                </div>
                <div>
                  <h4 className="anchor-node-title">Skill Gap Analysis</h4>
                  <span className="anchor-node-sub">Differential Matrix Logic</span>
                </div>
              </motion.div>

              <div className="graph-branch-connector">
                <span className="branch-label text-amber">Prerequisite Deficits ↓</span>
              </div>

              <div className="skills-chips-cluster">
                {missingSkills.map((sk) => (
                  <motion.div
                    key={sk}
                    className={`node-skill-pill pill-missing ${activeNode === sk ? 'pill-highlight' : ''}`}
                    onMouseEnter={() => setActiveNode(sk)}
                    onMouseLeave={() => setActiveNode(null)}
                    whileHover={{ y: -3, scale: 1.05 }}
                  >
                    <span className="skill-dot-amber">+</span>
                    <span>{sk}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Stream 2 */}
            <div className="graph-stream-arrow">
              <svg width="60" height="120" viewBox="0 0 60 120" fill="none" className="stream-svg">
                <path d="M5 60 C30 60, 30 60, 55 60" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="4 4" className="flowing-path-anim" />
                <polygon points="55,56 60,60 55,64" fill="#7c3aed" />
              </svg>
            </div>

            {/* Column 3: Career Roadmap Synthesis */}
            <div className="graph-cluster-col">
              <motion.div
                className={`graph-anchor-node roadmap-node ${activeNode === 'roadmap' ? 'glow-active' : ''}`}
                onMouseEnter={() => setActiveNode('roadmap')}
                onMouseLeave={() => setActiveNode(null)}
                whileHover={{ scale: 1.03 }}
              >
                <div className="node-avatar-circle circle-purple">
                  <Compass size={20} className="text-purple" />
                </div>
                <div>
                  <h4 className="anchor-node-title">Career Roadmap</h4>
                  <span className="anchor-node-sub">Tailored Milestone Tracks</span>
                </div>
              </motion.div>

              <div className="graph-branch-connector">
                <span className="branch-label text-purple">Action Pathways ↓</span>
              </div>

              <div className="roadmap-micro-stack">
                {roadmapPillars.map((p, idx) => (
                  <motion.div
                    key={p.title}
                    className="roadmap-step-strip"
                    whileHover={{ x: 4 }}
                  >
                    <span className="step-num-pill">{idx + 1}</span>
                    <div className="step-text-wrap">
                      <strong className="step-title-small">{p.title}</strong>
                      <span className="step-desc-small">{p.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Stream 3 */}
            <div className="graph-stream-arrow">
              <svg width="60" height="120" viewBox="0 0 60 120" fill="none" className="stream-svg">
                <path d="M5 60 C30 60, 30 60, 55 60" stroke="#059669" strokeWidth="2.5" strokeDasharray="4 4" className="flowing-path-anim" />
                <polygon points="55,56 60,60 55,64" fill="#059669" />
              </svg>
            </div>

            {/* Column 4: Target Job Readiness */}
            <div className="graph-cluster-col col-readiness">
              <motion.div
                className="readiness-destination-card"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.3 }}
              >
                <div className="readiness-icon-halo">
                  <Award size={28} className="text-emerald" />
                </div>
                <div className="readiness-score-display">
                  <span className="readiness-percentage">82%</span>
                  <span className="readiness-tagline">Career Readiness</span>
                </div>
                <p className="readiness-footnote">
                  Ready for Junior/Associate Placement in Full-Stack &amp; Python Roles
                </p>
                <div className="readiness-mini-breakdown">
                  <span className="mini-stat-bullet">✓ Strong Base Syntax</span>
                  <span className="mini-stat-bullet">✓ Proven Web Frameworks</span>
                  <span className="mini-stat-bullet">▲ In-Progress Cloud Setup</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Graph Interactive Legend Footer */}
          <div className="semantic-map-legend">
            <span className="legend-item"><span className="legend-dot green"></span> Extracted Candidate Proficiencies</span>
            <span className="legend-item"><span className="legend-dot amber"></span> Prerequisite Benchmark Gaps</span>
            <span className="legend-item"><span className="legend-dot purple"></span> Milestone Remediation Pathway</span>
            <span className="legend-item"><span className="legend-dot emerald"></span> Target Job Placement Readiness</span>
          </div>
        </div>
      </div>
    </section>
  );
}

