import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  X,
  RotateCcw,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import Button from '../common/Button';

/**
 * ResumeUploadErrorModal
 * Displayed when resume file upload or initial validation fails.
 * Explains the exact failure reason and gives a clean 1-click Retry option.
 */
export default function ResumeUploadErrorModal({
  isOpen,
  onClose,
  onRetry,
  errorMessage = 'Something went wrong while uploading your resume. Please try again.'
}) {
  const modalRef = useRef(null);
  const retryBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (retryBtnRef.current) {
        retryBtnRef.current.focus();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-error-title"
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
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'csSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Accent Red Bar */}
        <div
          style={{
            height: '5px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
          }}
        />

        {/* Modal Header */}
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
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={26} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#dc2626',
                  background: '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca'
                }}
              >
                Upload Notice
              </span>
              <h2
                id="upload-error-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '4px 0 0 0'
                }}
              >
                Resume Upload Failed
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
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '0.75rem 1.75rem 1.5rem 1.75rem' }}>
          <div
            style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '1rem',
              color: '#9f1239',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}
          >
            {errorMessage}
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.825rem',
              color: '#475569'
            }}
          >
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
              Upload Guidelines:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
              <li>Ensure the file is a valid standard PDF (not password-protected).</li>
              <li>File size must be 10 MB or smaller.</li>
              <li>Document should contain selectable text (not scanned flat images).</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.15rem 1.75rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
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
              padding: '9px 16px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            Close
          </button>

          <button
            ref={retryBtnRef}
            type="button"
            onClick={onRetry}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <RotateCcw size={15} />
            <span>Retry Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
