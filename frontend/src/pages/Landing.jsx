import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero from '../components/landing/Hero';
import StatsStrip from '../components/landing/StatsStrip';
import FeatureCard, { WHY_FEATURES } from '../components/landing/FeatureCard';
import HowItWorks from '../components/landing/HowItWorks';
import DemoPreview from '../components/landing/DemoPreview';
import CareerRoadmapFlow from '../components/landing/CareerRoadmapFlow';
import CTA from '../components/landing/CTA';

export default function Landing() {
  return (
    <div className="landing-master-wrapper">
      {/* 1. Frosted Sticky Navigation Bar */}
      <LandingNavbar />

      {/* 2. Hero Section with Integrated Pipeline Preview */}
      <Hero />

      {/* Quantitative Process Verification Strip */}
      <StatsStrip />

      {/* 3. Platform Capabilities (Core Intelligence Modules) */}
      <section id="capabilities" className="landing-section-block bg-white">
        <div className="section-container">
          <div className="section-title-wrap text-center">
            <div className="inline-badge-pill">
              <Sparkles size={14} className="text-primary" />
              <span>CORE ARCHITECTURE</span>
            </div>
            <h2 className="section-main-heading">Built for Quantitative Career Readiness</h2>
            <p className="section-sub-heading">
              Combining Natural Language Processing and Vector Space Models to provide honest, verifiable candidate guidance without black-box guesswork.
            </p>
          </div>

          <div className="features-three-col-grid">
            {WHY_FEATURES.map((feat, idx) => (
              <FeatureCard key={feat.id} feature={feat} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works (4-Step Sequential System Workflow) */}
      <HowItWorks />

      {/* 5. Deep Analytical Precision Dashboard */}
      <DemoPreview />

      {/* 6. Sequential Career Roadmap (Milestone Progression) */}
      <CareerRoadmapFlow />

      {/* 7. Final Call to Action */}
      <CTA />

      {/* 8. SaaS Master Footer with Architecture & Tech Stack */}
      <footer className="saas-footer-master">
        <div className="section-container">
          <div className="footer-columns-grid">
            {/* Brand & Mission Column */}
            <div className="footer-main-brand-col">
              <div className="footer-brand-logo">
                <div className="brand-icon-box glow-effect">
                  <Sparkles size={18} />
                </div>
                <span className="footer-brand-title">CareerSense AI</span>
              </div>
              <p className="footer-mission-text">
                Intelligent Resume Screening &amp; Career Guidance System designed for academic excellence, recruitment automation, and engineering student placement acceleration.
              </p>

              {/* Technology Stack Tags */}
              <div className="footer-tech-stack-wrap">
                <span className="tech-stack-label">POWERED BY CORE TECHNOLOGIES</span>
                <div className="tech-stack-pills">
                  <span className="tech-pill">Python</span>
                  <span className="tech-pill">Flask</span>
                  <span className="tech-pill">React + Vite</span>
                  <span className="tech-pill">MySQL</span>
                  <span className="tech-pill">PyMuPDF</span>
                  <span className="tech-pill">NLTK</span>
                  <span className="tech-pill">TF-IDF</span>
                  <span className="tech-pill">Cosine Similarity</span>
                  <span className="tech-pill">Scikit-Learn</span>
                </div>
              </div>
            </div>

            {/* Platform Capabilities Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Capabilities</h4>
              <ul className="footer-links-list">
                <li><a href="#capabilities">Resume Screening</a></li>
                <li><a href="#capabilities">NLP Normalization</a></li>
                <li><a href="#capabilities">TF-IDF Vector Matching</a></li>
                <li><a href="#capabilities">Skill Gap Detection</a></li>
                <li><a href="#roadmap">Milestone Roadmaps</a></li>
                <li><a href="#capabilities">Interview Simulation</a></li>
              </ul>
            </div>

            {/* Architecture & Workflow Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Architecture</h4>
              <ul className="footer-links-list">
                <li><a href="#how-it-works">How It Works (4 Steps)</a></li>
                <li><a href="#analytics">Analytical Precision Console</a></li>
                <li><a href="#roadmap">Career Roadmap Timeline</a></li>
                <li><Link to="/analyze">Upload &amp; Direct Analysis</Link></li>
              </ul>
            </div>

            {/* Candidate Portal Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Candidate Portal</h4>
              <ul className="footer-links-list">
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Create Free Account</Link></li>
                <li><Link to="/dashboard">Candidate Dashboard</Link></li>
                <li><Link to="/profile">Profile &amp; Credentials</Link></li>
                <li><Link to="/settings">System Settings</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar with Academic Demonstration Accreditation */}
          <div className="footer-bottom-bar">
            <div className="footer-copyright">
              © 2026 CareerSense AI. Built with React, Flask, MySQL &amp; NLP.
            </div>
            <div className="footer-project-tag">
              <ShieldCheck size={14} className="text-emerald inline-icon" />
              <span>B.Tech Major Engineering Project Demonstration • All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
