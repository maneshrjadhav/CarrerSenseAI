import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Compass,
  Layers,
  Video,
  FileText,
  BarChart2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getAuthToken } from '../services/authService';

export default function Pricing() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAuthToken());
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const unlockedFeatures = [
    {
      icon: Compass,
      title: 'Personalized Career Roadmap',
      desc: 'Chronological multi-week milestone schedules, custom hours configuration, sequential prerequisites, and interactive quiz validations.',
    },
    {
      icon: Layers,
      title: 'Skill Gap Intelligence',
      desc: 'Automated skill extraction, prioritized engineering competency mapping, learning curricula, and direct one-click roadmap additions.',
    },
    {
      icon: Video,
      title: 'AI Mock Interview Simulation',
      desc: 'Multi-stage real-time behavioral and technical interviews with AI video/audio analysis, speech recognition, and comprehensive feedback.',
    },
    {
      icon: FileText,
      title: 'ATS Resume Scoring & PDF Reports',
      desc: 'In-depth parse rate calculations, layout formatting checks, keyword density diagnostics, and instant official PDF report downloads.',
    },
    {
      icon: BarChart2,
      title: 'Intelligent Job Matching Engine',
      desc: 'TF-IDF semantic analysis matching your profile against real job descriptions with readiness scores and actionable recommendations.',
    },
  ];

  const faqs = [
    {
      q: 'Is CareerSense AI completely free to use?',
      a: 'Yes! CareerSense AI is 100% free for all registered candidates and students. There are no subscription fees, trial periods, or hidden paywalls.',
    },
    {
      q: 'Do I need to enter payment details or a credit/debit card?',
      a: 'No payment details or credit cards are required. Simply register your account or sign in to immediately access all features.',
    },
    {
      q: 'Are any features locked or restricted?',
      a: 'No. All platform capabilities — including Skill Gap Analysis, Personalized Career Roadmaps, Sequential Progression, ATS Reports, and AI Mock Interviews — are fully unlocked.',
    },
    {
      q: 'How do I start preparing for my target jobs?',
      a: 'Simply upload your resume in the Dashboard or Analyze page, provide your target job description, and the AI will analyze your match and generate your roadmap immediately.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
      <Navbar />

      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '3rem 1.5rem 5rem 1.5rem' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            <Sparkles size={14} /> 100% Free &amp; Unrestricted Access
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 1.25rem 0',
              color: 'var(--text-main, #0f172a)',
              lineHeight: 1.2,
            }}
          >
            All Features Are Freely Accessible
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted, #64748b)',
              maxWidth: '720px',
              margin: '0 auto 2rem auto',
              lineHeight: 1.6,
            }}
          >
            CareerSense AI has eliminated all subscriptions and payment paywalls. Every registered candidate enjoys full, unlimited access to our complete AI-powered career preparation platform.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '0.85rem 1.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary, #2563eb)')}
            >
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <ArrowRight size={18} />
            </button>

            {!isLoggedIn && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-main, #0f172a)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '0.85rem 1.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Highlight Banner */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            padding: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary, #2563eb)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Complete Candidate Empowerment
            </span>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-main, #0f172a)',
                margin: '0.5rem 0 0.5rem 0',
              }}
            >
              Everything Included, Zero Payment Required
            </h2>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', margin: 0 }}>
              Enjoy full access across all platform modules from day one.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {unlockedFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--primary, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                        {feat.title}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        <Check size={12} style={{ display: 'inline', marginRight: '3px' }} />
                        100% Free Access
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.5 }}>
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              textAlign: 'center',
              color: 'var(--text-main, #0f172a)',
              marginBottom: '2rem',
            }}
          >
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 1.5rem 1.25rem 1.5rem',
                        color: 'var(--text-muted, #64748b)',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                        borderTop: '1px solid #f1f5f9',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
