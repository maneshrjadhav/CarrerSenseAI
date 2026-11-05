import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Guards administrator-only routes.
 * - Unauthenticated visitors are redirected to /login.
 * - Authenticated non-admins see an explicit access-denied screen instead of
 *   administrator UI (the backend additionally returns 403 on admin APIs).
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner"></div>
        <p>Verifying administrator session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="dashboard-content-wrapper">
        <div
          className="dashboard-container-inner"
          style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}
        >
          <div
            className="dashboard-card"
            style={{ maxWidth: '560px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(220, 38, 38, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <ShieldAlert size={30} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Administrator Access Required
            </h1>
            <p style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Your account (<strong>{user?.email || 'unknown'}</strong>) is signed in as{' '}
              <strong>{user?.role || 'candidate'}</strong>. The payment administration portal is restricted to
              administrator accounts.
            </p>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              If you are the project owner, an administrator account can be granted only through the
              owner-authorized setup script on the server (backend/setup_admin.py) — never through the signup form.
            </p>
            <a
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                background: 'var(--primary, #2563eb)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
