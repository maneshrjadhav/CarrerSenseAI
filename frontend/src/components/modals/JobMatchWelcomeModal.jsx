import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  X,
  Target,
  Cpu,
  BarChart3,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import Button from '../common/Button';

/**
 * JobMatchWelcomeModal
 * Welcome modal shown when entering the Job Match page for the first time in a session.
 * Highlights the 3 core analytical capabilities and directs the user straight to the JD input.
 */
export default function JobMatchWelcomeModal({
  isOpen,
  onClose,
  onConfirm
}) {
  const modalRef = useRef(null);
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (primaryBtnRef.current) {
        primaryBtnRef.current.focus();
      }
    }, 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      icon: Target,
      iconColor: '#2563eb',
      iconBg: '#eff6ff',
      iconBorder: '#bfdbfe',
      title: 'Resume & Job Description Comparison',
      description: 'Comprehensive cross-referencing between your verified skills and target employer expectations.'
    },
    {
      icon: Cpu,
      iconColor: '#7c3aed',
      iconBg: '#f5f3ff',
      iconBorder: '#ddd6fe',
      title: 'AI-Based Text Similarity Analysis',
      description: 'Scored using verified NLP tokenization, lemmatization, TF-IDF vectorization, and Cosine similarity.'
    },
    {
      icon: BarChart3,
      iconColor: '#059669',
      iconBg: '#ecfdf5',
      iconBorder: '#a7f3d0',
      title: 'Matched & Missing Skills Identification',
      description: 'Instant classification of matched competencies, partial matches, and critical skill gap areas.'
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-match-welcome-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'csFadeIn 0.2s ease-out forwards'
      }}
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '580px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'csSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #10b981 100%)'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem 0.5rem 1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.18)',
                flexShrink: 0
              }}
            >
              <Target size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  Match Engine
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cosine Similarity + TF-IDF</span>
              </div>
              <h2
                id="job-match-welcome-title"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                Ready to Discover Your Job Match? 🚀
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '0.75rem 1.75rem 1.5rem 1.75rem' }}>
          <p
            style={{
              fontSize: '0.925rem',
              color: '#475569',
              margin: '0 0 1.25rem 0',
              lineHeight: 1.5
            }}
          >
            Compare your resume with your target job description and discover your matching skills and improvement opportunities.
          </p>

          {/* 3 Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: feat.iconBg,
                      border: `1px solid ${feat.iconBorder}`,
                      color: feat.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.4 }}>
                      {feat.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>

          <button
            ref={primaryBtnRef}
            type="button"
            onClick={onConfirm}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 22px',
              fontSize: '0.925rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
            }}
          >
            <span>Let's Match My Resume</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
