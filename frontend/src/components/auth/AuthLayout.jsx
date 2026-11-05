import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Target,
  Compass,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock
} from 'lucide-react';

export default function AuthLayout({
  children,
  title,
  subtitle,
  mode = 'login', // 'login' | 'register'
  maxWidth,
}) {
  const isRegister = mode === 'register';
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  return (
    <div className="auth-split-screen-wrapper auth-page-shell">
      {/* Centered Large Rounded Card Container */}
      <div className="auth-centered-card-frame">
        
        {/* Left Side: 45% Width - Authentication Form */}
        <div className="auth-form-card auth-left-form-panel">
          {/* Top Brand Logo */}
          <div className="auth-panel-logo-header">
            <Link to="/" className="auth-brand-badge-split" title="CareerSense AI Home">
              <div className="auth-brand-icon-box">
                <Sparkles size={18} />
              </div>
              <span className="auth-brand-name">
                CareerSense <span className="auth-brand-accent">AI</span>
              </span>
            </Link>
          </div>

          {/* Header Title & Subtitle */}
          <div className="auth-form-header">
            <h1 className="auth-form-title">
              {title || (isRegister ? 'Create Your Account' : 'Welcome Back')}
            </h1>
            <p className="auth-form-subtitle">
              {subtitle || (isRegister ? 'Start your AI-powered career journey.' : 'Sign in to continue your AI-powered career journey.')}
            </p>
          </div>

          {/* Form Content */}
          <div className="auth-card-body">
            {children}
          </div>

          {/* Bottom Legal & Navigation Links */}
          <div className="auth-legal-footer-row">
            <button
              type="button"
              className="auth-legal-link"
              onClick={() => setActiveModal('terms')}
            >
              Terms & Conditions
            </button>
            <span className="auth-legal-dot">•</span>
            <button
              type="button"
              className="auth-legal-link"
              onClick={() => setActiveModal('privacy')}
            >
              Privacy Policy
            </button>
            <span className="auth-legal-dot">•</span>
            <Link to="/" className="auth-back-link">
              <ArrowLeft size={13} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Right Side: 55% Width - Visual Panel */}
        <aside className="auth-split-showcase auth-right-visual-panel">
          <div className="auth-visual-inner-card">
            {/* Background Image Layer */}
            <div className="auth-visual-image-layer" />
            
            {/* Deep Navy/Blue Tech Gradient Overlay */}
            <div className="auth-visual-gradient-overlay" />
            
            {/* Ambient Lighting Accents */}
            <div className="auth-visual-glow-top" />
            <div className="auth-visual-glow-bottom" />

            {/* Visual Panel Inner Content */}
            <div className="auth-visual-inner-content">
              {/* Top Bar with AI Badge */}
              <div className="auth-visual-top-bar">
                <div className="auth-visual-tag">
                  <Sparkles size={13} className="text-cyan" />
                  <span>AI CAREER INTELLIGENCE</span>
                </div>
                <div className="auth-live-status-pill">
                  <span className="live-pulse-dot" />
                  <span>LIVE PLATFORM</span>
                </div>
              </div>

              {/* Headline & Subtext */}
              <div className="auth-visual-text-block">
                <h2 className="auth-visual-headline">
                  {isRegister
                    ? 'Your Career Growth, Powered by Precision AI.'
                    : 'Empowering Every Step of Your Career Journey.'}
                </h2>
                <p className="auth-visual-subtext">
                  Transform complex resume data into actionable career milestones with deterministic NLP parsing, semantic match scoring, and targeted interview preparation.
                </p>
              </div>

              {/* 3 Subtle Floating UI Cards */}
              <div className="auth-floating-cards-stack">
                {/* Card 1: AI Resume Analysis */}
                <div className="auth-floating-card card-float-1">
                  <div className="floating-card-icon-wrap icon-blue">
                    <FileText size={18} />
                  </div>
                  <div className="floating-card-text">
                    <div className="floating-card-header">
                      <h4>AI Resume Analysis</h4>
                      <span className="floating-card-badge badge-blue">Ready</span>
                    </div>
                    <p>Your career profile is ready for analysis.</p>
                  </div>
                </div>

                {/* Card 2: Skill Intelligence */}
                <div className="auth-floating-card card-float-2">
                  <div className="floating-card-icon-wrap icon-cyan">
                    <Target size={18} />
                  </div>
                  <div className="floating-card-text">
                    <div className="floating-card-header">
                      <h4>Skill Intelligence</h4>
                      <span className="floating-card-badge badge-cyan">Matched</span>
                    </div>
                    <p>Discover your strengths and skill gaps.</p>
                  </div>
                </div>

                {/* Card 3: Career Roadmap */}
                <div className="auth-floating-card card-float-3">
                  <div className="floating-card-icon-wrap icon-emerald">
                    <Compass size={18} />
                  </div>
                  <div className="floating-card-text">
                    <div className="floating-card-header">
                      <h4>Career Roadmap</h4>
                      <span className="floating-card-badge badge-emerald">Milestone 1</span>
                    </div>
                    <p>Build your next career milestone.</p>
                  </div>
                </div>
              </div>

              {/* Visual Panel Bottom Meta */}
              <div className="auth-visual-bottom-meta">
                <div className="visual-trust-pill">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Encrypted & Deterministic Evaluation</span>
                </div>
                <span className="visual-trust-tag">CareerSense AI Platform</span>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* Accessible Informational Modal for Terms & Privacy */}
      <AnimatePresence>
        {activeModal && (
          <div className="auth-legal-modal-backdrop" onClick={() => setActiveModal(null)}>
            <motion.div
              className="auth-legal-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="legal-modal-header">
                <h3>{activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h3>
                <button
                  type="button"
                  className="legal-modal-close"
                  onClick={() => setActiveModal(null)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="legal-modal-body">
                {activeModal === 'terms' ? (
                  <>
                    <p>
                      <strong>CareerSense AI Terms of Service</strong>
                    </p>
                    <p>
                      By accessing CareerSense AI, you agree to comply with our academic and professional demonstration guidelines. Candidate profiles, resumes, and scoring algorithms are processed for career advancement and placement intelligence.
                    </p>
                    <p>
                      All document parsing is executed using deterministic NLP techniques and vector math. No candidate data is shared with third parties without authorization.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>CareerSense AI Privacy Policy</strong>
                    </p>
                    <p>
                      Your privacy is central to CareerSense AI. Uploaded resume PDFs are parsed strictly for profile extraction and skill gap isolation. Multi-tenant database controls isolate your assessments and reports securely.
                    </p>
                    <p>
                      Authentication tokens are securely stored and validated per session. You may remove or update your uploaded credentials at any time.
                    </p>
                  </>
                )}
              </div>
              <div className="legal-modal-footer">
                <button
                  type="button"
                  className="legal-modal-btn"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
