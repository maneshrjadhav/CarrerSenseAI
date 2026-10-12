import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GitCompare, Binary, Percent, Check, X, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function JobMatchPreview({ matches = [] }) {
  const navigate = useNavigate();
  const hasMatches = matches && matches.length > 0;

  const featurePillars = [
    { title: 'Resume → Job Description', icon: GitCompare },
    { title: 'Semantic Similarity', icon: Binary },
    { title: 'Cosine Similarity', icon: Percent },
    { title: 'Matching Skills', icon: Check },
    { title: 'Missing Skills', icon: X },
  ];

  return (
    <div className="dashboard-card job-match-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">SEMANTIC MATCH</span>
          <h2 className="card-title">Job Matching</h2>
        </div>
        <span className={`status-pill ${hasMatches ? 'status-pill-emerald' : 'status-pill-neutral'}`}>
          {matches.length} Target {matches.length === 1 ? 'Role' : 'Roles'}
        </span>
      </div>

      {hasMatches ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {matches.slice(0, 3).map((m) => (
            <div
              key={m.id}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => navigate(`/job-match-result/${m.id}`)}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  {m.target_role}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {m.matched_skills_count || 0} Matched • {m.missing_skills_count || 0} Gaps
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7' }}>
                  {m.match_score}%
                </span>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Score
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="job-match-empty-body">
          <div className="pillars-flow-preview">
            {featurePillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="pillar-metric-chip">
                  <Icon size={13} className="pillar-icon" />
                  <span>{p.title}</span>
                </div>
              );
            })}
          </div>

          <div className="job-match-empty-notice">
            <Briefcase size={28} className="text-primary mb-2" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '4px 0', color: 'var(--text-primary, #fff)' }}>
              No job matching analysis available yet.
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
              Compare your resume against real industry job descriptions to calculate TF-IDF keyword match and vector cosine similarity.
            </p>
          </div>
        </div>
      )}

      <div className="card-bottom-action">
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowRight}
          className="w-full"
          onClick={() => navigate('/job-match')}
        >
          Analyze a Job
        </Button>
      </div>
    </div>
  );
}

