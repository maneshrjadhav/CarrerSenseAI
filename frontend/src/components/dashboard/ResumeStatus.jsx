import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, RefreshCw, Eye, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ResumeStatus({
  filename = 'Resume_Manesh_2026.pdf',
  analyzed = true,
  pdfParsed = true,
  nlpReady = true,
  uploadDate = 'Today, 02:45 PM',
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Resume Status"
      subtitle="Document parsing & NLP readiness"
      icon={FileText}
      className="resume-status-card"
    >
      <div className="resume-status-content">
        <div className="resume-status-banner">
          <div className="status-indicator-box">
            <CheckCircle2 size={24} className="status-check-icon" />
            <div>
              <div className="status-main-label">Analyzed</div>
              <span className="status-timestamp">Updated {uploadDate}</span>
            </div>
          </div>
          <Badge variant="emerald" size="sm">✓ Verified</Badge>
        </div>

        <div className="resume-meta-box">
          <div className="meta-row">
            <span className="meta-label">Active Resume:</span>
            <span className="meta-file-badge">
              <FileText size={14} />
              <code>{filename}</code>
            </span>
          </div>

          <div className="meta-chips-grid">
            <div className="meta-chip">
              <span className="chip-key">PDF Parsed:</span>
              <span className="chip-val text-emerald">Yes (PyMuPDF)</span>
            </div>
            <div className="meta-chip">
              <span className="chip-key">NLP Pipeline:</span>
              <span className="chip-val text-blue">Ready (NLTK Tokenized)</span>
            </div>
            <div className="meta-chip">
              <span className="chip-key">TF-IDF Vector:</span>
              <span className="chip-val text-purple">Generated</span>
            </div>
          </div>
        </div>

        <div className="resume-card-actions">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => navigate('/resumes')}
          >
            View Resume
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={() => navigate('/analyze')}
          >
            Analyze Again
          </Button>
        </div>
      </div>
    </Card>
  );
}

