import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Terminal, Sparkles, Wrench, Code2, Database, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function SkillOverview({ skills = [] }) {
  const navigate = useNavigate();
  const hasSkills = skills && skills.length > 0;

  const plannedCategories = [
    { title: 'Programming Languages', icon: Code2, count: 0 },
    { title: 'Frameworks & Libraries', icon: Terminal, count: 0 },
    { title: 'Databases & Storage', icon: Database, count: 0 },
    { title: 'Developer Tools & DevOps', icon: Wrench, count: 0 },
    { title: 'Technical Methodologies', icon: Layers, count: 0 },
    { title: 'Soft Skills & Leadership', icon: Sparkles, count: 0 },
  ];

  return (
    <div className="dashboard-card skill-overview-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">NLP TAXONOMY</span>
          <h2 className="card-title">Skill Intelligence</h2>
        </div>
        <span className="count-pill">
          {hasSkills ? `${skills.length} Verified` : '0 Identified'}
        </span>
      </div>

      {!hasSkills ? (
        <div className="skills-empty-state">
          <div className="empty-icon-halo">
            <Layers size={28} className="text-primary" />
          </div>
          <h3 className="empty-state-title">No skills extracted yet.</h3>
          <p className="empty-state-desc">
            Upload your resume or job description to automatically extract and categorize skills across technical domains.
          </p>

          <div className="planned-categories-grid">
            {plannedCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="planned-category-pill">
                  <Icon size={14} className="cat-icon" />
                  <span className="cat-title">{cat.title}</span>
                  <span className="cat-empty-tag">Awaiting NLP</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="skills-populated-view">
          <p className="text-xs text-secondary mb-3">
            Competencies extracted from your latest resume and classified against the master engineering taxonomy:
          </p>
          <div className="chips-flow-wrap mb-4">
            {skills.map((s, idx) => (
              <span
                key={s.skill_name || idx}
                className="mini-chip chip-green text-xs"
                title={s.category || 'Competency'}
              >
                ✓ {s.skill_name}
              </span>
            ))}
          </div>

          <div className="card-bottom-action pt-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              className="w-full"
              onClick={() => navigate('/skill-gap')}
            >
              Explore Skill Gap Analysis →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
