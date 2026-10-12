import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';

import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import ProfileSummary from '../components/dashboard/ProfileSummary';
import CareerReadiness from '../components/dashboard/CareerReadiness';
import ResumeIntelligence from '../components/dashboard/ResumeIntelligence';
import QuickActions from '../components/dashboard/QuickActions';
import SkillOverview from '../components/dashboard/SkillOverview';
import SkillGapPreview from '../components/dashboard/SkillGapPreview';
import JobMatchPreview from '../components/dashboard/JobMatchPreview';
import CareerRoadmapPreview from '../components/dashboard/CareerRoadmapPreview';
import RecentActivity from '../components/dashboard/RecentActivity';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      try {
        const res = await dashboardService.getDashboardSummary();
        if (mounted) {
          setDashboardData(res);
        }
      } catch (err) {
        // Fallback handled in service
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="dashboard-content-wrapper">
      {/* Subtle Technical Neural Grid Background */}
      <div className="dashboard-technical-bg" aria-hidden="true"></div>

      <div className="dashboard-container-inner">
        {/* 1. Welcome & Primary CTAs */}
        <WelcomeHeader user={user} />

        {/* 2. Top Dual Grid: Profile Summary + Career Readiness Benchmark */}
        <section className="dashboard-grid-dual mb-6" aria-label="Candidate Status">
          <ProfileSummary user={user} />
          <CareerReadiness
            score={dashboardData?.metrics?.career_readiness_score}
            analysisId={dashboardData?.metrics?.latest_analysis_id}
            targetRole={dashboardData?.metrics?.latest_target_role}
          />
        </section>

        {/* 3. Core NLP Pipeline & Resume Intelligence Card */}
        <section className="dashboard-section-full mb-6" aria-label="Resume Intelligence">
          <ResumeIntelligence resumes={dashboardData?.resumes || []} />
        </section>

        {/* 4. Quick Actions Direct Access Cards */}
        <section className="dashboard-section-full mb-6" aria-label="Quick Actions">
          <QuickActions />
        </section>

        {/* 5. Deep Intelligence Analysis Grid (Empty States - No Fake Data) */}
        <section className="dashboard-grid-triple mb-6" aria-label="Intelligence Modules">
          <SkillOverview skills={dashboardData?.skills || []} />
          <SkillGapPreview skillGaps={dashboardData?.skill_gaps || []} />
          <JobMatchPreview matches={dashboardData?.matches || []} />
        </section>

        {/* 6. Career Roadmap & Audit Activity */}
        <section className="dashboard-grid-split mb-6" aria-label="Roadmap and Activity">
          <CareerRoadmapPreview roadmap={dashboardData?.roadmap} />
          <RecentActivity activities={dashboardData?.activities || []} />
        </section>
      </div>
    </div>
  );
}
