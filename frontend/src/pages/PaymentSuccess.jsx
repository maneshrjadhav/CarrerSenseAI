import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import subscriptionService from '../services/subscriptionService';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [subData, setSubData] = useState(location.state?.subscription || null);
  const [paymentData, setPaymentData] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!subData);

  useEffect(() => {
    if (!subData) {
      loadLatestSubscription();
    }
  }, []);

  const loadLatestSubscription = async () => {
    try {
      const resp = await subscriptionService.getCurrentSubscription();
      if (resp.success && resp.subscription) {
        setSubData(resp.subscription);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const planName = subData?.plan?.plan_name || 'CareerSense Pro';
  const price = subData?.plan?.price_inr || paymentData?.amount_inr || 599;
  const expiryDate = subData?.end_date ? new Date(subData.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
      <Navbar />

      <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1.5rem' }}>
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
          {/* Green Checkmark Circle */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem auto',
            }}
          >
            ✓
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Payment Successful!
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
            Your transaction has been cryptographically verified and your premium access is activated immediately.
          </p>

          {/* Receipt Summary Card */}
          <div
            style={{
              backgroundColor: 'var(--card-subtle-bg, #f8fafc)',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: '1.25rem 1.5rem',
              textAlign: 'left',
              marginBottom: '2rem',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>Activated Plan</span>
              <strong style={{ color: 'var(--text-main, #0f172a)' }}>{planName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>Amount Paid</span>
              <strong style={{ color: 'var(--text-main, #0f172a)' }}>₹{Math.round(price)} (INR)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>Access Valid Until</span>
              <strong style={{ color: '#059669' }}>{expiryDate}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>Payment Status</span>
              <span
                style={{
                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}
              >
                CAPTURED & VERIFIED
              </span>
            </div>
          </div>

          {/* Next Steps Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md, 0 4px 6px rgba(37, 99, 235, 0.2))',
              }}
            >
              Go to Candidate Dashboard →
            </button>

            <button
              onClick={() => navigate('/job-match')}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--primary, #2563eb)',
                border: '1px solid var(--primary, #2563eb)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Explore Job Match Intelligence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

