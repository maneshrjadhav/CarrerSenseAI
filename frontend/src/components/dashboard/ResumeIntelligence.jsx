import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  FileCode,
  Cpu,
  Layers,
  Briefcase,
  Compass,
  ArrowRight,
  Info,
  RefreshCw,
  Award,
  Check,
} from 'lucide-react';
import Button from '../common/Button';

export default function ResumeIntelligence({
  resumes = [],
  skills = [],
  matches = [],
  hasRoadmap = false,
  resumeAnalyzed = false,
  latestResumeAnalysis = null,
}) {
  const navigate = useNavigate();
  const latestResume = resumes.length > 0 ? resumes[0] : null;
  const hasResume = Boolean(latestResume);

  const textExtracted = Boolean(
    latestResume && (latestResume.status === 'parsed' || latestResume.status === 'analyzed')
  );

  const stages = [
    { title: 'PDF Upload', icon: UploadCloud, desc: 'Secure intake', done: hasResume },
    { title: 'Text Extraction', icon: FileCode, desc: 'PyMuPDF parser', done: textExtracted },
    { title: 'NLP Processing', icon: Cpu, desc: 'Resume review', done: resumeAnalyzed },
    { title: 'Skill Extraction', icon: Layers, desc: 'Ontology matching', done: skills.length > 0 },
    { title: 'Job Matching', icon: Briefcase, desc: 'TF-IDF & Cosine', done: matches.length > 0 },
    { title: 'Career Recommendation', icon: Compass, desc: 'Milestone planner', done: hasRoadmap },
  ];

  const completedStages = stages.filter((s) => s.done).length;
  const firstPendingIndex = stages.findIndex((s) => !s.done);

  return (
    <div className="dashboard-card resume-intelligence-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">CORE NLP ENGINE</span>
          <h2 className="card-title">Resume Intelligence</h2>
        </div>
        <span className={`status-pill ${completedStages === 6 ? 'status-pill-emerald' : 'status-pill-blue'}`}>
          {completedStages}/6 Stages Complete
        </span>
      </div>

      {/* Main Status Area */}
      {!hasResume ? (
        <div className="resume-empty-callout">
          <div className="empty-callout-icon">
            <FileText size={28} className="text-primary" />
          </div>
          <div className="empty-callout-text">
            <h3>No Resume Active</h3>
            <p>Upload your resume in PDF format to initiate AI text extraction, NLP scoring, and semantic job matching.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            onClick={() => navigate('/resume-analyzer')}
          >
            Upload Resume
          </Button>
        </div>
      ) : (
        <div className="resume-active-container" style={{ marginBottom: '1.25rem' }}>
          <div className="resume-active-row">
            <div className="resume-file-info">
              <FileText size={24} className="text-emerald" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{latestResume.filename}</strong>
                  <span className={`status-pill ${latestResume.status === 'analyzed' ? 'status-pill-emerald' : 'status-pill-neutral'}`} style={{ fontSize: '0.7rem', padding: '1px 8px' }}>
                    {latestResume.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {latestResume.uploaded_at &&
                    `Uploaded ${new Date(
                      /Z$|[+-]\d{2}:\d{2}$/.test(latestResume.uploaded_at)
                        ? latestResume.uploaded_at
                        : `${latestResume.uploaded_at}Z`
                    ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(latestResume ? `/resume-analysis/${latestResume.id}` : '/resume-analyzer')}
              >
                View Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={() => navigate('/resume-analyzer')}
              >
                Re-Analyze
              </Button>
            </div>
          </div>

          {/* Analysis Summary & Extracted Skills Strip */}
          {latestResumeAnalysis && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 14px',
                background: 'var(--card-subtle-bg)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                  NLP Quality Score: <strong style={{ color: 'var(--primary)' }}>{latestResumeAnalysis.quality_score}/100</strong>
                  {latestResumeAnalysis.total_skills_detected > 0 && ` • ${latestResumeAnalysis.total_skills_detected} skills indexed`}
                  {latestResumeAnalysis.reading_time_minutes && ` • ~${latestResumeAnalysis.reading_time_minutes} min read`}
                </span>
                {latestResumeAnalysis.sections_detected_count > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {latestResumeAnalysis.sections_detected_count} sections detected
                  </span>
                )}
              </div>

              {skills.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Extracted Skills:
                  </span>
                  {skills.slice(0, 6).map((s, idx) => (
                    <span
                      key={s.skill_name || idx}
                      className="mini-chip chip-green text-xs"
                      style={{ padding: '2px 7px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Check size={11} /> {s.skill_name}
                    </span>
                  ))}
                  {skills.length > 6 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      +{skills.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visual Pipeline Status */}
      <div className="pipeline-architecture-block">
        <div className="pipeline-block-header">
          <span>AI PROCESSING PIPELINE</span>
          <span className="pipeline-notice">
            <Info size={12} />
            Live status from your latest processed resume
          </span>
        </div>

        <div className="pipeline-nodes-track">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === firstPendingIndex;
            return (
              <React.Fragment key={stage.title}>
                <div
                  className={`pipeline-node-card ${stage.done ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  title={stage.done ? 'Completed' : isActive ? 'Next step' : 'Pending'}
                >
                  <div className="pipeline-node-icon">
                    <Icon size={16} />
                  </div>
                  <strong className="pipeline-node-title">{stage.title}</strong>
                  <span className="pipeline-node-desc" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    {stage.done ? (
                      <>
                        <Check size={11} /> Done
                      </>
                    ) : isActive ? 'Next' : 'Pending'}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className="pipeline-track-connector" aria-hidden="true">
                    <span>→</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
