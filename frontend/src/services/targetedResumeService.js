/**
 * Targeted Resume Builder Service
 * Interacts with /api/resume/targeted endpoints for ATS tailoring,
 * live recalculation, and PDF synthesis.
 * CareerSense AI - Final Year Engineering Project
 */

import api, { API_BASE_URL, apiRequest } from './api';
import { getAuthToken } from './authService';

export const targetedResumeService = {
  // Generate initial job-targeted resume
  async generateTargetedResume({ resumeId, targetRole, jobDescription, companyName, analysisId }) {
    return apiRequest('/resume/targeted/generate', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        target_role: targetRole,
        job_description: jobDescription,
        company_name: companyName,
        analysis_id: analysisId,
      }),
    });
  },

  // Get targeted resume draft by ID
  async getTargetedResume(targetedId) {
    return apiRequest(`/resume/targeted/${targetedId}`, {
      method: 'GET',
    });
  },

  // Update draft and recalculate scores
  async updateTargetedResume(targetedId, resumeData, jobDescription) {
    return apiRequest(`/resume/targeted/${targetedId}`, {
      method: 'PUT',
      body: JSON.stringify({
        resume_data: resumeData,
        job_description: jobDescription,
      }),
    });
  },

  // Synthesize ATS-compliant PDF
  async generatePdf(targetedId) {
    return apiRequest(`/resume/targeted/${targetedId}/pdf`, {
      method: 'POST',
    });
  },

  // Download URL with authentication token
  getDownloadUrl(targetedId) {
    const token = getAuthToken();
    return `${API_BASE_URL}/resume/targeted/${targetedId}/download?token=${encodeURIComponent(token || '')}`;
  },

  // List candidate's targeted drafts
  async listTargetedResumes() {
    return apiRequest('/resume/targeted/list', {
      method: 'GET',
    });
  },
};

export default targetedResumeService;

