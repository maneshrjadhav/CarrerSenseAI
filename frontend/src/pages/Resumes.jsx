import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, RefreshCw, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function Resumes() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([
    {
      id: 1,
      filename: 'Resume_Manesh_2026.pdf',
      uploadedAt: 'Oct 07, 2026',
      status: 'Analyzed',
      matchScore: 78,
      size: '1.4 MB',
      isPrimary: true,
    },
    {
      id: 2,
      filename: 'Manesh_Resume_FullStack.pdf',
      uploadedAt: 'Sep 28, 2026',
      status: 'Analyzed',
      matchScore: 71,
      size: '1.2 MB',
      isPrimary: false,
    },
    {
      id: 3,
      filename: 'Resume_Frontend_V1.pdf',
      uploadedAt: 'Sep 15, 2026',
      status: 'Draft',
      matchScore: 65,
      size: '980 KB',
      isPrimary: false,
    },
  ]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this resume record?')) {
      setResumes(resumes.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">My Resumes</h2>
          <p className="page-subtitle">Manage your uploaded resume documents and view parsing details.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/analyze')}>
          Upload New Resume
        </Button>
      </div>

      <Card>
        <div className="table-responsive">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Resume Name</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Match Score</th>
                <th>File Size</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((item) => (
                <tr key={item.id} className="match-table-row">
                  <td>
                    <div className="resume-name-cell">
                      <FileText size={18} className="text-primary" />
                      <div>
                        <strong>{item.filename}</strong>
                        {item.isPrimary && (
                          <span className="primary-pill">Primary</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{item.uploadedAt}</td>
                  <td>
                    <Badge variant={item.status === 'Analyzed' ? 'emerald' : 'gray'} size="sm">
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    <span className="score-number-badge">{item.matchScore}%</span>
                  </td>
                  <td>{item.size}</td>
                  <td className="text-right">
                    <div className="table-actions-group">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => alert(`Viewing metadata for: ${item.filename}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        onClick={() => navigate('/analyze')}
                      >
                        Analyze
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        className="text-red"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

