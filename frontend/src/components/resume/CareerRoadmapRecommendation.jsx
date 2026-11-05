import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Target,
  ExternalLink
} from 'lucide-react';
import Badge from '../common/Badge';

/**
 * CareerRoadmapRecommendation
 * Conditionally displayed on Resume Intelligence Report (/resume-analysis/:resumeId)
 * based strictly on the actual calculated Job Match Score from MySQL:
 * - Match Score < 85%: Prominent Career Growth Journey card with matched/missing skills,
 *   recommended improvements, and "Explore My Career Roadmap →" CTA.
 * - Match Score >= 85%: Encouraging Great Match card with options to review details without low-match warnings.
 * - No Job Match exists: Returns null (renders nothing, preserving pure resume analysis view).
 */
export default function CareerRoadmapRecommendation({
  jobMatch,
  resumeId
}) {
  const navigate = useNavigate();

  // If no job match analysis exists for this resume, render nothing
  if (!jobMatch || typeof jobMatch.match_score !== 'number') {
    return null;
  }

  const matchScore = Math.round(jobMatch.match_score);
  const isBelowThreshold = matchScore < 85;
  const targetRole = jobMatch.target_role || 'Target Role';
  const matchedSkills = jobMatch.matched_skills || [];
  const missingSkills = jobMatch.missing_skills || [];
  const improvements = jobMatch.recommended_improvements || [];

  const handleNavigateRoadmap = () => {
    const params = new URLSearchParams();
    if (resumeId) params.set('resumeId', resumeId);
    if (jobMatch.target_role) params.set('targetRole', jobMatch.target_role);
    if (jobMatch.analysis_id || jobMatch.id) {
      params.set('analysisId', jobMatch.analysis_id || jobMatch.id);
    }
    navigate(`/career-roadmap?${params.toString()}`);
  };

  const handleNavigateJobMatch = () => {
    if (jobMatch.analysis_id || jobMatch.id) {
      navigate(`/analysis/${jobMatch.analysis_id || jobMatch.id}`);
    } else {
      navigate(`/job-match/${resumeId}`);
    }
  };

  // Case 1: Job Match Score < 85% — Prominent Career Growth Journey Recommendation
  if (isBelowThreshold) {
    return (
      <div
        className="career-growth-recommendation-card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 50%, #e0f2fe 100%)',
          border: '2px solid #93c5fd',
          borderRadius: '18px',
          padding: '1.75rem',
          marginBottom: '24px',
          boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '720px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                flexShrink: 0
              }}
            >
              <Compass size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#d97706',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Growth Opportunity
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
                  Target Role: <strong>{targetRole}</strong>
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                Your Career Growth Journey Starts Here!
              </h2>
            </div>
          </div>

          {/* Actual Match Score Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#ffffff',
              border: '1px solid #bfdbfe',
              borderRadius: '14px',
              padding: '10px 18px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Actual Job Match Score
              </div>
              <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                Gaps Identified (&lt; 85%)
              </div>
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#2563eb',
                lineHeight: 1
              }}
            >
              {matchScore}%
            </div>
          </div>
        </div>

        {/* Description Text */}
        <p
          style={{
            fontSize: '0.975rem',
            color: '#334155',
            lineHeight: 1.6,
            margin: '0 0 1.25rem 0',
            maxWidth: '850px'
          }}
        >
          Your current resume has some gaps compared to the selected job requirements. Explore your personalized career roadmap to identify the skills you can improve.
        </p>

        {/* Breakdown Grid: Matched Skills vs Missing Skills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '1.25rem'
          }}
        >
          {/* Matched Skills */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid #d1fae5',
              borderRadius: '12px',
              padding: '14px 16px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: '#059669' }} />
                <strong style={{ fontSize: '0.88rem', color: '#065f46' }}>
                  Matched Skills ({matchedSkills.length})
                </strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Verified</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {matchedSkills.length > 0 ? (
                matchedSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No direct skill matches found</span>
              )}
            </div>
          </div>

          {/* Missing Skills / Growth Areas */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '14px 16px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ color: '#ea580c' }} />
                <strong style={{ fontSize: '0.88rem', color: '#9a3412' }}>
                  Key Missing Skills ({missingSkills.length})
                </strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>Bridge in Roadmap</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {missingSkills.length > 0 ? (
                missingSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #ffedd5',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    {sk}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>None detected</span>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Improvements Snippet (if available) */}
        {improvements.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
              Priority Roadmap Recommendations:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {improvements.slice(0, 3).map((imp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: imp.priority === 'HIGH' ? '#dc2626' : '#d97706',
                        backgroundColor: imp.priority === 'HIGH' ? '#fef2f2' : '#fef3c7',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      {imp.priority || 'PRIORITY'}
                    </span>
                    <strong style={{ color: '#0f172a' }}>{imp.skill}:</strong>
                    <span style={{ color: '#475569' }}>{imp.recommendation}</span>
                  </div>
                  {imp.duration && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Clock size={12} /> {imp.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Calculated from verified job match analysis.</span>
            <button
              type="button"
              onClick={handleNavigateJobMatch}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <span>View Match Breakdown</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleNavigateRoadmap}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.35)';
            }}
          >
            <span>Explore My Career Roadmap</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Job Match Score >= 85% — Encouraging High Match Card (No low-match warning)
  return (
    <div
      className="career-growth-recommendation-card"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #dcfce7 100%)',
        border: '2px solid #86efac',
        borderRadius: '18px',
        padding: '1.5rem 1.75rem',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '720px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)',
              flexShrink: 0
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#065f46',
                  background: '#d1fae5',
                  border: '1px solid #a7f3d0',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                High Alignment (≥ 85%)
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>
                Role: <strong>{targetRole}</strong>
              </span>
            </div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#064e3b',
                margin: '0 0 4px 0',
                lineHeight: 1.3
              }}
            >
              Great Match! Your resume aligns well with the selected job requirements.
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>
              Your verified background closely matches this role. You can explore advanced career progression to further excel.
            </p>
          </div>
        </div>

        {/* Score & CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '8px 16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
              Match Score
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
              {matchScore}%
            </div>
          </div>

          <button
            type="button"
            onClick={handleNavigateRoadmap}
            style={{
              background: '#059669',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 18px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#047857';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
          >
            <span>Explore Advanced Roadmap</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
