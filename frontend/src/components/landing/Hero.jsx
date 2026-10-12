import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Cpu,
  FileText,
  BarChart3,
  Layers,
} from 'lucide-react';
import Button from '../common/Button';
import PipelinePreview from './PipelinePreview';
import SignatureBackground from './SignatureBackground';

export default function Hero() {
  const navigate = useNavigate();

  const scrollToHow = () => {
    const el = document.getElementById('how');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const trustBadges = [
    { label: 'PyMuPDF Ingestion', icon: FileText },
    { label: 'NLTK NLP Processing', icon: Cpu },
    { label: 'TF-IDF Vector Space', icon: BarChart3 },
    { label: 'Skill Gap Differential', icon: Layers },
  ];

  return (
    <section className="hero-master-container relative-overflow">
      {/* Dedicated Background Image Layer (Requirements Part 3, 4, 5, 6, 7) */}
      <SignatureBackground variant="hero" />

      {/* Hero Foreground Content */}
      <div className="hero-inner-content">
        {/* Badge */}
        <motion.div
          className="hero-pill-badge"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Sparkles size={14} className="badge-sparkle-icon" />
          <span>AI + NLP CAREER INTELLIGENCE</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="hero-headline-h1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          Turn Your Resume Into Your <br />
          <span className="hero-gradient-text">Career Roadmap.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          className="hero-subtitles-block"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          <p className="hero-kicker-lead">From resume understanding to career readiness.</p>
          <p className="hero-lead-description">
            CareerSense AI uses NLP, TF-IDF vectorization, similarity analysis and skill intelligence to transform resume data into actionable career guidance.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="hero-cta-buttons-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
        >
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            className="hero-primary-btn"
            onClick={() => navigate('/analyze')}
          >
            Analyze My Resume →
          </Button>
          <Button
            variant="outline"
            size="lg"
            icon={ChevronDown}
            className="hero-secondary-btn"
            onClick={scrollToHow}
          >
            Explore How It Works ↓
          </Button>
        </motion.div>

        {/* Product Preview Console */}
        <motion.div
          className="hero-showcase-wrapper"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PipelinePreview />
        </motion.div>

        {/* Trust Badges Bar */}
        <motion.div
          className="hero-trust-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.4 }}
        >
          <span className="trust-kicker">VERIFIED TECHNICAL FOUNDATION</span>
          <div className="trust-badges-grid">
            {trustBadges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="trust-badge-item">
                  <Icon size={15} className="trust-icon" />
                  <span>{b.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
