import React from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Hero() {
  const navigate = useNavigate();

  const scrollToHow = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      const yOffset = -62;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const trustBadges = [
    { label: 'PyMuPDF Parser', icon: FileText },
    { label: 'NLTK Lemmatization', icon: Cpu },
    { label: 'TF-IDF Vector Math', icon: BarChart3 },
    { label: 'Difference Gap Matrix', icon: Layers },
  ];

  return (
    <section className="hero-master-container">
      <div className="section-container">
        <div className="hero-two-column-layout">
          {/* Left Column: Heading, Subtitle, Actions, Proof Badges */}
          <div className="hero-left-column">
            {/* Top Eyebrow Badge */}
            <div className="hero-pill-badge">
              <Sparkles size={13} className="text-primary" />
              <span>AI CAREER INTELLIGENCE PLATFORM</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-headline-h1">
              Turn Your Resume Into Your <span className="hero-gradient-text">Actionable Career Roadmap.</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-lead-description">
              CareerSense AI extracts candidate credentials from multi-column PDFs, evaluates objective role fit, isolates prerequisite skill deficits, and builds your structured placement progression.
            </p>

            {/* Action Buttons Row */}
            <div className="hero-cta-buttons-row">
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                className="hero-primary-btn"
                onClick={() => navigate('/analyze')}
              >
                Analyze Resume Free
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={ChevronDown}
                iconPosition="right"
                className="hero-secondary-btn"
                onClick={scrollToHow}
              >
                How It Works (4 Steps)
              </Button>
            </div>

            {/* Trust Points */}
            <div className="hero-trust-bar-compact">
              <span className="trust-kicker">ENGINEERING ARCHITECTURE</span>
              <div className="trust-badges-flow">
                {trustBadges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.label} className="trust-badge-pill">
                      <Icon size={13} className="text-primary" />
                      <span>{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Compact Product Preview Console */}
          <div className="hero-right-column">
            <PipelinePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
