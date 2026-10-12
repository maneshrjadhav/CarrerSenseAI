import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase,
  BookOpen,
  Compass,
  FileCheck,
  ChevronRight,
  PlusCircle,
  X,
  Target,
  ExternalLink,
  Award,
  Video
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import jobMatchService from '../services/jobMatchService';
import dashboardService from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import { getSkillCurriculum } from '../utils/skillCurriculum';
import { evaluateReadiness } from '../utils/readinessHelper';
import UpgradeModal from '../components/subscription/UpgradeModal';

export default function SkillGapPage() {
  const { matchId: paramMatchId, analysisId } = useParams();
  const effectiveId = paramMatchId || analysisId;
  const navigate = useNavigate();
  const toast = useToast();

  const [matchId, setMatchId] = useState(effectiveId || null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [subRequired, setSubRequired] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL | HIGH | MEDIUM | LOW
  const [activeModalSkill, setActiveModalSkill] = useState(null);
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadSkillGap() {
      try {
        setLoading(true);
        setError('');

        let activeId = effectiveId;
        if (!activeId) {
          try {
            const dash = await dashboardService.getDashboardSummary();
            activeId = dash.metrics?.latest_analysis_id;
          } catch {}
        }

        const res = await jobMatchService.getSkillGap(activeId || undefined);
        if (mounted) {
          if (res.success) {
            setData(res);
            setMatchId(res.match_id || res.analysis_id || activeId);
          } else {
            setError(res.message || 'Failed to load skill gap analysis.');
          }
        }
      } catch (err) {
        if (mounted) {
          if (err.status === 403 || err.data?.subscription_required) {
            setSubRequired(true);
            setError(err.message || 'Skill Gap Analysis is a premium feature.');
          } else {
            setError(err.message || 'Failed to retrieve skill gaps.');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSkillGap();
    return () => {
      mounted = false;
    };
  }, [effectiveId]);

  const handleAddSkillToRoadmap = async (skillName, priority = 'HIGH') => {
    try {
      setAddingSkill(true);
      const res = await jobMatchService.addSkillToRoadmap(matchId, {
        skillName,
        priority
      });
      if (res.success) {
        if (res.already_exists) {
          toast.info(res.message || `${skillName} is already in your roadmap.`);
        } else {
          toast.success(res.message || `${skillName} successfully added to your Career Roadmap!`);
        }
      } else {
        toast.error(res.message || 'Failed to add skill to roadmap.');
      }
    } catch (err) {
      if (err.status === 403 || err.data?.subscription_required) {
        setUpgradeModalOpen(true);
      } else {
        toast.error(err.message || 'Error adding skill to roadmap.');
      }
    } finally {
      setAddingSkill(false);
      setActiveModalSkill(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '450px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Analyzing Skill Gaps...</h3>
          <p className="text-secondary text-sm">Evaluating missing engineering proficiencies against target requisition</p>
        </div>
      </div>
    );
  }

  if (subRequired) {
    return (
      <div className="page-container">
        <div className="page-header">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="page-title">Skill Gap Intelligence</h1>
          <p className="page-subtitle">Prioritized analysis of technical & core competencies missing from your profile.</p>
        </div>

        <Card className="text-center py-5 mt-4" style={{ maxWidth: '680px', margin: '2rem auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Layers size={32} />
          </div>
          <Badge variant="blue" size="md" className="mb-2">★ PREMIUM SUBSCRIPTION REQUIRED</Badge>
          <h2 className="text-2xl font-bold text-dark mb-2">Unlock Skill Gap Intelligence</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm" style={{ lineHeight: 1.6 }}>
            Skill Gap Prioritization is an exclusive CareerSense AI feature. Upgrade to view high-priority missing skills, learning curriculum topics, and recommended practice projects.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={() => setUpgradeModalOpen(true)}
            >
              Upgrade Now (From ₹83/mo) →
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/pricing')}
            >
              Compare Plans
            </Button>
          </div>
        </Card>

        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          featureName="skill_gap"
          reasonMessage="Skill Gap Analysis requires an active CareerSense AI subscription."
          onSuccessRedirect={window.location.pathname}
        />
      </div>
    );
  }

  if (error && !subRequired && !data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="page-title">Skill Gap Intelligence</h1>
          <p className="page-subtitle">Understand what competencies are required for your target role.</p>
        </div>

        <Card className="text-center py-5 mt-4">
          <AlertCircle size={48} className="text-red mx-auto mb-3" style={{ color: '#ef4444' }} />
          <h2 className="text-xl font-bold text-dark mb-2">Unable to Load Skill Gap Intelligence</h2>
          <p className="text-secondary mb-4 max-w-lg mx-auto text-sm">{error}</p>
          <div className="flex-center gap-3">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data || (!data.skill_gaps?.length && !data.matched_skills?.length && !data.missing_skills?.length)) {
    return (
      <div className="page-container">
        <div className="page-header">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="page-title">Your Skill Gap</h1>
          <p className="page-subtitle">Understand exactly what is preventing you from reaching your target role.</p>
        </div>

        <Card className="text-center py-5 mt-4">
          <Layers size={48} className="text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-dark mb-2">No Skill Gap Analysis Found</h2>
          <p className="text-secondary mb-4 max-w-lg mx-auto text-sm">
            Skill gap detection requires evaluating your resume against a target job requisition. Compare your profile to view categorized missing skills and actionable learning pathways.
          </p>
          <div className="flex-center gap-3">
            <Button variant="primary" icon={Sparkles} onClick={() => navigate('/job-match')}>
              Run Job Description Match →
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const {
    target_role = data.analysis?.target_role || 'Target Role',
    company_name = data.company_name || null,
    metrics = {},
    matched_skills = [],
    missing_skills = [],
    partial_matches = data.partial_skills || [],
    skill_gaps = []
  } = data;

  const matchScore = metrics.overall_match_score ?? data.match_score ?? 0;
  const skillCoverage = metrics.skill_coverage ?? Math.round((matched_skills.length / Math.max(1, (matched_skills.length + missing_skills.length))) * 100);
  const matchedCount = matched_skills.length;
  const partialCount = partial_matches.length;
  const missingCount = missing_skills.length || skill_gaps.length;

  const filteredGaps = skill_gaps.filter((gap) => {
    if (selectedFilter === 'ALL') return true;
    return (gap.priority || 'HIGH').toUpperCase() === selectedFilter;
  });

  const getPriorityBadge = (priority) => {
    const p = (priority || 'HIGH').toUpperCase();
    if (p === 'HIGH') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}
        >
          🔴 High Priority
        </span>
      );
    }
    if (p === 'MEDIUM') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#d97706',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}
        >
          🟠 Medium Priority
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}
      >
        🟢 Low Priority
      </span>
    );
  };

  const activeCurriculum = activeModalSkill ? getSkillCurriculum(activeModalSkill.skill_name) : null;

  // Centralized Interview Readiness Decision
  const readiness = data.interview_readiness || evaluateReadiness(matchScore, skill_gaps);
  const isInterviewReady = Boolean(readiness.is_interview_ready ?? readiness.isReady);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <BackButton
          to={matchId ? `/job-match-result/${matchId}` : '/dashboard'}
          label="Back"
          className="mb-3"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge-pill-cyan font-mono text-xs">SKILL GAP ANALYSIS</span>
              <Badge variant="blue" size="sm">Role: {target_role}</Badge>
              {company_name && <Badge variant="slate" size="sm">{company_name}</Badge>}
              <Badge variant={isInterviewReady ? 'emerald' : 'amber'} size="sm">
                {isInterviewReady ? '🎯 Interview Ready' : '🧭 Roadmap Recommended'}
              </Badge>
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Skill Gap Intelligence</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
              Understand the precise competencies separating your resume from the target job requisition.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isInterviewReady ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  icon={Compass}
                  onClick={() => navigate(matchId ? `/career-roadmap/${matchId}` : '/career-roadmap')}
                >
                  Career Roadmap
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={Video}
                  onClick={() => navigate(matchId ? `/interview-prep/${matchId}` : '/interview-prep')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#059669',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Prepare Your Interview →
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  icon={Compass}
                  onClick={() => navigate(matchId ? `/career-roadmap/${matchId}` : '/career-roadmap')}
                >
                  Open Career Roadmap →
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={Video}
                  onClick={() => navigate(matchId ? `/interview-prep/${matchId}` : '/interview-prep')}
                  title="Practice mock interview ahead of roadmap completion"
                >
                  Practice Interview →
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Premium Summary Card */}
      <Card className="mb-4" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
          {/* Readiness & Score */}
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Job Readiness
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: '800', color: matchScore >= 75 ? '#10b981' : matchScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                {matchScore}%
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-sub)' }}>
                {matchScore >= 80 ? 'Job Ready' : matchScore >= 60 ? 'Developing' : 'Needs Upskilling'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Computed via TF-IDF + Cosine Similarity &amp; Weighted Skill Coverage
            </p>
          </div>

          {/* Skill Coverage Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>Skill Coverage</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)' }}>{skillCoverage}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(5, skillCoverage))}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
              {matchedCount} of {matchedCount + missingCount} core requirements satisfied
            </span>
          </div>

          {/* Metric Status Pills */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '80px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#10b981' }}>{matchedCount}</strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669' }}>Matched</span>
            </div>
            <div style={{ flex: 1, minWidth: '80px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#f59e0b' }}>{partialCount}</strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706' }}>Partial</span>
            </div>
            <div style={{ flex: 1, minWidth: '80px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', textAlign: 'center' }}>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#ef4444' }}>{missingCount}</strong>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#dc2626' }}>Missing</span>
            </div>
          </div>
        </div>
      </Card>

      {/* INTERVIEW READINESS NOTIFICATION BANNER */}
      <Card
        className="mb-4"
        style={{
          borderLeft: `6px solid ${isInterviewReady ? '#10b981' : '#f59e0b'}`,
          backgroundColor: isInterviewReady ? 'rgba(16, 185, 129, 0.04)' : 'rgba(245, 158, 11, 0.04)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isInterviewReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isInterviewReady ? '#059669' : '#d97706'
                }}
              >
                {isInterviewReady ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Interview Readiness Status
                  </h3>
                  <Badge variant={isInterviewReady ? 'emerald' : 'amber'} size="md">
                    {isInterviewReady ? '✓ READY FOR MOCK INTERVIEW' : '⚠️ CAREER ROADMAP RECOMMENDED'}
                  </Badge>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Decision standard: Job Match Score ≥ 80.0% AND 0 High-Priority Core Gaps
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isInterviewReady ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={Video}
                  onClick={() => navigate(matchId ? `/interview-prep/${matchId}` : '/interview-prep')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#059669',
                    color: '#ffffff'
                  }}
                >
                  Prepare Your Interview →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={Compass}
                  onClick={() => navigate(matchId ? `/career-roadmap/${matchId}` : '/career-roadmap')}
                >
                  Bridge Gaps in Career Roadmap →
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Match Score vs. 80% Threshold
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: matchScore >= (readiness.threshold || 80) ? '#059669' : '#dc2626' }}>
                {matchScore}% / {readiness.threshold || 80}% {matchScore >= (readiness.threshold || 80) ? '✓ Meets requirement' : `(${Math.round((readiness.threshold || 80) - matchScore)}% deficit)`}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Critical Core Skills Status
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: (readiness.critical_missing_count || (readiness.criticalGaps || []).length) === 0 ? '#059669' : '#dc2626' }}>
                {(readiness.critical_missing_count || (readiness.criticalGaps || []).length) === 0
                  ? '✓ 0 high-priority core competencies missing'
                  : `⚠️ ${readiness.critical_missing_count || (readiness.criticalGaps || []).length} high-priority requirement(s) missing`}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Recommendation Rationale
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>
                {readiness.reason || (isInterviewReady
                  ? 'Strong baseline technical match. You are ready to rehearse behavioral and architectural answers in the Mock Interview.'
                  : 'Mastering the missing high-priority skills will significantly boost your interview clearance rate.')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 1: Green - Matched Skills */}
      <Card
        className="mb-4"
        style={{ borderLeft: '5px solid #10b981' }}
        title={`✓ Matched Competencies (${matchedCount})`}
        subtitle="Skills verified in your resume that fulfill the job description's expectations"
      >
        {matched_skills.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No direct skill matches identified.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {matched_skills.map((s, idx) => (
              <span
                key={s.id || idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#059669'
                }}
              >
                <span>{s.skill_name}</span>
                <CheckCircle2 size={14} color="#10b981" />
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Section 2: Yellow - Partial & Ecosystem Matches */}
      {partial_matches.length > 0 && (
        <Card
          className="mb-4"
          style={{ borderLeft: '5px solid #f59e0b' }}
          title={`◐ Partial & Adjacent Matches (${partialCount})`}
          subtitle="Related skills detected in your background where a quick conceptual bridge is required"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {partial_matches.map((s, idx) => (
              <span
                key={s.id || idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#d97706'
                }}
              >
                <span>{s.skill_name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Adjacent)</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Section 3: Red - Critical Missing Skills & Learning Plans */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✕ Missing Skills &amp; Actionable Learning Plans</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {filteredGaps.length} Gaps
              </span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Click <strong>View Learning Plan</strong> to review structured syllabus and projects, or <strong>Add to Roadmap</strong> to incorporate immediately.
            </p>
          </div>

          {/* Priority filter pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedFilter(lvl)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: selectedFilter === lvl ? 'var(--primary)' : 'var(--bg-card)',
                  borderColor: selectedFilter === lvl ? 'var(--primary)' : 'var(--border-color)',
                  color: selectedFilter === lvl ? '#fff' : 'var(--text-sub)'
                }}
              >
                {lvl === 'ALL' ? 'All Gaps' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Priority`}
              </button>
            ))}
          </div>
        </div>

        {/* Missing Skill Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredGaps.length === 0 ? (
            <Card className="text-center py-4">
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No missing skills found under the {selectedFilter} priority filter.
              </p>
            </Card>
          ) : (
            filteredGaps.map((gap, idx) => (
              <div
                key={gap.id || idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `5px solid ${gap.priority === 'HIGH' ? '#ef4444' : gap.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'}`,
                  borderRadius: '10px',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {gap.skill_name}
                    </h4>
                    {getPriorityBadge(gap.priority)}
                    <span
                      style={{
                        backgroundColor: 'var(--border-color)',
                        color: 'var(--text-sub)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {gap.category || 'Technical'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={BookOpen}
                      onClick={() => setActiveModalSkill(gap)}
                      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    >
                      View Learning Plan
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={PlusCircle}
                      onClick={() => handleAddSkillToRoadmap(gap.skill_name, gap.priority)}
                      style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    >
                      Add to Roadmap →
                    </Button>
                  </div>
                </div>

                {/* Reason & Recommendation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '10px' }}>
                  <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Why It Matters for This Role
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {gap.reason || `Crucial competency required by hiring team for ${target_role}.`}
                    </p>
                  </div>

                  <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Recommended Action
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      {gap.recommendation || `Build a portfolio project demonstrating practical ${gap.skill_name} implementation.`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Missing Skill Learning Plan Modal */}
      {activeModalSkill && activeCurriculum && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setActiveModalSkill(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: '14px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge-pill-cyan font-mono text-xs">LEARNING PLAN</span>
                  {getPriorityBadge(activeModalSkill.priority)}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                  {activeModalSkill.skill_name}: {activeCurriculum.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSkill(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Topics */}
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                  <Target size={16} color="var(--primary)" />
                  Core Learning Syllabus &amp; Topics:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: '1.6' }}>
                  {activeCurriculum.topics.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Practical Project */}
              <div style={{ backgroundColor: 'var(--primary-light)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '6px' }}>
                  <Award size={16} />
                  Recommended Hands-on Project:
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                  {activeCurriculum.project}
                </p>
              </div>

              {/* Expected Outcome */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Expected Candidate Outcome
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {activeCurriculum.outcome}
                </p>
              </div>

              {/* Curated Resources */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Recommended Resources
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {activeCurriculum.resources.map((r, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'var(--card-subtle-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        color: 'var(--text-sub)'
                      }}
                    >
                      📚 {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveModalSkill(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={PlusCircle}
                loading={addingSkill}
                onClick={() => handleAddSkillToRoadmap(activeModalSkill.skill_name, activeModalSkill.priority)}
              >
                Add to My Career Roadmap →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
