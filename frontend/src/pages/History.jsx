import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  Download,
  FileText,
  Calendar,
  Briefcase,
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import analysisService from '../services/analysisService';

export default function History() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      try {
        setLoading(true);
        setError('');
        const res = await analysisService.getAnalysisHistory();
        if (mounted) {
          if (res.success) {
            setHistoryList(res.history || []);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve analysis history.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = (analysisId) => {
    const url = analysisService.getDownloadUrl(analysisId);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="page-container flex-center min-h-400">
        <div className="text-center">
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Loading Analysis History...</h3>
          <p className="text-secondary text-sm">Querying historical database records from MySQL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-2" />
          <h1 className="page-title">Analysis History &amp; Audit Trail</h1>
          <p className="page-subtitle">
            Historical records of candidate resume screenings, TF-IDF comparisons, and skill gap reports.
          </p>
        </div>
        <Button variant="primary" icon={Sparkles} onClick={() => navigate('/resume-analyzer')}>
          New Analysis
        </Button>
      </div>

      {historyList.length === 0 ? (
        <Card className="empty-state-card text-center p-8 mt-4">
          <div className="empty-state-icon mx-auto mb-3">
            <Clock size={44} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No Previous Analyses Found</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm">
            You haven't run any resume intelligence analyses yet. Upload a PDF resume and match it against a job description to generate your first audit record.
          </p>
          <Button variant="primary" icon={Sparkles} onClick={() => navigate('/resume-analyzer')}>
            Analyze Resume Now →
          </Button>
        </Card>
      ) : (
        <div className="history-list-cards space-y-4">
          {historyList.map((item) => {
            const formattedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            return (
              <Card key={item.id} className="history-card hover-lift">
                <div className="flex-between flex-wrap gap-4">
                  <div className="flex-items-center gap-4">
                    <div className="history-icon-badge">
                      <FileText size={24} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex-items-center gap-2">
                        <h3 className="font-bold text-base text-dark">{item.target_role}</h3>
                        <Badge
                          variant={item.match_score >= 70 ? 'emerald' : item.match_score >= 40 ? 'blue' : 'amber'}
                          size="sm"
                        >
                          {item.match_score}% Match
                        </Badge>
                      </div>
                      <div className="history-meta-sub flex-items-center gap-3 mt-1 text-xs text-secondary">
                        <span className="flex-items-center gap-1">
                          <Calendar size={12} /> {formattedDate}
                        </span>
                        <span>•</span>
                        <span>{item.resume_filename}</span>
                        <span>•</span>
                        <span className="text-rose font-medium">
                          {item.missing_skills_count} Missing Skills
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="history-actions-row flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={() => handleDownload(item.id)}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate(`/analysis/${item.id}`)}
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
