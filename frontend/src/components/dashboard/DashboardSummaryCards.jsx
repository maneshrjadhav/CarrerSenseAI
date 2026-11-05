import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Compass,
  CheckSquare,
  ArrowRight
} from 'lucide-react';

export default function DashboardSummaryCards({ metrics, hasAnalysis, hasResume, hasRoadmap }) {
  const navigate = useNavigate();

  const qualityScore = metrics?.resume_quality_score;
  const matchScore = metrics?.latest_job_match ?? metrics?.job_match_score;
  const matchedCount = metrics?.matched_skills_count ?? 0;
  const missingCount = metrics?.missing_skills_count ?? 0;
  const roadmapProgress = metrics?.roadmap_progress ?? 0;
  const tasksCompleted = metrics?.tasks_completed ?? 0;
  const tasksTotal = metrics?.tasks_total ?? 0;

  const cards = [
    {
      id: 'quality',
      title: 'Resume Quality',
      value: qualityScore !== null && qualityScore !== undefined ? `${Math.round(qualityScore)}/100` : '--',
      subtitle: qualityScore !== null && qualityScore !== undefined ? 'Independent Document Caliber' : 'Upload resume to evaluate',
      icon: FileText,
      color: '#7c3aed',
      bgLight: 'rgba(124, 58, 237, 0.08)',
      route: '/resume-analyzer',
      status: qualityScore !== null && qualityScore !== undefined ? (qualityScore >= 80 ? 'Strong' : 'Evaluated') : 'Pending'
    },
    {
      id: 'match',
      title: 'Latest Job Match',
      value: matchScore !== null && matchScore !== undefined ? `${Math.round(matchScore)}%` : '--',
      subtitle: metrics?.latest_target_role ? `Target: ${metrics.latest_target_role}` : 'Run JD match to evaluate',
      icon: Briefcase,
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.08)',
      route: metrics?.latest_analysis_id ? `/job-match-result/${metrics.latest_analysis_id}` : '/job-match',
      status: matchScore !== null && matchScore !== undefined ? (matchScore >= 80 ? 'Interview Ready' : 'Gaps Detected') : 'Not Run'
    },
    {
      id: 'matched_skills',
      title: 'Matched Skills',
      value: hasAnalysis ? matchedCount : '--',
      subtitle: hasAnalysis ? 'Verified by resume text' : 'No match run yet',
      icon: CheckCircle2,
      color: '#059669',
      bgLight: 'rgba(5, 150, 105, 0.08)',
      route: '/skill-gap',
      status: hasAnalysis ? `${matchedCount} Active` : 'Awaiting JD'
    },
    {
      id: 'missing_skills',
      title: 'Missing Skills',
      value: hasAnalysis ? missingCount : '--',
      subtitle: hasAnalysis ? 'Target role competencies' : 'Run JD match to find gaps',
      icon: AlertCircle,
      color: '#dc2626',
      bgLight: 'rgba(220, 38, 38, 0.08)',
      route: '/skill-gap',
      status: hasAnalysis ? (missingCount === 0 ? 'Zero Gaps' : `${missingCount} to Learn`) : 'No Data'
    },
    {
      id: 'roadmap_progress',
      title: 'Roadmap Progress',
      value: hasRoadmap ? `${roadmapProgress}%` : '--',
      subtitle: hasRoadmap ? 'Mastery across milestones' : 'Build roadmap to start',
      icon: Compass,
      color: '#0284c7',
      bgLight: 'rgba(2, 132, 199, 0.08)',
      route: '/career-roadmap',
      status: hasRoadmap ? `${roadmapProgress}% Mastered` : 'Not Started'
    },
    {
      id: 'tasks_completed',
      title: 'Learning Tasks',
      value: hasRoadmap ? `${tasksCompleted}${tasksTotal > 0 ? `/${tasksTotal}` : ''}` : '--',
      subtitle: hasRoadmap ? 'Daily scheduled tasks' : 'Generate plan to track',
      icon: CheckSquare,
      color: '#0d9488',
      bgLight: 'rgba(13, 148, 136, 0.08)',
      route: '/career-roadmap',
      status: hasRoadmap ? `${tasksCompleted} Done` : 'Pending'
    }
  ];

  return (
    <section className="dashboard-summary-metrics-strip mb-6" aria-label="Key Performance Metrics">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              onClick={() => navigate(c.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(c.route);
              }}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '16px 18px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = c.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {c.title}
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: c.bgLight,
                    color: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', lineHeight: 1.1, marginBottom: '4px' }}>
                  {c.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.subtitle}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color, #f1f5f9)' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: c.bgLight,
                    color: c.color
                  }}
                >
                  {c.status}
                </span>
                <ArrowRight size={13} style={{ color: 'var(--text-muted, #94a3b8)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

