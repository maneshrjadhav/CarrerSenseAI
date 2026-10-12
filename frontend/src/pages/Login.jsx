import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/common/Button';
import Captcha from '../components/auth/Captcha';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fromLocation = location.state?.from?.pathname || '/dashboard';

  const regenerateCaptcha = async () => {
    setCaptchaInput('');
    try {
      const fresh = await authService.getCaptcha();
      if (fresh && fresh.captcha_code) {
        setCaptchaCode(fresh.captcha_code);
        setCaptchaToken(fresh.captcha_token);
        return;
      }
    } catch {
      // Fallback local
    }
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaToken(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (!captchaInput.trim()) {
      newErrors.captcha = 'Please enter the CAPTCHA.';
    } else if (captchaCode && captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      newErrors.captcha = 'Invalid CAPTCHA. Please try again.';
      regenerateCaptcha();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (submitting) return;

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password, captchaInput.trim(), captchaToken, rememberMe);
      // Navigate to dashboard
      navigate(fromLocation, { replace: true });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('captcha')) {
        setServerError('Invalid CAPTCHA. Please try again.');
        setErrors((prev) => ({ ...prev, captcha: 'Invalid CAPTCHA. Please try again.' }));
      } else if (err.status === 401) {
        setServerError('Invalid email or password.');
      } else {
        setServerError(err.message || 'Invalid email or password.');
      }
      // Always regenerate CAPTCHA after failed login attempt
      regenerateCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your career journey."
      maxWidth="480px"
    >
      {serverError && (
        <div className="auth-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        className="auth-form"
        noValidate
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Email */}
        <motion.div className="form-group" variants={itemVariants}>
          <label className="input-label" htmlFor="login-email">Email Address *</label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              id="login-email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                if (serverError) setServerError('');
              }}
              autoFocus
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          {errors.email && <span className="field-error-text">{errors.email}</span>}
        </motion.div>

        {/* Password */}
        <motion.div className="form-group" variants={itemVariants}>
          <div className="flex-between">
            <label className="input-label" htmlFor="login-password">Password *</label>
            <Link to="/forgot-password" className="auth-link-sm">
              Forgot Password?
            </Link>
          </div>
          <div className="input-with-icon">
            <Lock size={16} className="input-icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input password-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                if (serverError) setServerError('');
              }}
              autoComplete="current-password"
              disabled={submitting}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={submitting}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="field-error-text">{errors.password}</span>}
        </motion.div>

        {/* Remember Me */}
        <motion.div className="form-group checkbox-group" variants={itemVariants}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={submitting}
            />
            <span>Remember me on this device</span>
          </label>
        </motion.div>

        {/* CAPTCHA Section */}
        <motion.div className="form-group" variants={itemVariants}>
          <Captcha
            value={captchaInput}
            onChange={(val) => {
              setCaptchaInput(val);
              if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: '' }));
              if (serverError) setServerError('');
            }}
            captchaCode={captchaCode}
            setCaptchaCode={setCaptchaCode}
            captchaToken={captchaToken}
            setCaptchaToken={setCaptchaToken}
            error={errors.captcha}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting}
            className="w-full submit-cta-btn"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </motion.div>
      </motion.form>

      <div className="auth-footer-prompt">
        <span>Don't have an account?</span>
        <Link to="/register" className="auth-link">
          Create Account <ArrowRight size={14} className="inline-arrow" />
        </Link>
      </div>
    </AuthLayout>
  );
}
