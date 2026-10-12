import React from 'react';
import { Sparkles, Bell, User } from 'lucide-react';

export default function Navbar({ userName = 'Manesh Jadhav' }) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <Sparkles size={20} className="sparkle-icon" />
        </div>
        <span className="brand-name">CareerSense AI</span>
      </div>

      <div className="navbar-actions">
        <button className="icon-button" aria-label="Notifications" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            {userName.charAt(0)}
          </div>
          <span className="user-name">{userName}</span>
        </div>
      </div>
    </header>
  );
}

