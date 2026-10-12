import api, { API_BASE_URL } from './api';
import { getAuthToken } from './authService';

const analysisService = {
  // Step 1: Upload Resume PDF (returns resume_id)
  async uploadResume(file) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload resume.');
    }
    return data;
  },

  // Step 2: Resume Intelligence Analysis (Independent of Job Description)
  async analyzeResume(resumeId) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ resume_id: resumeId })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to analyze resume.');
    }
    return data;
  },

  // Step 3: Get Resume Intelligence Result
  async getResumeAnalysis(resumeId) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/resume/analysis/${resumeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load resume analysis.');
    }
    return data;
  },

  // Create Analysis from Resume + JD (Job Matching)
  async createAnalysis({ resumeId, targetRole, jobDescription, companyName }) {
    const res = await api.post('/analysis/create', {
      resume_id: resumeId,
      target_role: targetRole,
      job_description: jobDescription,
      company_name: companyName
    });
    return res;
  },

  // Get Analysis Detail (Job Match Result)
  async getAnalysisDetail(analysisId) {
    const res = await api.get(`/analysis/${analysisId}`);
    return res;
  },

  // Get Analysis History
  async getAnalysisHistory() {
    const res = await api.get('/analysis/history');
    return res;
  },

  // Get Active Roadmap
  async getActiveRoadmap() {
    const res = await api.get('/roadmap/active');
    return res;
  },

  // Update Milestone Progress
  async updateMilestoneProgress(itemId, { progress, status }) {
    const res = await api.patch(`/roadmap/items/${itemId}/progress`, {
      progress,
      status
    });
    return res;
  },

  // Generate PDF Report
  async generateReport(analysisId) {
    const res = await api.post(`/report/${analysisId}/generate`, {});
    return res;
  },

  // Download PDF Report URL with Auth Token
  getDownloadUrl(analysisId) {
    const token = getAuthToken();
    return `${API_BASE_URL}/report/${analysisId}/download?token=${encodeURIComponent(token || '')}`;
  },

  // Generate ATS Resume Report
  async generateAtsReport(resumeId) {
    const res = await api.post(`/resume/${resumeId}/ats-report`, {});
    return res;
  },

  // Download ATS Resume Report URL with Auth Token
  getAtsReportDownloadUrl(resumeId) {
    const token = getAuthToken();
    return `${API_BASE_URL}/resume/${resumeId}/ats-report/download?token=${encodeURIComponent(token || '')}`;
  },

  // Delete Resume from database and disk
  async deleteResume(resumeId) {
    const res = await api.delete(`/resume/${resumeId}`);
    return res;
  },

  // Get user's uploaded resumes
  async getUserResumes() {
    const res = await api.get('/resume/list');
    return res.resumes || [];
  }
};

export default analysisService;
