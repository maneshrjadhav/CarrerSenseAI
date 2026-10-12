import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function PaymentFailed() {
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = location.state?.error || 'The transaction could not be processed by the bank or was cancelled.';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
      <Navbar />

      <div style={{ maxWidth: '580px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: 'var(--radius-lg, 16px)',
            border: '1px solid var(--border-color, #e2e8f0)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          }}
        >
          {/* Red Warning/Cross */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem auto',
            }}
          >
            ✕
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Payment Incomplete
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
            {errorMessage}
          </p>

          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              borderRadius: 'var(--radius-md, 10px)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              padding: '1rem',
              marginBottom: '2rem',
              fontSize: '0.88rem',
              color: 'var(--text-sub, #475569)',
              textAlign: 'left',
            }}
          >
            <strong>Note: </strong> If money was debited from your account or UPI wallet, Razorpay will automatically reverse the charges within 3-5 business days.
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '0.8rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again / Change Plan
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-muted, #64748b)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '0.8rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

