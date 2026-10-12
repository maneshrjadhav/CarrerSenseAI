import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  FileCode,
  Cpu,
  Layers,
  Briefcase,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import Button from '../common/Button';

export default function ResumeIntelligence({ resumes = [] }) {
  const navigate = useNavigate();
  const hasResume = resumes && resumes.length > 0;

  const pipelineStages = [
    { title: 'PDF Upload', icon: UploadCloud, desc: 'Secure parsing' },
    { title: 'Text Extraction', icon: FileCode, desc: 'PyMuPDF parser' },
    { title: 'NLP Processing', icon: Cpu, desc: 'NLTK tokenization' },
    { title: 'Skill Extraction', icon: Layers, desc: 'Ontology matching' },
    { title: 'Job Matching', icon: Briefcase, desc: 'TF-IDF & Cosine' },
    { title: 'Career Roadmap', icon: Compass, desc: 'Milestone planner' },
  ];

  return (
    <div className="dashboard-card resume-intelligence-card">
      <div className="card-header-row">
        <div>
          <span className="card-badge">CORE NLP ENGINE</span>
          <h2 className="card-title">Resume Intelligence</h2>
        </div>
        <span className="pipeline-state-badge">Stage 1 Ready</span>
      </div>

      {/* Main Status Area */}
      {!hasResume ? (
        <div className="resume-empty-callout">
          <div className="empty-callout-icon">
            <FileText size={28} className="text-primary" />
          </div>
          <div className="empty-callout-text">
            <h3>No Resume Active</h3>
            <p>Upload your resume to unlock AI career analysis, semantic matching, and gap detection.</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            onClick={() => navigate('/resume-analyzer')}
          >
            Upload Resume
          </Button>
        </div>
      ) : (
        <div className="resume-active-row">
          <div className="resume-file-info">
            <FileText size={24} className="text-emerald" />
            <div>
              <strong>{resumes[0].filename}</strong>
              <span>Status: {resumes[0].status}</span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/resume-analyzer')}
          >
            View Document
          </Button>
        </div>
      )}

      {/* Visual Pipeline Architecture Preview */}
      <div className="pipeline-architecture-block">
        <div className="pipeline-block-header">
          <span>AI PROCESSING PIPELINE PREVIEW</span>
          <span className="pipeline-notice">
            <Info size={12} />
            Activates upon PDF upload
          </span>
        </div>

        <div className="pipeline-nodes-track">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.title}>
                <div className="pipeline-node-card">
                  <div className="pipeline-node-icon">
                    <Icon size={16} />
                  </div>
                  <strong className="pipeline-node-title">{stage.title}</strong>
                  <span className="pipeline-node-desc">{stage.desc}</span>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <div className="pipeline-track-connector" aria-hidden="true">
                    <span>→</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

