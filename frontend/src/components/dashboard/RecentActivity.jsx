import React from 'react';
import { Clock, FileText, Cpu, Compass, HelpCircle, CreditCard } from 'lucide-react';

const TYPE_ICONS = {
  upload: FileText,
  analysis: Cpu,
  roadmap: Compass,
  interview: HelpCircle,
  payment: CreditCard,
};

function formatWhen(iso) {
  if (!iso) return '';
  const hasZone = /Z$|[+-]\d{2}:\d{2}$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  if (isNaN(date.getTime())) return '';
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RecentActivity({ activities = [] }) {
  const hasActivity = activities && activities.length > 0;

  return (
    <div className="dashboard-card recent-activity-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">ACTIVITY LOG</span>
          <h2 className="card-title">Recent Activity</h2>
        </div>
        <span className="count-pill">{activities.length} Entries</span>
      </div>

      {!hasActivity ? (
        <div className="activity-empty-state">
          <Clock size={28} className="activity-empty-icon text-muted mb-2" />
          <h3 className="empty-state-title">No activity yet.</h3>
          <p className="empty-state-desc">
            Activity entries are logged automatically as you upload resumes, compare job descriptions, generate
            roadmaps, and take mock interviews.
          </p>
        </div>
      ) : (
        <ul className="activity-list-real">
          {activities.map((act, idx) => {
            const Icon = TYPE_ICONS[act.type] || Clock;
            return (
              <li key={idx} className="activity-item-row">
                <span className={`activity-icon-wrap activity-type-${act.type || 'default'}`}>
                  <Icon size={15} />
                </span>
                <div className="activity-text-col">
                  <span className="activity-title">{act.title}</span>
                  {act.description && <span className="activity-desc">{act.description}</span>}
                </div>
                <span className="activity-time">{formatWhen(act.timestamp)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
