import React, { useState, useEffect } from 'react';
import { RotateCw, ShieldCheck } from 'lucide-react';
import authService from '../../services/authService';

function generateLocalCaptcha(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Captcha({
  value,
  onChange,
  error,
  captchaCode,
  setCaptchaCode,
  captchaToken,
  setCaptchaToken,
}) {
  const [internalCode, setInternalCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const activeCode = captchaCode !== undefined ? captchaCode : internalCode;

  const updateCode = (newCode, newToken = null) => {
    if (setCaptchaCode) {
      setCaptchaCode(newCode);
    } else {
      setInternalCode(newCode);
    }
    if (setCaptchaToken && newToken) {
      setCaptchaToken(newToken);
    }
  };

  const refreshCaptcha = async () => {
    setRefreshing(true);
    if (onChange) onChange('');

    try {
      const serverCaptcha = await authService.getCaptcha();
      if (serverCaptcha && serverCaptcha.captcha_code) {
        updateCode(serverCaptcha.captcha_code, serverCaptcha.captcha_token);
        setRefreshing(false);
        return;
      }
    } catch {
      // Fallback to client-side generation
    }

    const local = generateLocalCaptcha(5);
    updateCode(local, null);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  return (
    <div className="captcha-container">
      <div className="captcha-header">
        <label className="input-label flex-label">
          <ShieldCheck size={16} className="text-primary" />
          <span>Human Verification *</span>
        </label>
        <button
          type="button"
          onClick={refreshCaptcha}
          className={`captcha-refresh-btn ${refreshing ? 'spinning' : ''}`}
          title="Refresh CAPTCHA"
          disabled={refreshing}
        >
          <RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="captcha-box-row">
        {/* Visual stylized CAPTCHA display */}
        <div className="captcha-display" aria-label="CAPTCHA Image">
          <div className="captcha-noise"></div>
          <span className="captcha-text">{activeCode || '8K4PZ'}</span>
        </div>

        {/* User Input */}
        <div className="captcha-input-wrap">
          <input
            type="text"
            className={`form-input captcha-input ${error ? 'input-error' : ''}`}
            placeholder="Enter code"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={6}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      {error && <span className="field-error-text">{error}</span>}
      <span className="captcha-hint">Enter the characters shown above (case-insensitive)</span>
    </div>
  );
}

export { generateLocalCaptcha };
