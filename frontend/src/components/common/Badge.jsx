import React from 'react';

export default function Badge({
  children,
  variant = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple' | 'red' | 'gray'
  size = 'md',
  className = '',
}) {
  return (
    <span className={`cs-badge cs-badge-${variant} cs-badge-${size} ${className}`}>
      {children}
    </span>
  );
}

