import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className = '',
  footer,
}) {
  return (
    <div className={`cs-card ${className}`}>
      {(title || Icon || action) && (
        <div className="cs-card-header">
          <div className="cs-card-title-wrap">
            {Icon && <Icon size={18} className="cs-card-icon" />}
            <div>
              {title && <h3 className="cs-card-title">{title}</h3>}
              {subtitle && <p className="cs-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="cs-card-action">{action}</div>}
        </div>
      )}
      <div className="cs-card-body">{children}</div>
      {footer && <div className="cs-card-footer">{footer}</div>}
    </div>
  );
}

