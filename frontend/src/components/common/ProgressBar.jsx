import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  variant = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple'
  height = 8,
  showLabel = false,
  className = '',
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={`cs-progress-wrapper ${className}`}>
      {showLabel && (
        <div className="cs-progress-labels">
          <span className="cs-progress-value">{percentage}%</span>
        </div>
      )}
      <div className="cs-progress-track" style={{ height: `${height}px` }}>
        <div
          className={`cs-progress-fill cs-fill-${variant}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

