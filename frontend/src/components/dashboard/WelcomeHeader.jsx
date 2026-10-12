import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Briefcase } from 'lucide-react';
import Button from '../common/Button';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeHeader({ user }) {
  const navigate = useNavigate();
  const firstName = (user?.full_name || user?.name || 'Candidate').split(' ')[0];

  return (
    <section className="dashboard-welcome-banner" aria-label="Welcome Overview">
      <div className="welcome-text-col">
        <div className="welcome-tag">
          <Sparkles size={14} className="sparkle-icon" />
          <span>AI CAREER INTELLIGENCE SYSTEM</span>
        </div>
        <h1 className="welcome-heading">
          {getTimeGreeting()}, {firstName} 👋
        </h1>
        <p className="welcome-subtitle">
          Your AI-powered career intelligence at a glance.
        </p>
      </div>

      <div className="welcome-actions-col">
        <Button
          variant="primary"
          size="md"
          icon={ArrowRight}
          onClick={() => navigate('/resume-analyzer')}
        >
          Analyze My Resume
        </Button>

        <button
          type="button"
          className="secondary-btn-subtle"
          onClick={() => navigate('/job-match')}
        >
          <Briefcase size={16} />
          <span>Explore Job Match</span>
        </button>
      </div>
    </section>
  );
}

