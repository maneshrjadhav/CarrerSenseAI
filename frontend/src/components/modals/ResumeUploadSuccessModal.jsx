import React, { useEffect, useRef } from 'react';
import {
  FileCheck,
  CheckCircle2,
  ArrowRight,
  X,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * ResumeUploadSuccessModal
 * Displayed immediately when a valid PDF resume is successfully uploaded.
 * Shows file details, verification status, and offers a 1-click CTA to start analysis.
 */
export default function ResumeUploadSuccessModal({
  isOpen,
  onClose,
  onStartAnalysis,
  fileData = {} // { filename, fileSize, resumeId }
}) {
  const modalRef = useRef(null);
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary CTA on open for keyboard accessibility
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-success-title"
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
          borderRadius: '18px',
          width: '100%',
          maxWidth: '520px',
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
            height: '5px',
            background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 50%, #10b981 100%)'
          }}
        />

        {/* Modal Header with Close Button */}
        <div
          style={{
            padding: '1.5rem 1.75rem 0.75rem 1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                flexShrink: 0
              }}
            >
              <FileCheck size={28} />
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
                  Verified
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ready for Analysis</span>
              </div>
              <h2
                id="upload-success-title"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                Resume Uploaded Successfully! 🎉
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
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
            Your resume has been received successfully. CareerSense AI is getting ready to analyze your professional profile.
          </p>

          {/* File Information Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '1.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <FileText size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={fileData.filename || 'Uploaded Resume.pdf'}
                >
                  {fileData.filename || 'Uploaded Resume.pdf'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  flexShrink: 0
                }}
              >
                PDF
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid #edf2f7',
                fontSize: '0.8rem'
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>File Size: </span>
                <strong style={{ color: '#0f172a' }}>{formatFileSize(fileData.fileSize)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Format: </span>
                <strong style={{ color: '#059669' }}>PyMuPDF Compatible</strong>
              </div>
            </div>
          </div>

          {/* Verification Badge Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#065f46'
            }}
          >
            <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
            <span>
              Text extraction verified. Ready for deep skill profiling and ATS scoring.
            </span>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
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
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '9px 16px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            <RefreshCw size={14} />
            Choose Different File
          </button>

          <button
            ref={primaryBtnRef}
            type="button"
            onClick={onStartAnalysis}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
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
            <span>Start Resume Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
