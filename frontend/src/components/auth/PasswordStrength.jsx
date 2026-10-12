import React from 'react';
import { motion } from 'framer-motion';

export function calculatePasswordStrength(password = '') {
  if (!password) return { score: 0, label: '', color: 'gray' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score: 1, label: 'Weak', color: 'red', percent: 33 };
  } else if (score <= 4) {
    return { score: 2, label: 'Medium', color: 'amber', percent: 66 };
  } else {
    return { score: 3, label: 'Strong', color: 'emerald', percent: 100 };
  }
}

export default function PasswordStrength({ password = '' }) {
  if (!password) return null;

  const { label, color, percent } = calculatePasswordStrength(password);

  return (
    <div className="password-strength-widget">
      <div className="strength-header">
        <span className="strength-label">Password Strength:</span>
        <span className={`strength-value text-${color}`}>{label}</span>
      </div>

      <div className="strength-track">
        <motion.div
          className={`strength-bar bar-${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

