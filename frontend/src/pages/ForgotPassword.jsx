import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Edit2
} from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';
import { authService } from '../services/authService';

const STAGES = {
  EMAIL: 'email',
  OTP: 'otp',
  NEW_PASSWORD: 'new_password',
  SUCCESS: 'success'
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Multi-step State
  const [currentStage, setCurrentStage] = useState(STAGES.EMAIL);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timers
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes
  const [cooldownSeconds, setCooldownSeconds] = useState(60); // 60s resend cooldown

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // OTP Input Refs
  const digitInputRefs = useRef([]);

  // Timer countdown hooks
  useEffect(() => {
    let timer;
    if (currentStage === STAGES.OTP && expirySeconds > 0) {
      timer = setInterval(() => {
        setExpirySeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStage, expirySeconds]);

  useEffect(() => {
    let timer;
    if (currentStage === STAGES.OTP && cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStage, cooldownSeconds]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // STAGE 1: REQUEST OTP VIA EMAIL
  // -------------------------------------------------------------
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(cleanEmail);
      setInfoMessage(res.message || 'Verification code sent! Please check your inbox.');
      setCooldownSeconds(res.cooldown_seconds || 60);
      setExpirySeconds((res.expiry_minutes || 5) * 60);
      setOtpDigits(['', '', '', '', '', '']);
      setCurrentStage(STAGES.OTP);
      // Auto focus first OTP digit
      setTimeout(() => {
        if (digitInputRefs.current[0]) {
          digitInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      if (err.status === 429 && err.data?.cooldown_remaining) {
        setCooldownSeconds(err.data.cooldown_remaining);
        setCurrentStage(STAGES.OTP);
      }
      setError(err.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STAGE 2: 6-DIGIT OTP VERIFICATION & DIGIT HANDLING
  // -------------------------------------------------------------
  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    // Single digit input
    const char = cleanVal.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setError('');

    // Auto advance
    if (index < 5 && digitInputRefs.current[index + 1]) {
      digitInputRefs.current[index + 1].focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous box on backspace if current is empty
      if (digitInputRefs.current[index - 1]) {
        digitInputRefs.current[index - 1].focus();
      }
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpDigits(updated);
    setError('');

    const targetIndex = Math.min(pasted.length, 5);
    if (digitInputRefs.current[targetIndex]) {
      digitInputRefs.current[targetIndex].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please click "Resend Code" to get a fresh code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, fullOtp);
      setResetToken(res.reset_token);
      setInfoMessage('Verification code confirmed! Now create your new password.');
      setCurrentStage(STAGES.NEW_PASSWORD);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setError('');
    setInfoMessage('');
    setResending(true);

    try {
      const res = await authService.resendOtp(email);
      setInfoMessage(res.message || 'A fresh verification code has been dispatched.');
      setCooldownSeconds(res.cooldown_seconds || 60);
      setExpirySeconds(300);
      setOtpDigits(['', '', '', '', '', '']);
      if (digitInputRefs.current[0]) {
        digitInputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || 'Unable to resend verification code. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------
  // STAGE 3: NEW PASSWORD & CONFIRM PASSWORD
  // -------------------------------------------------------------
  // Password Complexity Metrics
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength Score: 0 to 4
  const getStrengthScore = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasLetter) score++;
    if (hasNumber) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
    return score;
  };

  const strengthScore = getStrengthScore();
  const getStrengthMeta = () => {
    if (!newPassword) return { label: 'Empty', colorClass: 'bar-red', percent: 0 };
    if (strengthScore <= 1) return { label: 'Weak', colorClass: 'bar-red', percent: 25 };
    if (strengthScore === 2) return { label: 'Fair', colorClass: 'bar-amber', percent: 50 };
    if (strengthScore === 3) return { label: 'Good', colorClass: 'bar-amber', percent: 75 };
    return { label: 'Strong', colorClass: 'bar-emerald', percent: 100 };
  };
  const strengthMeta = getStrengthMeta();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasLetter) {
      setError('Password must contain at least one letter.');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword
      });
      setCurrentStage(STAGES.SUCCESS);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please restart the verification process.');
    } finally {
      setLoading(false);
    }
  };

  // Titles & Subtitles for each stage
  const getHeaderMeta = () => {
    switch (currentStage) {
      case STAGES.OTP:
        return {
          title: 'Verify Your Identity',
          subtitle: 'Enter the 6-digit code sent to your registered email address.'
        };
      case STAGES.NEW_PASSWORD:
        return {
          title: 'Set New Password',
          subtitle: 'Create a strong, secure password for your CareerSense AI account.'
        };
      case STAGES.SUCCESS:
        return {
          title: 'Password Updated',
          subtitle: 'Your access credentials have been securely reset.'
        };
      case STAGES.EMAIL:
      default:
        return {
          title: 'Forgot Password?',
          subtitle: 'Enter your registered email to receive a secure 6-digit OTP.'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <AuthLayout
      mode="login"
      title={headerMeta.title}
      subtitle={headerMeta.subtitle}
      maxWidth="480px"
    >
      {/* 3-Step Progress Indicator */}
      {currentStage !== STAGES.SUCCESS && (
        <div className="otp-steps-progress" aria-label="Password Reset Progress">
          <div className={`otp-step-item ${currentStage === STAGES.EMAIL ? 'active' : 'completed'}`}>
            <div className="otp-step-circle">
              {currentStage !== STAGES.EMAIL ? <Check size={14} /> : '1'}
            </div>
            <span className="otp-step-label">Email</span>
          </div>

          <div
            className={`otp-step-item ${
              currentStage === STAGES.OTP
                ? 'active'
                : currentStage === STAGES.NEW_PASSWORD
                ? 'completed'
                : ''
            }`}
          >
            <div className="otp-step-circle">
              {currentStage === STAGES.NEW_PASSWORD ? <Check size={14} /> : '2'}
            </div>
            <span className="otp-step-label">Verify OTP</span>
          </div>

          <div className={`otp-step-item ${currentStage === STAGES.NEW_PASSWORD ? 'active' : ''}`}>
            <div className="otp-step-circle">3</div>
            <span className="otp-step-label">New Password</span>
          </div>
        </div>
      )}

      {/* Global Alert Messages */}
      {error && (
        <div className="otp-feedback-alert error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {infoMessage && !error && (
        <div className="otp-feedback-alert info" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 1: EMAIL REQUEST FORM                               */}
      {/* ========================================================= */}
      {currentStage === STAGES.EMAIL && (
        <form onSubmit={handleRequestOtp} className="auth-form" noValidate>
          <div className="form-group">
            <label className="input-label" htmlFor="forgot-email">
              Registered Email Address *
            </label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="forgot-email"
                type="email"
                className={`form-input ${error ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="captcha-hint">
              We'll send a 6-digit verification code that expires in 5 minutes.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full submit-cta-btn"
            disabled={loading}
          >
            {loading ? 'Sending Code...' : 'Send Verification Code'}
          </Button>

          <div className="auth-footer-prompt">
            <span>Remembered your password?</span>
            <Link to="/login" className="auth-link">
              Back to Sign In <ArrowRight size={14} className="inline-arrow" />
            </Link>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: 6-DIGIT OTP VERIFICATION FORM                   */}
      {/* ========================================================= */}
      {currentStage === STAGES.OTP && (
        <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
          {/* Target Email display with change button */}
          <div className="otp-email-badge">
            <div className="otp-email-badge-info">
              <Mail size={15} />
              <span>
                Code sent to: <strong>{email}</strong>
              </span>
            </div>
            <button
              type="button"
              className="otp-email-change-btn"
              onClick={() => {
                setCurrentStage(STAGES.EMAIL);
                setError('');
                setInfoMessage('');
              }}
              title="Change email address"
            >
              Change
            </button>
          </div>

          {/* 6 Segmented OTP Inputs */}
          <div className="form-group">
            <label className="input-label" style={{ textAlign: 'center', display: 'block' }}>
              Enter 6-Digit Code
            </label>
            <div className="otp-digits-grid" onPaste={handleDigitPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (digitInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-digit-field ${digit ? 'has-value' : ''} ${error ? 'has-error' : ''}`}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  disabled={loading || expirySeconds <= 0}
                  aria-label={`Digit ${idx + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {/* Expiry and Resend Metas */}
          <div className="otp-meta-row">
            <div
              className={`otp-timer-pill ${
                expirySeconds <= 0
                  ? 'danger'
                  : expirySeconds < 60
                  ? 'warning'
                  : ''
              }`}
            >
              <Clock size={13} />
              <span>
                {expirySeconds > 0
                  ? `Expires in ${formatTime(expirySeconds)}`
                  : 'Code Expired'}
              </span>
            </div>

            <button
              type="button"
              className="otp-resend-action"
              onClick={handleResendOtp}
              disabled={cooldownSeconds > 0 || resending}
            >
              <RefreshCw size={13} className={resending ? 'spin' : ''} />
              <span>
                {resending
                  ? 'Resending...'
                  : cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : 'Resend Code'}
              </span>
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full submit-cta-btn"
            disabled={loading || otpDigits.join('').length !== 6 || expirySeconds <= 0}
          >
            {loading ? 'Verifying Code...' : 'Verify Code & Proceed'}
          </Button>

          <div className="auth-footer-prompt">
            <button
              type="button"
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                setCurrentStage(STAGES.EMAIL);
                setError('');
                setInfoMessage('');
              }}
            >
              <ArrowLeft size={14} className="inline-arrow" /> Back to Email Entry
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: NEW PASSWORD AND CONFIRM PASSWORD                */}
      {/* ========================================================= */}
      {currentStage === STAGES.NEW_PASSWORD && (
        <form onSubmit={handleResetPassword} className="auth-form" noValidate>
          {/* New Password Input */}
          <div className="form-group">
            <label className="input-label" htmlFor="new-password">
              New Password *
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="password-strength-widget">
              <div className="strength-header">
                <span className="strength-label">Password Strength:</span>
                <span className={`strength-value ${strengthMeta.colorClass.replace('bar-', 'text-')}`}>
                  {strengthMeta.label}
                </span>
              </div>
              <div className="strength-track">
                <div
                  className={`strength-bar ${strengthMeta.colorClass}`}
                  style={{ width: `${strengthMeta.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="form-group">
            <label className="input-label" htmlFor="confirm-password">
              Confirm New Password *
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Checklist Criteria */}
          <div className="pwd-checklist">
            <div className={`pwd-checklist-item ${hasMinLength ? 'valid' : 'invalid'}`}>
              {hasMinLength ? <Check size={12} /> : <X size={12} />}
              <span>8+ characters</span>
            </div>
            <div className={`pwd-checklist-item ${hasLetter ? 'valid' : 'invalid'}`}>
              {hasLetter ? <Check size={12} /> : <X size={12} />}
              <span>At least 1 letter</span>
            </div>
            <div className={`pwd-checklist-item ${hasNumber ? 'valid' : 'invalid'}`}>
              {hasNumber ? <Check size={12} /> : <X size={12} />}
              <span>At least 1 number</span>
            </div>
            <div className={`pwd-checklist-item ${passwordsMatch ? 'valid' : 'invalid'}`}>
              {passwordsMatch ? <Check size={12} /> : <X size={12} />}
              <span>Passwords match</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full submit-cta-btn"
            disabled={loading || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
          >
            {loading ? 'Updating Password...' : 'Save & Reset Password'}
          </Button>
        </form>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: SUCCESS CONFIRMATION                             */}
      {/* ========================================================= */}
      {currentStage === STAGES.SUCCESS && (
        <div className="otp-success-view">
          <div className="otp-success-icon-wrap">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="otp-success-title">Password Successfully Reset!</h2>
          <p className="otp-success-desc">
            Your CareerSense AI password has been securely updated. You can now log in using your new credentials.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full submit-cta-btn"
            onClick={() => navigate('/login')}
          >
            Sign In with New Password <ArrowRight size={16} className="inline-arrow" />
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
