import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function CareerReadiness({ score = null, analysisId = null, targetRole = null }) {
  const navigate = useNavigate();
  const isAnalyzed = score !== null && score !== undefined;

  return (
    <div className="dashboard-card career-readiness-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">BENCHMARK</span>
          <h2 className="card-title">Career Readiness</h2>
        </div>
        <span className={`status-pill ${isAnalyzed ? (score >= 70 ? 'status-pill-emerald' : 'status-pill-blue') : 'status-pill-neutral'}`}>
          {isAnalyzed ? `${score}% Ready` : 'Not Analyzed'}
        </span>
      </div>

      <div className="readiness-gauge-body">
        <div className="gauge-circle-outer">
          <div className="gauge-circle-inner">
            <Gauge size={32} className="gauge-icon" />
            <span className="gauge-score-value">{isAnalyzed ? `${score}%` : '--'}</span>
            <span className="gauge-score-caption">{isAnalyzed ? (targetRole || 'Calculated') : 'No Data'}</span>
          </div>
        </div>

        <div className="readiness-explanation">
          <p className="readiness-copy">
            {isAnalyzed
              ? `Evaluated match score against ${targetRole || 'target requisition'} based on 60% skill coverage and 40% TF-IDF cosine similarity.`
              : 'Complete your first resume analysis to calculate your Career Readiness Score.'}
          </p>
          <span className="readiness-subtext">
            {isAnalyzed
              ? 'Real mathematically calculated metrics from your latest screening.'
              : 'Evaluation measures keyword frequency, technical breadth, and market alignment.'}
          </span>
        </div>
      </div>

      <div className="card-bottom-action">
        <Button
          variant="primary"
          size="sm"
          icon={ArrowRight}
          className="w-full"
          onClick={() => {
            if (isAnalyzed && analysisId) {
              navigate(`/analysis/${analysisId}`);
            } else {
              navigate('/resume-analyzer');
            }
          }}
        >
          {isAnalyzed ? 'View Analysis Report →' : 'Start Analysis'}
        </Button>
      </div>
    </div>
  );
}
