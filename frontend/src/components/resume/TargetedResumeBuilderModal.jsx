import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  X,
  Briefcase,
  GraduationCap,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Plus,
  Trash2
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import targetedResumeService from '../../services/targetedResumeService';

export default function TargetedResumeBuilderModal({
  isOpen,
  onClose,
  initialData = {}, // { resumeId, targetRole, companyName, jobDescription, analysisId }
  onDraftSaved
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [targetedRecord, setTargetedRecord] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [scores, setScores] = useState({
    origQuality: 0,
    revQuality: 0,
    origMatch: 0,
    revMatch: 0
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'skills', 'projects', 'experience', 'education'

  // Initialize draft when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function initBuilder() {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      try {
        const res = await targetedResumeService.generateTargetedResume({
          resumeId: initialData.resumeId,
          targetRole: initialData.targetRole || 'Software Engineer',
          companyName: initialData.companyName || '',
          jobDescription: initialData.jobDescription || '',
          analysisId: initialData.analysisId || undefined
        });

        if (res.success && res.targeted_resume) {
          setTargetedRecord(res.targeted_resume);
          setDraftData(res.targeted_resume.resume_data || {});
          setScores({
            origQuality: res.targeted_resume.original_quality_score || res.comparison?.original_quality_score || 0,
            revQuality: res.targeted_resume.revised_quality_score || res.comparison?.revised_quality_score || 0,
            origMatch: res.targeted_resume.original_match_score || res.comparison?.original_match_score || 0,
            revMatch: res.targeted_resume.revised_match_score || res.comparison?.revised_match_score || 0
          });
        } else {
          setError(res.message || 'Failed to initialize targeted resume draft.');
        }
      } catch (err) {
        setError(err.message || 'Could not generate targeted draft.');
      } finally {
        setLoading(false);
      }
    }

    initBuilder();
  }, [isOpen, initialData.resumeId, initialData.targetRole, initialData.jobDescription]);

  if (!isOpen) return null;

  const handleUpdateField = (field, value) => {
    setDraftData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAndRecalculate = async () => {
    if (!targetedRecord?.id || !draftData) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await targetedResumeService.updateTargetedResume(
        targetedRecord.id,
        draftData,
        initialData.jobDescription
      );
      if (res.success && res.targeted_resume) {
        setTargetedRecord(res.targeted_resume);
        setScores({
          origQuality: res.targeted_resume.original_quality_score,
          revQuality: res.targeted_resume.revised_quality_score,
          origMatch: res.targeted_resume.original_match_score,
          revMatch: res.targeted_resume.revised_match_score
        });
        setSuccessMsg('Draft saved & scores recalculated successfully!');
        if (onDraftSaved) onDraftSaved(res.targeted_resume);
      } else {
        setError(res.message || 'Failed to recalculate scores.');
      }
    } catch (err) {
      setError(err.message || 'Error updating targeted resume.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!targetedRecord?.id) return;
    setGeneratingPdf(true);
    setError('');
    try {
      const pdfRes = await targetedResumeService.generatePdf(targetedRecord.id);
      if (pdfRes.success) {
        const downloadUrl = targetedResumeService.getDownloadUrl(targetedRecord.id);
        window.open(downloadUrl, '_blank');
      } else {
        setError(pdfRes.message || 'Failed to compile ATS PDF.');
      }
    } catch (err) {
      setError(err.message || 'Failed to download targeted PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const qualityDiff = Math.round(scores.revQuality - scores.origQuality);
  const matchDiff = Math.round(scores.revMatch - scores.origMatch);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving && !generatingPdf) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0,0,0,0.25))',
          width: '100%',
          maxWidth: '1120px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-subtle-bg, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #2563eb)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Build a Job-Targeted Resume
                </h2>
                <Badge variant="blue" size="sm">
                  {initialData.targetRole || 'Target Role'}
                </Badge>
                {initialData.companyName && (
                  <Badge variant="emerald" size="sm">
                    {initialData.companyName}
                  </Badge>
                )}
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                Targeted ATS optimization preserving authentic credentials • Anti-fabrication safeguards active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Anti-Fabrication Guarantee Strip */}
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '8px 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#065f46'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>
              <strong>Zero-Fabrication Guarantee:</strong> Real degrees, companies, and projects are strictly preserved.
              Missing requisition skills are placed transparently under <em>"Competencies in Progress"</em>.
            </span>
          </div>
          <span style={{ fontWeight: 600, color: '#047857' }}>Placement Verified ATS Schema</span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner-primary mx-auto mb-3"></div>
              <h4 style={{ fontWeight: 700 }}>Synthesizing Targeted Resume Draft...</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                Comparing authentic candidate taxonomy against job requisition
              </p>
            </div>
          </div>
        ) : error && !draftData ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '480px' }}>
              <AlertCircle size={44} color="#ef4444" className="mx-auto mb-3" />
              <h3 style={{ fontWeight: 700 }}>Unable to Initialize Builder</h3>
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                {error}
              </p>
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Before-and-After Score Cards Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                padding: '12px 1.75rem',
                backgroundColor: 'var(--card-subtle-bg, #f8fafc)',
                borderBottom: '1px solid var(--border-color, #e2e8f0)'
              }}
            >
              {/* Card 1: ATS Quality Score */}
              <div
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    ATS QUALITY SCORE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      {scores.revQuality}%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', textDecoration: 'line-through' }}>
                      {scores.origQuality}%
                    </span>
                  </div>
                </div>
                {qualityDiff > 0 && (
                  <Badge variant="emerald" size="sm">
                    +{qualityDiff}% ATS Lift
                  </Badge>
                )}
              </div>

              {/* Card 2: JD Match Score */}
              <div
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    JD MATCH SCORE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>
                      {scores.revMatch}%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', textDecoration: 'line-through' }}>
                      {scores.origMatch}%
                    </span>
                  </div>
                </div>
                {matchDiff > 0 && (
                  <Badge variant="emerald" size="sm">
                    +{matchDiff}% Role Match
                  </Badge>
                )}
              </div>

              {/* Card 3: In-Progress Competencies Count */}
              <div
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                    TRANSPARENT SKILLS TO LEARN
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>
                    {(draftData?.skills_to_learn || []).length} Skills
                  </div>
                </div>
                <Badge variant="amber" size="sm">
                  In Progress
                </Badge>
              </div>
            </div>

            {/* Main Side-by-Side Dual Pane */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                overflow: 'hidden'
              }}
            >
              {/* Left Pane: Target Context & Requisition Guidance */}
              <div
                style={{
                  borderRight: '1px solid var(--border-color, #e2e8f0)',
                  backgroundColor: 'var(--card-subtle-bg, #f8fafc)',
                  padding: '1.25rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>
                    Target Requisition
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main, #0f172a)' }}>
                    {initialData.targetRole || 'Target Role'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                    {initialData.companyName || 'Target Organization'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                    Skills Targeted for Learning
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(draftData?.skills_to_learn || []).map((sk, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#b45309',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        ⚡ {sk}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '6px' }}>
                    These skills are clearly marked as in-progress on your resume draft so recruiters appreciate your honesty.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #64748b)', marginBottom: '6px' }}>
                    Editor Navigation
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { id: 'summary', label: '1. Professional Summary' },
                      { id: 'skills', label: '2. Skills & Competencies' },
                      { id: 'projects', label: '3. Technical Projects' },
                      { id: 'experience', label: '4. Work Experience' },
                      { id: 'education', label: '5. Education & Details' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: activeTab === tab.id ? '1px solid #2563eb' : '1px solid transparent',
                          background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                          color: activeTab === tab.id ? '#1d4ed8' : 'var(--text-main, #334155)',
                          fontWeight: activeTab === tab.id ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Pane: Interactive Targeted Resume Draft Editor */}
              <div
                style={{
                  padding: '1.5rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Notification banners */}
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {successMsg}
                  </div>
                )}

                {/* Tab 1: Professional Summary */}
                {activeTab === 'summary' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>
                      Targeted Professional Summary
                    </label>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>
                      Tailored to highlight your genuine competencies for {initialData.targetRole || 'the target role'} and express commitment to target competencies.
                    </p>
                    <textarea
                      rows={5}
                      value={draftData?.professional_summary || ''}
                      onChange={(e) => handleUpdateField('professional_summary', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        backgroundColor: 'var(--bg-page, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                )}

                {/* Tab 2: Skills & Competencies */}
                {activeTab === 'skills' && (
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                        Authentic Technical Skills (Categorized)
                      </label>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '12px' }}>
                        Extracted directly from your resume. Grouped for optimal ATS parsing.
                      </p>
                      {Object.entries(draftData?.technical_skills || {}).map(([cat, skList]) => (
                        <div key={cat} style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                            {cat}:
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #475569)', marginLeft: '8px' }}>
                            {Array.isArray(skList) ? skList.join(', ') : skList}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                        Target Competencies in Progress (Skills to Learn)
                      </label>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '8px' }}>
                        Required by the job requisition that you are actively learning.
                      </p>
                      <input
                        type="text"
                        value={(draftData?.skills_to_learn || []).join(', ')}
                        onChange={(e) => {
                          const val = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          handleUpdateField('skills_to_learn', val);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color, #cbd5e1)',
                          backgroundColor: 'var(--bg-page, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.9rem'
                        }}
                        placeholder="e.g. Docker, Kubernetes, AWS, TypeScript"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Projects */}
                {activeTab === 'projects' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Academic & Engineering Projects
                      </label>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
                      All project titles and metrics reflect your actual work. You can refine bullet wording to highlight role-relevant keywords.
                    </p>

                    {(draftData?.projects || []).map((proj, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '10px',
                          padding: '14px',
                          marginBottom: '14px',
                          background: 'var(--card-subtle-bg, #f8fafc)'
                        }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                            Project Title
                          </label>
                          <input
                            type="text"
                            value={proj.title || ''}
                            onChange={(e) => {
                              const updated = [...(draftData?.projects || [])];
                              updated[idx] = { ...updated[idx], title: e.target.value };
                              handleUpdateField('projects', updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color, #cbd5e1)',
                              fontSize: '0.88rem',
                              fontWeight: 700
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                            Action-Oriented Bullet Points
                          </label>
                          <textarea
                            rows={3}
                            value={(proj.bullets || []).join('\n')}
                            onChange={(e) => {
                              const updated = [...(draftData?.projects || [])];
                              updated[idx] = { ...updated[idx], bullets: e.target.value.split('\n') };
                              handleUpdateField('projects', updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color, #cbd5e1)',
                              fontSize: '0.85rem',
                              lineHeight: 1.4
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: Work Experience */}
                {activeTab === 'experience' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                      Authentic Work Experience & Internships
                    </label>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '14px' }}>
                      Company names and employment terms are strictly preserved without fabricated positions.
                    </p>

                    {(draftData?.experience || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '10px' }}>
                        <Briefcase size={32} color="#94a3b8" className="mx-auto mb-2" />
                        <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>No prior corporate experience recorded</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                          As a student candidate, your technical projects and academic coursework form the primary ATS foundation.
                        </p>
                      </div>
                    ) : (
                      (draftData?.experience || []).map((exp, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '14px',
                            background: 'var(--card-subtle-bg, #f8fafc)'
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              value={exp.title || ''}
                              onChange={(e) => {
                                const updated = [...(draftData?.experience || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                handleUpdateField('experience', updated);
                              }}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                              placeholder="Job Title"
                            />
                            <input
                              type="text"
                              value={exp.company || ''}
                              onChange={(e) => {
                                const updated = [...(draftData?.experience || [])];
                                updated[idx] = { ...updated[idx], company: e.target.value };
                                handleUpdateField('experience', updated);
                              }}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                              placeholder="Organization"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={(exp.bullets || []).join('\n')}
                            onChange={(e) => {
                              const updated = [...(draftData?.experience || [])];
                              updated[idx] = { ...updated[idx], bullets: e.target.value.split('\n') };
                              handleUpdateField('experience', updated);
                            }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            placeholder="Key responsibilities and achievements"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 5: Education */}
                {activeTab === 'education' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                      Education & Credentials
                    </label>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '14px' }}>
                      Degrees and university details are preserved from your original resume.
                    </p>

                    {(draftData?.education || []).map((edu, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '10px',
                          padding: '14px',
                          marginBottom: '10px',
                          background: 'var(--card-subtle-bg, #f8fafc)'
                        }}
                      >
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => {
                            const updated = [...(draftData?.education || [])];
                            updated[idx] = { ...updated[idx], degree: e.target.value };
                            handleUpdateField('education', updated);
                          }}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px' }}
                          placeholder="Degree / Qualification"
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const updated = [...(draftData?.education || [])];
                              updated[idx] = { ...updated[idx], institution: e.target.value };
                              handleUpdateField('education', updated);
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            placeholder="College / University"
                          />
                          <input
                            type="text"
                            value={edu.year || ''}
                            onChange={(e) => {
                              const updated = [...(draftData?.education || [])];
                              updated[idx] = { ...updated[idx], year: e.target.value };
                              handleUpdateField('education', updated);
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div
              style={{
                padding: '1rem 1.75rem',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--card-subtle-bg, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  loading={saving}
                  disabled={saving || generatingPdf}
                  onClick={handleSaveAndRecalculate}
                >
                  Save & Recalculate Scores
                </Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving || generatingPdf}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  icon={Download}
                  loading={generatingPdf}
                  disabled={saving || generatingPdf}
                  onClick={handleDownloadPdf}
                >
                  Download ATS Resume (PDF)
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

