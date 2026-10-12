import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import Navbar from '../components/Navbar';
import subscriptionService from '../services/subscriptionService';
import { launchRazorpayPayment } from '../utils/paymentHandler';
import { getAuthToken } from '../services/authService';
import PaymentCheckoutModal from '../components/subscription/PaymentCheckoutModal';

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(2); // Quarterly default
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const isLoggedIn = Boolean(getAuthToken());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setFetching(true);
      setErrorMessage('');
      const plansResp = await subscriptionService.getPlans();
      if (plansResp.success && plansResp.plans) {
        setPlans(plansResp.plans);
        const pop = plansResp.plans.find((p) => p.is_popular);
        if (pop) setSelectedPlanId(pop.id);
        else if (plansResp.plans.length > 0) setSelectedPlanId(plansResp.plans[0].id);
      }

      if (isLoggedIn) {
        const subResp = await subscriptionService.getCurrentSubscription();
        if (subResp.success) {
          setCurrentSub(subResp);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load pricing data.');
    } finally {
      setFetching(false);
    }
  };

  const handleCheckout = (planIdToBuy = null) => {
    const planId = planIdToBuy || selectedPlanId;
    if (!isLoggedIn) {
      navigate('/login?redirect=/pricing');
      return;
    }

    const targetPlan = plans.find((p) => p.id === planId) || plans[0];
    if (targetPlan) {
      setCheckoutPlan(targetPlan);
      setCheckoutModalOpen(true);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const faqs = [
    {
      q: 'What payment modes are accepted?',
      a: 'We accept all major Indian payment methods powered by Razorpay, including UPI (Google Pay, PhonePe, Paytm, BHIM, Cred) and Domestic Debit/Credit Cards (Visa, MasterCard, RuPay).',
    },
    {
      q: 'Which features are locked in the Free tier?',
      a: 'The Free tier allows resume parsing, ATS scoring, and basic Job Match percentage. Prioritized Skill Gap Analysis, the Sequential Career Roadmap with interactive assessments, and AI Mock Interview simulations are included in the Paid subscription.',
    },
    {
      q: 'Can I extend or upgrade my subscription before it expires?',
      a: 'Yes. If you subscribe to another plan while your current plan is active, your subscription will be automatically extended from your current expiration date without losing any active days.',
    },
    {
      q: 'Is my payment safe and secure?',
      a: 'All transactions are encrypted with 256-bit SSL and processed securely via Razorpay with cryptographic HMAC-SHA256 signature verification directly verified on our backend servers.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page, #f8fafc)', color: 'var(--text-main, #0f172a)' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary, #2563eb)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            ★ STUDENT-FRIENDLY PLACEMENT SUBSCRIPTIONS
          </div>
          <h1
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              margin: '0 0 1rem 0',
              color: 'var(--text-main, #0f172a)',
            }}
          >
            Invest in Your Placement Readiness
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-muted, #64748b)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Access personalized skill gap intelligence, sequential milestone roadmaps, and AI mock interview simulations tailored to your target job descriptions.
          </p>

          {/* Current Status Banner if active */}
          {currentSub && currentSub.has_active_subscription && (
            <div
              style={{
                marginTop: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                color: '#059669',
                padding: '0.65rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <span>✓</span> You have an active {currentSub.subscription?.plan?.plan_name} (Expires in{' '}
              {currentSub.subscription?.days_remaining} days). Renewing now extends your expiration date seamlessly.
            </div>
          )}

          {/* Pending Payment Verification Banner */}
          {currentSub && currentSub.pending_payment_request && (
            <div
              style={{
                marginTop: '1.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#b45309',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                fontSize: '0.92rem',
                textAlign: 'left',
                maxWidth: '750px',
                margin: '1.5rem auto 0 auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '6px' }}>
                <Clock size={18} color="#d97706" />
                <span style={{ fontSize: '15px' }}>Payment Verification in Progress</span>
              </div>
              <p style={{ margin: '0 0 8px 0', lineHeight: '1.5', color: 'var(--text-sub, #475569)' }}>
                Your payment of <strong>₹{currentSub.pending_payment_request.amount_inr}</strong> for the{' '}
                <strong>{currentSub.pending_payment_request.plan_name}</strong> (Ref ID:{' '}
                <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                  {currentSub.pending_payment_request.request_reference}
                </code>
                {currentSub.pending_payment_request.utr_number
                  ? `, UTR: ${currentSub.pending_payment_request.utr_number}`
                  : ''}
                ) has been submitted and is currently awaiting admin verification.
              </p>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
                ✓ You do not need to submit another payment. Access will unlock automatically once our administration team verifies the bank statement.
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            style={{
              maxWidth: '700px',
              margin: '0 auto 2rem auto',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#dc2626',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.9rem',
            }}
          >
            <strong>Payment Alert: </strong>
            {errorMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted, #64748b)' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }}></div>
            Loading available plans and features...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            {plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              const monthlyPrice = Math.round(p.price_inr / p.duration_months);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  style={{
                    backgroundColor: 'var(--bg-card, #ffffff)',
                    border: isSelected
                      ? '2px solid var(--primary, #2563eb)'
                      : '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: 'var(--radius-lg, 16px)',
                    padding: '2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? 'var(--shadow-xl, 0 10px 25px -5px rgba(37, 99, 235, 0.2))'
                      : 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {p.is_popular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--primary, #2563eb)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.85rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  {p.duration_months === 12 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.85rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Best Value
                    </div>
                  )}

                  <div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        margin: '0 0 0.5rem 0',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    >
                      {p.plan_name}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted, #64748b)',
                        marginBottom: '1.25rem',
                      }}
                    >
                      Valid for {p.duration_months} {p.duration_months === 1 ? 'month' : 'months'}
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                          ₹{Math.round(p.price_inr)}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)' }}>total</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary, #2563eb)', fontWeight: 600 }}>
                        ₹{monthlyPrice} / month equivalent
                      </div>
                    </div>

                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: '0 0 1.5rem 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        fontSize: '0.86rem',
                        color: 'var(--text-sub, #475569)',
                      }}
                    >
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Skill Gap Prioritization
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Personalized Career Roadmap
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Sequential Task Progress Tracking
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Milestone Assessment Quizzes
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> AI Mock Interview Simulation
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> Speech & Rubric Audio Feedback
                      </li>
                    </ul>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckout(p.id);
                      }}
                      disabled={loading}
                      style={{
                        width: '100%',
                        backgroundColor: isSelected ? 'var(--primary, #2563eb)' : 'var(--bg-surface, #ffffff)',
                        color: isSelected ? '#ffffff' : 'var(--primary, #2563eb)',
                        border: isSelected ? 'none' : '1px solid var(--primary, #2563eb)',
                        borderRadius: 'var(--radius-md, 8px)',
                        padding: '0.75rem',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.75 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {loading && selectedPlanId === p.id ? 'Processing...' : `Get ${p.plan_name} →`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Method Selector & Instant Checkout Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 16px)',
            padding: '2rem',
            marginBottom: '4rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>
              Selected: {selectedPlan?.plan_name} (₹{Math.round(selectedPlan?.price_inr || 0)})
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', margin: '0 0 1rem 0' }}>
              Instant activation via Razorpay. Supports all Indian bank cards and UPI apps.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="pm"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <span>
                  <strong>UPI</strong> (Google Pay, PhonePe, Paytm, BHIM)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="pm"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <span>
                  <strong>Debit / Credit Card</strong> (Visa, MasterCard, RuPay)
                </span>
              </label>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => handleCheckout()}
              disabled={loading || !selectedPlan}
              style={{
                backgroundColor: 'var(--primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md, 10px)',
                padding: '0.85rem 2.25rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(37, 99, 235, 0.25))',
              }}
            >
              {loading ? 'Processing...' : `Pay ₹${Math.round(selectedPlan?.price_inr || 0)} Now →`}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div style={{ marginBottom: '4rem' }}>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'var(--text-main, #0f172a)',
            }}
          >
            Compare Free vs. Premium Access
          </h2>

          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 16px)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--card-subtle-bg, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>Feature Capability</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, width: '25%' }}>Free Tier</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, width: '25%', color: 'var(--primary, #2563eb)' }}>
                    CareerSense Pro (Paid)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Resume PDF Upload & PyMuPDF Parsing</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Basic Resume Analysis & Overall Score</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Job Description Intake & Basic Match %</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Prioritized Skill Gap Intelligence (Critical vs Good-to-Have)</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#dc2626' }}>✗ Locked</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Full Unlimited Access</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Personalized Career Roadmap with Custom Timelines</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#dc2626' }}>✗ Locked</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Full Unlimited Access</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Sequential Progression & Milestone Assessment Quizzes</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#dc2626' }}>✗ Locked</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Included (80% Mastery Gate)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>AI-Powered Mock Interview Assessment Simulation</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#dc2626' }}>✗ Locked</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Real JD Questions & Rubrics</td>
                </tr>
                <tr>
                  <td style={{ padding: '1rem 1.5rem' }}>Web Speech API Audio Questions & Microphone Answers</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#dc2626' }}>✗ Locked</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#059669', fontWeight: 600 }}>✓ Voice Interactive</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '2rem',
              color: 'var(--text-main, #0f172a)',
            }}
          >
            Frequently Asked Questions
          </h2>

          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((f, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: 'var(--radius-md, 12px)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-main, #0f172a)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{f.q}</span>
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-muted, #64748b)' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 1.5rem 1.25rem 1.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-sub, #475569)',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-color, #e2e8f0)',
                        paddingTop: '1rem',
                      }}
                    >
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unified Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={checkoutPlan}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}

