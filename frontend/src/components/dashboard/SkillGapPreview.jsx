import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Target, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function SkillGapPreview({ skillGaps = [] }) {
  const navigate = useNavigate();
  const hasGaps = skillGaps && skillGaps.length > 0;

  return (
    <div className="dashboard-card skill-gap-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">DIFFERENTIAL ANALYSIS</span>
          <h2 className="card-title">Skill Gap Analysis</h2>
        </div>
        <span className={`status-pill ${hasGaps ? 'status-pill-rose' : 'status-pill-neutral'}`}>
          {hasGaps ? `${skillGaps.length} Gaps Detected` : 'Awaiting Input'}
        </span>
      </div>

      {hasGaps ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {skillGaps.slice(0, 4).map((gap) => (
            <div
              key={gap.id || gap.skill_name}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #fee2e2',
                background: '#fff5f5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#991b1b' }}>
                  ✕ {gap.skill_name}
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
                  {gap.estimated_learning_duration || '2-3 weeks'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: gap.priority === 'HIGH' ? '#fecaca' : '#fed7aa',
                  color: gap.priority === 'HIGH' ? '#991b1b' : '#9a3412'
                }}
              >
                {gap.priority || 'MEDIUM'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="skill-gap-empty-body">
          <div className="gap-wireframe-placeholder">
            <div className="wireframe-radar-ring outer"></div>
            <div className="wireframe-radar-ring mid"></div>
            <div className="wireframe-radar-ring inner"></div>
            <div className="wireframe-radar-crosshair"></div>
            <span className="wireframe-radar-label">Target Role Competency Gap</span>
          </div>

          <div className="gap-copy-block">
            <p className="gap-prompt-text">
              Upload a resume and select a job description to identify missing skills.
            </p>
            <span className="gap-subtext">
              The NLP differential engine highlights critical qualifications missing from your profile.
            </span>
          </div>
        </div>
      )}

      <div className="card-bottom-action">
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowRight}
          className="w-full"
          onClick={() => navigate('/skill-gap')}
        >
          Analyze Skill Gap
        </Button>
      </div>
    </div>
  );
}

