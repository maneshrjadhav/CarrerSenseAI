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
          resume_quality_score: null,
          job_match_score: null,
          latest_job_match: null,
          career_readiness_score: null,
          skills_detected_count: 0,
          missing_skills_count: 0,
          roadmap_progress: 0,
          analyses_count: 0,
          resumes_count: 0,
          jobs_count: 0,
          status: 'Not Analyzed',
          latest_target_role: null,
          latest_analysis_id: null,
        },
        resumes: [],
        matches: [],
        skills: [],
        suggested_skills: [],
        skill_gaps: [],
        skill_summary: {
          total_required: 0,
          matched: 0,
          partial: 0,
          missing: 0,
          high_priority_gaps: 0,
        },
        roadmap: null,
        roadmap_summary: null,
        activities: [],
      };
    }
  },
};

export default dashboardService;
