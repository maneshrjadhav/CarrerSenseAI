import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`cs-btn cs-btn-${variant} cs-btn-${size} ${loading ? 'loading' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="btn-icon" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

