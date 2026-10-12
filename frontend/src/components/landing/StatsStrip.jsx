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
          {stats.map((st, idx) => {
            const Icon = st.icon;
            return (
              <motion.div
                key={st.label}
                className="stat-strip-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <div className="stat-card-icon-box">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="stat-metric-headline">{st.metric}</div>
                  <span className="stat-metric-label">{st.label}</span>
                  <p className="stat-metric-desc">{st.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

