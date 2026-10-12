import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  RefreshCw,
  User,
  Mail,
  Phone,
  Briefcase,
  Code2,
  Database,
  Wrench,
  BookOpen,
  ChevronRight,
  Download
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import analysisService from '../services/analysisService';
import { useToast } from '../context/ToastContext';
import UpgradeModal from '../components/subscription/UpgradeModal';

export default function ResumeAnalysisResult() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleDownloadAtsReport = async () => {
    if (!resumeId) return;
    setDownloadingReport(true);
    try {
      toast.info('Generating your verified ATS Evaluation Report PDF...');
      const res = await analysisService.generateAtsReport(resumeId);
      if (res.success && res.download_url) {
        toast.success('ATS Evaluation Report generated! Downloading...');
        const dlUrl = analysisService.getAtsReportDownloadUrl(resumeId);
        window.open(dlUrl, '_blank');
      } else {
        toast.error(res.message || 'Could not generate report.');
      }
    } catch (err) {
      if (err.status === 403 || err.data?.subscription_required) {
        setUpgradeModalOpen(true);
      } else {
        toast.error(err.message || 'Failed to download ATS report.');
      }
    } finally {
      setDownloadingReport(false);
    }
  };

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  useEffect(() => {
    let mounted = true;
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError('');
        const res = await analysisService.getResumeAnalysis(resumeId);
        if (mounted) {
          if (res.success) {
            setData(res);
          } else {
            setError(res.message || 'Failed to load resume analysis.');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Failed to load resume analysis report.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (resumeId) {
      loadAnalysis();
    }
    return () => {
      mounted = false;
    };
  }, [resumeId]);

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '450px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Resume Intelligence Report...</h3>
          <p className="text-secondary text-sm">Retrieving verified quality metrics from MySQL</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <BackButton to="/analyze" label="Back to Analyzer" className="mb-4" />
        <Card className="text-center py-5">
          <AlertTriangle size={48} className="text-amber mx-auto mb-3" />
          <h2 className="text-xl font-bold text-dark mb-2">Report Unavailable</h2>
          <p className="text-secondary mb-4 max-w-md mx-auto">
            {error || 'The requested resume analysis report could not be found or has expired.'}
          </p>
          <div className="flex-center gap-3">
            <Button variant="primary" onClick={() => navigate('/analyze')}>
              Upload New Resume
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
    resume = {},
    analysis = {},
    candidate_profile = {},
    metrics = {},
    skills = [],
    skills_by_category = {},
    sections = [],
    strengths = [],
    suggestions = []
  } = data;

  const score = Math.round(metrics.quality_score || analysis.quality_score || 0);

  const getScoreRating = (val) => {
    if (val >= 85) return { label: 'Strong Profile', badgeVariant: 'emerald', color: '#059669' };
    if (val >= 70) return { label: 'Good Profile', badgeVariant: 'blue', color: '#2563eb' };
    if (val >= 50) return { label: 'Moderate Quality', badgeVariant: 'amber', color: '#d97706' };
    return { label: 'Needs Improvement', badgeVariant: 'red', color: '#dc2626' };
  };

  const rating = getScoreRating(score);

  const getCategoryIcon = (catName) => {
    const lower = catName.toLowerCase();
    if (lower.includes('language')) return <Code2 size={16} className="text-primary" />;
    if (lower.includes('database')) return <Database size={16} className="text-emerald" />;
    if (lower.includes('framework')) return <Layers size={16} className="text-purple" />;
    return <Wrench size={16} className="text-amber" />;
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <BackButton to="/analyze" label="Back to Resume Analyzer" className="mb-3" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Resume Intelligence Report</h1>
              <Badge variant="emerald" size="sm">✓ MySQL Verified</Badge>
              <Badge variant="blue" size="sm">ID #{resume.id}</Badge>
            </div>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Evaluated: <strong>{resume.filename}</strong> • Complete ATS structure, skill taxonomy, and content depth analysis.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="md"
              icon={Download}
              loading={downloadingReport}
              disabled={downloadingReport}
              onClick={handleDownloadAtsReport}
            >
              Download ATS Report (PDF)
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={() => navigate('/analyze')}
            >
              Re-analyze Resume
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={TrendingUp}
              onClick={() => navigate('/career-roadmap')}
            >
              Career Roadmap
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={() => navigate(resume.id ? `/job-match/${resume.id}` : '/job-match')}
            >
              Run Job Description Match →
            </Button>
          </div>
        </div>
      </div>

      {/* Top Grid: Quality Score + Candidate Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Resume Quality Score */}
        <Card title="Resume Quality Score" subtitle="Independent ATS and formatting audit">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', padding: '10px 0' }}>
            {/* Score Ring / Gauge */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: `8px solid ${rating.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--card-subtle-bg)',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '2.1rem', fontWeight: '800', color: rating.color, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                / 100
              </span>
            </div>

            {/* Score Details */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Badge variant={rating.badgeVariant} size="lg">
                  {rating.label}
                </Badge>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                {score >= 80
                  ? 'Your resume demonstrates high section completeness, strong technical terminology, and clean ATS parseability.'
                  : score >= 60
                  ? 'Good foundation with readable structure. Incorporating more quantifiable achievements will boost your ATS rank.'
                  : 'Key sections or technical skill density can be expanded to pass modern applicant tracking systems.'}
              </p>

              {/* Sub-metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.825rem' }}>
                <div style={{ background: 'var(--card-subtle-bg)', border: '1px solid var(--border-color)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Word Count</div>
                  <strong style={{ color: 'var(--text-main)' }}>{metrics.word_count || 0} words</strong>
                </div>
                <div style={{ background: 'var(--card-subtle-bg)', border: '1px solid var(--border-color)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reading Time</div>
                  <strong style={{ color: 'var(--text-main)' }}>{metrics.reading_time_minutes || 1} min</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Extracted Candidate Profile */}
        <Card title="Candidate Profile" subtitle="Information parsed from your document">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '6px' }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Candidate Name</div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {candidate_profile.name || 'Not detected'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--emerald-light)', color: 'var(--emerald)', padding: '8px', borderRadius: '6px' }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>
                  {candidate_profile.email || 'Not detected'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--amber-light)', color: 'var(--amber)', padding: '8px', borderRadius: '6px' }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Phone</div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>
                  {candidate_profile.phone || 'Not detected'}
                </span>
              </div>
            </div>

            {candidate_profile.summary && (
              <div style={{ marginTop: '4px', background: 'var(--card-subtle-bg)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>
                  Professional Summary Snippet
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
                  {candidate_profile.summary}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detected Skills by Category */}
      <Card
        title={`Detected Skills (${skills.length})`}
        subtitle="Taxonomy-normalized technical & domain competencies extracted from resume"
        className="mb-4"
      >
        {Object.keys(skills_by_category).length === 0 ? (
          <p className="text-secondary text-sm">No specific skills were extracted from this document.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(skills_by_category).map(([category, catSkills]) => {
              const isExpanded = !!expandedCategories[category];
              const visibleSkills = isExpanded ? catSkills : catSkills.slice(0, 8);
              const hasMore = catSkills.length > 8;

              return (
                <div key={category} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getCategoryIcon(category)}
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        {category}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--card-subtle-bg)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '4px' }}>
                        {catSkills.length}
                      </span>
                    </div>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpansion(category)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '2px 6px'
                        }}
                      >
                        {isExpanded ? 'Show Less' : `+${catSkills.length - 8} More`}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {visibleSkills.map((sk) => (
                      <span
                        key={sk.id || sk.skill_name}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--card-subtle-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.825rem',
                          fontWeight: '500',
                          color: 'var(--text-main)',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                        title={sk.evidence_text ? `Evidence: ${sk.evidence_text}` : sk.skill_name}
                      >
                        <span>{sk.skill_name}</span>
                        {sk.confidence && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: '600' }}>
                            ✓
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Two Column Grid: Strengths & Improvement Suggestions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Strengths Card */}
        <Card
          title={`Resume Strengths (${strengths.length})`}
          subtitle="Identified advantages and competitive highlights"
        >
          {strengths.length === 0 ? (
            <p className="text-secondary text-sm">No specific strengths cataloged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {strengths.map((st, i) => (
                <div
                  key={st.id || i}
                  style={{
                    backgroundColor: 'var(--emerald-light)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <CheckCircle2 size={18} className="text-emerald" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <h5 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--emerald)' }}>
                      {st.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
                      {st.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Suggestions Card */}
        <Card
          title={`Improvement Suggestions (${suggestions.length})`}
          subtitle="Actionable steps to raise your ATS score and interview callback rate"
        >
          {suggestions.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--emerald-light)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '8px',
                padding: '20px 16px',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.2)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--emerald)' }}>
                Your resume looks strong!
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
                Our ATS parser found comprehensive sections, clear technical keywords, and strong profile attributes. Ready to match against targeted job postings!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {suggestions.map((sg, i) => (
                <div
                  key={sg.id || i}
                  style={{
                    backgroundColor: 'var(--amber-light)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} className="text-amber" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--amber)' }}>
                        {sg.title}
                      </h5>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          backgroundColor: sg.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: sg.priority === 'HIGH' ? 'var(--danger)' : 'var(--amber)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {sg.priority || 'MEDIUM'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
                      {sg.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Detected Resume Sections */}
      <Card
        title={`Detected Resume Sections (${sections.length})`}
        subtitle="Structural layout detected by NLP segmentation"
        className="mb-4"
      >
        {sections.length === 0 ? (
          <p className="text-secondary text-sm">No distinct section headers detected.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {sections.map((sec) => (
              <div
                key={sec.id || sec.section_name}
                style={{
                  backgroundColor: 'var(--card-subtle-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {sec.section_name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1px 6px', borderRadius: '4px' }}>
                    {sec.word_count || 0} words
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--text-sub)',
                    lineHeight: '1.4',
                    maxHeight: '75px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {sec.section_content ? sec.section_content.slice(0, 150) + '...' : 'Content present'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bottom Action Card */}
      <Card className="text-center py-4">
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            Next Steps in Your Career Preparation
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Compare your newly analyzed resume against live job descriptions or explore your customized engineering roadmap.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={() => navigate(resume.id ? `/job-match/${resume.id}` : '/job-match')}
            >
              Run Job Description Match →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={TrendingUp}
              onClick={() => navigate('/career-roadmap')}
            >
              View Career Roadmap
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={RefreshCw}
              onClick={() => navigate('/analyze')}
            >
              Upload Another Resume
            </Button>
          </div>
        </div>
      </Card>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="ats_report"
        reasonMessage="ATS Evaluation Report generation and PDF download is a premium feature. Please choose a subscription plan to download your official ATS report."
        onSuccessRedirect={window.location.pathname}
      />
    </div>
  );
}

