import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  Layers,
  Award,
  RefreshCw,
  FileText,
  Briefcase,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Video,
  Mic,
  Compass
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import ProgressBar from '../components/common/ProgressBar';
import jobMatchService from '../services/jobMatchService';
import { evaluateReadiness, READINESS_THRESHOLD, MAX_CRITICAL_GAPS } from '../utils/readinessHelper';
import UpgradeModal from '../components/subscription/UpgradeModal';
import TargetedResumeBuilderModal from '../components/resume/TargetedResumeBuilderModal';

export default function JobMatchResult() {
  const { matchId: pMatchId, analysisId } = useParams();
  const matchId = pMatchId || analysisId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [error, setError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [selectedSkillModal, setSelectedSkillModal] = useState(null);

  // Targeted resume builder and improvement popup state
  const [targetedBuilderOpen, setTargetedBuilderOpen] = useState(false);
  const [showImprovePopup, setShowImprovePopup] = useState(false);

  // Subscription gating & paywall modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState('career_roadmap');
  const [lockedReason, setLockedReason] = useState('');
  const [targetRedirect, setTargetRedirect] = useState('');

  const handleFeatureAccess = (feature, targetRoute, fallbackReason) => {
    const hasSub = Boolean(matchData?.has_subscription);
    if (hasSub) {
      navigate(targetRoute);
    } else {
      setLockedFeature(feature);
      setLockedReason(fallbackReason);
      setTargetRedirect(targetRoute);
      setUpgradeModalOpen(true);
    }
  };

  const openSkillModal = (skill) => {
    if (!matchData) return;
    const sName = (skill.skill_name || '').toLowerCase();
    const gap = (matchData.skill_gaps || []).find((g) => (g.skill_name || '').toLowerCase() === sName);
    const rItem = (matchData.roadmap?.items || []).find((i) => (i.skill_name || '').toLowerCase() === sName);

    setSelectedSkillModal({
      skill_name: skill.skill_name,
      priority: gap?.priority || rItem?.priority || 'HIGH',
      why_it_matters:
        gap?.why_it_matters ||
        `This competency is explicitly required for the target role of ${matchData.target_role || 'Target Role'}. Recruiters and ATS screening systems look for hands-on experience in this area.`,
      topics:
        gap?.topics_to_learn ||
        rItem?.topics ||
        ['Core architecture & principles', 'Hands-on configuration & syntax', 'Best practices and integration'],
      practice_project:
        gap?.practice_project ||
        rItem?.practice_project ||
        `Build a functional mini-project implementing ${skill.skill_name} and add it to your portfolio repository.`
    });
  };

  useEffect(() => {
    let mounted = true;
    async function fetchMatchDetail() {
      try {
        setLoading(true);
        setError('');
        const res = await jobMatchService.getJobMatch(matchId);
        if (mounted) {
          if (res.success) {
            setMatchData(res);
            const score = Math.round(
              res.metrics?.overall_match_score ||
              res.analysis?.match_score ||
              0
            );
            const isDismissed = sessionStorage.getItem(`cs_dismissed_improve_popup_${matchId}`);
            if (score < 75 && !isDismissed) {
              setShowImprovePopup(true);
            }
          } else {
            setError(res.message || 'Failed to load match result.');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve job match result.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (matchId) {
      fetchMatchDetail();
    }
    return () => {
      mounted = false;
    };
  }, [matchId]);

  const handleOpenImprovementBuilder = () => {
    setShowImprovePopup(false);
    setTargetedBuilderOpen(true);
  };

  const handleDismissImprovePopup = () => {
    setShowImprovePopup(false);
    sessionStorage.setItem(`cs_dismissed_improve_popup_${matchId}`, 'true');
  };

  const handleDownloadPDF = async () => {
    const hasSub = Boolean(matchData?.has_subscription);
    if (!hasSub) {
      setLockedFeature('ats_report');
      setLockedReason('ATS Compliance & Job-Match Report PDF download requires an active CareerSense AI subscription.');
      setTargetRedirect(window.location.pathname);
      setUpgradeModalOpen(true);
      return;
    }
    try {
      setGeneratingReport(true);
      await jobMatchService.generateReport(matchId);
      const url = jobMatchService.getReportDownloadUrl(matchId);
      window.open(url, '_blank');
    } catch (err) {
      if (err.status === 403 || err.data?.subscription_required) {
        setLockedFeature('ats_report');
        setLockedReason('ATS Compliance & Job-Match Report PDF download requires an active CareerSense AI subscription.');
        setUpgradeModalOpen(true);
      } else {
        alert(err.message || 'Could not generate report.');
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '450px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Job Match Intelligence...</h3>
          <p className="text-secondary text-sm">Evaluating TF-IDF vector matrix &amp; skill taxonomy comparison</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="page-container">
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-4" />
        <Card className="text-center py-5">
          <AlertTriangle size={48} className="text-amber mx-auto mb-3" />
          <h2 className="text-xl font-bold text-dark mb-2">Match Report Unavailable</h2>
          <p className="text-secondary mb-4 max-w-md mx-auto">
            {error || 'The requested job match analysis could not be found or you lack permission to view it.'}
          </p>
          <div className="flex-center gap-3">
            <Button variant="primary" onClick={() => navigate('/job-match')}>
              Run New Job Match
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
    analysis = {},
    target_role = 'Target Role',
    company_name,
    resume = {},
    metrics = {},
    matched_skills = [],
    missing_skills = [],
    partial_matches = [],
    extra_skills = []
  } = matchData;

  const finalScore = Math.round(metrics.overall_match_score || analysis.match_score || 0);
  const skillCoverage = Math.round(metrics.skill_coverage || analysis.skill_coverage || 0);
  const semanticSim = Math.round(metrics.semantic_similarity || analysis.semantic_similarity || 0);

  const getScoreCategory = (val) => {
    if (val >= 90) return { label: 'Excellent Match', color: '#059669', badgeVariant: 'emerald' };
    if (val >= 75) return { label: 'Strong Match', color: '#2563eb', badgeVariant: 'blue' };
    if (val >= 60) return { label: 'Moderate Match', color: '#d97706', badgeVariant: 'amber' };
    if (val >= 40) return { label: 'Low Match', color: '#ea580c', badgeVariant: 'red' };
    return { label: 'Poor Match', color: '#dc2626', badgeVariant: 'red' };
  };

  const category = getScoreCategory(finalScore);

  const totalRequired = metrics.total_required_skills || (matched_skills.length + missing_skills.length + partial_matches.length);

  // Centralized Interview Readiness Decision
  const readiness = matchData.interview_readiness || evaluateReadiness(finalScore, matchData.skill_gaps);
  const isInterviewReady = Boolean(readiness.is_interview_ready ?? readiness.isReady);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Job Match Intelligence</h1>
              <Badge variant="emerald" size="sm">✓ MySQL Verified</Badge>
              <Badge variant="blue" size="sm">Match #{matchId}</Badge>
              <Badge variant={isInterviewReady ? 'emerald' : 'amber'} size="sm">
                {isInterviewReady ? '🎯 Interview Ready' : '⚠️ Skill Improvement Recommended'}
              </Badge>
            </div>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Role: <strong className="text-dark">{target_role}</strong>
              {company_name && <span> • Company: <strong className="text-dark">{company_name}</strong></span>}
              {resume.filename && <span> • Evaluated against: <strong>{resume.filename}</strong></span>}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="md"
              icon={Download}
              loading={generatingReport}
              onClick={handleDownloadPDF}
            >
              Generate Career Report
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={Sparkles}
              onClick={() => setTargetedBuilderOpen(true)}
              style={{
                borderColor: '#2563eb',
                color: '#2563eb',
                fontWeight: 600
              }}
            >
              Build Targeted Resume
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={TrendingUp}
              onClick={() => handleFeatureAccess('skill_gap', `/skill-gap/${matchId}`, 'Skill Gap Analysis & Recommendations requires an active subscription.')}
            >
              View Skill Gap Analysis →
            </Button>

            {/* CONDITIONAL ACTION BUTTON BASED ON INTERVIEW READINESS */}
            {isInterviewReady ? (
              <Button
                variant="primary"
                size="md"
                icon={Video}
                onClick={() => handleFeatureAccess('interview_prep', `/interview-prep/${matchId}`, 'AI-Powered Mock Interview Assessment requires an active subscription.')}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#059669',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                Prepare Your Interview →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={Sparkles}
                onClick={() => handleFeatureAccess('career_roadmap', `/career-roadmap/${matchId}`, 'Personalized Career Roadmap requires an active subscription.')}
              >
                Create My Career Roadmap →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Top Section: Score Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Circular Match Score Gauge */}
        <Card title="How Ready Am I for This Job?" subtitle="CareerSense AI alignment synthesis combining skill coverage & semantic match">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '10px 0' }}>
            {/* Circular Gauge */}
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                border: `9px solid ${category.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '2.4rem', fontWeight: '800', color: category.color, lineHeight: 1 }}>
                {finalScore}%
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>
                MATCH
              </span>
            </div>

            {/* Score Category & Explanation */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Badge variant={category.badgeVariant} size="lg">
                  {category.label}
                </Badge>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                {finalScore >= 75
                  ? `High qualification match for ${target_role}. Your resume reflects significant alignment with required tools and responsibilities.`
                  : finalScore >= 60
                  ? `Moderate alignment for ${target_role}. You have foundational competencies, but closing specific skill gaps will dramatically boost callback rates.`
                  : `Target role requires several key competencies currently absent from your resume. Review your skill gap breakdown below.`}
              </p>

              <button
                type="button"
                onClick={() => setShowFormula(!showFormula)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.8rem',
                  color: '#2563eb',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showFormula ? 'Hide Scoring Formula' : 'View Scoring Formula'}
                {showFormula ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Formula Collapsible Box */}
          {showFormula && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem'
              }}
            >
              <strong style={{ color: '#1e293b' }}>Mathematical Formula:</strong>
              <div style={{ fontFamily: 'monospace', color: '#0f172a', margin: '4px 0' }}>
                Final Score = (Skill Coverage × 0.60) + (TF-IDF Cosine Similarity × 0.40)
              </div>
              <div style={{ color: '#475569' }}>
                = ({skillCoverage}% × 0.60) + ({semanticSim}% × 0.40) = <strong>{finalScore}%</strong>
              </div>
            </div>
          )}
        </Card>

        {/* Card 2: Dual Breakdown Components */}
        <Card title="Score Breakdown Components" subtitle="Mathematical metrics from NLP vector space">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Skill Coverage */}
            <div>
              <div className="flex-between mb-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} className="text-primary" />
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>Skill Coverage (60% Weight)</strong>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb' }}>
                  {skillCoverage}%
                </span>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#64748b' }}>
                {matched_skills.length} matched / {totalRequired} total required competencies in JD
              </p>
              <ProgressBar value={skillCoverage} variant="primary" height={8} />
            </div>

            {/* Semantic Similarity */}
            <div>
              <div className="flex-between mb-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} className="text-emerald" />
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>Semantic Similarity (40% Weight)</strong>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>
                  {semanticSim}%
                </span>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#64748b' }}>
                Cosine similarity across n-gram statistical TF-IDF term vectors
              </p>
              <ProgressBar value={semanticSim} variant="emerald" height={8} />
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Matched</span>
                <strong style={{ fontSize: '1.05rem', color: '#059669' }}>{matched_skills.length}</strong>
              </div>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Partial</span>
                <strong style={{ fontSize: '1.05rem', color: '#d97706' }}>{partial_matches.length}</strong>
              </div>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Missing</span>
                <strong style={{ fontSize: '1.05rem', color: '#dc2626' }}>{missing_skills.length}</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* INTERVIEW READINESS ASSESSMENT CARD */}
      <Card
        className="mb-4"
        style={{
          borderLeft: `6px solid ${isInterviewReady ? '#10b981' : '#f59e0b'}`,
          backgroundColor: isInterviewReady ? 'rgba(16, 185, 129, 0.04)' : 'rgba(245, 158, 11, 0.04)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    AI Interview Readiness Assessment
                  </h3>
                  <Badge variant={isInterviewReady ? 'emerald' : 'amber'} size="md">
                    {isInterviewReady ? '✓ INTERVIEW READY' : '⚠️ SKILL IMPROVEMENT RECOMMENDED'}
                  </Badge>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isInterviewReady
                    ? 'Candidate matches core requirements and qualifies for simulated interview practice.'
                    : `Candidate match score is currently ${finalScore}%. Improving skills to reach the 80% interview readiness threshold is recommended before taking formal mock interviews.`}
                </p>
              </div>
            </div>

            {/* CTA action button inside assessment card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {isInterviewReady ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={Video}
                  onClick={() => handleFeatureAccess('interview_prep', `/interview-prep/${matchId}`, 'Mock Interview Assessment requires an active subscription.')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#059669',
                    color: '#ffffff'
                  }}
                >
                  Prepare Your Interview →
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Sparkles}
                    onClick={() => handleFeatureAccess('career_roadmap', `/career-roadmap/${matchId}`, 'Personalized Career Roadmap requires an active subscription.')}
                  >
                    Create My Career Roadmap →
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    icon={Video}
                    onClick={() => {
                      if (matchData?.has_subscription) {
                        navigate(`/interview-prep/${matchId}`);
                      } else {
                        handleFeatureAccess('interview_prep', `/interview-prep/${matchId}`, 'Candidate has not reached the 80% readiness threshold. Practicing interview early requires an active subscription.');
                      }
                    }}
                    title={matchData?.has_subscription ? "Practice ahead of roadmap completion" : "Active subscription required to practice before 80% threshold"}
                  >
                    Practice Interview Anyway →
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Criteria & Explanation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            {/* Criteria 1: Score vs Threshold */}
            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Match Score vs. Threshold
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: finalScore >= (readiness.threshold || 80) ? '#059669' : '#dc2626' }}>
                  {finalScore}% / {readiness.threshold || 80}% min
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)' }}>
                {finalScore >= (readiness.threshold || 80)
                  ? `✓ Exceeds minimum readiness threshold of ${readiness.threshold || 80}% for ${target_role}.`
                  : `Score is currently ${(readiness.threshold || 80) - finalScore}% below the recommended interview threshold.`}
              </p>
            </div>

            {/* Criteria 2: Critical Core Missing Skills */}
            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Critical Missing Skills
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: (readiness.critical_missing_count || (readiness.criticalGaps || []).length) === 0 ? '#059669' : '#dc2626' }}>
                  {readiness.critical_missing_count || (readiness.criticalGaps || []).length} High-Priority Gaps
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)' }}>
                {(readiness.critical_missing_count || (readiness.criticalGaps || []).length) === 0
                  ? '✓ Zero critical core engineering competencies missing from your profile.'
                  : `${readiness.critical_missing_count || (readiness.criticalGaps || []).length} core requirement(s) should be covered before formal technical rounds.`}
              </p>
            </div>

            {/* Rationale explanation */}
            <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 1' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Pedagogical Recommendation
              </span>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.45 }}>
                {readiness.reason || (isInterviewReady
                  ? 'Your profile reflects sufficient foundation in the target stack. Simulated mock interviews will test your architectural explanation and live articulation.'
                  : 'We recommend focusing on your personalized Career Roadmap modules to establish baseline proficiency before full mock interviews.')}
              </p>
            </div>
          </div>

          {/* List of critical blocking skills if any */}
          {(!isInterviewReady && (readiness.critical_missing_skills || readiness.criticalGaps || []).length > 0) && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                  High-Priority Skills Requiring Remediation:
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(readiness.critical_missing_skills || readiness.criticalGaps || []).map((skillName, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#b91c1c',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    🔴 {skillName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Skill Comparison Visualization */}
      <Card
        title="Resume Skills vs. Required Job Skills Comparison"
        subtitle="Taxonomy-normalized comparison across matched, partial, and missing skills"
        className="mb-4"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. MATCHED SKILLS */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} className="text-emerald" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#166534' }}>
                  MATCHED SKILLS ({matched_skills.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '9999px' }}>
                {Math.round((matched_skills.length / (totalRequired || 1)) * 100)}% Coverage
              </span>
            </div>

            {matched_skills.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>No direct skill matches detected in this job description.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {matched_skills.map((s, idx) => (
                  <span
                    key={s.id || idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#166534',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <span>{s.skill_name}</span>
                    <span style={{ color: '#059669', fontSize: '0.8rem' }}>✓</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. PARTIAL SKILLS */}
          {partial_matches.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', color: '#d97706' }}>◐</span>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>
                    PARTIAL / RELATED SKILLS ({partial_matches.length})
                  </h4>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '9999px' }}>
                  Base skill present, ecosystem variant required
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {partial_matches.map((s, idx) => (
                  <span
                    key={s.id || idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      border: '1px solid #fcd34d',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#92400e',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                    title={s.recommended_improvement || 'Partial match'}
                  >
                    <span>{s.skill_name}</span>
                    <span style={{ color: '#d97706', fontSize: '0.8rem' }}>◐</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. MISSING SKILLS */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} className="text-red" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#991b1b' }}>
                  MISSING SKILLS ({missing_skills.length})
                </h4>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '9999px' }}>
                Critical to Target Role
              </span>
            </div>

            {missing_skills.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>
                Outstanding! No missing required skills were identified in this job requisition.
              </p>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                  Click any missing skill to view why it matters, required topics, and recommended practice projects:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {missing_skills.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type="button"
                      onClick={() => openSkillModal(s)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#991b1b',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#fca5a5';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                      title="Click to view skill details &amp; curriculum"
                    >
                      <span>{s.skill_name}</span>
                      <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>✕</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '2px' }}>ℹ️</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. EXTRA SKILLS */}
          {extra_skills.length > 0 && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                ADDITIONAL CANDIDATE SKILLS ({extra_skills.length} bonus competencies beyond JD requisition)
              </h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {extra_skills.slice(0, 15).map((s, idx) => (
                  <span
                    key={s.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.775rem',
                      color: '#475569'
                    }}
                  >
                    {s.skill_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation CTA Footer Card */}
      <Card className="text-center py-4 mb-4">
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            {isInterviewReady
              ? 'Next Step: Advance to Interactive Mock Interview'
              : 'Next Steps: Bridge Your Skill Gaps with Career Roadmap'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            {isInterviewReady
              ? 'Your resume satisfies the target job requisition. Test your problem-solving under real pressure with 5 tailored AI interview questions and live feedback.'
              : 'Review detailed priority reasons for missing skills, track personalized learning milestones in your Career Roadmap, and generate an executive PDF report.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {isInterviewReady ? (
              <Button
                variant="primary"
                size="lg"
                icon={Video}
                onClick={() => navigate(`/interview-prep/${matchId}`)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#059669',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                Prepare Your Interview →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                onClick={() => navigate(`/career-roadmap/${matchId}`)}
              >
                Create My Career Roadmap →
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              icon={TrendingUp}
              onClick={() => navigate(`/skill-gap/${matchId}`)}
            >
              View Skill Gap Analysis →
            </Button>

            {!isInterviewReady && (
              <Button
                variant="outline"
                size="lg"
                icon={Video}
                onClick={() => navigate(`/interview-prep/${matchId}`)}
                title="Practice mock interview ahead of schedule"
              >
                Practice Interview Anyway →
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              icon={Download}
              loading={generatingReport}
              onClick={handleDownloadPDF}
            >
              Download PDF Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Missing Skill Detail Modal */}
      {selectedSkillModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedSkillModal(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedSkillModal.skill_name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Target Role: <strong>{target_role}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkillModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Status & Priority Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Missing Skill
                </span>
                <span style={{ backgroundColor: selectedSkillModal.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: selectedSkillModal.priority === 'HIGH' ? '#ef4444' : '#f59e0b', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {selectedSkillModal.priority || 'HIGH'} Priority Requisition Requirement
                </span>
              </div>

              {/* Why It Matters */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Why This Skill Matters:
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5, background: 'var(--card-subtle-bg)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {selectedSkillModal.why_it_matters}
                </p>
              </div>

              {/* Key Topics to Learn */}
              {selectedSkillModal.topics && selectedSkillModal.topics.length > 0 && (
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    Key Topics to Learn:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedSkillModal.topics.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--card-subtle-bg)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        • {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Hands-on Project */}
              {selectedSkillModal.practice_project && (
                <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px' }}>
                    🛠️ Recommended Hands-on Practice Project:
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {selectedSkillModal.practice_project}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="md" onClick={() => setSelectedSkillModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Sparkles}
                onClick={() => {
                  setSelectedSkillModal(null);
                  handleFeatureAccess('career_roadmap', `/career-roadmap/${matchId}`, 'Personalized Career Roadmap requires an active subscription.');
                }}
              >
                Add to My Roadmap →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student-Friendly AI Resume Improvement Popup */}
      {showImprovePopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            padding: '1.25rem'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.2))',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary, #2563eb)'
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Your Resume Can Be Improved!
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 700 }}>
                  Current Match: {finalScore}% (Target: 80%+)
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #475569)', lineHeight: 1.5, marginBottom: '16px' }}>
              Your current resume scored <strong>{finalScore}%</strong> for <strong>{target_role}</strong>.
              CareerSense AI detected {missing_skills.length} missing skill alignments that can be tailored into an
              ATS-optimized format without inventing false credentials.
            </p>

            <div style={{ background: 'var(--card-subtle-bg, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px', padding: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '4px' }}>
                🛡️ Ethical ATS Optimization:
              </div>
              <div style={{ color: 'var(--text-muted, #64748b)' }}>
                Real experience preserved. Missing skills placed transparently under <em>"Competencies in Progress"</em>.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                icon={Sparkles}
                onClick={handleOpenImprovementBuilder}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Improve My Resume →
              </Button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Button
                  variant="outline"
                  icon={TrendingUp}
                  onClick={() => {
                    handleDismissImprovePopup();
                    handleFeatureAccess('skill_gap', `/skill-gap/${matchId}`, 'Skill Gap Analysis & Recommendations requires an active subscription.');
                  }}
                  style={{ justifyContent: 'center' }}
                >
                  View Skill Gaps
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismissImprovePopup}
                  style={{ justifyContent: 'center', color: '#64748b' }}
                >
                  Not Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Targeted Resume Builder Modal */}
      <TargetedResumeBuilderModal
        isOpen={targetedBuilderOpen}
        onClose={() => setTargetedBuilderOpen(false)}
        initialData={{
          resumeId: resume?.id || matchData?.resume?.id || matchData?.analysis?.resume_id,
          targetRole: target_role,
          companyName: company_name,
          jobDescription: matchData?.job_description_text || matchData?.job_description?.description || '',
          analysisId: matchId
        }}
      />

      {/* Upgrade Subscription Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName={lockedFeature}
        reasonMessage={lockedReason}
        onSuccessRedirect={targetRedirect}
      />
    </div>
  );
}
