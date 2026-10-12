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
    name: user?.name || 'Manesh Jadhav',
    email: user?.email || 'manesh@example.com',
    phone: user?.phone || '+91 98765 43210',
    dob: user?.dob || '2003-05-15',
    education: 'B.Tech in Computer Engineering (2022 - 2026)',
    role: user?.role === 'recruiter' ? 'Recruiter' : 'Candidate (Full Stack / Software Engineer)',
    skills: 'Python, React, JavaScript, MySQL, Flask, HTML/CSS, Git, Tailwind CSS',
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({ name: formData.name, email: formData.email, phone: formData.phone, dob: formData.dob });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const initials = formData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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
        <div className="auth-alert-success mb-4">
          ✓ Profile changes saved successfully!
        </div>
      )}

      <div className="profile-layout-grid">
        {/* Left Column: Avatar & Summary */}
        <div className="profile-card-left">
          <Card className="text-center profile-avatar-card">
            <div className="profile-large-avatar">{initials}</div>
            <h3 className="profile-name-heading">{formData.name}</h3>
            <Badge variant="blue" size="md" className="my-2">{formData.role}</Badge>
            <p className="profile-tagline">Computer Engineering Undergraduate • AI &amp; Web Developer</p>
          </Card>

          {/* Subscription & Entitlement Status Card */}
          <Card className="mt-4" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} className="text-primary" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Subscription Plan</h4>
              </div>
              <Badge variant={subscription?.has_active_subscription ? 'emerald' : 'amber'} size="sm">
                {subscription?.has_active_subscription ? 'ACTIVE PRO' : 'FREE TIER'}
              </Badge>
            </div>

            {loadingSub ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Checking subscription status...</p>
            ) : subscription?.has_active_subscription ? (
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {subscription.subscription?.plan?.plan_name || 'CareerSense Pro'}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Valid until {new Date(subscription.subscription?.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({subscription.subscription?.days_remaining} days remaining)
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ width: '100%' }}
                    onClick={() => navigate('/pricing')}
                  >
                    Extend / Change Plan →
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Free Candidate Tier
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                  Resume parsing and ATS scoring included. Upgrade for Skill Gap Intelligence, Career Roadmap, and Mock Interviews.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  style={{ width: '100%' }}
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade to Pro (From ₹83/mo) →
                </Button>
              </div>
            )}
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
