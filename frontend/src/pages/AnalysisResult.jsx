import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  ExternalLink,
  RefreshCw,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import analysisService from '../services/analysisService';

export default function AnalysisResult() {
  const { analysisId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState('');
  const [showFormula, setShowFormula] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError('');
        const data = await analysisService.getAnalysisDetail(analysisId);
        if (mounted) {
          if (data.success) {
            setAnalysisData(data);
          } else {
            setError(data.message || 'Failed to load analysis details.');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Failed to retrieve analysis.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (analysisId) {
      loadAnalysis();
    }
    return () => {
      mounted = false;
    };
  }, [analysisId]);

  const handleDownloadPDF = async () => {
    try {
      setGeneratingReport(true);
      await analysisService.generateReport(analysisId);
      setReportSuccess(true);
      // Trigger browser download
      const downloadUrl = analysisService.getDownloadUrl(analysisId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert(err.message || 'Could not generate report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center min-h-400">
        <div className="text-center">
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Career Intelligence Report...</h3>
          <p className="text-secondary text-sm">Retrieving real MySQL verification data</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="page-container">
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-4" />
        <Card className="text-center p-8">
          <AlertTriangle size={48} className="text-amber mx-auto mb-3" />
          <h2 className="text-xl font-bold text-dark mb-2">Analysis Unavailable</h2>
          <p className="text-secondary max-w-md mx-auto mb-6">
            {error || 'The requested analysis record could not be found or you do not have permission to view it.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/resume-analyzer')}>
            Start New Analysis
          </Button>
        </Card>
      </div>
    );
  }

  const { analysis, metrics, matched_skills, missing_skills, skill_gaps, partial_matches, extra_skills, roadmap } = analysisData;
  const matchScore = metrics.overall_match_score || 0;
  const skillCoverage = metrics.skill_coverage || 0;
  const semanticSim = metrics.semantic_similarity || 0;
  const totalReq = metrics.total_required_skills || 0;
  const matchedCount = metrics.matched_skills_count || 0;
  const missingCount = metrics.missing_skills_count || 0;

  // Format date
  const formattedDate = analysis.created_at
    ? new Date(analysis.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recently';

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="analysis-report-header mb-6">
        <div>
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-2" />
          <div className="flex-items-center gap-2">
            <span className="badge-pill-cyan font-mono text-xs">RESUME INTELLIGENCE REPORT</span>
            <span className="text-xs text-muted">ID: #{analysis.id}</span>
          </div>
          <h1 className="report-main-title mt-1">{analysis.target_role}</h1>
          <div className="report-meta-strip mt-2">
            <span className="meta-strip-item">
              <User size={14} className="text-primary" /> {analysis.candidate_name || 'Candidate'}
            </span>
            <span className="meta-strip-item">
              <Calendar size={14} className="text-primary" /> {formattedDate}
            </span>
            <span className="meta-strip-item">
              <Briefcase size={14} className="text-primary" /> Verified Requisition Match
            </span>
          </div>
        </div>

        <div className="report-header-actions">
          <Button
            variant="primary"
            icon={Download}
            loading={generatingReport}
            onClick={handleDownloadPDF}
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* 1. Primary Match Score Hero Card */}
      <Card className="match-score-hero-card mb-6">
        <div className="score-hero-layout">
          {/* Circular Visual Gauge */}
          <div className="score-circular-wrapper">
            <div className="score-radial-meter">
              <svg className="radial-svg" viewBox="0 0 120 120">
                <circle className="radial-bg" cx="60" cy="60" r="50" />
                <circle
                  className="radial-progress"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: 314,
                    strokeDashoffset: 314 - (314 * Math.min(100, Math.max(0, matchScore))) / 100
                  }}
                />
              </svg>
              <div className="score-radial-center">
                <span className="score-huge-num">{matchScore}%</span>
                <span className="score-label-text">MATCH SCORE</span>
              </div>
            </div>
            <span className="score-quick-verdict text-center mt-2">
              {matchedCount} / {totalReq} required skills matched
            </span>
          </div>

          {/* Metric Pillars */}
          <div className="score-pillars-column">
            <div className="pillars-grid">
              <div className="pillar-metric-box">
                <span className="pillar-label">SKILL COVERAGE</span>
                <span className="pillar-val text-primary">{skillCoverage}%</span>
                <span className="pillar-sub">{matchedCount} of {totalReq} required skills</span>
              </div>

              <div className="pillar-metric-box">
                <span className="pillar-label">SEMANTIC SIMILARITY</span>
                <span className="pillar-val text-indigo">{semanticSim}%</span>
                <span className="pillar-sub">TF-IDF Vector Cosine Alignment</span>
              </div>

              <div className="pillar-metric-box">
                <span className="pillar-label">SKILL GAPS</span>
                <span className="pillar-val text-rose">{missingCount}</span>
                <span className="pillar-sub">Actionable roadmap targets</span>
              </div>

              <div className="pillar-metric-box">
                <span className="pillar-label">EXTRA COMPETENCIES</span>
                <span className="pillar-val text-emerald">{extra_skills?.length || 0}</span>
                <span className="pillar-sub">Value-add technical assets</span>
              </div>
            </div>

            {/* Methodology Explainer Toggle */}
            <div className="formula-toggle-wrap mt-4">
              <button
                type="button"
                className="formula-toggle-btn"
                onClick={() => setShowFormula(!showFormula)}
              >
                <HelpCircle size={15} />
                <span>How was this score calculated?</span>
                {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showFormula && (
                <div className="formula-details-box mt-3 animate-fade-in">
                  <p className="font-semibold text-dark text-sm mb-1">Scoring Methodology &amp; Mathematical Formulation:</p>
                  <p className="text-xs text-secondary mb-2">
                    Our scoring engine computes an un-doctored, weighted combination of exact technical coverage and TF-IDF high-dimensional cosine semantic alignment:
                  </p>
                  <div className="code-formula-box">
                    <code>
                      Match Score = (60% × Skill Coverage) + (40% × TF-IDF Semantic Similarity)<br />
                      = (0.60 × {skillCoverage}%) + (0.40 × {semanticSim}%) = {matchScore}%
                    </code>
                  </div>
                  <p className="text-xs text-secondary mt-2">
                    Weights configured dynamically in backend settings: 60% Required Skill Weight, 40% Natural Language Term Frequency Vector Weight.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Visual Skill Gap Proportion Bar */}
      <Card title="Skill Alignment Visual Distribution" subtitle="Required vs Detected Competency Ratio" className="mb-6">
        <div className="skill-distribution-bar-wrap">
          <div className="bar-labels-top flex-between text-xs font-semibold mb-2">
            <span className="text-emerald">Matched Skills ({matchedCount})</span>
            <span className="text-rose">Missing Gaps ({missingCount})</span>
          </div>
          <div className="multi-segmented-bar">
            <div
              className="segment-fill seg-matched"
              style={{ width: `${totalReq > 0 ? (matchedCount / totalReq) * 100 : 50}%` }}
              title={`Matched: ${matchedCount}`}
            ></div>
            <div
              className="segment-fill seg-missing"
              style={{ width: `${totalReq > 0 ? (missingCount / totalReq) * 100 : 50}%` }}
              title={`Missing: ${missingCount}`}
            ></div>
          </div>
          <div className="bar-legend-footer flex-center gap-6 mt-3 text-xs text-secondary">
            <span className="legend-item"><span className="legend-dot bg-emerald"></span> Matched ({matchedCount})</span>
            <span className="legend-item"><span className="legend-dot bg-rose"></span> Missing Required Gaps ({missingCount})</span>
            <span className="legend-item"><span className="legend-dot bg-indigo"></span> Extra Competencies ({extra_skills?.length || 0})</span>
          </div>
        </div>
      </Card>

      {/* 3. Skill Gaps (Missing Skills) - HIGHLIGHTED AS VERY IMPORTANT */}
      <div className="section-block mb-6" id="skill-gaps-section">
        <div className="section-header-row mb-4">
          <div>
            <h2 className="section-title text-rose flex-items-center gap-2">
              <AlertTriangle size={22} />
              Your Skill Gaps ({missing_skills?.length || 0})
            </h2>
            <p className="section-subtitle">
              These skills are required or preferred by the selected job description but were not sufficiently detected in your resume.
            </p>
          </div>
          {roadmap && (
            <Link to="/career-roadmap" className="btn-secondary-sm">
              View in Roadmap →
            </Link>
          )}
        </div>

        {missing_skills && missing_skills.length > 0 ? (
          <div className="skill-gaps-grid">
            {missing_skills.map((gap) => (
              <div key={gap.skill_name} className={`skill-gap-card prio-${gap.priority?.toLowerCase() || 'medium'}`}>
                <div className="gap-card-top flex-between">
                  <h3 className="gap-skill-name font-bold text-base text-dark">✕ {gap.skill_name}</h3>
                  <Badge
                    variant={gap.priority === 'HIGH' ? 'rose' : gap.priority === 'MEDIUM' ? 'amber' : 'gray'}
                    size="sm"
                  >
                    {gap.priority} PRIORITY
                  </Badge>
                </div>

                <div className="gap-card-meta mt-2">
                  <span className="gap-meta-category">{gap.category || 'Technical'}</span>
                  <span className="gap-meta-duration">
                    <Clock size={12} className="inline mr-1" /> {gap.estimated_learning_duration || '2–3 weeks'}
                  </span>
                </div>

                <p className="gap-reason-text mt-3">
                  {gap.reason || 'Required by requisition specifications; not detected in candidate profile.'}
                </p>

                <div className="gap-card-footer mt-4 pt-3 flex-between">
                  <span className="gap-status-label">Status: <b>Not Detected</b></span>
                  <Link to="/career-roadmap" className="gap-roadmap-link">
                    View Roadmap →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center p-6">
            <CheckCircle2 size={36} className="text-emerald mx-auto mb-2" />
            <h4 className="font-semibold text-dark">Zero Skill Gaps Detected!</h4>
            <p className="text-sm text-secondary">Your resume encompasses every requested competency in this requisition.</p>
          </Card>
        )}
      </div>

      {/* 4. Matched Skills Section */}
      <div className="section-block mb-6">
        <div className="section-header-row mb-4">
          <div>
            <h2 className="section-title text-emerald flex-items-center gap-2">
              <CheckCircle2 size={22} />
              Verified Matched Skills ({matched_skills?.length || 0})
            </h2>
            <p className="section-subtitle">
              Competencies directly matched against the job requisition with textual proof extracted from your resume.
            </p>
          </div>
        </div>

        {matched_skills && matched_skills.length > 0 ? (
          <div className="matched-skills-grid">
            {matched_skills.map((skill) => (
              <div key={skill.skill_name} className="matched-skill-card">
                <div className="matched-card-top flex-between">
                  <div className="flex-items-center gap-2">
                    <span className="text-emerald font-bold">✓</span>
                    <strong className="matched-skill-title">{skill.skill_name}</strong>
                  </div>
                  <Badge variant="emerald" size="sm">
                    {Math.round(skill.confidence * 100)}% Confidence
                  </Badge>
                </div>

                <span className="skill-cat-pill mt-2">{skill.category}</span>

                <div className="skill-evidence-box mt-3">
                  <span className="evidence-label">Resume Evidence:</span>
                  <p className="evidence-quote">"{skill.evidence_text || `Demonstrated competency in ${skill.skill_name}`}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center p-6">
            <p className="text-sm text-secondary">No exact matches identified. Review required skills to align your resume.</p>
          </Card>
        )}
      </div>

      {/* 5. Partial Matches & Extra Competencies */}
      <div className="grid-split-2 mb-6">
        {/* Partial Matches */}
        <Card title="Partial Skill Evidence" subtitle="Base competency found with ecosystem extension needed">
          {partial_matches && partial_matches.length > 0 ? (
            <div className="space-y-3">
              {partial_matches.map((p, idx) => (
                <div key={idx} className="partial-skill-item">
                  <div className="flex-between">
                    <strong>{p.skill_name}</strong>
                    <Badge variant="blue" size="sm">Partial Match</Badge>
                  </div>
                  <p className="text-xs text-secondary mt-1">{p.recommended_improvement}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary py-3">No partial ambiguity detected; skill matches are cleanly segregated.</p>
          )}
        </Card>

        {/* Extra Candidate Skills */}
        <Card title="Extra Resume Competencies" subtitle="Valuable skills detected beyond JD baseline">
          {extra_skills && extra_skills.length > 0 ? (
            <div className="chips-flow-wrap">
              {extra_skills.map((ex) => (
                <span key={ex.skill_name} className="mini-chip chip-cyan" title={ex.category}>
                  {ex.skill_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-secondary py-3">No extraneous skills detected outside JD parameters.</p>
          )}
        </Card>
      </div>

      {/* 6. Personalized Roadmap Integration Card */}
      {roadmap && (
        <Card
          title="Generated Personalized Career Roadmap"
          subtitle={`Customized ${roadmap.total_duration_weeks}-week progression sequence built to resolve identified skill gaps`}
          className="roadmap-integration-card mb-6"
        >
          <div className="roadmap-preview-flow">
            <div className="roadmap-mini-steps">
              {roadmap.items?.map((item, idx) => (
                <div key={item.id || idx} className="mini-phase-badge">
                  <span className="phase-num">Phase {item.phase_number}</span>
                  <span className="phase-name">{item.skill_name}</span>
                  <span className="phase-dur">{item.duration_weeks}</span>
                </div>
              ))}
            </div>

            <div className="roadmap-cta-banner mt-6 flex-between">
              <div>
                <h4 className="font-semibold text-dark">Track Your Learning Roadmap</h4>
                <p className="text-xs text-secondary">
                  Complete hands-on practice projects, update milestone progress, and build portfolio assets.
                </p>
              </div>
              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={() => navigate('/career-roadmap')}
              >
                Open Full Career Roadmap
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Download Actions */}
      <div className="report-bottom-cta-strip text-center py-6">
        <h3 className="font-bold text-lg text-dark mb-2">Need an offline copy for reference or interview prep?</h3>
        <p className="text-sm text-secondary mb-4">
          Download the official verified PDF analysis report with executive score breakdowns and roadmap checkpoints.
        </p>
        <Button
          variant="primary"
          size="lg"
          icon={Download}
          loading={generatingReport}
          onClick={handleDownloadPDF}
        >
          Download PDF Report
        </Button>
      </div>
    </div>
  );
}

