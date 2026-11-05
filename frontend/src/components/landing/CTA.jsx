import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-master-section">
      <div className="section-container">
        <div className="cta-banner-box">
          <div className="cta-ambient-circle" aria-hidden="true" />

          <div className="cta-content-inner">
            <div className="inline-badge-pill light-pill">
              <Sparkles size={14} className="text-cyan" />
              <span>ACCELERATE YOUR CAREER</span>
            </div>

            <h2 className="cta-headline">Ready to Understand Your True Career Readiness?</h2>
            <p className="cta-subheading">
              Upload your resume and let CareerSense AI compute your mathematical match confidence, isolate high-priority skill deficits, and build your milestone roadmap.
            </p>

            <div className="cta-buttons-group">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                className="cta-main-btn"
                onClick={() => navigate('/analyze')}
              >
                Analyze My Resume
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={UserPlus}
                className="cta-secondary-btn"
                onClick={() => navigate('/register')}
              >
                Create Free Account
              </Button>
            </div>

            <div className="cta-footer-proof">
              <span className="cta-proof-item">
                <ShieldCheck size={14} className="text-emerald" /> Automated Resume Screening &amp; Placement Intelligence
              </span>
              <span className="cta-proof-dot">•</span>
              <span className="cta-proof-item">B.Tech Engineering Project Demonstration</span>
              <span className="cta-proof-dot">•</span>
              <span className="cta-proof-item">No Credit Card Required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
