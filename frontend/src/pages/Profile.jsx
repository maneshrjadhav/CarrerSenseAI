import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, GraduationCap, Briefcase, Award, Save, Edit3, CreditCard, Sparkles, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import { useAuth } from '../context/AuthContext';
import subscriptionService from '../services/subscriptionService';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    async function loadSub() {
      try {
        const resp = await subscriptionService.getCurrentSubscription();
        if (resp.success) {
          setSubscription(resp);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingSub(false);
      }
    }
    loadSub();
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    education: user?.education || '',
    role: user?.role === 'recruiter' ? 'Recruiter' : 'Candidate',
    skills: user?.skills || '',
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name: formData.name, email: formData.email, phone: formData.phone, dob: formData.dob });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const initials = (formData.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const hasPremiumSub = Boolean(subscription?.features_access?.skill_gap);
  const hasAtsPass = Boolean(subscription?.active_ats_pass);

  return (
    <div className="page-container">
      <BackButton to="/dashboard" label="Back to Dashboard" className="mb-2" />
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Candidate Profile</h2>
          <p className="page-subtitle">Manage your personal credentials, education history, and career preferences.</p>
        </div>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          icon={isEditing ? null : Edit3}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {saveSuccess && (
        <div className="auth-alert-success mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> Profile changes saved successfully!
        </div>
      )}

      <div className="profile-layout-grid">
        {/* Left Column: Avatar & Summary */}
        <div className="profile-card-left">
          <Card className="text-center profile-avatar-card">
            <div className="profile-large-avatar">{initials || '?'}</div>
            <h3 className="profile-name-heading">{formData.name || 'Unnamed Candidate'}</h3>
            <Badge variant="blue" size="md" className="my-2">{formData.role}</Badge>
            {formData.email && <p className="profile-tagline">{formData.email}</p>}
          </Card>

          {/* Platform Access Status Card */}
          <Card className="mt-4" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} className="text-primary" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Platform Access</h4>
              </div>
              <Badge variant="emerald" size="sm">
                FULL ACCESS UNLOCKED
              </Badge>
            </div>

            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Free All-Inclusive Access
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                All career intelligence features are 100% free and unlocked for your account:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  <span>Personalized Career Roadmap</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  <span>Sequential Milestone Progression</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  <span>Skill Gap Intelligence</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  <span>AI Mock Interview Simulator</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }} />
                  <span>ATS Report Downloads</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                style={{ width: '100%' }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard →
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Details Form */}
        <div className="profile-card-right">
          <Card title="Personal & Academic Information">
            <form onSubmit={handleSave} className="profile-form">
              <div className="form-row-dual">
                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      disabled={!isEditing}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-dual">
                <div className="form-group">
                  <label className="input-label">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Date of Birth</label>
                  <div className="input-with-icon">
                    <Calendar size={16} className="input-icon" />
                    <input
                      type="date"
                      className="form-input"
                      disabled={!isEditing}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Education Background</label>
                <div className="input-with-icon">
                  <GraduationCap size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    disabled={!isEditing}
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Target Role</label>
                <div className="input-with-icon">
                  <Briefcase size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    disabled={!isEditing}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Core Competencies &amp; Skills</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  disabled={!isEditing}
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                ></textarea>
              </div>

              {isEditing && (
                <div className="form-action-bar">
                  <Button type="submit" variant="primary" icon={Save}>
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
