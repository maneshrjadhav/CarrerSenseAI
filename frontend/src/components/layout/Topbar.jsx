import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Search,
  CheckCircle,
  Sun,
  Moon,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Topbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const displayName = user?.full_name || user?.name || 'Candidate';
  const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Candidate';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CA';

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-topbar" role="banner">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <div className="topbar-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Search modules, skills, jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="topbar-search-input"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Icon with Honest Empty State */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {notifOpen && (
            <div className="notifications-dropdown" role="region" aria-label="Notifications Menu">
              <div className="dropdown-title">Notifications</div>
              <div
                className="notif-empty-state"
                style={{
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                <CheckCircle size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary, #fff)', fontSize: '0.9rem' }}>
                  You're all caught up.
                </p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  No new alerts or pending tasks.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Upgrade Quick Link */}
        <Link
          to="/pricing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            color: 'var(--primary, #2563eb)',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s ease',
          }}
          title="View Subscription Plans & Pricing"
        >
          <Sparkles size={14} />
          <span>Plans</span>
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <button
            type="button"
            className="profile-pill-btn"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            aria-expanded={dropdownOpen}
            aria-label="User Profile Menu"
          >
            <div className="avatar-circle">{initials}</div>
            <div className="user-meta">
              <span className="user-fullname">{displayName}</span>
              <span className="role-tag">{role}</span>
            </div>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="dropdown-user-header">
                <strong>{displayName}</strong>
                <span>{user?.email || 'Authenticated User'}</span>
              </div>
              <div className="dropdown-divider"></div>

              <Link
                to="/pricing"
                className="dropdown-menu-item"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <CreditCard size={15} />
                <span>Subscription Plans</span>
              </Link>

              <Link
                to="/profile"
                className="dropdown-menu-item"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={15} />
                <span>View Profile</span>
              </Link>

              <Link
                to="/settings"
                className="dropdown-menu-item"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={15} />
                <span>Settings</span>
              </Link>

              <div className="dropdown-divider"></div>

              <button
                type="button"
                className="dropdown-menu-item logout-item"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
