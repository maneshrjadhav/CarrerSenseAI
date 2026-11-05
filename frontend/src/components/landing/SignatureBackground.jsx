import React from 'react';
import bgImage from '../../assets/career-intelligence-background.svg';

export default function SignatureBackground({ variant = 'hero', className = '' }) {
  if (variant === 'hero') {
    return (
      <div className={`signature-bg-wrapper hero-variant ${className}`} aria-hidden="true">
        {/* 1. Subtle Engineering Grid Mesh */}
        <div className="bg-grid-mesh"></div>

        {/* 2. Soft Outer Ambient Glow Orbs */}
        <div className="bg-ambient-orb orb-top-center"></div>
        <div className="bg-ambient-orb orb-left-edge"></div>
        <div className="bg-ambient-orb orb-right-edge"></div>

        {/* 3. Real Dedicated Career Intelligence Background Asset */}
        <div className="bg-asset-layer">
          <img
            src={bgImage}
            alt=""
            className="career-intel-bg-img anim-subtle-shimmer"
            loading="eager"
          />
        </div>

        {/* 4. Soft Blue Atmospheric Gradient (High contrast, non-washed-out) */}
        <div className="bg-gradient-overlay"></div>
      </div>
    );
  }

  // Fallback variant for other sections
  return (
    <div className={`signature-bg-wrapper section-variant ${className}`} aria-hidden="true">
      <div className="bg-grid-mesh"></div>
    </div>
  );
}
