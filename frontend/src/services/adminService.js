/**
 * CareerSense AI - Admin Management Service
 * API client for administrator payment requests, approvals, and payment configuration.
 */

import { apiRequest } from './api';

export const adminService = {
  /**
   * Fetch payment requests with optional status filter and search query
   */
  async getPaymentRequests(status = 'all', search = '') {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/admin/payment-requests${queryString}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch single payment request details with full audit logs
   */
  async getPaymentRequestDetails(requestId) {
    return await apiRequest(`/admin/payment-requests/${requestId}`, {
      method: 'GET',
    });
  },

  /**
   * Approve verified payment request and activate candidate's subscription
   */
  async approvePaymentRequest(requestId, adminNotes = '') {
    return await apiRequest(`/admin/payment-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        admin_notes: adminNotes,
      }),
    });
  },

  /**
   * Reject payment request with reason
   */
  async rejectPaymentRequest(requestId, rejectionReason, adminNotes = '') {
    return await apiRequest(`/admin/payment-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      }),
    });
  },

  /**
   * Fetch editable payment settings (UPI ID, bank account, QR code)
   */
  async getPaymentSettings() {
    return await apiRequest('/admin/payment-settings', {
      method: 'GET',
    });
  },

  /**
   * Update payment configuration and optional QR code image upload
   */
  async updatePaymentSettings(settingsData, qrFile = null) {
    if (qrFile) {
      const formData = new FormData();
      Object.entries(settingsData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val);
        }
      });
      formData.append('qr_code_image', qrFile);

      return await apiRequest('/admin/payment-settings', {
        method: 'POST',
        body: formData,
      });
    }

    return await apiRequest('/admin/payment-settings', {
      method: 'POST',
      body: JSON.stringify(settingsData),
    });
  },

  /**
   * Fetch administrative stats (pending, approved, rejected, revenue)
   */
  async getStats() {
    return await apiRequest('/admin/stats', {
      method: 'GET',
    });
  },
};

export default adminService;

