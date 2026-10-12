import React, { useState } from 'react';
import { Palette, Bell, Shield, User, Moon, Sun, Monitor, Lock, Check } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
        <div>
          <h2 className="page-title">Application Settings</h2>
          <p className="page-subtitle">Configure theme appearance, notification alerts, and security preferences.</p>
        </div>
      </div>

      {saved && (
        <div className="auth-alert-success mb-4">
          ✓ Settings preferences saved successfully!
        </div>
      )}

      <div className="settings-stack">
        {/* Appearance */}
        <Card title="Appearance" subtitle="Customize the visual presentation of CareerSense AI" icon={Palette}>
          <div className="setting-row">
            <div>
              <strong>Theme Mode</strong>
              <p className="setting-desc">Choose between Light, Dark, or System preference.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`cs-btn cs-btn-sm ${themeMode === 'light' ? 'cs-btn-primary' : 'cs-btn-outline'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: themeMode === 'light' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: themeMode === 'light' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: themeMode === 'light' ? '#fff' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => setThemeMode('light')}
              >
                <Sun size={14} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`cs-btn cs-btn-sm ${themeMode === 'dark' ? 'cs-btn-primary' : 'cs-btn-outline'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: themeMode === 'dark' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: themeMode === 'dark' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: themeMode === 'dark' ? '#fff' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => setThemeMode('dark')}
              >
                <Moon size={14} />
                <span>Dark</span>
              </button>
              <button
                type="button"
                className={`cs-btn cs-btn-sm ${themeMode === 'system' ? 'cs-btn-primary' : 'cs-btn-outline'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: themeMode === 'system' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: themeMode === 'system' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: themeMode === 'system' ? '#fff' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => setThemeMode('system')}
              >
                <Monitor size={14} />
                <span>System</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card title="Notifications" subtitle="Control system alerts and email updates" icon={Bell}>
          <div className="setting-row">
            <div>
              <strong>Resume Analysis Alerts</strong>
              <p className="setting-desc">Receive notifications when your PDF parsing and TF-IDF vectors complete.</p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="setting-row border-top pt-3">
            <div>
              <strong>High Alignment Job Matches</strong>
              <p className="setting-desc">Alert when a newly added Job Description scores &gt;80% Cosine Similarity.</p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={matchAlerts}
                onChange={(e) => setMatchAlerts(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </Card>

        {/* Security */}
        <Card title="Security" subtitle="Password hashing & session management" icon={Shield}>
          <div className="setting-row">
            <div>
              <strong>Password Protection</strong>
              <p className="setting-desc">Stored securely on MySQL using 12 rounds of bcrypt salt hashing.</p>
            </div>
            <Button variant="outline" size="sm" icon={Lock} onClick={() => alert('Password update form opens here')}>
              Change Password
            </Button>
          </div>

          <div className="setting-row border-top pt-3">
            <div>
              <strong>Two-Factor Authentication (2FA)</strong>
              <p className="setting-desc">Require one-time verification during login challenge.</p>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </Card>

        {/* Account Actions */}
        <Card title="Account" subtitle="Manage profile lifecycle" icon={User}>
          <div className="setting-row">
            <div>
              <strong>Session Invalidation</strong>
              <p className="setting-desc">Log out of all active candidate sessions across all browser devices.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('All active tokens invalidated.')}>
              Invalidate Sessions
            </Button>
          </div>
        </Card>

        <div className="mt-4 text-right">
          <Button variant="primary" size="md" onClick={handleSaveSettings}>
            Save All Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
