import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  FileText,
  Briefcase,
  Layers,
  Compass,
  HelpCircle,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze', icon: FileSearch },
    { id: 'resumes', label: 'My Resumes', icon: FileText },
    { id: 'matches', label: 'Job Matches', icon: Briefcase },
    { id: 'skills', label: 'Skill Gap', icon: Layers },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'interview', label: 'Interview', icon: HelpCircle },
  ];

  const bottomNav = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="nav-list">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''} ${item.id === 'logout' ? 'nav-logout' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

