import React from 'react';
import { Clock, History, FileText, CheckCircle2 } from 'lucide-react';

export default function RecentActivity({ activities = [] }) {
  const hasActivity = activities && activities.length > 0;

  return (
    <div className="dashboard-card recent-activity-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">AUDIT LOG</span>
          <h2 className="card-title">Recent Activity</h2>
        </div>
        <span className="count-pill">{activities.length} Entries</span>
      </div>

      {!hasActivity ? (
        <div className="activity-empty-state">
          <Clock size={28} className="activity-empty-icon text-muted mb-2" />
          <h3 className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #fff)', margin: '4px 0' }}>
            No analysis activity yet.
          </h3>
          <p className="empty-state-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', margin: '0 0 1rem 0' }}>
            Activity entries will log automatically as you upload resumes, compare job descriptions, and generate roadmaps.
          </p>

          <div className="future-activity-tags">
            <span className="future-tag">Resume Uploaded</span>
            <span className="future-tag">Resume Analyzed</span>
            <span className="future-tag">Job Matched</span>
            <span className="future-tag">Skill Gap Generated</span>
            <span className="future-tag">Roadmap Updated</span>
          </div>
        </div>
      ) : (
        <ul className="activity-list-real">
          {activities.map((act, idx) => (
            <li key={idx} className="activity-item-row">
              <FileText size={16} className="text-primary" />
              <span>{act.message}</span>
              <span className="activity-time">{act.timestamp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

