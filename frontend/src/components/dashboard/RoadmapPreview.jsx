import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Code2, Users } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function RoadmapPreview() {
  const navigate = useNavigate();

  const milestones = [
    { num: '01', title: 'Current Skills', desc: 'Python, React, SQL', status: 'completed' },
    { num: '02', title: 'Skill Gap', desc: 'Docker, AWS, TS', status: 'current' },
    { num: '03', title: 'Learning Plan', desc: '4-Week Roadmap', status: 'upcoming' },
    { num: '04', title: 'Projects', desc: 'Fullstack Microservices', status: 'upcoming' },
    { num: '05', title: 'Certification', desc: 'AWS Cloud Practitioner', status: 'upcoming' },
    { num: '06', title: 'Job Ready', desc: 'Resume & Interview Fit', status: 'target' },
  ];

  return (
    <div className="roadmap-interview-dual-grid">
      {/* Roadmap Card */}
      <Card
        title="Career Roadmap Preview"
        subtitle="Step-by-step path to close identified gaps"
        icon={Compass}
        className="roadmap-preview-card"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/roadmap')}
          >
            View Full Roadmap
          </Button>
        }
      >
        <div className="roadmap-horizontal-stepper">
          {milestones.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className={`stepper-node node-${step.status}`}>
                <div className="node-circle">
                  {step.status === 'completed' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>
                <div className="node-text">
                  <span className="node-title">{step.title}</span>
                  <span className="node-desc">{step.desc}</span>
                </div>
              </div>
              {idx < milestones.length - 1 && (
                <div className="stepper-connector">
                  <ChevronRight size={14} className="connector-arrow" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Interview Prep Card */}
      <Card
        title="Interview Preparation"
        subtitle="AI-predicted technical & behavioral interview questions"
        icon={HelpCircle}
        className="interview-preview-card"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/interview')}
          >
            Start Interview Prep
          </Button>
        }
      >
        <div className="interview-preview-body">
          <div className="interview-readiness-highlight">
            <div className="readiness-score-box">
              <span className="readiness-score-number">72%</span>
              <span className="readiness-score-label">Readiness Score</span>
            </div>
            <div className="readiness-stats-breakdown">
              <div className="prep-stat-item">
                <Code2 size={16} className="text-blue" />
                <div>
                  <strong>16</strong>
                  <span>Technical Questions</span>
                </div>
              </div>
              <div className="prep-stat-item">
                <Users size={16} className="text-purple" />
                <div>
                  <strong>8</strong>
                  <span>HR Questions</span>
                </div>
              </div>
              <div className="prep-stat-item highlight">
                <div>
                  <strong>24</strong>
                  <span>Total Predicted Questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

