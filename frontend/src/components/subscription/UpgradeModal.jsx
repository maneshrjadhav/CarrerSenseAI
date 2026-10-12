import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { launchRazorpayPayment } from '../../utils/paymentHandler';
import PaymentCheckoutModal from './PaymentCheckoutModal';

export default function UpgradeModal({
  isOpen,
  onClose,
  featureName = 'career_roadmap',
  reasonMessage = '',
  onSuccessRedirect,
}) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(2); // Default to Quarterly (Popular)
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [pendingReq, setPendingReq] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      setFetchingPlans(true);
      setErrorMessage('');
      const [resp, subResp] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription().catch(() => null),
      ]);
      if (resp.success && resp.plans) {
        setPlans(resp.plans);
        // Find popular or default to plan ID 2 (Quarterly)
        const pop = resp.plans.find((p) => p.is_popular);
        if (pop) setSelectedPlanId(pop.id);
        else if (resp.plans.length > 0) setSelectedPlanId(resp.plans[0].id);
      }
      if (subResp && subResp.pending_payment_request) {
        setPendingReq(subResp.pending_payment_request);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load subscription plans.');
    } finally {
      setFetchingPlans(false);
    }
  };

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleCheckout = () => {
    if (!selectedPlanId) return;
    setCheckoutModalOpen(true);
  };

  const featureLabels = {
    skill_gap: 'Skill Gap Intelligence & Prioritization',
    career_roadmap: 'Personalized Career Roadmap & Sequential Progression',
    interview_prep: 'AI-Powered Mock Interview Assessment',
  };

  const featureTitle = featureLabels[featureName] || 'CareerSense AI Premium';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.2))',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted, #64748b)',
            lineHeight: 1,
            padding: '0.25rem',
          }}
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary, #2563eb)',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            <span>★</span> PREMIUM ACCESS REQUIRED
          </div>
          <h2
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
              color: 'var(--text-main, #0f172a)',
            }}
          >
            Unlock {featureTitle}
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted, #64748b)',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            {reasonMessage ||
              'Access prioritized skill gap analytics, personalized learning roadmaps, interactive assessment quizzes, and realistic AI mock interview simulations.'}
          </p>
        </div>

        {/* Pending Payment Verification Banner */}
        {pendingReq && (
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#b45309',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Clock size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                Payment Verification in Progress
              </div>
              <div style={{ lineHeight: 1.5, color: 'var(--text-sub, #475569)' }}>
                Your payment of <strong>₹{pendingReq.amount_inr}</strong> for the{' '}
                <strong>{pendingReq.plan_name}</strong> (Ref ID:{' '}
                <code style={{ background: '#fef3c7', padding: '2px 5px', borderRadius: '4px' }}>
                  {pendingReq.request_reference}
                </code>
                ) is awaiting admin approval. Protected features will unlock automatically upon verification.
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.88rem',
              marginBottom: '1.25rem',
            }}
          >
            <strong>Notice: </strong>
            {errorMessage}
          </div>
        )}

        {fetchingPlans ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted, #64748b)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            Loading available plans...
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                const monthlyEquiv = Math.round(p.price_inr / p.duration_months);

                return (
                  <div
                    key={p.id}
                    onClick={() => !loading && setSelectedPlanId(p.id)}
                    style={{
                      border: isSelected
                        ? '2px solid var(--primary, #2563eb)'
                        : '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: isSelected
                        ? 'rgba(37, 99, 235, 0.05)'
                        : 'var(--bg-surface, #ffffff)',
                      borderRadius: 'var(--radius-md, 12px)',
                      padding: '1.15rem 1rem',
                      cursor: loading ? 'default' : 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                    }}
                  >
                    {p.is_popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'var(--primary, #2563eb)',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Recommended
                      </span>
                    )}

                    <div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-main, #0f172a)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {p.plan_name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted, #64748b)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {p.duration_months} {p.duration_months === 1 ? 'Month' : 'Months'}
                      </div>
                      <div
                        style={{
                          fontSize: '1.45rem',
                          fontWeight: 800,
                          color: isSelected ? 'var(--primary, #2563eb)' : 'var(--text-main, #0f172a)',
                          marginBottom: '0.15rem',
                        }}
                      >
                        ₹{Math.round(p.price_inr)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        ₹{monthlyEquiv}/mo
                      </div>
                    </div>

                    <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected
                            ? '5px solid var(--primary, #2563eb)'
                            : '2px solid var(--border-color, #cbd5e1)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div
              style={{
                backgroundColor: 'var(--card-subtle-bg, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 'var(--radius-md, 10px)',
                padding: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-main, #0f172a)',
                  marginBottom: '0.65rem',
                }}
              >
                Select Payment Mode (INR)
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  <input
                    type="radio"
                    name="paymethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    disabled={loading}
                  />
                  <span>
                    <strong>UPI</strong> (GPay, PhonePe, Paytm, BHIM)
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    color: 'var(--text-main, #0f172a)',
                  }}
                >
                  <input
                    type="radio"
                    name="paymethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    disabled={loading}
                  />
                  <span>
                    <strong>Debit / Credit Card</strong> (Visa, MasterCard, RuPay)
                  </span>
                </label>
              </div>
            </div>

            {/* Included in Pro Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem 1rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted, #64748b)',
                marginBottom: '1.75rem',
                padding: '0 0.5rem',
              }}
            >
              <div>✓ Unlimited Skill Gap Prioritization</div>
              <div>✓ Full Career Roadmap & Task Checklists</div>
              <div>✓ AI Mock Interview with Voice & Rubrics</div>
              <div>✓ Interactive Milestone Quizzes</div>
              <div>✓ Instant Activation & Verified Payment</div>
              <div>✓ No Hidden Charges</div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/pricing');
                }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #2563eb)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  padding: '0.65rem 1rem',
                  textDecoration: 'underline',
                }}
              >
                Compare All Plans
              </button>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || !selectedPlan}
                style={{
                  backgroundColor: 'var(--primary, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: 'var(--shadow-md, 0 4px 6px rgba(37, 99, 235, 0.2))',
                }}
              >
                {loading ? 'Processing Payment...' : `Pay ₹${Math.round(selectedPlan?.price_inr || 0)} & Unlock Now →`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Unified Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={selectedPlan}
        onSuccess={() => {
          loadPlans();
          if (onSuccessRedirect) {
            onSuccessRedirect();
          }
        }}
      />
    </div>
  );
}

