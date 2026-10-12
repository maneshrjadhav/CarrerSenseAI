import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Cpu,
  Target,
  BarChart3,
  Compass,
  FileCheck,
  ChevronRight,
  Trash2,
  XCircle,
  UploadCloud,
  Save,
  RotateCcw,
  FileUp,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import jobMatchService from '../services/jobMatchService';
import analysisService from '../services/analysisService';
import { useToast } from '../context/ToastContext';

const PIPELINE_STAGES = [
  { id: 1, label: '01 Job Description Received' },
  { id: 2, label: '02 Text Cleaning & Preprocessing' },
  { id: 3, label: '03 NLP Tokenization' },
  { id: 4, label: '04 Stopword Removal' },
  { id: 5, label: '05 Lemmatization to Root Forms' },
  { id: 6, label: '06 Skill Extraction from Requirements' },
  { id: 7, label: '07 Skill Taxonomy Normalization' },
  { id: 8, label: '08 Resume Skill Comparison' },
  { id: 9, label: '09 TF-IDF Vectorization' },
  { id: 10, label: '10 Cosine Similarity Calculation' },
  { id: 11, label: '11 Final Weighted Match Scoring' },
  { id: 12, label: '12 Skill Gap & Priority Detection' },
  { id: 13, label: '13 Personalized Roadmap Synthesis' },
  { id: 14, label: '14 Analysis Complete' }
];

const DEFAULT_SAMPLE_JD = `We are looking for a Full Stack Developer with experience in React, Node.js, Express.js, MongoDB, MySQL, REST APIs, Git, Docker, AWS, and responsive web development. The ideal candidate will design scalable architectures, develop secure microservices, write clean testable code, and collaborate effectively across agile engineering teams. Requirements: 2+ years software engineering experience, solid computer science fundamentals, proficient with relational and NoSQL databases, CI/CD pipelines, and cloud deployments.`;

