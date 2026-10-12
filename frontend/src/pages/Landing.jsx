import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero from '../components/landing/Hero';
import StatsStrip from '../components/landing/StatsStrip';
import FeatureCard, { WHY_FEATURES } from '../components/landing/FeatureCard';
import HowItWorks from '../components/landing/HowItWorks';
import CareerIntelligenceMap from '../components/landing/CareerIntelligenceMap';
import ResumeScanDemo from '../components/landing/ResumeScanDemo';
import SkillGapVisualizer from '../components/landing/SkillGapVisualizer';
import CareerRoadmapFlow from '../components/landing/CareerRoadmapFlow';
import DemoPreview from '../components/landing/DemoPreview';
import CTA from '../components/landing/CTA';

export default function Landing() {
  return (
    <div className="landing-master-wrapper">
      {/* 1. Frosted Sticky Navigation Bar */}
      <LandingNavbar />

      {/* 2. Hero Section with Real Career Intelligence Background */}
      <Hero />

      {/* Process Verification Stats Strip */}
      <StatsStrip />

      {/* 3. Why CareerSense AI (Core Capabilities Grid) */}
      <section id="why" className="landing-section-block bg-white">
        <div className="section-container">
          <div className="section-title-wrap text-center">
            <span className="section-eyebrow">WHY CAREERSENSE AI</span>
            <h2 className="section-main-heading">Built for Quantitative Career Readiness</h2>
            <p className="section-sub-heading">
              Combining Natural Language Processing and Vector Space Models to provide honest, verifiable candidate guidance.
            </p>
          </div>

          <div className="features-three-col-grid">
            {WHY_FEATURES.map((feat, idx) => (
              <FeatureCard key={feat.id} feature={feat} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works (6-Step Sequential Timeline) */}
      <HowItWorks />

      {/* 5. Career Intelligence / Semantic Map */}
      <CareerIntelligenceMap />

      {/* 6. Interactive Resume Scan Demo */}
      <ResumeScanDemo />

      {/* 7. Skill Gap Visualization (Set Difference Matrix) */}
      <SkillGapVisualizer />

      {/* 8. Career Roadmap (Progressive 7-Stage Flow) */}
      <CareerRoadmapFlow />

      {/* 9. Live Dashboard Showcase (Interactive Simulator) */}
      <DemoPreview />

      {/* 10. Call to Action */}
      <CTA />

      {/* 11. SaaS Footer with Compact Technology Stack (Requirement Part 14) */}
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
                Intelligent Resume Screening &amp; Career Guidance System designed for academic excellence, recruitment automation, and student placement acceleration.
              </p>

              {/* Compact Technology Stack Section (Requirement Part 14) */}
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

            {/* Product Capabilities Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Capabilities</h4>
              <ul className="footer-links-list">
                <li><a href="#why">Resume Screening</a></li>
                <li><a href="#why">NLP Text Processing</a></li>
                <li><a href="#why">TF-IDF Matching</a></li>
                <li><a href="#skill-gap">Skill Gap Detection</a></li>
                <li><a href="#roadmap">Career Roadmap</a></li>
                <li><a href="#why">Interview Preparation</a></li>
              </ul>
            </div>

            {/* Navigation & Tools Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Architecture &amp; Tools</h4>
              <ul className="footer-links-list">
                <li><a href="#how">How It Works</a></li>
                <li><a href="#semantic-map">Semantic Knowledge Graph</a></li>
                <li><a href="#scan-demo">Interactive Resume Scan</a></li>
                <li><a href="#skill-gap">Skill Difference Matrix</a></li>
                <li><a href="#roadmap">Milestone Roadmap</a></li>
                <li><Link to="/analyze">Direct Analysis Tool</Link></li>
              </ul>
            </div>

            {/* Candidate Portal Column */}
            <div className="footer-nav-col">
              <h4 className="footer-heading">Candidate Portal</h4>
              <ul className="footer-links-list">
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Create Free Account</Link></li>
                <li><Link to="/dashboard">Candidate Dashboard</Link></li>
                <li><Link to="/resumes">My Uploaded Resumes</Link></li>
                <li><Link to="/settings">Application Settings</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div className="footer-copyright-note">
              © 2026 CareerSense AI. Built with React, Flask, MySQL &amp; NLP.
            </div>
            <div className="footer-meta-academic">
              B.Tech Major Project Demonstration • All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
