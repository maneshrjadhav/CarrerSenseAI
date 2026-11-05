import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../common/Button';

export default function SkillGapPreview({
  skillGaps = [],
  skillSummary = null,
  targetRole = null,
  score = null,
  latestAnalysisId = null,
}) {
  const navigate = useNavigate();
  const hasGaps = skillGaps && skillGaps.length > 0;
  const hasMatchData = Boolean(
    (skillSummary && skillSummary.total_required > 0) || targetRole || score !== null
  );

  return (
    <div className="dashboard-card skill-gap-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">DIFFERENTIAL ANALYSIS</span>
          <h2 className="card-title">Skill Gap Analysis</h2>
        </div>
        <span
          className={`status-pill ${
            hasGaps
              ? 'status-pill-rose'
              : hasMatchData
              ? 'status-pill-emerald'
              : 'status-pill-neutral'
          }`}
        >
          {hasGaps
            ? `${skillGaps.length} Gaps Detected`
            : hasMatchData
            ? 'No Critical Gaps'
            : 'No Analysis Yet'}
        </span>
      </div>

      {hasMatchData ? (
        <div>
          {/* Target Role & Match Score Meta Row */}
          {(targetRole || score !== null) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border-color)',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Target: <strong>{targetRole || 'Current Requisition'}</strong>
              </span>
              {score !== null && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {score}% Match
                </span>
              )}
            </div>
          )}

          {/* Breakdown Summary Chips */}
          {skillSummary && (
            <div className="gap-summary-chips" style={{ marginBottom: '12px' }}>
              <span className="gap-stat-chip gap-stat-matched">
                {skillSummary.matched || 0} Matched
              </span>
              <span className="gap-stat-chip gap-stat-partial">
                {skillSummary.partial || 0} Partial
              </span>
              <span className="gap-stat-chip gap-stat-missing">
                {skillSummary.missing || 0} Missing
              </span>
            </div>
          )}

          {hasGaps ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {skillGaps.slice(0, 4).map((gap) => (
                <div
                  key={gap.id || gap.skill_name}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    background: 'rgba(244, 63, 94, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#fb7185', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={13} /> {gap.skill_name}
                    </span>
                    {gap.estimated_learning_duration && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Est. {gap.estimated_learning_duration}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background:
                        gap.priority === 'HIGH'
                          ? 'rgba(244, 63, 94, 0.2)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color: gap.priority === 'HIGH' ? '#fb7185' : '#fbbf24',
                    }}
                  >
                    {gap.priority || 'MEDIUM'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px 12px', textAlign: 'center', marginBottom: '12px', background: 'var(--card-subtle-bg)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} className="text-emerald" /> No high-priority skill gaps detected for {targetRole || 'target requisition'}.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Your resume meets or exceeds all required competencies for this role.
              </span>
            </div>
          )}
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
              Upload a resume and evaluate against a job description to identify missing skills.
            </p>
            <span className="gap-subtext">
              The differential NLP engine maps competencies and highlights high-priority curriculum milestones.
            </span>
          </div>
        </div>
      )}

      <div className="card-bottom-action">
        <Button
          variant={hasMatchData ? 'secondary' : 'primary'}
          size="sm"
          icon={ArrowRight}
          className="w-full"
          onClick={() => {
            if (hasMatchData) {
              navigate(latestAnalysisId ? `/skill-gap/${latestAnalysisId}` : '/skill-gap');
            } else {
              navigate('/job-match');
            }
          }}
        >
          {hasMatchData ? 'Explore Skill Gap Details →' : 'Analyze Job Match'}
        </Button>
      </div>
    </div>
  );
}
