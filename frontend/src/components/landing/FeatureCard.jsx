import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch,
  Cpu,
  Target,
  Layers,
  Compass,
  HelpCircle,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const WHY_FEATURES = [
  {
    id: 'screening',
    title: 'Intelligent Resume Screening',
    category: 'Ingestion & Parsing',
    desc: 'Extract clean structural text, contact details, and credentials from complex multi-column PDF resumes using PyMuPDF stream decoding.',
    icon: FileSearch,
    color: '#2563eb',
    microPreview: 'PDF → Extracted Text → Structured Schema',
  },
  {
    id: 'nlp',
    title: 'NLP-Based Analysis',
    category: 'Text Normalization',
    desc: 'Deep linguistic cleaning with tokenization, stop-word elimination, and lemmatization to extract underlying semantics.',
    icon: Cpu,
    color: '#0891b2',
    microPreview: 'Text → Tokens → Clean Text → Lemmatization',
  },
  {
    id: 'tfidf',
    title: 'TF-IDF Vector Matching',
    category: 'Vector Modeling',
    desc: 'Transform resumes and job specifications into TF-IDF vector spaces to compute objective mathematical Cosine Similarity.',
    icon: Target,
    color: '#0f766e',
    microPreview: 'Resume Vector → Job Vector → Similarity Score',
  },
  {
    id: 'skillgap',
    title: 'Skill Gap Detection',
    category: 'Competency Engine',
    desc: 'Differentiate candidate competencies against prerequisite job requirements using set matrix logic to isolate missing proficiencies.',
    icon: Layers,
    color: '#d97706',
    microPreview: 'Required Skills → Candidate Skills → Missing Gaps',
  },
  {
    id: 'roadmap',
    title: 'Personalized Career Roadmap',
    category: 'Growth Architecture',
    desc: 'Translate identified skill deficiencies into progressive learning milestones, project goals, and realistic career timelines.',
    icon: Compass,
    color: '#7c3aed',
    microPreview: 'Skill Gap → Learning → Projects → Job Ready',
  },
  {
    id: 'interview',
    title: 'Interview Preparation',
    category: 'Readiness Engine',
    desc: 'AI-synthesized technical coding problems and STAR-format behavioral questions tailored specifically to your target gaps.',
    icon: HelpCircle,
    color: '#2563eb',
    microPreview: 'Skills → Questions → Practice Simulation',
  },
  {
    id: 'jobmatching',
    title: 'AI Job Matching',
    category: 'Recommendation Core',
    desc: 'Calculate bidirectional match confidence across hundreds of job requisitions, ranking top opportunities by domain affinity.',
    icon: Briefcase,
    color: '#059669',
    microPreview: 'Candidate Embeddings ↔ Requisitions ↔ Ranked Matches',
  },
];

export default function FeatureCard({ feature, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div
      className={`cs-feature-card ${hovered ? 'hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      {/* Background Subtle Gradient Mesh on hover */}
      <div
        className="card-hover-halo"
        style={{
          background: `radial-gradient(circle at top right, ${feature.color}18 0%, transparent 70%)`,
        }}
      />

      <div className="feature-card-header">
        <motion.div
          className="feature-icon-wrapper"
          style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
          animate={hovered ? { rotate: [0, -10, 10, 0], scale: 1.08 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Icon size={22} className="feature-lucide-icon" />
        </motion.div>
        <span
          className="feature-category-pill"
          style={{ backgroundColor: `${feature.color}10`, color: feature.color }}
        >
          {feature.category}
        </span>
      </div>

      <h3 className="feature-title-text">{feature.title}</h3>
      <p className="feature-description-text">{feature.desc}</p>

      {/* Micro-preview pipeline reveal with glowing indicator */}
      <div className={`feature-micro-preview-box ${hovered ? 'preview-glow' : ''}`}>
        <span className="preview-label">Pipeline:</span>
        <code className="preview-code-tag">{feature.microPreview}</code>
      </div>

      <div className="feature-card-footer">
        <span className="learn-more-text">Explore Capability</span>
        <motion.div animate={hovered ? { x: 5 } : { x: 0 }} transition={{ duration: 0.2 }}>
          <ArrowRight size={15} className="feature-arrow-icon" style={{ color: feature.color }} />
        </motion.div>
      </div>
    </motion.div>
  );
}
