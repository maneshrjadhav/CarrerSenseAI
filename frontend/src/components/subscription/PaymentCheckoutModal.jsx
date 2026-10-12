import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  CreditCard,
  ShieldCheck,
  Building,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { launchRazorpayPayment } from '../../utils/paymentHandler';

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('upi_qr'); // 'upi_qr' or 'gateway'
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState(null); // 'pending_verification'

  // Form fields for proof submission
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentTime, setPaymentTime] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    if (isOpen && plan) {
      initCheckout();
    } else {
      // Reset state
      setPaymentRequest(null);
      setSubmittedStatus(null);
      setUtrNumber('');
      setPaymentTime('');
      setStudentNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setErrorMsg('');
    }
  }, [isOpen, plan]);

  const initCheckout = async () => {
    try {
      setInitialLoading(true);
      setErrorMsg('');

      // 1. Fetch public payment config (UPI ID, bank account, instructions)
      const cfgResp = await subscriptionService.getPaymentConfig();
      if (cfgResp.success && cfgResp.payment_config) {
        setPaymentConfig(cfgResp.payment_config);
      }

      // 2. Initialize student payment request on Flask backend
      const reqResp = await subscriptionService.createPaymentRequest(plan.id, '', 'upi_qr');
      if (reqResp.success && reqResp.payment_request) {
        setPaymentRequest(reqResp.payment_request);
        setPaymentTime(new Date().toLocaleString());
      } else {
        throw new Error(reqResp.message || 'Unable to create payment reference.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize payment request.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (paymentConfig?.upi_id) {
      navigator.clipboard.writeText(paymentConfig.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleCopyRef = () => {
    if (paymentRequest?.request_reference) {
      navigator.clipboard.writeText(paymentRequest.request_reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Receipt file size must be less than 5 MB.');
        return;
      }
      setReceiptFile(file);
      setErrorMsg('');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setReceiptPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UTR or Transaction Reference number (at least 6 characters).');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const refOrId = paymentRequest.id;
      const resp = await subscriptionService.submitPaymentProof(refOrId, {
        utrNumber: utrNumber.trim(),
        paymentTime: paymentTime || new Date().toISOString(),
        studentNotes: studentNotes.trim(),
        receiptFile: receiptFile,
      });

      if (resp.success) {
        setSubmittedStatus('pending_verification');
        if (onSuccess) {
          onSuccess(resp.payment_request);
        }
      } else {
        throw new Error(resp.message || 'Submission failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit payment reference. Please check inputs and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayGateway = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const orderResp = await subscriptionService.createPaymentOrder(plan.id, 'upi');
      if (!orderResp.success) {
        throw new Error(orderResp.message || 'Failed to create payment order.');
      }

      await launchRazorpayPayment(orderResp, {
        paymentMethod: 'upi',
        onSuccess: (verifyResult) => {
          setLoading(false);
          onClose();
          if (onSuccess) onSuccess(verifyResult.subscription);
        },
        onError: (payErr) => {
          setLoading(false);
          setErrorMsg(payErr.message || 'Payment processing failed.');
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Gateway initialization error.');
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-card-header, #f8fafc)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563eb',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Secure Checkout
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                {plan.plan_name} ({plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'})
              </span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span>Pay ₹{plan.price_inr}</span>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted, #64748b)' }}>
                (Inclusive of all features)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {initialLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted, #64748b)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
              <p style={{ fontSize: '14px' }}>Generating your payment reference...</p>
            </div>
          ) : submittedStatus === 'pending_verification' ? (
            /* Submission Success & Status Screen */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <Clock size={32} />
              </div>

              <span
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '12px',
                }}
              >
                Pending Admin Verification
              </span>

              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
                Payment Reference Submitted!
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted, #64748b)',
                  maxWidth: '480px',
                  margin: '0 auto 1.5rem auto',
                  lineHeight: '1.6',
                }}
              >
                Your transaction details have been registered under Reference ID{' '}
                <strong style={{ color: 'var(--text-main, #0f172a)' }}>
                  {paymentRequest?.request_reference}
                </strong>
                . Our administration team verifies transactions against authorized bank statements. Your subscription will activate automatically upon approval.
              </p>

              {/* Reference Summary Card */}
              <div
                style={{
                  background: 'var(--bg-input, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '16px',
                  maxWidth: '420px',
                  margin: '0 auto 2rem auto',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Selected Plan:</span>
                  <span style={{ fontWeight: '700' }}>{plan.plan_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Amount:</span>
                  <span style={{ fontWeight: '700', color: '#2563eb' }}>₹{plan.price_inr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Submitted UTR:</span>
                  <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{utrNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted, #64748b)' }}>Current Status:</span>
                  <span style={{ color: '#d97706', fontWeight: '700' }}>Under Admin Review</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Understood, Done
                </button>
              </div>
            </div>
          ) : (
            /* Mode Selection Tabs & Payment Details */
            <div>
              {/* Payment Mode Selector Tabs */}
              <div
                style={{
                  display: 'flex',
                  borderRadius: '8px',
                  background: 'var(--bg-input, #f1f5f9)',
                  padding: '4px',
                  marginBottom: '1.25rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('upi_qr')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: activeTab === 'upi_qr' ? 'var(--bg-card, #ffffff)' : 'transparent',
                    color: activeTab === 'upi_qr' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    boxShadow: activeTab === 'upi_qr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <QrCode size={15} />
                  <span>Manual UPI QR & Bank Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gateway')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: activeTab === 'gateway' ? 'var(--bg-card, #ffffff)' : 'transparent',
                    color: activeTab === 'gateway' ? '#2563eb' : 'var(--text-muted, #64748b)',
                    boxShadow: activeTab === 'gateway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CreditCard size={15} />
                  <span>Online Gateway (Razorpay)</span>
                </button>
              </div>

              {activeTab === 'upi_qr' ? (
                /* UPI QR and Bank Transfer Workflow */
                <div>
                  {/* Payment Reference Banner */}
                  <div
                    style={{
                      background: 'rgba(37, 99, 235, 0.06)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      fontSize: '13px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Unique Payment Ref: </span>
                      <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>
                        {paymentRequest?.request_reference}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {copiedRef ? <Check size={14} /> : <Copy size={14} />}
                      {copiedRef ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* QR Code and Account Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(180px, 200px) 1fr',
                      gap: '16px',
                      background: 'var(--bg-input, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '1.25rem',
                      alignItems: 'center',
                    }}
                  >
                    {/* QR Code Box */}
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          background: '#ffffff',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'inline-block',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        {paymentConfig?.upi_qr_image_url ? (
                          <img
                            src={paymentConfig.upi_qr_image_url}
                            alt="Official UPI QR Code"
                            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                          />
                        ) : (
                          /* Standard Dynamic SVG QR Code Representation */
                          <div
                            style={{
                              width: '160px',
                              height: '160px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '6px',
                              padding: '10px',
                            }}
                          >
                            <QrCode size={64} color="#1e3a8a" />
                            <span style={{ fontSize: '11px', fontWeight: '700', marginTop: '6px', color: '#1e3a8a' }}>
                              Scan & Pay ₹{plan.price_inr}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>GPay / PhonePe / Paytm</span>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '6px' }}>
                        Scan using any UPI App
                      </div>
                    </div>

                    {/* Account Details */}
                    <div>
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>
                          Verified UPI ID
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
                            {paymentConfig?.upi_id || 'careersense.ai@okhdfcbank'}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: copiedUpi ? '#dcfce7' : '#eff6ff',
                              color: copiedUpi ? '#166534' : '#2563eb',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                            {copiedUpi ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-muted, #64748b)' }}>
                        <div><strong>Account Name:</strong> {paymentConfig?.account_holder_name || 'CareerSense AI Pvt Ltd'}</div>
                        <div><strong>Bank Name:</strong> {paymentConfig?.bank_name || 'HDFC Bank Ltd'}</div>
                        <div><strong>Account No:</strong> {paymentConfig?.account_number || '50200088991122'}</div>
                        <div><strong>IFSC Code:</strong> {paymentConfig?.ifsc_code || 'HDFC0001234'} ({paymentConfig?.account_type || 'Current'})</div>
                      </div>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handleSubmitProof}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                        Enter 12-Digit UTR / Transaction Reference <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="e.g. 428719284712 or UPI Ref ID"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color, #cbd5e1)',
                          background: 'var(--bg-input, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
                        Found in your UPI transaction receipt details under "UPI Ref No" or "UTR".
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                          Payment Date & Time (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentTime}
                          onChange={(e) => setPaymentTime(e.target.value)}
                          placeholder="e.g. 12 Oct 2026, 02:45 PM"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: 'var(--bg-input, #ffffff)',
                            color: 'var(--text-main, #0f172a)',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                          Upload Receipt Screenshot (Optional)
                        </label>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,.pdf"
                          onChange={handleFileChange}
                          style={{
                            width: '100%',
                            fontSize: '12px',
                            padding: '6px 0',
                          }}
                        />
                      </div>
                    </div>

                    {receiptPreview && (
                      <div style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
                          Receipt Preview:
                        </span>
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          style={{ maxHeight: '90px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                      </div>
                    )}

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        Student Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        placeholder="Any additional details or payment app used"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color, #cbd5e1)',
                          background: 'var(--bg-input, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '12px',
                        color: 'var(--text-muted, #475569)',
                        marginBottom: '1rem',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong style={{ color: '#b45309' }}>Note: </strong>
                      Submitting this form logs your transaction for administrative verification. Your subscription activates upon admin confirmation.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid var(--border-color, #cbd5e1)',
                          color: 'var(--text-main, #0f172a)',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '10px 22px',
                          borderRadius: '8px',
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {loading ? 'Submitting Reference...' : 'Submit Payment Reference'}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Online Razorpay Gateway Option */
                <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                  <div
                    style={{
                      background: 'rgba(37, 99, 235, 0.05)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: '12px',
                      padding: '24px',
                      maxWidth: '460px',
                      margin: '0 auto',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Razorpay Gateway
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                      Pay ₹{plan.price_inr}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                      Pay instantly using Debit/Credit Cards or UPI via the Razorpay checkout modal.
                    </p>

                    <button
                      type="button"
                      onClick={handleRazorpayGateway}
                      disabled={loading}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '8px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {loading ? 'Opening Gateway...' : 'Proceed to Razorpay Checkout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

