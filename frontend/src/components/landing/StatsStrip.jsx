import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Target, Layers, Compass } from 'lucide-react';

export default function StatsStrip() {
  const stats = [
    {
      metric: 'NLTK',
      label: 'NLP Lemmatization',
      desc: 'Tokenization, stop-word elimination & base normalization',
      icon: Cpu,
    },
    {
      metric: 'TF-IDF',
      label: 'Vector Space Math',
      desc: 'High-dimensional feature weighting & inverse frequency',
      icon: Target,
    },
    {
      metric: 'Cosine θ',
      label: 'Similarity Analysis',
      desc: 'Geometric distance scoring between candidate & JD',
      icon: Layers,
    },
    {
      metric: 'Milestone',
      label: 'Career Roadmap',
      desc: 'Automated 7-stage learning and gap closure planning',
      icon: Compass,
    },
  ];

  return (
    <div className="stats-strip-container">
      <div className="section-container">
        <div className="stats-strip-grid">
          {stats.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.label}
                className="stat-strip-card"
              >
                <div className="stat-card-icon-box">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="stat-metric-headline">{st.metric}</div>
                  <span className="stat-metric-label">{st.label}</span>
                  <p className="stat-metric-desc">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
