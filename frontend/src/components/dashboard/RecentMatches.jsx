import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowUpRight } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';

export default function RecentMatches({ matches = [] }) {
  const navigate = useNavigate();

  const defaultMatches = [
    { id: 1, title: 'Frontend Developer', company: 'TechNova Labs', match: 87, status: 'High Match', variant: 'emerald' },
    { id: 2, title: 'Python Developer', company: 'DataSphere AI', match: 78, status: 'Good Match', variant: 'blue' },
    { id: 3, title: 'Full Stack Developer', company: 'CloudBridge Corp', match: 71, status: 'Good Match', variant: 'blue' },
    { id: 4, title: 'Java Developer', company: 'Apex Global', match: 62, status: 'Moderate Match', variant: 'amber' },
  ];

  const list = matches.length > 0 ? matches : defaultMatches;

  return (
    <Card
      title="Recent Job Matches"
      subtitle="AI-calculated match against target job descriptions"
      icon={Briefcase}
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate('/matches')}>
          View All Matches
        </Button>
      }
      className="recent-matches-card"
    >
      <div className="matches-table-container">
        <table className="matches-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Match Score</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="match-table-row">
                <td>
                  <div className="job-title-cell">
                    <span className="job-title-text">{item.title}</span>
                  </div>
                </td>
                <td className="company-cell">{item.company}</td>
                <td className="score-cell">
                  <div className="table-score-wrapper">
                    <span className="table-score-num">{item.match}%</span>
                    <ProgressBar
                      value={item.match}
                      variant={item.match >= 80 ? 'emerald' : item.match >= 70 ? 'blue' : 'amber'}
                      height={6}
                      className="table-progress"
                    />
                  </div>
                </td>
                <td>
                  <Badge
                    variant={item.match >= 80 ? 'emerald' : item.match >= 70 ? 'blue' : 'amber'}
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                </td>
                <td className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArrowUpRight}
                    onClick={() => navigate('/matches')}
                  >
                    View Analysis
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

