import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';

export default function MatchScore({
  overall = 78,
  status = 'GOOD MATCH',
  tfidfSimilarity = 74,
  skillMatch = 82,
  experience = 74,
  education = 90,
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <Card
      title="Career Match"
      subtitle="Comprehensive AI profile fit score"
      icon={Target}
      className="match-score-card"
    >
      <div className="match-score-content">
        {/* Animated Radial / Circular Gauge */}
        <div className="radial-gauge-container">
          <svg className="radial-gauge-svg" width="130" height="130" viewBox="0 0 120 120">
            <circle
              className="gauge-bg-circle"
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="9"
            />
            <circle
              className="gauge-progress-circle"
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="9"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-percentage">{overall}%</span>
            <Badge variant="emerald" size="sm">{status}</Badge>
          </div>
        </div>

        {/* Detailed Match Sub-Metrics */}
        <div className="match-submetrics">
          <div className="submetric-item">
            <div className="submetric-header">
              <span>TF-IDF Vector Similarity</span>
              <strong>{tfidfSimilarity}%</strong>
            </div>
            <ProgressBar value={tfidfSimilarity} variant="blue" height={6} />
          </div>

          <div className="submetric-item">
            <div className="submetric-header">
              <span>Skill Requirement Match</span>
              <strong>{skillMatch}%</strong>
            </div>
            <ProgressBar value={skillMatch} variant="emerald" height={6} />
          </div>

          <div className="submetric-item">
            <div className="submetric-header">
              <span>Experience Alignment</span>
              <strong>{experience}%</strong>
            </div>
            <ProgressBar value={experience} variant="purple" height={6} />
          </div>

          <div className="submetric-item">
            <div className="submetric-header">
              <span>Education Relevance</span>
              <strong>{education}%</strong>
            </div>
            <ProgressBar value={education} variant="amber" height={6} />
          </div>
        </div>
      </div>
    </Card>
  );
}

