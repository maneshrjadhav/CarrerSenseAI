import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, Check, AlertCircle, Sparkles, ArrowRight, Clock } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import analysisService from '../services/analysisService';

export default function Matches() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadMatches() {
      try {
        setLoading(true);
        const res = await analysisService.getAnalysisHistory();
        if (mounted && res.success) {
          setMatches(res.history || []);
        }
      } catch (err) {
        // Fallback to empty
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMatches();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMatches = matches.filter((m) =>
    (m.target_role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container flex-center min-h-400">
        <div className="text-center">
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Evaluated Job Matches...</h3>
          <p className="text-secondary text-sm">Querying verified TF-IDF alignment scores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <span className="badge-pill-cyan font-mono text-xs">TF-IDF &amp; COSINE ALIGNMENT</span>
          <h1 className="page-title mt-1">Job Matches &amp; Alignment</h1>
          <p className="page-subtitle">Cosine similarity and skill coverage rankings derived from real screening runs.</p>
        </div>
        <Button variant="primary" icon={Sparkles} onClick={() => navigate('/job-match')}>
          Analyze New Job Requisition
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card className="empty-state-card text-center p-8 mt-4">
          <div className="empty-state-icon mx-auto mb-3">
            <Briefcase size={44} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No Job Matches Evaluated Yet</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm">
            Job match rankings require an uploaded resume and a benchmark job description. Compare your resume against any job requisition to calculate your alignment score.
          </p>
          <Button variant="primary" icon={Sparkles} onClick={() => navigate('/job-match')}>
            Analyze Resume against a Job Requisition →
          </Button>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <div className="filter-controls-row mb-4">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search evaluated job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="job-cards-list space-y-4">
            {filteredMatches.map((job) => (
              <Card key={job.id} className="job-detailed-card hover-lift">
                <div className="job-card-top-row flex-between flex-wrap gap-3">
                  <div>
                    <h3 className="job-card-title text-base font-bold text-dark">{job.target_role}</h3>
                    <span className="job-card-meta text-xs text-muted">
                      Resume: {job.resume_filename} • Evaluated on {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="job-score-badge-wrap flex-items-center gap-2">
                    <span className="match-big-percent text-xl font-extrabold text-primary">{job.match_score}%</span>
                    <Badge variant={job.match_score >= 70 ? 'emerald' : job.match_score >= 40 ? 'blue' : 'amber'}>
                      {job.match_score >= 70 ? 'High Match' : 'Alignment Evaluated'}
                    </Badge>
                  </div>
                </div>

                <ProgressBar
                  value={job.match_score}
                  variant={job.match_score >= 70 ? 'emerald' : job.match_score >= 40 ? 'blue' : 'amber'}
                  height={6}
                  className="my-3"
                />

                <div className="job-skills-split flex-between pt-2">
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald font-semibold">
                      ✓ {job.matched_skills_count} Matched Skills
                    </span>
                    <span className="text-rose font-semibold">
                      ✕ {job.missing_skills_count} Missing Gaps
                    </span>
                    <span className="text-secondary">
                      Coverage: {job.skill_coverage}% • Semantic: {job.semantic_similarity}%
                    </span>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => navigate(`/analysis/${job.id}`)}
                  >
                    View Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
