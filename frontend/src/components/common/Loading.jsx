import React from 'react';

export default function Loading({ text = 'Loading data...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="cs-loading-fullscreen">
        <div className="cs-spinner"></div>
        <p className="cs-loading-text">{text}</p>
      </div>
    );
  }

  return (
    <div className="cs-loading-container">
      <div className="cs-spinner"></div>
      <p className="cs-loading-text">{text}</p>
    </div>
  );
}

