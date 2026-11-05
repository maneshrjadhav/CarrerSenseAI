import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Terminal, Sparkles, Wrench, Code2, Database, ArrowRight, Check } from 'lucide-react';
import Button from '../common/Button';

export default function SkillOverview({ skills = [], suggestedSkills = [] }) {
  const navigate = useNavigate();
  const hasExtracted = skills && skills.length > 0;
  const hasSuggested = suggestedSkills && suggestedSkills.length > 0;
  const hasAny = hasExtracted || hasSuggested;

  const plannedCategories = [
    { title: 'Programming Languages', icon: Code2 },
    { title: 'Frameworks & Libraries', icon: Terminal },
    { title: 'Databases & Storage', icon: Database },
    { title: 'Developer Tools & DevOps', icon: Wrench },
    { title: 'Technical Methodologies', icon: Layers },
    { title: 'Soft Skills & Leadership', icon: Sparkles },
  ];

  return (
    <div className="dashboard-card skill-overview-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">NLP TAXONOMY</span>
          <h2 className="card-title">Skill Intelligence</h2>
        </div>
        <span className="count-pill">
          {hasExtracted ? `${skills.length} Extracted` : '0 Identified'}
        </span>
      </div>

      {!hasAny ? (
        <div className="skills-empty-state">
          <div className="empty-icon-halo">
            <Layers size={28} className="text-primary" />
          </div>
          <h3 className="empty-state-title">No skills extracted yet.</h3>
          <p className="empty-state-desc">
            Upload your resume or run a job match to automatically extract and categorize skills across technical
            domains.
          </p>

          <div className="planned-categories-grid">
            {plannedCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="planned-category-pill">
                  <Icon size={14} className="cat-icon" />
                  <span className="cat-title">{cat.title}</span>
                  <span className="cat-empty-tag">Awaiting Analysis</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="skills-populated-view">
          {hasExtracted && (
            <>
              <p className="skill-source-label">Extracted from your latest resume:</p>
              <div className="chips-flow-wrap mb-4">
                {skills.map((s, idx) => (
                  <span
                    key={s.skill_name || idx}
                    className="mini-chip chip-green text-xs"
                    title={s.category || 'Competency'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Check size={11} /> {s.skill_name}
                  </span>
                ))}
              </div>
            </>
          )}

          {hasSuggested && (
            <>
              <p className="skill-source-label">
                Suggested to learn (required by your latest target job):
              </p>
              <div className="chips-flow-wrap mb-4">
                {suggestedSkills.slice(0, 8).map((s, idx) => (
                  <span
                    key={s.skill_name || idx}
                    className="mini-chip chip-amber text-xs"
                    title={s.category ? `${s.category} • ${s.match_status}` : 'From job match'}
                  >
                    + {s.skill_name}
                  </span>
                ))}
                {suggestedSkills.length > 8 && (
                  <span className="mini-chip chip-amber text-xs">+{suggestedSkills.length - 8} more</span>
                )}
              </div>
            </>
          )}

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
