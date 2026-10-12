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

export default function CareerRoadmapPreview({ roadmap = null }) {
  const navigate = useNavigate();
  const hasRoadmap = Boolean(roadmap && ((roadmap.items && roadmap.items.length > 0) || (roadmap.stages && roadmap.stages.length > 0)));

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
          {hasRoadmap ? `${roadmap.overall_progress || 0}% Complete` : 'Awaiting Analysis'}
        </span>
      </div>

      {hasRoadmap ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
              Personalized Learning Progress
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0284c7' }}>
              {roadmap.overall_progress || 0}%
            </span>
          </div>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                height: '100%',
                width: `${roadmap.overall_progress || 0}%`,
                background: '#0284c7',
                borderRadius: '4px',
                transition: 'width 0.4s'
              }}
            ></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(roadmap.items || []).slice(0, 3).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, display: 'block' }}>
                    Phase {item.phase_number} • {item.duration_weeks}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                    {item.skill_name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.status === 'completed' ? '#dcfce7' : item.status === 'in_progress' ? '#e0f2fe' : '#f1f5f9',
                    color: item.status === 'completed' ? '#15803d' : item.status === 'in_progress' ? '#0369a1' : '#64748b'
                  }}
                >
                  {item.status === 'completed' ? 'Done' : item.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="roadmap-preview-body">
          <p className="roadmap-lead-text">
            Your personalized roadmap will appear after resume analysis.
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
            The roadmap engine sequences missing skills into structured 30-60-90 day learning milestones with curated resources.
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

