import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import dashboardService from '../services/dashboardService';
import analysisService from '../services/analysisService';

export default function Skills() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadLatestSkills() {
      try {
        setLoading(true);
        const dash = await dashboardService.getDashboardSummary();
        if (dash.metrics?.latest_analysis_id) {
          const detail = await analysisService.getAnalysisDetail(dash.metrics.latest_analysis_id);
          if (mounted && detail.success) {
            setAnalysisData(detail);
          }
        }
      } catch (err) {
        // Fallback to empty state
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLatestSkills();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container flex-center min-h-400">
        <div className="text-center">
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Skill Gap Intelligence...</h3>
          <p className="text-secondary text-sm">Evaluating real category competencies</p>
        </div>
      </div>
    );
  }

  // Honest Empty State: No Fake Data
  if (!analysisData || !analysisData.analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Skill Gap Analysis</h1>
            <p className="page-subtitle">Granular evaluation of competencies across domain technology stacks.</p>
          </div>
        </div>

        <Card className="empty-state-card text-center p-8 mt-4">
          <div className="empty-state-icon mx-auto mb-3">
            <Layers size={44} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No Skill Gap Analysis Available</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm">
            Skill gap detection requires an uploaded resume and a benchmark job description. Upload your resume and paste a job description to screen your profile against target requisitions.
          </p>
          <Button variant="primary" icon={Sparkles} onClick={() => navigate('/resume-analyzer')}>
            Analyze Resume &amp; Detect Skill Gaps →
          </Button>
        </Card>
      </div>
    );
  }

  const { analysis, matched_skills = [], missing_skills = [], skill_gaps = [] } = analysisData;

  // Group by category
  const categoriesMap = {};
  matched_skills.forEach((s) => {
    const cat = s.category || 'Other';
    if (!categoriesMap[cat]) categoriesMap[cat] = { matched: [], missing: [] };
    categoriesMap[cat].matched.push(s.skill_name);
  });
  missing_skills.forEach((s) => {
    const cat = s.category || 'Other';
    if (!categoriesMap[cat]) categoriesMap[cat] = { matched: [], missing: [] };
    categoriesMap[cat].missing.push(s.skill_name);
  });

  const categories = Object.keys(categoriesMap).map((catName) => {
    const cat = categoriesMap[catName];
    const total = cat.matched.length + cat.missing.length;
    const score = total > 0 ? Math.round((cat.matched.length / total) * 100) : 0;
    return {
      name: catName,
      score,
      matched: cat.matched,
      missing: cat.missing,
      variant: score >= 70 ? 'emerald' : score >= 40 ? 'blue' : 'amber'
    };
  });

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <span className="badge-pill-cyan font-mono text-xs">GRANULAR COMPETENCY BENCHMARK</span>
          <h1 className="page-title mt-1">Skill Gap Analysis: {analysis.target_role}</h1>
          <p className="page-subtitle">Technical alignment breakdown derived from your latest resume screening.</p>
        </div>
        <Button variant="secondary" icon={Sparkles} onClick={() => navigate('/resume-analyzer')}>
          New Analysis
        </Button>
      </div>

      {/* Top Banner Card */}
      <Card className="skill-readiness-banner mb-6">
        <div className="readiness-banner-content flex-between flex-wrap gap-4">
          <div>
            <span className="banner-kicker">OVERALL PROFILE READINESS</span>
            <div className="readiness-big-display flex-items-center gap-3 mt-1">
              <span className="readiness-huge-num text-3xl font-extrabold text-primary">{analysis.match_score}%</span>
              <Badge variant={analysis.match_score >= 70 ? 'emerald' : 'amber'} size="md">
                {analysis.match_score >= 70 ? 'Industry Ready Profile' : 'Skill Gaps Detected'}
              </Badge>
            </div>
            <p className="banner-desc-text text-sm text-secondary mt-2">
              You possess {matched_skills.length} of the {matched_skills.length + missing_skills.length} competencies requested for {analysis.target_role}.
            </p>
          </div>
          <div className="banner-quick-stats flex gap-6">
            <div className="q-stat">
              <strong className="text-2xl text-emerald">{matched_skills.length}</strong>
              <span className="block text-xs text-muted uppercase">Matched Skills</span>
            </div>
            <div className="q-stat">
              <strong className="text-2xl text-rose">{missing_skills.length}</strong>
              <span className="block text-xs text-muted uppercase">Target Gaps</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Categories Grid */}
      <div className="category-cards-grid">
        {categories.map((cat) => (
          <Card key={cat.name} title={cat.name} className="category-skill-card mb-4">
            <div className="cat-header-row flex-between mb-2">
              <span className="cat-score-text font-bold text-sm">{cat.score}% Coverage</span>
            </div>
            <ProgressBar value={cat.score} variant={cat.variant} height={6} />

            <div className="cat-skills-lists mt-4 space-y-3">
              {cat.matched.length > 0 && (
                <div className="cat-sublist">
                  <span className="cat-list-tag text-emerald text-xs font-semibold flex-items-center gap-1 mb-1">
                    <CheckCircle2 size={13} /> Matched ({cat.matched.length})
                  </span>
                  <div className="chips-flow-wrap">
                    {cat.matched.map((s) => (
                      <span key={s} className="mini-chip chip-green">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {cat.missing.length > 0 && (
                <div className="cat-sublist">
                  <span className="cat-list-tag text-rose text-xs font-semibold flex-items-center gap-1 mb-1">
                    <AlertCircle size={13} /> Missing Gaps ({cat.missing.length})
                  </span>
                  <div className="chips-flow-wrap">
                    {cat.missing.map((s) => (
                      <span key={s} className="mini-chip chip-amber">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
