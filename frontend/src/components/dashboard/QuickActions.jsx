import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Briefcase,
  Layers,
  Compass,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Upload Resume',
      desc: 'Upload PDF to extract and index your career history.',
      icon: UploadCloud,
      route: '/resume-analyzer',
      badge: 'Step 5 Ready',
    },
    {
      title: 'Analyze Job Description',
      desc: 'Compare target job requirements with your extracted profile.',
      icon: Briefcase,
      route: '/job-match',
      badge: 'TF-IDF',
    },
    {
      title: 'View Skill Gaps',
      desc: 'Identify high-priority competencies missing for target roles.',
      icon: Layers,
      route: '/skill-gap',
      badge: 'Differential',
    },
    {
      title: 'Build Career Roadmap',
      desc: 'Generate structured learning milestones to close skill gaps.',
      icon: Compass,
      route: '/career-roadmap',
      badge: 'Curriculum',
    },
    {
      title: 'Practice Interview',
      desc: 'Prepare with AI-generated technical & HR interview questions.',
      icon: HelpCircle,
      route: '/interview-prep',
      badge: 'Q&A Prep',
    },
  ];

  return (
    <section className="dashboard-quick-actions-section" aria-label="Quick Actions">
      <div className="section-title-row">
        <div>
          <span className="card-badge">DIRECT ACCESS</span>
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <span className="section-subtext">Launch career intelligence modules</span>
      </div>

      <div className="quick-actions-grid">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.title}
              className="quick-action-card"
              onClick={() => navigate(act.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(act.route);
                }
              }}
            >
              <div className="qa-top-row">
                <div className="qa-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className="qa-badge">{act.badge}</span>
              </div>

              <h3 className="qa-card-title">{act.title}</h3>
              <p className="qa-card-desc">{act.desc}</p>

              <div className="qa-bottom-row">
                <span className="qa-launch-text">Launch Module</span>
                <ArrowRight size={14} className="qa-arrow-icon" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

