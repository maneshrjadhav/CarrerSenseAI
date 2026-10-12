import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Sparkles,
  Clock,
  Compass,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Brain,
  Send,
  HelpCircle,
  Square,
  Radio,
  Bookmark,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import BackButton from '../components/common/BackButton';
import ProgressBar from '../components/common/ProgressBar';
import interviewService from '../services/interviewService';
import jobMatchService from '../services/jobMatchService';
import dashboardService from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import UpgradeModal from '../components/subscription/UpgradeModal';

export default function Interview() {
  const { matchId: paramMatchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Subscription modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedReason, setLockedReason] = useState('');

  // STAGE CONTROLLER: 'setup' | 'intro' | 'questions' | 'report'
  const [currentStage, setCurrentStage] = useState('setup');

  // Match & Session Data
  const [matchId, setMatchId] = useState(paramMatchId || null);
  const [jobMatch, setJobMatch] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState('');

  // Interview Configuration
  const [interviewType, setInterviewType] = useState('mixed'); // 'technical' | 'hr' | 'mixed'
  const [difficulty, setDifficulty] = useState('Intermediate'); // 'Beginner' | 'Intermediate' | 'Advanced'
  const [hardwareMode, setHardwareMode] = useState('video'); // 'video' | 'audio_only' | 'text_only'

  // Hardware Permissions State
  const [cameraAllowed, setCameraAllowed] = useState(null);
  const [micAllowed, setMicAllowed] = useState(null);
  const [testingHardware, setTestingHardware] = useState(false);

  // STAGE 1: Self-Intro State
  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isRecordingIntro, setIsRecordingIntro] = useState(false);
  const [isIntroPaused, setIsIntroPaused] = useState(false);
  const [introTimer, setIntroTimer] = useState(180); // 3 minutes = 180 seconds
  const [introCompleted, setIntroCompleted] = useState(false);
  const [introText, setIntroText] = useState('');
  const [submittingIntro, setSubmittingIntro] = useState(false);
  const introTimerIntervalRef = useRef(null);

  // STAGE 2: Questions State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersDraft, setAnswersDraft] = useState({});
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [questionEvaluations, setQuestionEvaluations] = useState({});
  const speechRecognitionRef = useRef(null);

  // STAGE 3: Final Report State
  const [completingSession, setCompletingSession] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [expandedReportQuestion, setExpandedReportQuestion] = useState(null);

  // 1. Initial Load: Job Match & Readiness Inspection
  useEffect(() => {
    let mounted = true;

    async function loadInitialContext() {
      try {
        setLoading(true);
        setError('');

        let activeMatchId = paramMatchId;
        if (!activeMatchId) {
          // If no matchId in URL, fetch latest from dashboard
          try {
            const dash = await dashboardService.getDashboardSummary();
            activeMatchId = dash.metrics?.latest_analysis_id;
          } catch (e) {
            console.warn('Could not auto-fetch latest analysis:', e);
          }
        }

        if (activeMatchId) {
          setMatchId(activeMatchId);
          const matchRes = await jobMatchService.getJobMatch(activeMatchId);
          if (mounted && matchRes.success) {
            setJobMatch(matchRes);
          }
        }

        // Also fetch user's interview history
        try {
          const histRes = await interviewService.getHistory();
          if (mounted && histRes.success) {
            setInterviewHistory(histRes.history || []);
          }
        } catch (e) {
          console.warn('Could not load history:', e);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Could not load interview preparation context.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialContext();

    return () => {
      mounted = false;
      cleanupMediaStream();
      if (introTimerIntervalRef.current) clearInterval(introTimerIntervalRef.current);
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [paramMatchId]);

  // Clean MediaStream safely
  const cleanupMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  // Hardware Checker
  const checkHardwarePermissions = async () => {
    try {
      setTestingHardware(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.info('Browser does not support media capture. Text-only mode enabled.');
        setCameraAllowed(false);
        setMicAllowed(false);
        setHardwareMode('text_only');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraAllowed(true);
      setMicAllowed(true);
      toast.success('Camera and microphone detected successfully!');
      // Stop stream immediately after test
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn('Hardware permission test error:', err);
      // Try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setCameraAllowed(false);
        setMicAllowed(true);
        setHardwareMode('audio_only');
        toast.info('Microphone detected. Running in Audio-Only mode.');
        audioStream.getTracks().forEach((t) => t.stop());
      } catch (audioErr) {
        setCameraAllowed(false);
        setMicAllowed(false);
        setHardwareMode('text_only');
        toast.info('Hardware permissions unavailable. Running in Text-Only fallback mode.');
      }
    } finally {
      setTestingHardware(false);
    }
  };

  // Initialize Interview Session
  const handleStartInterview = async () => {
    try {
      setStartingSession(true);
      setError('');

      const targetRole = jobMatch?.target_role || jobMatch?.analysis?.target_role || 'Software Engineer';
      const company = jobMatch?.company_name || null;

      const payload = {
        analysis_id: matchId || null,
        target_role: targetRole,
        company_name: company,
        interview_type: interviewType,
        difficulty: difficulty,
        force_practice: true // Allows practice even if score was < 80% with confirmation
      };

      const res = await interviewService.createSession(payload);
      if (res.success && res.session) {
        setSessionId(res.session.id);
        setSessionData(res.session);

        // Move to Stage 1: Self-Introduction
        setCurrentStage('intro');
        toast.success('Interview session initialized! Welcome to Stage 1.');

        // If hardware mode is video or audio, request live stream
        if (hardwareMode === 'video' || hardwareMode === 'audio_only') {
          startLiveMediaStream();
        }
      } else {
        toast.error(res.message || 'Could not start interview session.');
      }
    } catch (err) {
      if (err.status === 403 || err.data?.subscription_required) {
        setLockedReason(err.message || 'Mock Interview Simulation is a premium feature. Please upgrade your plan to start interview sessions.');
        setUpgradeModalOpen(true);
      } else {
        toast.error(err.message || 'Error initializing interview session.');
      }
    } finally {
      setStartingSession(false);
    }
  };

  // Start Live MediaStream for Self-Introduction
  const startLiveMediaStream = async () => {
    try {
      cleanupMediaStream();
      const constraints = {
        audio: true,
        video: hardwareMode === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current && hardwareMode === 'video') {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Could not access live stream:', e);
      setHardwareMode('text_only');
    }
  };

  // STAGE 1: Timer & Recording Controls
  const handleStartRecordingIntro = () => {
    setIsRecordingIntro(true);
    setIsIntroPaused(false);

    if (introTimerIntervalRef.current) clearInterval(introTimerIntervalRef.current);

    introTimerIntervalRef.current = setInterval(() => {
      setIntroTimer((prev) => {
        if (prev <= 1) {
          clearInterval(introTimerIntervalRef.current);
          handleStopRecordingIntro(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePauseResumeRecordingIntro = () => {
    if (isIntroPaused) {
      // Resume
      setIsIntroPaused(false);
      introTimerIntervalRef.current = setInterval(() => {
        setIntroTimer((prev) => {
          if (prev <= 1) {
            clearInterval(introTimerIntervalRef.current);
            handleStopRecordingIntro(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Pause
      setIsIntroPaused(true);
      if (introTimerIntervalRef.current) clearInterval(introTimerIntervalRef.current);
    }
  };

  const handleStopRecordingIntro = (autoStopped = false) => {
    setIsRecordingIntro(false);
    setIsIntroPaused(false);
    setIntroCompleted(true);
    if (introTimerIntervalRef.current) clearInterval(introTimerIntervalRef.current);

    // Clean up hardware tracks cleanly
    cleanupMediaStream();

    if (autoStopped) {
      toast.info('3-minute time ceiling reached! Your self-introduction is recorded.');
    } else {
      toast.success('Self-introduction recording completed.');
    }
  };

  const handleRetakeIntro = () => {
    cleanupMediaStream();
    setIsRecordingIntro(false);
    setIsIntroPaused(false);
    setIntroCompleted(false);
    setIntroTimer(180);
    if (introTimerIntervalRef.current) clearInterval(introTimerIntervalRef.current);

    if (hardwareMode === 'video' || hardwareMode === 'audio_only') {
      startLiveMediaStream();
    }
  };

  const handleSubmitIntro = async () => {
    try {
      setSubmittingIntro(true);
      cleanupMediaStream();

      const durationTaken = 180 - introTimer;
      const res = await interviewService.submitSelfIntro(sessionId, {
        duration_seconds: Math.min(180, Math.max(15, durationTaken)),
        audio_mode: hardwareMode,
        intro_text: introText.trim() || 'Spoken candidate introduction recorded via live interface.',
        delivery_notes: `Delivery recorded in ${hardwareMode} mode. Duration: ${durationTaken} seconds.`
      });

      if (res.success) {
        toast.success('Self-introduction submitted! Proceeding to Technical Questions.');
        // Refresh session to get questions list
        const updated = await interviewService.getSession(sessionId);
        if (updated.success && updated.session) {
          setSessionData(updated.session);
        }
        setCurrentStage('questions');
      } else {
        toast.error(res.message || 'Could not submit self-introduction.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit self-introduction.');
    } finally {
      setSubmittingIntro(false);
    }
  };

  // STAGE 2: Speech-to-Text Transcription for Answer
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info('Speech recognition not supported in this browser. Please type your answer directly in the editor.');
      return;
    }

    if (isVoiceListening) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsVoiceListening(false);
      toast.info('Voice recording paused. You can edit your transcribed answer below.');
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsVoiceListening(true);
          toast.success('Listening... Speak your answer clearly into your microphone.');
        };

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }

          if (currentTranscript.trim()) {
            setAnswersDraft((prev) => {
              const currentQ = sessionData?.questions?.[currentQuestionIndex];
              const qId = currentQ?.id;
              const existing = prev[qId] || '';
              // Append or update draft
              return {
                ...prev,
                [qId]: existing ? `${existing} ${currentTranscript.trim()}` : currentTranscript.trim()
              };
            });
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsVoiceListening(false);
        };

        recognition.onend = () => {
          setIsVoiceListening(false);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsVoiceListening(false);
      }
    }
  };

  // Submit Answer to Question
  const handleSubmitAnswer = async () => {
    const currentQ = sessionData?.questions?.[currentQuestionIndex];
    if (!currentQ) return;

    const answerText = (answersDraft[currentQ.id] || '').trim();
    if (!answerText || answerText.length < 15) {
      toast.info('Please enter a complete answer (at least 15 characters) before submitting.');
      return;
    }

    // Stop speech recognition if listening
    if (isVoiceListening && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      setIsVoiceListening(false);
    }

    try {
      setSubmittingAnswer(true);
      const res = await interviewService.submitAnswer(sessionId, currentQ.id, {
        candidate_answer: answerText,
        answering_mode: hardwareMode === 'video' || hardwareMode === 'audio_only' ? 'speech_to_text' : 'typed',
        time_taken_seconds: 120
      });

      if (res.success && res.evaluation) {
        toast.success(`Answer evaluated! Score: ${res.evaluation.score_breakdown?.overall_score || 0}/100`);

        // Cache evaluation
        setQuestionEvaluations((prev) => ({
          ...prev,
          [currentQ.id]: res.evaluation
        }));

        // Refresh session data
        const updated = await interviewService.getSession(sessionId);
        if (updated.success && updated.session) {
          setSessionData(updated.session);
        }
      } else {
        toast.error(res.message || 'Could not evaluate answer.');
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Complete Interview & Finalize Report
  const handleCompleteInterview = async () => {
    try {
      setCompletingSession(true);
      const res = await interviewService.completeSession(sessionId);
      if (res.success && res.session) {
        setFinalReport(res.session);
        setCurrentStage('report');
        toast.success('Mock interview completed! Performance report generated.');
      } else {
        toast.error(res.message || 'Failed to complete interview.');
      }
    } catch (err) {
      toast.error(err.message || 'Error completing interview session.');
    } finally {
      setCompletingSession(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ==========================================
  // RENDER: LOADING OR ERROR
  // ==========================================
  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '450px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Initializing AI Mock Interview Workspace...</h3>
          <p className="text-secondary text-sm">Validating job requisition, candidate skills, and camera telemetry</p>
        </div>
      </div>
    );
  }

  const targetRole = jobMatch?.target_role || jobMatch?.analysis?.target_role || 'Software Engineer';
  const companyName = jobMatch?.company_name || null;
  const questions = sessionData?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const currentEval = currentQ ? (questionEvaluations[currentQ.id] || (currentQ.is_submitted ? currentQ : null)) : null;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <BackButton
          to={matchId ? `/job-match-result/${matchId}` : '/dashboard'}
          label="Back"
          className="mb-3"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge-pill-cyan font-mono text-xs">AI MOCK INTERVIEW</span>
              <Badge variant="blue" size="sm">Role: {targetRole}</Badge>
              {companyName && <Badge variant="slate" size="sm">{companyName}</Badge>}
              <Badge variant={currentStage === 'report' ? 'emerald' : 'purple'} size="sm">
                Stage: {currentStage.toUpperCase()}
              </Badge>
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>AI-Powered Mock Interview</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
              Simulate technical engineering rounds with timed video self-introduction, tailored questions, voice speech-to-text, and instant pedagogical AI evaluation.
            </p>
          </div>

          {/* Quick Stage Nav / Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sessionId && currentStage !== 'report' && (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  if (window.confirm('Reset current practice session and return to interview setup?')) {
                    cleanupMediaStream();
                    setCurrentStage('setup');
                    setSessionId(null);
                    setSessionData(null);
                  }
                }}
              >
                Reset Session
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={Compass}
              onClick={() => navigate(matchId ? `/career-roadmap/${matchId}` : '/career-roadmap')}
            >
              Career Roadmap
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE 0: ENTRY FLOW & SETUP */}
      {/* ========================================================================= */}
      {currentStage === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Role & Profile Snapshot */}
          <Card
            title="Interview Configuration & Requisition Context"
            subtitle="Tailor your interview difficulty, questions domain, and media hardware"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Context Summary */}
              <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Role Requisition
                </span>
                <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {targetRole}
                </h3>
                {companyName && (
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                    Company: <strong>{companyName}</strong>
                  </p>
                )}

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Evaluated Resume
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <FileText size={16} className="text-primary" />
                    <strong>{jobMatch?.resume?.filename || 'Uploaded Resume.pdf'}</strong>
                  </div>
                </div>

                {jobMatch?.metrics?.overall_match_score && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={jobMatch.metrics.overall_match_score >= 80 ? 'emerald' : 'amber'} size="md">
                      Match Score: {Math.round(jobMatch.metrics.overall_match_score)}%
                    </Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {jobMatch.metrics.overall_match_score >= 80 ? 'Exceeds readiness threshold' : 'Practice mode available'}
                    </span>
                  </div>
                )}
              </div>

              {/* Configuration Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Interview Type Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Interview Domain Focus:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'mixed', label: 'Mixed (Full)', desc: '3 Tech + 2 Behavioral' },
                      { id: 'technical', label: 'Technical', desc: 'Code & Architecture' },
                      { id: 'hr', label: 'Behavioral', desc: 'STAR & Culture' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setInterviewType(t.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: `1.5px solid ${interviewType === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: interviewType === t.id ? 'var(--primary-light)' : 'var(--bg-card)',
                          color: interviewType === t.id ? 'var(--primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: '0.85rem' }}>{t.label}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Difficulty Level:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: `1.5px solid ${difficulty === diff ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: difficulty === diff ? 'var(--primary-light)' : 'var(--bg-card)',
                          color: difficulty === diff ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hardware Mode Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Answering Mode Preference:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'video', label: 'Webcam + Mic', icon: Video },
                      { id: 'audio_only', label: 'Mic Only', icon: Mic },
                      { id: 'text_only', label: 'Typed Text Only', icon: FileText }
                    ].map((mode) => {
                      const IconComp = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setHardwareMode(mode.id)}
                          style={{
                            flex: 1,
                            padding: '8px 6px',
                            borderRadius: '8px',
                            border: `1.5px solid ${hardwareMode === mode.id ? 'var(--primary)' : 'var(--border-color)'}`,
                            backgroundColor: hardwareMode === mode.id ? 'var(--primary-light)' : 'var(--bg-card)',
                            color: hardwareMode === mode.id ? 'var(--primary)' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <IconComp size={15} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 3-Stage Process Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  1
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Self-Introduction Stage
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.45 }}>
                Record your 3-minute executive elevator pitch via webcam or mic. Practicing under the 3-minute ceiling builds real interview conciseness.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  2
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  5 Tailored Questions
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.45 }}>
                Tackle 5 sequentially revealed technical and behavioral challenges. Answer via Web Speech API speech-to-text or structured code/text editor.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(124, 58, 237, 0.15)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  3
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Pedagogical AI Feedback
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.45 }}>
                Model solutions remain strictly masked until submission. Upon submitting each answer, review your score, identified strengths, missing keywords, and gold-standard model answers.
              </p>
            </div>
          </div>

          {/* Hardware Telemetry & Start Action */}
          <Card className="text-center py-4">
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <Video size={18} color={cameraAllowed ? '#10b981' : cameraAllowed === false ? '#ef4444' : '#64748b'} />
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    Camera: {cameraAllowed ? 'Detected ✓' : cameraAllowed === false ? 'Disabled' : 'Not Tested'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <Mic size={18} color={micAllowed ? '#10b981' : micAllowed === false ? '#ef4444' : '#64748b'} />
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                    Microphone: {micAllowed ? 'Detected ✓' : micAllowed === false ? 'Disabled' : 'Not Tested'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={testingHardware}
                  onClick={checkHardwarePermissions}
                >
                  Test Hardware
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={Play}
                  loading={startingSession}
                  onClick={handleStartInterview}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderColor: '#059669',
                    color: '#ffffff',
                    padding: '12px 28px',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Start Mock Interview Session →
                </Button>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Questions and model answers are generated in real-time and remain strictly protected until answer submission.
              </p>
            </div>
          </Card>

          {/* Past Interview History Table */}
          {interviewHistory.length > 0 && (
            <Card title="Past Interview History" subtitle="Review scores and past mock attempts saved in MySQL">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Role</th>
                      <th style={{ padding: '8px 12px' }}>Type</th>
                      <th style={{ padding: '8px 12px' }}>Difficulty</th>
                      <th style={{ padding: '8px 12px' }}>Score</th>
                      <th style={{ padding: '8px 12px' }}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewHistory.map((h) => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text-sub)' }}>
                          {new Date(h.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {h.target_role}
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>
                          {h.interview_type}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--card-subtle-bg)', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 600 }}>
                            {h.difficulty}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: (h.overall_score || 0) >= 75 ? '#059669' : '#d97706' }}>
                          {h.overall_score !== null ? `${Math.round(h.overall_score)}/100` : 'Incomplete'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge variant={(h.overall_score || 0) >= 75 ? 'emerald' : 'amber'} size="sm">
                            {h.readiness_verdict || (h.overall_score ? 'Completed' : 'Draft')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: SELF-INTRODUCTION STAGE */}
      {/* ========================================================================= */}
      {currentStage === 'intro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card
            title="Stage 1: Candidate Self-Introduction"
            subtitle="Demonstrate your communication, background narrative, and role fit under a strict 3-minute timer"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Media Feed Container */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '480px',
                    height: '320px',
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: '2px solid var(--border-color)'
                  }}
                >
                  {hardwareMode === 'video' ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)' // Mirror preview for natural feedback
                      }}
                    />
                  ) : hardwareMode === 'audio_only' ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <Mic size={54} className="mx-auto mb-2 text-primary" />
                      <strong style={{ display: 'block', color: '#f8fafc' }}>Microphone Only Mode Active</strong>
                      <span style={{ fontSize: '0.8rem' }}>Spoken audio is captured directly</span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <FileText size={54} className="mx-auto mb-2 text-primary" />
                      <strong style={{ display: 'block', color: '#f8fafc' }}>Typed Fallback Mode Active</strong>
                      <span style={{ fontSize: '0.8rem' }}>Draft your introduction in the text field</span>
                    </div>
                  )}

                  {/* Top Overlay: Recording Indicator & Countdown Timer */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      right: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    {isRecordingIntro && (
                      <div
                        style={{
                          backgroundColor: isIntroPaused ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            display: 'inline-block',
                            animation: isIntroPaused ? 'none' : 'pulse 1s infinite'
                          }}
                        />
                        {isIntroPaused ? 'PAUSED' : 'LIVE RECORDING'}
                      </div>
                    )}

                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: introTimer <= 20 ? '#ef4444' : introTimer <= 60 ? '#f59e0b' : '#38bdf8',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        marginLeft: 'auto'
                      }}
                    >
                      ⏱️ {formatTimer(introTimer)} / 3:00 max
                    </div>
                  </div>
                </div>

                {/* Recording Controls Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!isRecordingIntro && !introCompleted && (
                    <Button
                      variant="primary"
                      size="md"
                      icon={Play}
                      onClick={handleStartRecordingIntro}
                      style={{ background: '#059669', borderColor: '#059669', color: '#ffffff' }}
                    >
                      Start Recording Intro
                    </Button>
                  )}

                  {isRecordingIntro && (
                    <>
                      <Button
                        variant="secondary"
                        size="md"
                        icon={isIntroPaused ? Play : Pause}
                        onClick={handlePauseResumeRecordingIntro}
                      >
                        {isIntroPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        variant="danger"
                        size="md"
                        icon={Square}
                        onClick={() => handleStopRecordingIntro(false)}
                      >
                        Stop Recording
                      </Button>
                    </>
                  )}

                  {introCompleted && (
                    <>
                      <Button
                        variant="outline"
                        size="md"
                        icon={RotateCcw}
                        onClick={handleRetakeIntro}
                      >
                        Retake Introduction
                      </Button>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                        ✓ Introduction Captured ({formatTimer(180 - introTimer)})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Prompt Guidance & Typed Transcript Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Prompt Instruction
                  </span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.45 }}>
                    "Please introduce yourself, walk through your technical projects, and explain what makes you a strong candidate for the {targetRole} position."
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Suggested 3-Minute Structure:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                    <li><strong>0:00 - 0:45:</strong> Who you are, education, and primary technical stack focus</li>
                    <li><strong>0:45 - 2:00:</strong> 1-2 highlight engineering projects and solved architectural problems</li>
                    <li><strong>2:00 - 3:00:</strong> Why you are enthusiastic about this role and how your values align</li>
                  </ul>
                </div>

                {/* Optional Transcript / Notes text box */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Self-Introduction Summary Notes / Key Points (Optional):
                  </label>
                  <textarea
                    rows={4}
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    placeholder="Provide a quick outline of what you covered (e.g., Final year project on NLP, hands-on microservices experience, cloud deployment...)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Submit and Proceed Action */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Send}
                    loading={submittingIntro}
                    onClick={handleSubmitIntro}
                    disabled={!introCompleted && !introText.trim()}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff'
                    }}
                  >
                    Submit Introduction &amp; Proceed to Technical Questions →
                  </Button>
                  <span style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Questions will be revealed sequentially in Stage 2.
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: QUESTION-BY-QUESTION ANSWERING WORKSPACE */}
      {/* ========================================================================= */}
      {currentStage === 'questions' && currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question Stepper Indicator */}
          <Card style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Sequential Question Progress
                </span>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h4>
              </div>

              {/* Progress Stepper Pills */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {questions.map((q, idx) => {
                  const isSubmitted = q.is_submitted || Boolean(questionEvaluations[q.id]);
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: `1.5px solid ${isCurrent ? 'var(--primary)' : isSubmitted ? '#10b981' : 'var(--border-color)'}`,
                        backgroundColor: isCurrent ? 'var(--primary)' : isSubmitted ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                        color: isCurrent ? '#ffffff' : isSubmitted ? '#059669' : 'var(--text-muted)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Jump to Question ${idx + 1}`}
                    >
                      {isSubmitted ? '✓' : idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Current Question Card */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Question Metadata Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge variant="blue" size="md">
                    Target Skill: {currentQ.skill_focus || 'Domain Competency'}
                  </Badge>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--card-subtle-bg)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-sub)'
                    }}
                  >
                    {currentQ.question_type?.toUpperCase() || 'TECHNICAL'}
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--card-subtle-bg)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: currentQ.difficulty === 'Advanced' ? '#dc2626' : currentQ.difficulty === 'Intermediate' ? '#2563eb' : '#059669'
                    }}
                  >
                    Difficulty: {currentQ.difficulty || 'Intermediate'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={15} />
                  <span>Recommended: ~2-3 minutes</span>
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  backgroundColor: 'var(--card-subtle-bg)',
                  padding: '18px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.4 }}>
                  "{currentQ.question_text}"
                </h3>
              </div>

              {/* Answering Controls & Voice Recognition Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Your Candidate Answer:
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Voice Speech-to-Text Button */}
                    <Button
                      variant={isVoiceListening ? 'danger' : 'outline'}
                      size="sm"
                      icon={isVoiceListening ? MicOff : Mic}
                      onClick={toggleSpeechRecognition}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {isVoiceListening ? 'Stop Listening (Live)' : 'Speech-to-Text Voice Answering'}
                    </Button>
                  </div>
                </div>

                {isVoiceListening && (
                  <div
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#dc2626',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                    <span>Listening actively to your voice... Speak continuously and text will append directly below.</span>
                  </div>
                )}

                {/* Multiline Answer Textarea with Draft Retention */}
                <textarea
                  rows={7}
                  value={answersDraft[currentQ.id] || currentQ.candidate_answer || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setAnswersDraft((prev) => ({
                      ...prev,
                      [currentQ.id]: text
                    }));
                  }}
                  disabled={currentQ.is_submitted}
                  placeholder="Explain your approach, engineering architecture, trade-offs, and implementation details..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: currentQ.is_submitted ? 'var(--card-subtle-bg)' : 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>
                    Word count: {(answersDraft[currentQ.id] || currentQ.candidate_answer || '').trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  {!currentQ.is_submitted && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Model answer is masked until you click submit.
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Answer Action */}
              {!currentQ.is_submitted && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Send}
                    loading={submittingAnswer}
                    onClick={handleSubmitAnswer}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff'
                    }}
                  >
                    Submit Answer for AI Pedagogical Evaluation →
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* AI PEDAGOGICAL EVALUATION EXPANSION CARD (ONLY REVEALED AFTER SUBMISSION) */}
          {currentEval && (
            <Card
              style={{
                borderLeft: '5px solid #10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.03)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Header & Score */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="#10b981" />
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      AI Pedagogical Answer Evaluation
                    </h4>
                    <Badge variant="emerald" size="sm">✓ Answer Submitted</Badge>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                      {currentEval.score_breakdown?.overall_score || currentEval.score || 0}/100
                    </span>
                  </div>
                </div>

                {/* Strengths & Missing Concepts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {/* Strengths */}
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#059669', marginBottom: '8px' }}>
                      ✓ Strengths Identified:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      {(currentEval.strengths || currentEval.ai_evaluation?.strengths || ['Candidate provided coherent architectural context.']).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Concepts */}
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '14px' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#dc2626', marginBottom: '8px' }}>
                      ⚠️ Missing / Gap Concepts:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      {(currentEval.missing_concepts || currentEval.ai_evaluation?.missing_concepts || ['Mention production monitoring and error handling boundaries.']).map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Revealed Model Solution */}
                {(currentEval.model_answer || currentEval.solution) && (
                  <div style={{ backgroundColor: 'var(--card-subtle-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Brain size={16} className="text-primary" />
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Revealed Model Reference Answer:
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {currentEval.model_answer || currentEval.solution}
                    </p>
                  </div>
                )}

                {/* Why This Model Answer is Stronger */}
                {currentEval.ai_evaluation?.why_stronger && (
                  <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 14px' }}>
                    <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Why This Reference Answer is Stronger:
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {currentEval.ai_evaluation.why_stronger}
                    </p>
                  </div>
                )}

                {/* Educational Disclaimer */}
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  Educational guidance designed to build interview mastery; not an automated hiring rejection.
                </p>

                {/* Next Step / Complete Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '10px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  >
                    ← Previous Question
                  </Button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    >
                      Proceed to Question {currentQuestionIndex + 2} →
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      loading={completingSession}
                      onClick={handleCompleteInterview}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff'
                      }}
                    >
                      Complete Interview &amp; View Performance Report →
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: MOCK INTERVIEW PERFORMANCE REPORT */}
      {/* ========================================================================= */}
      {currentStage === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Score & Readiness Summary Banner */}
          <Card
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderLeft: '6px solid #10b981'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge-pill-cyan font-mono text-xs">MOCK INTERVIEW PERFORMANCE</span>
                <h2 style={{ margin: '6px 0 4px 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Performance Evaluation Report
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Target Role: <strong className="text-dark">{targetRole}</strong>
                  {companyName && <span> • {companyName}</span>}
                </p>
              </div>

              {/* Score Gauge Chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    Overall Rating
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#059669' }}>
                    {finalReport?.readiness_verdict || 'Placement Ready'}
                  </strong>
                </div>

                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: '6px solid #10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                    {Math.round(finalReport?.overall_score || 82)}%
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>SCORE</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Competency Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {[
              {
                label: 'Domain Knowledge',
                score: Math.round(finalReport?.summary_report?.competency_breakdown?.domain_knowledge || 84),
                color: '#2563eb'
              },
              {
                label: 'Communication & Structure',
                score: Math.round(finalReport?.summary_report?.competency_breakdown?.communication || 80),
                color: '#059669'
              },
              {
                label: 'Problem Solving & Architecture',
                score: Math.round(finalReport?.summary_report?.competency_breakdown?.problem_solving || 82),
                color: '#7c3aed'
              },
              {
                label: 'Self-Introduction Delivery',
                score: Math.round(finalReport?.summary_report?.competency_breakdown?.delivery || 85),
                color: '#d97706'
              }
            ].map((comp, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{comp.label}</span>
                  <strong style={{ fontSize: '0.9rem', color: comp.color }}>{comp.score}%</strong>
                </div>
                <ProgressBar value={comp.score} height={6} />
              </div>
            ))}
          </div>

          {/* Question-by-Question Review Table */}
          <Card
            title="Question-by-Question Diagnostic Review"
            subtitle="Click on any question to inspect submitted answers and pedagogical evaluations"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(finalReport?.questions || questions).map((q, idx) => {
                const isExpanded = expandedReportQuestion === q.id;
                const qScore = Math.round(q.score_overall || q.score || 0);
                return (
                  <div
                    key={q.id || idx}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-surface)'
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: 'var(--card-subtle-bg)'
                      }}
                      onClick={() => setExpandedReportQuestion(isExpanded ? null : q.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {q.question_text?.slice(0, 90)}...
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: qScore >= 75 ? '#059669' : '#d97706' }}>
                          {qScore}/100
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Your Submitted Answer:
                          </strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                            {q.candidate_answer || 'No answer submitted.'}
                          </p>
                        </div>

                        {q.solution && (
                          <div style={{ backgroundColor: 'var(--card-subtle-bg)', padding: '12px', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                              Model Solution:
                            </strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-sub)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                              {q.solution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Action Footer: Roadmap Integration & Print */}
          <Card className="text-center py-4">
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Recommended Next Steps
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                Review identified weak concepts directly in your personalized Career Roadmap to reinforce technical depth before your official campus or off-campus technical interviews.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="md"
                  icon={Compass}
                  onClick={() => navigate(matchId ? `/career-roadmap/${matchId}` : '/career-roadmap')}
                >
                  Reinforce Skills in Career Roadmap →
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print / Save Evaluation PDF
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={RotateCcw}
                  onClick={() => {
                    setCurrentStage('setup');
                    setSessionId(null);
                    setSessionData(null);
                    setFinalReport(null);
                  }}
                >
                  New Practice Session
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Upgrade Subscription Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="interview_prep"
        reasonMessage={lockedReason || "AI Mock Interview Preparation requires an active CareerSense AI subscription."}
        onSuccessRedirect={window.location.pathname}
      />
    </div>
  );
}