export default function JobMatch() {
  const { resumeId: paramResumeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(paramResumeId ? parseInt(paramResumeId) : null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingResumes, setLoadingResumes] = useState(true);

  // Form State
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [companyName, setCompanyName] = useState('TechCorp Solutions');
  const [jobDescription, setJobDescription] = useState(DEFAULT_SAMPLE_JD);

  // Upload state
  const [uploadingResume, setUploadingResume] = useState(false);

  // Modals
  const [showDeselectModal, setShowDeselectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

  // Match Execution State
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Format Helpers
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Load user resumes
  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const list = await jobMatchService.getUserResumes();
      setResumes(list);

      if (paramResumeId) {
        const found = list.find((r) => r.id === parseInt(paramResumeId));
        if (found) {
          setSelectedResume(found);
          setSelectedResumeId(found.id);
        } else {
          setSelectedResumeId(parseInt(paramResumeId));
        }
      } else if (!selectedResumeId && list.length > 0) {
        setSelectedResume(list[0]);
        setSelectedResumeId(list[0].id);
      } else if (selectedResumeId) {
        const found = list.find((r) => r.id === selectedResumeId);
        if (found) setSelectedResume(found);
      }
    } catch (err) {
      // Fallback
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [paramResumeId]);

  // Handle switching resume
  const handleResumeSelect = (id) => {
    setSelectedResumeId(id);
    const found = resumes.find((r) => r.id === id);
    setSelectedResume(found || null);
    toast.info(`Active resume switched to #${id}`);
  };

  // Handle in-page file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are supported for resume matching.');
      return;
    }

    try {
      setUploadingResume(true);
      toast.info(`Uploading and parsing ${file.name}...`);
      const uploadRes = await analysisService.uploadResume(file);

      if (uploadRes.success && uploadRes.resume_id) {
        toast.success('Resume uploaded! Running intelligence extraction...');
        await analysisService.analyzeResume(uploadRes.resume_id);

        toast.success('Resume parsed and ready for Job Match!');
        const updatedList = await jobMatchService.getUserResumes();
        setResumes(updatedList);
        const newlyAdded = updatedList.find((r) => r.id === uploadRes.resume_id);
        setSelectedResumeId(uploadRes.resume_id);
        setSelectedResume(newlyAdded || null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Confirm Deselection (Remove from Current Selection only)
  const handleConfirmDeselect = () => {
    setSelectedResumeId(null);
    setSelectedResume(null);
    setShowDeselectModal(false);
    toast.info('Resume deselected from current job match.');
  };

  // Confirm Permanent Deletion (Deletes file & database records)
  const handleConfirmDelete = async () => {
    if (!selectedResumeId) return;
    setDeletingResume(true);
    try {
      await jobMatchService.deleteResume(selectedResumeId);
      toast.success('Resume permanently deleted from your account.');
      setShowDeleteModal(false);

      // Refresh list
      const updatedList = await jobMatchService.getUserResumes();
      setResumes(updatedList);
      if (updatedList.length > 0) {
        setSelectedResume(updatedList[0]);
        setSelectedResumeId(updatedList[0].id);
      } else {
        setSelectedResume(null);
        setSelectedResumeId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Could not delete resume.');
    } finally {
      setDeletingResume(false);
    }
  };

  // Draft Management in localStorage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        'careersense_jd_draft',
        JSON.stringify({
          targetRole,
          companyName,
          jobDescription,
          savedAt: new Date().toISOString()
        })
      );
      toast.success('Job description draft saved to browser storage!');
    } catch {
      toast.error('Could not save draft to local storage.');
    }
  };

  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem('careersense_jd_draft');
      if (!raw) {
        toast.warning('No saved draft found.');
        return;
      }
      const data = JSON.parse(raw);
      if (data.targetRole) setTargetRole(data.targetRole);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.jobDescription) setJobDescription(data.jobDescription);
      toast.success('Job description draft loaded!');
    } catch {
      toast.error('Could not load draft.');
    }
  };

  const handleClearDescription = () => {
    setJobDescription('');
    toast.info('Job description text cleared.');
  };

  const handleLoadSample = () => {
    setTargetRole('Full Stack Developer');
    setCompanyName('TechCorp Solutions');
    setJobDescription(DEFAULT_SAMPLE_JD);
    toast.info('Loaded sample Job Description template.');
  };

  const isJdValid = jobDescription.trim().length >= 100;
  const isFormValid = Boolean(selectedResumeId) && Boolean(targetRole.trim()) && isJdValid;

  const handleStartMatch = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!selectedResumeId) {
      setErrorMessage('Please upload or select a resume first.');
      toast.warning('Please select or upload a resume before matching.');
      return;
    }

    if (!targetRole.trim()) {
      setErrorMessage('Please enter the target job role.');
      toast.warning('Target job role is required.');
      return;
    }

    if (!isJdValid) {
      setErrorMessage('Please enter a complete job description (minimum 100 characters required).');
      toast.warning('Job description must be at least 100 characters.');
      return;
    }

    setAnalyzing(true);
    setActiveStepIndex(0);

    // Live step progression tracker
    const stepTimer = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < PIPELINE_STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 380);

    try {
      const res = await jobMatchService.analyzeJobMatch({
        resumeId: selectedResumeId,
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim(),
      });

      clearInterval(stepTimer);
      setActiveStepIndex(PIPELINE_STAGES.length - 1);

      toast.success('Job Match analysis complete! Redirecting to results...');
      const matchId = res.match_id || res.analysis_id;
      setTimeout(() => {
        navigate(`/job-match-result/${matchId}`);
      }, 600);
    } catch (err) {
      clearInterval(stepTimer);
      setAnalyzing(false);
      const msg = err.message || 'Job match analysis failed. Please verify your inputs.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
        <div>
          <h1 className="page-title" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main, #1e293b)', margin: 0 }}>
            Job Match Intelligence
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-muted, #64748b)', marginTop: '6px' }}>
            Compare your resume with a real job description and discover exactly what skills you need to improve.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="analyze-grid">
        {/* Left Column: Form & Resume Controls */}
        <div className="analyze-main-col">
          {/* Active Resume Card */}
          <Card
            className="mb-4"
            title="1. Selected Candidate Resume"
            subtitle="The baseline document evaluated against requisition criteria"
          >
            {loadingResumes ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                <div className="spinner-primary mx-auto mb-2" style={{ width: '24px', height: '24px' }}></div>
                <span style={{ fontSize: '0.85rem' }}>Loading candidate resumes...</span>
              </div>
            ) : !selectedResumeId || !selectedResume ? (
              /* Empty Resume Selection State */
              <div
                style={{
                  padding: '24px 20px',
                  textAlign: 'center',
                  background: 'var(--card-subtle-bg, #f8fafc)',
                  border: '1.5px dashed var(--border-color, #cbd5e1)',
                  borderRadius: '10px'
                }}
              >
                <AlertCircle size={32} className="text-amber mx-auto mb-2" />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-main, #1e293b)', fontWeight: '700' }}>
                  No Resume Currently Selected
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Please select one of your uploaded resumes or upload a new PDF document to begin Job Description matching.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {resumes.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        onChange={(e) => handleResumeSelect(parseInt(e.target.value))}
                        defaultValue=""
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          background: '#fff',
                          color: '#1e293b'
                        }}
                      >
                        <option value="" disabled>Select from uploaded resumes...</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.filename} (ID #{r.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  <Button
                    variant="primary"
                    size="md"
                    icon={UploadCloud}
                    loading={uploadingResume}
                    disabled={uploadingResume}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload New Resume PDF
                  </Button>
                </div>
              </div>
            ) : (
              /* Selected Resume Card with Rich Metadata */
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    padding: '16px',
                    background: 'var(--card-subtle-bg, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                    <div
                      style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        padding: '12px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileCheck size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main, #1e293b)' }}>
                          {selectedResume.filename}
                        </strong>
                        <span
                          style={{
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          ✓ Ready for Matching
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #64748b)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span>ID: <strong>#{selectedResume.id}</strong></span>
                        <span>•</span>
                        <span>Size: <strong>{formatFileSize(selectedResume.file_size)}</strong></span>
                        <span>•</span>
                        <span>Uploaded: <strong>{formatDate(selectedResume.uploaded_at)}</strong></span>
                        <span>•</span>
                        <span style={{ color: '#059669' }}>PyMuPDF text verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Selected Resume */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      onClick={() => setShowDeselectModal(true)}
                      title="Remove from current Job Match selection without deleting from database"
                    >
                      Remove from Selection
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      title="Permanently delete this resume from MySQL and disk"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Switch Resume & Upload Another Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color, #f1f5f9)',
                    flexWrap: 'wrap'
                  }}
                >
                  {resumes.length > 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>Switch active resume:</span>
                      <select
                        value={selectedResumeId || ''}
                        onChange={(e) => handleResumeSelect(parseInt(e.target.value))}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          background: 'var(--card-bg, #fff)',
                          color: 'var(--text-main, #1e293b)'
                        }}
                      >
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.filename} (ID #{r.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                      1 resume uploaded on your candidate profile.
                    </span>
                  )}

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={UploadCloud}
                      loading={uploadingResume}
                      disabled={uploadingResume}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Another Resume PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Job Requisition Form */}
          <Card
            title="2. Target Job Role &amp; Requisition Details"
            subtitle="Paste the complete job description to screen against your skills and TF-IDF profile"
            className="mb-4"
          >
            <form onSubmit={handleStartMatch}>
              <div className="form-row-dual mb-4">
                <div className="form-group flex-1">
                  <label className="input-label" style={{ fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                    Target Job Role *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Full Stack Developer, DevOps Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    disabled={analyzing}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="input-label" style={{ fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                    Hiring Company (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TechCorp Solutions, Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={analyzing}
                  />
                </div>
              </div>

              <div className="form-group mb-2">
                <div className="flex-between mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ fontWeight: '600', color: 'var(--text-main, #1e293b)' }}>
                    Paste Full Job Description *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: isJdValid ? '#059669' : '#dc2626'
                      }}
                    >
                      {jobDescription.length} / 5000 characters {isJdValid ? '✓' : '(minimum 100 required)'}
                    </span>
                  </div>
                </div>
                <textarea
                  className="form-textarea"
                  rows={9}
                  placeholder="Paste the full job requirements, technical responsibilities, frameworks, databases, and qualifications here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={analyzing}
                  style={{
                    borderColor: jobDescription.length > 0 && !isJdValid ? '#f87171' : undefined,
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                  required
                ></textarea>
                {!isJdValid && jobDescription.length > 0 && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
                    Please enter a complete job description for accurate analysis (minimum 100 characters).
                  </p>
                )}
              </div>

              {/* Form Toolbar: Drafts, Clear, Templates */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '20px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Save}
                    onClick={handleSaveDraft}
                    disabled={analyzing || !jobDescription.trim()}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={FolderOpen}
                    onClick={handleLoadDraft}
                    disabled={analyzing}
                  >
                    Load Draft
                  </Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleClearDescription}
                    disabled={analyzing || !jobDescription}
                  >
                    Clear Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Sparkles}
                    onClick={handleLoadSample}
                    disabled={analyzing}
                  >
                    Use Sample JD
                  </Button>
                </div>
              </div>

              {errorMessage && (
                <div className="field-error-alert mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={Sparkles}
                  loading={analyzing}
                  disabled={!isFormValid || analyzing}
                  onClick={handleStartMatch}
                  style={{ minWidth: '250px', fontSize: '1rem', fontWeight: '700' }}
                >
                  {analyzing ? 'Analyzing Job Match...' : '✨ Run Job Match Analysis'}
                </Button>

                {!selectedResumeId && (
                  <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>
                    * Select or upload a resume above to proceed.
                  </span>
                )}
              </div>
            </form>
          </Card>

          {/* Live Pipeline Tracker */}
          {analyzing && (
            <Card className="analysis-progress-card mb-4">
              <div className="progress-header-box mb-4">
                <div className="spinner-primary"></div>
                <div>
                  <h3 className="progress-main-title">Executing Career Intelligence Engine</h3>
                  <p className="progress-main-sub">
                    Normalizing taxonomy, computing semantic alignment, and identifying skill gaps...
                  </p>
                </div>
              </div>

              <div className="processing-steps-tracker" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {PIPELINE_STAGES.map((step, idx) => {
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

        {/* Right Sidebar: Student Guidance */}
        <div className="analyze-side-col">
          <Card title="Job Match Guidance" subtitle="How CareerSense AI evaluates alignment" className="mb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-main, #1e293b)', display: 'block' }}>Direct Skill Comparison</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Categorizes competencies into Matched (✓), Partial (◐), and Missing (✕) skills.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-main, #1e293b)', display: 'block' }}>Semantic Relevance</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Compares your resume text against the job requirements using TF-IDF and Cosine Similarity.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-main, #1e293b)', display: 'block' }}>Skill Gap Breakdown</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Highlights high-priority missing competencies and suggests targeted practice projects.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--card-subtle-bg, #f8fafc)', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-main, #1e293b)', display: 'block' }}>Personalized Career Roadmap</strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    Synthesizes a time-based study plan customized to your weekly hours and learning style.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Tips for Best Match Results" subtitle="Guidelines for job postings">
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-muted, #475569)', lineHeight: '1.6' }}>
              <li>Paste the full job description including responsibilities and required qualifications.</li>
              <li>Include specific technology stacks and tools (e.g. React, Node.js, Docker, AWS).</li>
              <li>Ensure the description has enough detail for complete keyword extraction.</li>
              <li>Keep the target role name standard (e.g., Full Stack Developer, Backend Engineer).</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal: Remove from Current Selection */}
      {showDeselectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ padding: '8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '8px' }}>
                <XCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>
                Deselect Resume from Job Match?
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', lineHeight: '1.5', marginBottom: '20px' }}>
              This will remove <strong>{selectedResume?.filename}</strong> from your active selection for this job match.
              <br /><br />
              <span style={{ color: '#059669', fontWeight: '600' }}>
                ✓ Your resume file and prior analysis records in MySQL will NOT be deleted.
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="md" onClick={() => setShowDeselectModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmDeselect}>
                Confirm Deselect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Permanently Delete Resume */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: 'var(--card-bg, #ffffff)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#dc2626' }}>
                Permanently Delete Resume?
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to permanently delete <strong>{selectedResume?.filename}</strong> (ID #{selectedResumeId})?
              <br /><br />
              <strong style={{ color: '#dc2626' }}>
                Warning: This action will permanently remove the PDF file and cascade-delete all related skill analyses from the database. This cannot be undone.
              </strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" size="md" onClick={() => setShowDeleteModal(false)} disabled={deletingResume}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={Trash2}
                loading={deletingResume}
                disabled={deletingResume}
                onClick={handleConfirmDelete}
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
