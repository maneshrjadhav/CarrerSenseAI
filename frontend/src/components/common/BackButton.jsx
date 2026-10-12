import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({
  to = '/',
  label = 'Back',
  className = '',
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`cs-back-btn ${className}`}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '8px',
        color: 'var(--text-secondary, #94a3b8)',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      <ArrowLeft size={15} className="back-arrow-icon" />
      <span>{label}</span>
    </button>
  );
}
