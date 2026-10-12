import React from 'react';
import {
  FileText,
  Briefcase,
  Layers,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export default function DashboardView({ userName = 'Manesh' }) {
  const stats = [
    { label: 'Resume', value: '78%', icon: FileText, color: 'blue' },
    { label: 'Matches', value: '12', icon: Briefcase, color: 'emerald' },
    { label: 'Skills', value: '24', icon: Layers, color: 'purple' },
    { label: 'Gap', value: '7', icon: AlertCircle, color: 'amber' },
  ];

  const recentMatches = [
    { title: 'Frontend Developer', match: 87, level: 'High Match', color: 'emerald' },
    { title: 'Python Developer', match: 78, level: 'Good Match', color: 'blue' },
    { title: 'Full Stack Developer', match: 71, level: 'Good Match', color: 'blue' },
  ];

  return (
    <div className="dashboard-view">
      {/* Welcome Header */}
      <section className="welcome-banner">
        <h2>Good evening, {userName} 👋</h2>
        <p className="welcome-subtext">Track your career readiness, resume match scores, and skill gap roadmaps.</p>
      </section>

      {/* 4 Top Metric Cards */}
      <section className="metrics-grid">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`metric-card metric-${stat.color}`}>
              <div className="metric-header">
                <span className="metric-value">{stat.value}</span>
                <div className="metric-icon-box">
                  <Icon size={18} />
                </div>
              </div>
              <span className="metric-label">{stat.label}</span>
            </div>
          );
        })}
      </section>

      {/* 2 Middle Status Cards */}
      <section className="middle-grid">
        {/* Career Match Card */}
        <div className="card career-match-card">
          <div className="card-header">
            <h3>Career Match</h3>
            <TrendingUp size={18} className="card-header-icon" />
          </div>
          <div className="career-match-body">
            <div className="percentage-circle">
              <span className="percentage-number">78%</span>
            </div>
            <div className="match-tag">GOOD MATCH</div>
            <p className="card-hint">Calculated using TF-IDF vector similarity and skill matching</p>
          </div>
        </div>

        {/* Resume Status Card */}
        <div className="card resume-status-card">
          <div className="card-header">
            <h3>Resume Status</h3>
            <FileText size={18} className="card-header-icon" />
          </div>
          <div className="resume-status-body">
            <div className="status-badge-verified">
              <CheckCircle2 size={24} className="check-icon" />
              <span className="status-title">Analyzed</span>
            </div>
            <p className="resume-filename">Latest: <code>Resume_Manesh_2026.pdf</code></p>
            <div className="resume-details">
              <span>PDF parsed: <strong>Yes</strong></span>
              <span>•</span>
              <span>NLP Lemmatized: <strong>Ready</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Job Matches Section */}
      <section className="card recent-matches-card">
        <div className="card-header">
          <div>
            <h3>Recent Job Matches</h3>
            <p className="card-subtext">Cosine similarity scores against target role descriptions</p>
          </div>
        </div>

        <div className="job-matches-list">
          {recentMatches.map((job, idx) => (
            <div key={idx} className="job-match-row">
              <div className="job-info">
                <div className="job-bullet"></div>
                <div>
                  <span className="job-title">{job.title}</span>
                  <span className="job-level">{job.level}</span>
                </div>
              </div>

              <div className="job-score-container">
                <div className="score-bar-bg">
                  <div
                    className={`score-bar-fill fill-${job.color}`}
                    style={{ width: `${job.match}%` }}
                  ></div>
                </div>
                <span className={`match-badge badge-${job.color}`}>{job.match}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

