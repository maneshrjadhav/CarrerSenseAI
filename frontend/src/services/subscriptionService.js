/**
 * CareerSense AI - Subscription & Payment Service
 * Connects frontend to Flask payment endpoints, manual UPI QR workflow,
 * and manages subscription entitlement.
 */

import { apiRequest } from './api';

export const subscriptionService = {
  /**
   * Fetch all active subscription plans
   */
  async getPlans() {
    return await apiRequest('/subscription/plans', {
      method: 'GET',
    });
  },

  /**
   * Fetch public verified UPI & bank account payment details
   */
  async getPaymentConfig() {
    return await apiRequest('/subscription/payment-config', {
      method: 'GET',
    });
  },

  /**
   * Fetch current authenticated user's active subscription status & pending requests
   */
  async getCurrentSubscription() {
    return await apiRequest('/subscription/current', {
      method: 'GET',
    });
  },

  /**
   * Check access entitlement for a specific feature (skill_gap, career_roadmap, interview_prep, ats_report)
   */
  async checkFeatureAccess(featureName) {
    return await apiRequest(`/subscription/check-access/${featureName}`, {
      method: 'GET',
    });
  },

  /**
   * Create a manual payment request for student UPI QR payment
   */
  async createPaymentRequest(planId, studentNotes = '', paymentMethod = 'upi_qr') {
    return await apiRequest('/subscription/payment-requests', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        student_notes: studentNotes,
        payment_method: paymentMethod,
      }),
    });
  },

  /**
   * Submit payment proof (UTR number, payment time, notes, optional receipt file)
   */
  async submitPaymentProof(requestIdOrRef, { utrNumber, paymentTime, studentNotes, receiptFile }) {
    if (receiptFile) {
      const formData = new FormData();
      formData.append('utr_number', utrNumber);
      if (paymentTime) formData.append('payment_time', paymentTime);
      if (studentNotes) formData.append('student_notes', studentNotes);
      formData.append('receipt', receiptFile);

      return await apiRequest(`/subscription/payment-requests/${requestIdOrRef}/submit-proof`, {
        method: 'POST',
        body: formData,
      });
    }

    return await apiRequest(`/subscription/payment-requests/${requestIdOrRef}/submit-proof`, {
      method: 'POST',
      body: JSON.stringify({
        utr_number: utrNumber,
        payment_time: paymentTime,
        student_notes: studentNotes,
      }),
    });
  },

  /**
   * Fetch all payment requests for the logged-in candidate
   */
  async getMyPaymentRequests() {
    return await apiRequest('/subscription/payment-requests/my', {
      method: 'GET',
    });
  },

  /**
   * Fetch a single payment request by ID or reference
   */
  async getPaymentRequestDetails(refOrId) {
    return await apiRequest(`/subscription/payment-requests/${refOrId}`, {
      method: 'GET',
    });
  },

  /**
   * Create Razorpay payment order for a selected plan (Gateway flow)
   */
  async createPaymentOrder(planId, paymentMethod = 'upi') {
    return await apiRequest('/subscription/create-order', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_method: paymentMethod,
      }),
    });
  },

  /**
   * Verify cryptographic payment signature and activate subscription
   */
  async verifyPayment(paymentDetails) {
    return await apiRequest('/subscription/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentDetails),
    });
  },

  /**
   * Get user payment history
   */
  async getPaymentHistory() {
    return await apiRequest('/subscription/history', {
      method: 'GET',
    });
  },
};

export default subscriptionService;
