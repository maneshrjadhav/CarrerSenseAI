import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  QrCode,
  Building,
  Upload,
  AlertCircle,
  CreditCard,
  FileText,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminPayments() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'settings'
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');

  // Form states for approval/rejection
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Payment settings state
  const [settings, setSettings] = useState({
    upi_id: '',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Current Account',
    payment_instructions: '',
    upi_qr_image_url: '',
  });
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqResp, statsResp, setResp] = await Promise.all([
        adminService.getPaymentRequests(statusFilter, searchQuery),
        adminService.getStats(),
        adminService.getPaymentSettings(),
      ]);

      if (reqResp.success) {
        setRequests(reqResp.payment_requests || []);
      }
      if (statsResp.success) {
        setStats(statsResp.stats);
      }
      if (setResp.success && setResp.payment_settings) {
        setSettings(setResp.payment_settings);
      }
    } catch (err) {
      showToast(err.message || 'Error loading administration data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await adminService.getPaymentRequests(statusFilter, searchQuery);
      if (res.success) {
        setRequests(res.payment_requests || []);
      }
    } catch (err) {
      showToast(err.message || 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      setActionLoading(true);
      const res = await adminService.approvePaymentRequest(selectedReq.id, adminNotes);
      if (res.success) {
        showToast(`Payment request approved! Subscription activated for ${selectedReq.student_name}.`, 'success');
        setApproveModalOpen(false);
        setSelectedReq(null);
        setAdminNotes('');
        loadData();
      } else {
        throw new Error(res.message || 'Approval failed');
      }
    } catch (err) {
      showToast(err.message || 'Approval error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      showToast('A rejection reason is mandatory.', 'warning');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminService.rejectPaymentRequest(selectedReq.id, rejectionReason, adminNotes);
      if (res.success) {
        showToast('Payment request has been marked as rejected.', 'info');
        setRejectModalOpen(false);
        setSelectedReq(null);
        setRejectionReason('');
        setAdminNotes('');
        loadData();
      } else {
        throw new Error(res.message || 'Rejection failed');
      }
    } catch (err) {
      showToast(err.message || 'Rejection error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      const res = await adminService.updatePaymentSettings(settings, qrFile);
      if (res.success) {
        showToast('Payment settings and account details updated successfully!', 'success');
        setSettings(res.payment_settings);
        setQrFile(null);
        setQrPreview(null);
      } else {
        throw new Error(res.message || 'Failed to save settings');
      }
    } catch (err) {
      showToast(err.message || 'Error updating settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = () => setQrPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openDetailsModal = async (req) => {
    try {
      setSelectedReq(req);
      setDetailsModalOpen(true);
      const detailResp = await adminService.getPaymentRequestDetails(req.id);
      if (detailResp.success) {
        setSelectedReq({ ...req, audit_logs: detailResp.audit_logs || [] });
      }
    } catch {
      // Keep basic info if detail request fails
    }
  };

  const openReceiptModal = (url) => {
    setReceiptUrl(url);
    setReceiptModalOpen(true);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span
            style={{
              background: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'pending_verification':
        return (
          <span
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={12} /> Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#dc2626',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span
            style={{
              background: 'rgba(100, 116, 139, 0.12)',
              color: '#64748b',
              border: '1px solid rgba(100, 116, 139, 0.25)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Awaiting Payment
          </span>
        );
    }
  };

  return (
    <div
      style={{
        padding: '2rem 1.5rem 4rem 1.5rem',
        maxWidth: '1280px',
        margin: '0 auto',
        color: 'var(--text-main, #0f172a)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Admin Security Control
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              Administrator: {user?.full_name || 'Admin'}
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', margin: 0 }}>
            Payment Approvals & Settings
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
            Review candidate UTR submissions, atomically verify receipts, and manage verified bank account configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            color: 'var(--text-main, #0f172a)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#d97706' }}>
                Pending Verification
              </span>
              <Clock size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#d97706' }}>
              {stats.pending_verification}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              Requires admin verification
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#16a34a' }}>
                Approved & Active
              </span>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#16a34a' }}>
              {stats.approved}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              Subscriptions activated
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#2563eb' }}>
                Verified Revenue
              </span>
              <DollarSign size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: '#2563eb' }}>
              ₹{stats.total_verified_revenue_inr.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              Total confirmed collections
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>
                Total Requests
              </span>
              <FileText size={18} color="var(--text-muted, #64748b)" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px' }}>
              {stats.total_requests}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              Across all statuses
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '1.5rem',
          gap: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            color: activeTab === 'requests' ? '#2563eb' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'requests' ? '2px solid #2563eb' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CreditCard size={18} />
          <span>Payment Requests ({stats?.pending_verification || 0} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            color: activeTab === 'settings' ? '#2563eb' : 'var(--text-muted, #64748b)',
            borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building size={18} />
          <span>Payment Settings & Bank Account</span>
        </button>
      </div>

      {activeTab === 'requests' ? (
        /* ================= TAB 1: PAYMENT REQUESTS ================= */
        <div>
          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '1.25rem',
            }}
          >
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'pending_verification', label: 'Pending Verification' },
                { id: 'awaiting_payment', label: 'Awaiting Payment' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'all', label: 'All Requests' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStatusFilter(p.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: statusFilter === p.id ? '#2563eb' : 'var(--bg-card, #ffffff)',
                    color: statusFilter === p.id ? '#ffffff' : 'var(--text-main, #0f172a)',
                    borderColor: statusFilter === p.id ? '#2563eb' : 'var(--border-color, #e2e8f0)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, UTR, Ref ID..."
                  style={{
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-input, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '13px',
                    width: '240px',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
            </form>
          </div>

          {/* Table Container */}
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #64748b)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                <p>Loading payment requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted, #64748b)' }}>
                <FileText size={40} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main, #0f172a)' }}>
                  No payment requests found
                </h4>
                <p style={{ fontSize: '13px' }}>
                  There are no requests matching the current status filter ({statusFilter}).
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--bg-card-header, #f8fafc)',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        color: 'var(--text-muted, #64748b)',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <th style={{ padding: '12px 16px' }}>Request Ref / ID</th>
                      <th style={{ padding: '12px 16px' }}>Candidate Details</th>
                      <th style={{ padding: '12px 16px' }}>Selected Plan</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>UTR / Reference</th>
                      <th style={{ padding: '12px 16px' }}>Receipt Proof</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        style={{
                          borderBottom: '1px solid var(--border-color, #e2e8f0)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{req.request_reference}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                            ID #{req.id} • {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ display: 'block' }}>{req.student_name || 'Candidate'}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>{req.student_email}</span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600' }}>{req.plan_name}</div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                            {req.plan_duration_months} {req.plan_duration_months === 1 ? 'Month' : 'Months'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#16a34a' }}>
                            ₹{req.amount_inr}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {req.utr_number ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-main, #0f172a)' }}>
                              {req.utr_number}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>Not submitted</span>
                          )}
                          {req.payment_time && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                              {req.payment_time}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {req.receipt_file_url ? (
                            <button
                              type="button"
                              onClick={() => openReceiptModal(req.receipt_file_url)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              <FileText size={12} /> View Proof
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>None</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {renderStatusBadge(req.status)}
                          {req.approver_name && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                              By: {req.approver_name}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openDetailsModal(req)}
                              title="View Details"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'transparent',
                                border: '1px solid var(--border-color, #cbd5e1)',
                                color: 'var(--text-main, #0f172a)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              Details
                            </button>

                            {req.status === 'pending_verification' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setApproveModalOpen(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Check size={13} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedReq(req);
                                    setRejectModalOpen(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <X size={13} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= TAB 2: PAYMENT SETTINGS ================= */
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '780px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
              Official Bank & UPI Payment Configuration
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              These verified details are presented to students on the checkout page when paying via manual UPI or bank transfer.
            </p>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Official UPI ID <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.upi_id}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                  placeholder="e.g. careersense.ai@okhdfcbank"
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Account Holder Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.account_holder_name}
                  onChange={(e) => setSettings({ ...settings, account_holder_name: e.target.value })}
                  placeholder="e.g. CareerSense AI Placement Services"
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
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Bank Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.bank_name}
                  onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  placeholder="e.g. HDFC Bank Ltd"
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Account Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.account_number}
                  onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                  placeholder="e.g. 50200088991122"
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  IFSC Code <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.ifsc_code}
                  onChange={(e) => setSettings({ ...settings, ifsc_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDFC0001234"
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
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Account Type
              </label>
              <select
                value={settings.account_type}
                onChange={(e) => setSettings({ ...settings, account_type: e.target.value })}
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
              >
                <option value="Current Account">Current Account</option>
                <option value="Savings Account">Savings Account</option>
              </select>
            </div>

            {/* QR Code Upload */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Upload Genuine UPI QR Code Image (Optional)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                onChange={handleQrFileChange}
                style={{
                  display: 'block',
                  fontSize: '13px',
                  marginBottom: '8px',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Upload a genuine screenshot or exported image of your UPI QR code. If omitted, an automatic scan card is displayed.
              </span>

              {(qrPreview || settings.upi_qr_image_url) && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={qrPreview || settings.upi_qr_image_url}
                    alt="UPI QR Preview"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      padding: '4px',
                      background: '#ffffff',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                    {qrPreview ? 'New QR ready to save' : 'Currently active QR'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Candidate Payment Instructions
              </label>
              <textarea
                rows={4}
                value={settings.payment_instructions}
                onChange={(e) => setSettings({ ...settings, payment_instructions: e.target.value })}
                placeholder="Step-by-step instructions displayed to the student..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={settingsLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {settingsLoading ? 'Saving Settings...' : 'Save Payment Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: APPROVE PAYMENT ================= */}
      {approveModalOpen && selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Confirm Payment Approval</h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5', marginBottom: '1rem' }}>
              Have you verified that ₹{selectedReq.amount_inr} was received in the authorized bank account under UTR{' '}
              <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedReq.utr_number}</strong>?
            </p>

            <div
              style={{
                background: 'var(--bg-input, #f8fafc)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '1rem',
              }}
            >
              <div><strong>Candidate:</strong> {selectedReq.student_name} ({selectedReq.student_email})</div>
              <div><strong>Plan:</strong> {selectedReq.plan_name} ({selectedReq.plan_duration_months} Months)</div>
              <div><strong>Amount:</strong> ₹{selectedReq.amount_inr}</div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Internal Admin Note (Optional)
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified in HDFC statement"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setApproveModalOpen(false)}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Activating...' : 'Yes, Approve & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT PAYMENT ================= */}
      {rejectModalOpen && selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Reject Payment Request</h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted, #64748b)', lineHeight: '1.5', marginBottom: '1rem' }}>
              Rejecting will keep the candidate's subscription inactive. Please provide an honest, student-friendly reason.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR not found in bank statement, or transferred amount was incomplete."
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

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Internal Admin Note (Optional)
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Cross-checked with HDFC netbanking"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECEIPT PREVIEW ================= */}
      {receiptModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
          onClick={() => setReceiptModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '12px',
              maxWidth: '600px',
              maxHeight: '85vh',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Candidate Payment Receipt Proof</h4>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflow: 'auto', textAlign: 'center', flex: 1 }}>
              {receiptUrl.endsWith('.pdf') ? (
                <iframe src={receiptUrl} title="Receipt PDF" style={{ width: '100%', height: '400px', border: 'none' }} />
              ) : (
                <img
                  src={receiptUrl}
                  alt="Candidate Receipt"
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAILS & AUDIT TRAIL ================= */}
      {detailsModalOpen && selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Payment Request Audit
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{selectedReq.request_reference}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '1.25rem' }}>
              <div><strong>Candidate:</strong> {selectedReq.student_name}</div>
              <div><strong>Email:</strong> {selectedReq.student_email}</div>
              <div><strong>Plan:</strong> {selectedReq.plan_name}</div>
              <div><strong>Amount:</strong> ₹{selectedReq.amount_inr}</div>
              <div><strong>UTR Reference:</strong> {selectedReq.utr_number || 'N/A'}</div>
              <div><strong>Submitted At:</strong> {selectedReq.payment_time || 'N/A'}</div>
              <div><strong>Status:</strong> {renderStatusBadge(selectedReq.status)}</div>
              <div><strong>Approver:</strong> {selectedReq.approver_name || 'N/A'}</div>
            </div>

            {selectedReq.student_notes && (
              <div style={{ background: 'var(--bg-input, #f8fafc)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
                <strong>Student Note:</strong> {selectedReq.student_notes}
              </div>
            )}

            {selectedReq.rejection_reason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
                <strong>Rejection Reason:</strong> {selectedReq.rejection_reason}
              </div>
            )}

            {selectedReq.admin_notes && (
              <div style={{ background: 'var(--bg-input, #f8fafc)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem' }}>
                <strong>Internal Admin Note:</strong> {selectedReq.admin_notes}
              </div>
            )}

            {/* Audit Logs Trail */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Audit Trail History</h4>
              {selectedReq.audit_logs && selectedReq.audit_logs.length > 0 ? (
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedReq.audit_logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-input, #f8fafc)',
                        borderRadius: '6px',
                        borderLeft: '3px solid #2563eb',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                        <span>{log.action}</span>
                        <span style={{ color: 'var(--text-muted, #64748b)' }}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                        By: {log.performer_name || log.performer_email || `User #${log.performed_by_user_id}`}
                        {log.previous_status && log.new_status && ` (${log.previous_status} → ${log.new_status})`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>No previous audit records.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

