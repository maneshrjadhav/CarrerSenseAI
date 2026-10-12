import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';
import PasswordStrength from '../components/auth/PasswordStrength';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    role: 'candidate',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const newErrors = {};

    // Full Name: required, min 2 chars
    const nameVal = formData.fullName.trim();
    if (!nameVal) {
      newErrors.fullName = 'Please enter your full name.';
    } else if (nameVal.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    // Email: required, valid format
    const emailVal = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      newErrors.email = 'Please enter a valid email address.';
    } else if (!emailRegex.test(emailVal)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Phone: optional, validate if provided
    const phoneVal = formData.phone.trim();
    if (phoneVal) {
      const phoneClean = phoneVal.replace(/[\s\-+()]/g, '');
      if (phoneClean.length < 7 || phoneClean.length > 15) {
        newErrors.phone = 'Please enter a valid phone number.';
      }
    }

    // Date of Birth: optional, validate if provided
    const dobVal = formData.dob;
    if (dobVal) {
      const parsedDate = new Date(dobVal);
      if (isNaN(parsedDate.getTime())) {
        newErrors.dob = 'Please enter a valid date of birth.';
      }
    }

    // Password: required, min 8 chars
    if (!formData.password) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    // Confirm Password: required, match
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (submitting) return; // Prevent double submission

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        dob: formData.dob || undefined,
        password: formData.password,
        role: formData.role,
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 409) {
        setServerError('An account with this email already exists. Please sign in.');
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <AuthLayout
        title="Account Created Successfully"
        subtitle="Your CareerSense AI account is ready."
        maxWidth="460px"
      >
        <div className="success-modal-body" style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            className="success-icon-wrap"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={36} color="#10B981" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #fff)', marginBottom: '0.5rem' }}>
            Account Created ✓
          </h3>
          <p className="success-lead-text" style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Your account has been registered successfully with secure encryption. Please sign in to access your Candidate Dashboard.
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            className="w-full mt-2"
            onClick={() => navigate('/login')}
          >
            Continue to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Start your AI-powered career journey."
      maxWidth="520px"
    >
      {serverError && (
        <div className="auth-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label className="input-label" htmlFor="reg-name">Full Name *</label>
          <div className="input-with-icon">
            <User size={16} className="input-icon" />
            <input
              id="reg-name"
              type="text"
              name="fullName"
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              placeholder="e.g. Manesh Jadhav"
              value={formData.fullName}
              onChange={handleChange}
              autoComplete="name"
              disabled={submitting}
            />
          </div>
          {errors.fullName && <span className="field-error-text">{errors.fullName}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="input-label" htmlFor="reg-email">Email Address *</label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              id="reg-email"
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          {errors.email && <span className="field-error-text">{errors.email}</span>}
        </div>

        {/* Phone & Date of Birth */}
        <div className="form-row-dual">
          <div className="form-group">
            <label className="input-label" htmlFor="reg-phone">Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} className="input-icon" />
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'input-error' : ''}`}
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            {errors.phone && <span className="field-error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="reg-dob">Date of Birth</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input
                id="reg-dob"
                type="date"
                name="dob"
                className={`form-input ${errors.dob ? 'input-error' : ''}`}
                value={formData.dob}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            {errors.dob && <span className="field-error-text">{errors.dob}</span>}
          </div>
        </div>

        {/* Role Selector */}
        <div className="form-group">
          <label className="input-label">Role</label>
          <div className="role-selector-pills">
            <label className={`role-pill ${formData.role === 'candidate' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="candidate"
                checked={formData.role === 'candidate'}
                onChange={handleChange}
                disabled={submitting}
              />
              <span>Candidate (Student / Job Seeker)</span>
            </label>
            <label className={`role-pill ${formData.role === 'recruiter' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="recruiter"
                checked={formData.role === 'recruiter'}
                onChange={handleChange}
                disabled={submitting}
              />
              <span>Recruiter</span>
            </label>
          </div>
        </div>

        {/* Passwords */}
        <div className="form-row-dual">
          <div className="form-group">
            <label className="input-label" htmlFor="reg-password">Password *</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`form-input password-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 chars"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="field-error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="reg-confirm">Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-input password-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="field-error-text">{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* Password Strength Widget */}
        <PasswordStrength password={formData.password} />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting}
          className="w-full submit-cta-btn"
        >
          {submitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="auth-footer-prompt">
        <span>Already have an account?</span>
        <Link to="/login" className="auth-link">
          Sign In <ArrowRight size={14} className="inline-arrow" />
        </Link>
      </div>
    </AuthLayout>
  );
}
