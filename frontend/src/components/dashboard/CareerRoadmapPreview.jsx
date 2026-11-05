import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FolderGit2,
  HelpCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import Button from '../common/Button';

const ITEM_STATUS_LABELS = {
  Completed: 'Done',
  'In Progress': 'In Progress',
  'Not Started': 'Not Started',
};

export default function CareerRoadmapPreview({ roadmap = null, roadmapSummary = null }) {
  const navigate = useNavigate();
  const items = (roadmap && roadmap.items) || [];
  const hasRoadmap = items.length > 0;

  const completedPhases = items.filter((i) => i.status === 'Completed').length;
  const allPhasesCompleted = hasRoadmap && completedPhases === items.length;
  const rawProgress = roadmap?.overall_progress || 0;
  // Never display 100% unless every phase is genuinely completed.
  const displayProgress = allPhasesCompleted ? 100 : Math.min(rawProgress, 99);

  const timelineSteps = [
    { label: 'Current Skills', icon: CheckCircle2, status: 'Input' },
    { label: 'Skill Gaps', icon: AlertTriangle, status: 'Detection' },
    { label: 'Learning Recommendations', icon: BookOpen, status: 'Curriculum' },
    { label: 'Projects', icon: FolderGit2, status: 'Portfolio' },
    { label: 'Interview Preparation', icon: HelpCircle, status: 'Practice' },
    { label: 'Career Ready', icon: Award, status: 'Goal' },
  ];

  return (
    <div className="dashboard-card career-roadmap-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">GROWTH MILESTONES</span>
          <h2 className="card-title">Your Career Roadmap</h2>
        </div>
        <span className={`status-pill ${hasRoadmap ? 'status-pill-emerald' : 'status-pill-neutral'}`}>
          {hasRoadmap ? `${displayProgress}% Complete` : 'Awaiting Analysis'}
        </span>
      </div>

      {hasRoadmap ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Personalized Learning Progress
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
              {displayProgress}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div
              style={{
                height: '100%',
                width: `${displayProgress}%`,
                background: 'var(--primary)',
                borderRadius: '4px',
                transition: 'width 0.4s'
              }}
            ></div>
          </div>

          {roadmapSummary && (
            <div className="roadmap-summary-stats">
              <span className="roadmap-stat">
                {roadmapSummary.completed_phases}/{roadmapSummary.total_phases} phases complete
              </span>
              <span className="roadmap-stat">
                {roadmapSummary.tasks_completed}/{roadmapSummary.tasks_total} tasks done
              </span>
              {roadmapSummary.current_phase && (
                <span className="roadmap-stat">
                  Current: Phase {roadmapSummary.current_phase}
                  {roadmapSummary.current_phase_skill ? ` — ${roadmapSummary.current_phase_skill}` : ''}
                </span>
              )}
            </div>
          )}

          {roadmapSummary?.next_task && (
            <div className="roadmap-next-task">
              <span className="next-task-label">Next task</span>
              <span className="next-task-title">{roadmapSummary.next_task.title}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--card-subtle-bg)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'block' }}>
                    Phase {item.phase_number} • {item.duration_weeks}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.skill_name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.status === 'Completed' ? 'var(--emerald-light)' : item.status === 'In Progress' ? 'var(--primary-light)' : 'var(--card-subtle-bg)',
                    color: item.status === 'Completed' ? 'var(--emerald)' : item.status === 'In Progress' ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  {ITEM_STATUS_LABELS[item.status] || item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="roadmap-preview-body">
          <p className="roadmap-lead-text">
            Your personalized roadmap will appear after you generate one from a job match.
          </p>

          {/* Interactive Visual Timeline Placeholder */}
          <div className="roadmap-timeline-track" role="list">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="roadmap-step-node" role="listitem">
                  <div className="step-node-bubble">
                    <Icon size={16} />
                  </div>
                  <strong className="step-node-label">{step.label}</strong>
                  <span className="step-node-stage">{step.status}</span>
                  {idx < timelineSteps.length - 1 && (
                    <div className="step-node-connector" aria-hidden="true"></div>
                  )}
                </div>
              );
            })}
          </div>

          <span className="roadmap-subtext-note">
            The roadmap engine sequences missing skills into structured learning milestones with curated resources.
          </span>
        </div>
      )}

      <div className="card-bottom-action">
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowRight}
          onClick={() => navigate('/career-roadmap')}
        >
          View Roadmap Engine
        </Button>
      </div>
    </div>
  );
}
