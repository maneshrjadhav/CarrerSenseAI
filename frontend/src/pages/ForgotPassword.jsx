import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Info, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setNotice(true);
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Reset your CareerSense AI account access."
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label className="input-label" htmlFor="forgot-email">Email Address *</label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              id="forgot-email"
              type="email"
              className={`form-input ${error ? 'input-error' : ''}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
                if (notice) setNotice(false);
              }}
              autoFocus
            />
          </div>
          {error && <span className="field-error-text">{error}</span>}
        </div>

        {notice && (
          <div
            className="auth-alert-info"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Password reset functionality will be connected in the next authentication enhancement.</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full submit-cta-btn"
        >
          Send Reset Link
        </Button>
      </form>

      <div className="auth-footer-prompt">
        <span>Remembered your password?</span>
        <Link to="/login" className="auth-link">
          Sign In <ArrowRight size={14} className="inline-arrow" />
        </Link>
      </div>
    </AuthLayout>
  );
}

