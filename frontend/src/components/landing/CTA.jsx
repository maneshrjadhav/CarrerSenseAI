import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, UserPlus } from 'lucide-react';
import Button from '../common/Button';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-master-section">
      <div className="section-container">
        <motion.div
          className="cta-banner-box"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
        >
          <div className="cta-ambient-circle" aria-hidden="true"></div>

          <div className="cta-content-inner">
            <div className="inline-badge-pill light-pill">
              <Sparkles size={14} className="text-teal" />
              <span>START YOUR JOURNEY</span>
            </div>

            <h2 className="cta-headline">Ready to Understand Your Career Potential?</h2>
            <p className="cta-subheading">
              Upload your resume and let CareerSense AI reveal the skills, opportunities and next steps that matter.
            </p>

            <div className="cta-buttons-group">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                className="cta-main-btn"
                onClick={() => navigate('/register')}
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}

