import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, GraduationCap, Target, FileText, ArrowRight } from 'lucide-react';

export default function ProfileSummary({ user }) {
  const navigate = useNavigate();

  // Compute honest completion percentage based on actual filled fields
  let completion = 20; // Base account creation
  if (user?.full_name || user?.name) completion += 20;
  if (user?.email) completion += 20;
  if (user?.phone) completion += 20;
  if (user?.dob) completion += 20;

  const displayName = user?.full_name || user?.name || 'Candidate';
  const displayEmail = user?.email || 'Not specified';
  const displayPhone = user?.phone || 'Not provided';
  const displayTarget = user?.career_target || 'Software Engineer / Developer';
  const resumeStatus = user?.resumes_count > 0 ? 'Uploaded (Pending Analysis)' : 'Not analyzed yet';

  return (
    <div className="dashboard-card profile-summary-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">CANDIDATE DOSSIER</span>
          <h2 className="card-title">Profile Summary</h2>
        </div>
        <div className="completion-ring-wrap" title={`Profile is ${completion}% complete`}>
          <div className="completion-score">{completion}%</div>
          <span className="completion-label">Completed</span>
        </div>
      </div>

      <div className="profile-details-grid">
        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <User size={14} />
            <span>Full Name</span>
          </div>
          <span className="detail-value">{displayName}</span>
        </div>

        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <Mail size={14} />
            <span>Email</span>
          </div>
          <span className="detail-value text-truncate">{displayEmail}</span>
        </div>

        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <Phone size={14} />
            <span>Phone</span>
          </div>
          <span className="detail-value">{displayPhone}</span>
        </div>

        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <GraduationCap size={14} />
            <span>Education</span>
          </div>
          <span className="detail-value">Undergraduate / Tech</span>
        </div>

        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <Target size={14} />
            <span>Career Target</span>
          </div>
          <span className="detail-value">{displayTarget}</span>
        </div>

        <div className="profile-detail-item">
          <div className="detail-label-icon">
            <FileText size={14} />
            <span>Resume Status</span>
          </div>
          <span className="detail-value status-tag-muted">{resumeStatus}</span>
        </div>
      </div>

      <div className="card-bottom-action">
        <button
          type="button"
          className="text-action-btn"
          onClick={() => navigate('/profile')}
        >
          <span>Complete Profile</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

