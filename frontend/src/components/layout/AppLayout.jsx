import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CareerAssistantChat from '../chat/CareerAssistantChat';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="dashboard-main-area">
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="dashboard-page-content">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Career Assistant Chatbot */}
      <CareerAssistantChat />
    </div>
  );
}

