import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Cpu,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BackButton from '../components/common/BackButton';
import analysisService from '../services/analysisService';
import { getAuthToken } from '../services/authService';
import TargetedResumeBuilderModal from '../components/resume/TargetedResumeBuilderModal';

const PROCESSING_STEPS = [
  { id: 1, label: '01 Uploading Resume' },
  { id: 2, label: '02 PyMuPDF Text Extraction' },
  { id: 3, label: '03 NLP Tokenization & Lemmatization' },
  { id: 4, label: '04 Skill Extraction & Categorization' },
  { id: 5, label: '05 Section Detection & Formatting' },
  { id: 6, label: '06 Resume Quality Scoring (0-100)' },
  { id: 7, label: '07 Generating Strengths & Suggestions' },
  { id: 8, label: '08 Analysis Complete' }
];

export default function Analyze() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Targeted resume builder state
  const [targetedBuilderOpen, setTargetedBuilderOpen] = useState(false);
  const [existingResumes, setExistingResumes] = useState([]);
  const [selectedResumeIdForBuilder, setSelectedResumeIdForBuilder] = useState(null);

  // Optional JD matching toggle state
  const [showOptionalJD, setShowOptionalJD] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const fileInputRef = useRef(null);

  React.useEffect(() => {
    async function loadResumes() {
      try {
        const list = await analysisService.getUserResumes();
        if (list && list.length > 0) {
          setExistingResumes(list);
          setSelectedResumeIdForBuilder(list[0].id);
        }
      } catch (_) {}
    }
    loadResumes();
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleSelectedFile = (selected) => {
    setFileError('');
    setErrorMessage('');

    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file format. Only PDF files are accepted.');
      return;
    }

    if (selected.size === 0) {
      setFileError('The selected file is empty (0 bytes). Please select a valid PDF.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds the 10 MB limit. Please select a smaller PDF.');
      return;
    }

    setFile(selected);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartAnalysis = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFileError('');

    const token = getAuthToken();
    if (!token) {
      setErrorMessage('Authentication required. Please log in.');
      return;
    }

    if (!file) {
      setFileError('Please select a PDF resume first.');
      return;
    }

    setAnalyzing(true);
    setActiveStepIndex(0);

    // Realistic progressive step animation
    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < PROCESSING_STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      // 1. Upload Resume PDF to MySQL backend
      const uploadResult = await analysisService.uploadResume(file);
      const resumeId = uploadResult.resume_id;

      if (!resumeId) {
        throw new Error(uploadResult.message || 'Failed to initialize resume record.');
      }

      // Check if user also provided optional JD for full matching
      if (showOptionalJD && jobDescription.trim().length >= 25) {
        // Run full JD match
        const jdResult = await analysisService.createAnalysis({
          resumeId: resumeId,
          targetRole: targetRole.trim() || 'Software Engineer',
          jobDescription: jobDescription.trim(),
          companyName: companyName.trim()
        });

        clearInterval(stepInterval);
        setActiveStepIndex(PROCESSING_STEPS.length - 1);

        setTimeout(() => {
          navigate(`/analysis/${jdResult.analysis_id}`);
        }, 600);
      } else {
        // Run independent Resume Intelligence Analysis
        await analysisService.analyzeResume(resumeId);

        clearInterval(stepInterval);
        setActiveStepIndex(PROCESSING_STEPS.length - 1);

        setTimeout(() => {
          navigate(`/resume-analysis/${resumeId}`);
        }, 600);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        'Something went wrong while analyzing your resume. Please try again.'
      );
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
        <div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Resume Intelligence
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '6px' }}>
            Understand your resume, discover your strengths, and find the skills you need for your target career.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="analyze-grid">
        <div className="analyze-main-col">
          {/* Targeted Resume Builder Banner */}
          <Card className="mb-4" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%)', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    Build a Job-Targeted Resume
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>
                    Optimize your resume for any target requisition with zero fabrication, transparent in-progress competencies, and ATS PDF export.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                icon={Sparkles}
                onClick={() => setTargetedBuilderOpen(true)}
              >
                Build Targeted Resume →
              </Button>
            </div>
          </Card>

          {/* Card 1: Resume Upload */}
          <Card className="mb-4">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                Upload Your Resume
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                Upload your latest PDF resume and let CareerSense AI analyze your skills, experience, and career readiness.
              </p>
            </div>

            <div
              className={`dropzone-box ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !file && !analyzing && fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: file ? '24px' : '40px 20px',
                textAlign: 'center',
                backgroundColor: isDragging ? '#f0f9ff' : file ? '#f8fafc' : '#ffffff',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden-file-input"
                onChange={(e) => e.target.files && handleSelectedFile(e.target.files[0])}
                disabled={analyzing}
              />

              {file ? (
                <div className="file-selected-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCheck size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{file.name}</strong>
                        <span
                          style={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '9999px'
                          }}
                        >
                          ✓ Resume selected
                        </span>
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span style={{ color: '#059669', fontWeight: '600' }}>✓ PDF only</span>
                        <span>•</span>
                        <span style={{ color: '#0284c7', fontWeight: '600' }}>✓ Ready for analysis</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    title="Remove file"
                    onClick={handleRemoveFile}
                    disabled={analyzing}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="dropzone-prompt">
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <UploadCloud size={30} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', margin: '0 0 4px 0' }}>
                    Drag &amp; drop your PDF here
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 12px 0' }}>
                    OR <span style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'underline' }}>Browse from computer</span>
                  </p>
                  <div style={{ display: 'inline-flex', gap: '12px', fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '9999px' }}>
                    <span>✓ PDF only</span>
                    <span>•</span>
                    <span>✓ Maximum 10 MB</span>
                  </div>
                </div>
              )}
            </div>

            {fileError && (
              <div className="field-error-alert mt-3" style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{fileError}</span>
              </div>
            )}

            {errorMessage && (
              <div className="field-error-alert mt-3" style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div style={{ marginTop: '22px' }}>
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                loading={analyzing}
                disabled={!file || analyzing}
                onClick={handleStartAnalysis}
                style={{
                  minWidth: '240px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  opacity: file ? 1 : 0.6,
                  cursor: file ? 'pointer' : 'not-allowed'
                }}
              >
                {analyzing ? 'Analyzing Profile...' : '✨ Analyze My Resume'}
              </Button>
            </div>
          </Card>

          {/* Job Matching Notice */}
          <Card className="mb-4">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  Next Step: Match Against a Job Requisition
                </h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  After your resume is analyzed, you can run a <strong>Job Match</strong> against any target job description to discover exact missing skills and generate a personalized learning roadmap.
                </p>
                <Link
                  to="/job-match"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', textDecoration: 'none' }}
                >
                  Explore Job Matching <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>

          {/* Live Progress Overlay */}
          {analyzing && (
            <Card className="analysis-progress-card mb-4">
              <div className="progress-header-box mb-4" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="spinner-primary"></div>
                <div>
                  <h3 className="progress-main-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    Analyzing Your Resume
                  </h3>
                  <p className="progress-main-sub" style={{ margin: '2px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                    Extracting skills, assessing formatting quality, and structuring recommendations...
                  </p>
                </div>
              </div>

              <div className="processing-steps-tracker">
                {PROCESSING_STEPS.map((step, idx) => {
                  const isDone = idx < activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={step.id}
                      className={`pipeline-step-item ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-current' : ''}`}
                    >
                      <div className="step-indicator">
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-emerald" />
                        ) : isCurrent ? (
                          <div className="pulse-dot"></div>
                        ) : (
                          <span className="step-num">{step.id}</span>
                        )}
                      </div>
                      <span className="step-text">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Student Guidance & Real Profile Metrics */}
        <div className="analyze-side-col">
          <Card title="Student Career Intelligence" subtitle="What CareerSense AI evaluates" className="mb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#1e293b', display: 'block' }}>Technical Skill Extraction</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Identifies programming languages, frameworks, databases, and DevOps tools.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#1e293b', display: 'block' }}>ATS Section Completeness</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Verifies Experience, Education, Projects, and Skills formatting for recruiting filters.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#1e293b', display: 'block' }}>Action Verbs &amp; Impact</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Detects measurable achievements and metrics in your work and project experience.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#1e293b', display: 'block' }}>Job Matching &amp; Roadmaps</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Identifies missing competencies for your target role and builds a weekly learning plan.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Quick Tips for Best Results" subtitle="Guidelines for student resumes">
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#475569', lineHeight: '1.6' }}>
              <li>Use a clean, single-column or clean dual-column PDF.</li>
              <li>Include clearly labeled sections: Experience, Education, Projects, Skills.</li>
              <li>Highlight specific technologies (e.g. React, Docker, Python).</li>
              <li>Quantify project achievements with numbers where possible.</li>
            </ul>
          </Card>
        </div>
      </div>

      <TargetedResumeBuilderModal
        isOpen={targetedBuilderOpen}
        onClose={() => setTargetedBuilderOpen(false)}
        initialData={{
          resumeId: selectedResumeIdForBuilder || existingResumes[0]?.id,
          targetRole: targetRole || 'Software Engineer',
          companyName: companyName,
          jobDescription: jobDescription,
        }}
      />
    </div>
  );
}
