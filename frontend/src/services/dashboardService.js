import { apiRequest } from './api';

export const dashboardService = {
  async getDashboardSummary() {
    try {
      const data = await apiRequest('/dashboard/summary', { method: 'GET' });
      return data;
    } catch (err) {
      // Safe, honest empty state fallback
      return {
        success: false,
        has_analysis: false,
        metrics: {
          resumes_count: 0,
          jobs_count: 0,
          career_readiness_score: null,
          status: 'Not Analyzed',
        },
        resumes: [],
        skills: [],
        skill_gaps: [],
        activities: [],
      };
    }
  },
};

export default dashboardService;

