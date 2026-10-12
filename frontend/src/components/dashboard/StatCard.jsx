import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber'
  subtitle,
}) {
  return (
    <div className={`cs-stat-card cs-stat-${variant}`}>
      <div className="cs-stat-top">
        <div>
          <span className="cs-stat-title">{title}</span>
          <div className="cs-stat-value">{value}</div>
        </div>
        {Icon && (
          <div className="cs-stat-icon-wrapper">
            <Icon size={20} />
          </div>
        )}
      </div>
      {subtitle && <div className="cs-stat-subtitle">{subtitle}</div>}
    </div>
  );
}

