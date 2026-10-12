/**
 * CareerSense AI — AI Mock Interview API Client
 * Wraps all endpoints under /api/interview/*
 */
import { apiRequest } from './api';

export const interviewService = {
  /**
   * Check interview readiness for an existing job match analysis
   * @param {number|string} analysisId
   */
  async checkReadiness(analysisId) {
    return apiRequest(`/interview/readiness/${analysisId}`, {
      method: 'GET',
    });
  },

  /**
   * Initialize a new Mock Interview session with customized settings
   * @param {object} payload - { analysis_id, target_role, company_name, interview_type, difficulty, force_practice }
   */
  async createSession(payload) {
    return apiRequest('/interview/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch an active or completed interview session by ID
   * @param {number|string} sessionId
   */
  async getSession(sessionId) {
    return apiRequest(`/interview/session/${sessionId}`, {
      method: 'GET',
    });
  },

  /**
   * Submit self-introduction metadata & audio/video completion
   * Enforces 180s hard limit on duration
   * @param {number|string} sessionId
   * @param {object} introData - { intro_text, duration_seconds, audio_mode, delivery_notes }
   */
  async submitSelfIntro(sessionId, introData) {
    return apiRequest(`/interview/session/${sessionId}/submit-intro`, {
      method: 'POST',
      body: JSON.stringify(introData),
    });
  },

  /**
   * Submit candidate answer for a specific interview question
   * Triggers pedagogical AI evaluation & reveals model answer
   * @param {number|string} sessionId
   * @param {number|string} questionId
   * @param {object} answerData - { candidate_answer, answering_mode, time_taken_seconds }
   */
  async submitAnswer(sessionId, questionId, answerData) {
    return apiRequest(`/interview/session/${sessionId}/questions/${questionId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  },

  /**
   * Complete the interview session and generate the final performance report
   * @param {number|string} sessionId
   */
  async completeSession(sessionId) {
    return apiRequest(`/interview/session/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Retrieve candidate's mock interview history
   */
  async getHistory() {
    return apiRequest('/interview/history', {
      method: 'GET',
    });
  },
};

export default interviewService;

