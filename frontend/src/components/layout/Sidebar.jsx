import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  Briefcase,
  Layers,
  Compass,
  HelpCircle,
  Clock,
  User,
  Settings,
  LogOut,
  LifeBuoy,
  Sparkles,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainNavigation = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resume-analyzer', label: 'Resume Analyzer', icon: FileSearch },
    { to: '/job-match', label: 'Job Match', icon: Briefcase },
    { to: '/skill-gap', label: 'Skill Gap', icon: Layers },
    { to: '/career-roadmap', label: 'Career Roadmap', icon: Compass },
    { to: '/interview-prep', label: 'Interview Prep', icon: HelpCircle },
    { to: '/history', label: 'Analysis History', icon: Clock },
  ];

  const accountNavigation = [
    { to: '/pricing', label: 'Subscription Plans', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="brand-icon-box">
              <Sparkles size={18} />
            </div>
            <span className="brand-title">CareerSense AI</span>
          </div>
          {onClose && (
            <button
              type="button"
              className="mobile-close-btn"
              onClick={onClose}
              aria-label="Close Navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">MAIN INTELLIGENCE</div>
          <ul className="nav-items">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={18} className="link-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="nav-divider"></div>

          <div className="nav-group-label">ACCOUNT &amp; SETTINGS</div>
          <ul className="nav-items">
            {accountNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={18} className="link-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {user?.role === 'admin' && (
            <>
              <div className="nav-divider"></div>
              <div className="nav-group-label" style={{ color: '#d97706' }}>
                ADMINISTRATION
              </div>
              <ul className="nav-items">
                <li>
                  <NavLink
                    to="/admin/payments"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <ShieldCheck size={18} className="link-icon" style={{ color: '#d97706' }} />
                    <span>Payment Approvals</span>
                  </NavLink>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link help-link"
            style={{ width: '100%', marginBottom: '6px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => alert('CareerSense AI Support: Visit the documentation or contact support@careersense.ai')}
          >
            <LifeBuoy size={18} className="link-icon" />
            <span>Help &amp; Support</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-btn"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
