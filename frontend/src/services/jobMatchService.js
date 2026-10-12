import api, { API_BASE_URL } from './api';
import { getAuthToken } from './authService';

async function handleResponse(response, defaultMsg = 'Request failed') {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `${defaultMsg} (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const jobMatchService = {
  // 1. Create Job Description
  async createJobDescription({ targetRole, companyName, jobDescription }) {
    const res = await api.post('/job-match/job-description', {
      target_role: targetRole,
      company_name: companyName,
      job_description: jobDescription,
    });
    return res;
  },

  // 2. Run Job Match Analysis
  async analyzeJobMatch({ resumeId, targetRole, jobDescription, companyName }) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/job-match/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        resume_id: resumeId,
        target_role: targetRole,
        job_description: jobDescription,
        company_name: companyName,
      }),
    });

    return handleResponse(response, 'Job match analysis failed');
  },

  // 3. Get Match Result
  async getJobMatch(matchId) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`${API_BASE_URL}/job-match/${matchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(response, 'Failed to load job match result');
  },

  // 4. Get Match Skills
  async getJobMatchSkills(matchId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/job-match/${matchId}/skills`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response, 'Failed to load match skills');
  },

  // 5. Get Skill Gap Analysis
  async getSkillGap(matchId) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const endpoint = matchId ? `${API_BASE_URL}/skill-gap/${matchId}` : `${API_BASE_URL}/skill-gap/latest`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response, 'Failed to load skill gap');
  },

  // 6. Get Career Roadmap for a Match
  async getRoadmap(matchId) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const endpoint = matchId ? `${API_BASE_URL}/career-roadmap/${matchId}` : `${API_BASE_URL}/career-roadmap/latest`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response, 'Failed to load roadmap');
  },

  // 7. Generate Personalized Roadmap
  async generateRoadmap(matchId, options = {}) {
    const token = getAuthToken();
    const endpoint = matchId ? `${API_BASE_URL}/career-roadmap/${matchId}/generate` : `${API_BASE_URL}/career-roadmap/generate`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        match_id: matchId || undefined,
        duration_weeks: options.durationWeeks || options.duration_weeks || 8,
        daily_study_hours: options.dailyStudyHours || options.daily_study_hours || 1.0,
        study_days_per_week: options.studyDaysPerWeek || options.study_days_per_week || 5,
        learning_style: options.learningStyle || options.learning_style || 'balanced',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Failed to generate roadmap.');
    return data;
  },

  // 7b. Regenerate Roadmap with updated timeline
  async regenerateRoadmap(matchId, options = {}) {
    const token = getAuthToken();
    const endpoint = matchId ? `${API_BASE_URL}/career-roadmap/${matchId}/regenerate` : `${API_BASE_URL}/career-roadmap/regenerate`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        match_id: matchId || undefined,
        duration_weeks: options.durationWeeks || options.duration_weeks || 8,
        daily_study_hours: options.dailyStudyHours || options.daily_study_hours || 1.0,
        study_days_per_week: options.studyDaysPerWeek || options.study_days_per_week || 5,
        learning_style: options.learningStyle || options.learning_style || 'balanced',
      }),
    });
    return handleResponse(response, 'Failed to regenerate roadmap');
  },

  // 7c. Add Missing Skill to Active Roadmap
  async addSkillToRoadmap(matchId, { skillName, priority = 'HIGH' }) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const endpoint = matchId ? `${API_BASE_URL}/career-roadmap/${matchId}/add-skill` : `${API_BASE_URL}/career-roadmap/add-skill`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        match_id: matchId || undefined,
        skill_name: skillName,
        priority: priority
      }),
    });
    return handleResponse(response, 'Failed to add skill to roadmap');
  },

  // 8. Update Roadmap Item Progress
  async updateRoadmapItem(itemId, { status, progress, tasks }) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/career-roadmap/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, progress, tasks }),
    });
    return handleResponse(response, 'Failed to update milestone');
  },

  // 8b. Submit Milestone Quiz Assessment
  async submitRoadmapQuiz(itemId, answers) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/career-roadmap/items/${itemId}/quiz-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });
    return handleResponse(response, 'Failed to submit quiz assessment');
  },

  // 9. Re-analyze Skills after completing milestones
  async reanalyzeSkills(matchId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/job-match/${matchId}/reanalyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return handleResponse(response, 'Failed to re-analyze skills');
  },

  // 10. Generate PDF Report
  async generateReport(matchId) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/job-match/${matchId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return handleResponse(response, 'Failed to generate report');
  },

  // 11. Download PDF Report URL
  getReportDownloadUrl(matchId) {
    const token = getAuthToken();
    return `${API_BASE_URL}/job-match/${matchId}/report/download?token=${encodeURIComponent(token || '')}`;
  },

  // 12. Get User Resumes list
  async getUserResumes() {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}/resume/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (data.success && data.resumes) return data.resumes;
    } catch (_) {}

    // Fallback to dashboard summary
    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    return data.resumes || [];
  },

  // 13. Permanently Delete Resume
  async deleteResume(resumeId) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`${API_BASE_URL}/resume/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Failed to delete resume.');
    return data;
  },
};

export default jobMatchService;

