import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import BackButton from '../common/BackButton';

export default function AuthLayout({
  children,
  title,
  subtitle,
  maxWidth = '480px',
}) {
  return (
    <div className="auth-fullscreen-wrap">
      {/* Top Navigation Bar with Back Button */}
      <header className="auth-top-nav" style={{ padding: '1rem 2rem', width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'flex-start' }}>
        <BackButton to="/" label="Back to Home" />
      </header>

      {/* Main Centered Content */}
      <main className="auth-center-stage">
        <motion.div
          className="auth-floating-card"
          style={{ maxWidth }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Card Brand Header */}
          <div className="auth-card-top">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.25rem' }}>
              <Link to="/" className="auth-brand-badge" title="CareerSense AI">
                <div className="brand-icon-box">
                  <Sparkles size={18} />
                </div>
                <span className="brand-text">CareerSense AI</span>
              </Link>
              <BackButton to="/" label="Back" />
            </div>

            {title && <h1 className="auth-main-title">{title}</h1>}
            {subtitle && <p className="auth-main-subtitle">{subtitle}</p>}
          </div>

          {/* Form / Body */}
          <div className="auth-card-body">
            {children}
          </div>
        </motion.div>
      </main>

      {/* Subtle Footer Note */}
      <footer className="auth-bottom-footer">
        <span>© 2026 CareerSense AI • Academic &amp; Research Prototype</span>
      </footer>
    </div>
  );
}
