import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  Award,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  X,
  Code2,
  FileText,
  User
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * ResumeAnalysisCompleteModal
 * Displayed when independent resume intelligence analysis finishes.
 * Shows candidate summary, ATS Quality score gauge, extracted skills,
 * and 2 distinct forward paths: View Full Analysis or Match with a Job Description.
 */
export default function ResumeAnalysisCompleteModal({
  isOpen,
  onClose,
  resumeId,
  analysisData = {}, // { candidateName, qualityScore, totalSkills, skills }
  onViewAnalysis,
  onMatchJob
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

  const score = Math.round(analysisData.qualityScore || 0);
  const candidateName = analysisData.candidateName || 'Candidate';
  const totalSkills = analysisData.totalSkills || (analysisData.skills?.length || 0);
  const skillsList = analysisData.skills || [];

  const getScoreColor = (val) => {
    if (val >= 80) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Strong Profile' };
    if (val >= 60) return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Good Quality' };
    if (val >= 40) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Moderate' };
    return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Needs Improvement' };
  };

  const scoreBadge = getScoreColor(score);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-complete-title"
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
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'csSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Top Gradient Ribbon */}
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
              <Sparkles size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  Completed
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Profile Insights Ready</span>
              </div>
              <h2
                id="analysis-complete-title"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                Your Resume Analysis is Complete! ✨
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
            CareerSense AI has successfully analyzed your resume. Your professional profile insights are ready.
          </p>

          {/* Key Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '1.25rem'
            }}
          >
            {/* ATS Score Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  border: `3px solid ${scoreBadge.text}`,
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreBadge.text, lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ATS Quality Score</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {scoreBadge.label}
                </div>
              </div>
            </div>

            {/* Candidate & Total Skills Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  flexShrink: 0
                }}
              >
                <Code2 size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Skills Identified</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {totalSkills} Skills
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Profile Mention */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f1f5f9',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={15} style={{ color: '#475569' }} />
              <span style={{ color: '#64748b' }}>Candidate:</span>
              <strong style={{ color: '#0f172a' }}>{candidateName}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>Parsed from PDF</span>
            </div>
          </div>

          {/* Extracted Skills Preview */}
          {skillsList.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Sample Extracted Skills
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillsList.slice(0, 8).map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #dbeafe',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    {sk}
                  </span>
                ))}
                {skillsList.length > 8 && (
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    +{skillsList.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={onMatchJob}
            style={{
              background: '#ffffff',
              border: '1px solid #2563eb',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#2563eb',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            <Briefcase size={16} />
            <span>Match with a Job Description</span>
          </button>

          <button
            ref={primaryBtnRef}
            type="button"
            onClick={onViewAnalysis}
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
            <span>View Full Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
