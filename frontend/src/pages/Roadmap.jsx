import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  BookOpen,
  FolderGit2,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  RotateCcw,
  Check,
  Download,
  Zap,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Target,
  Flame,
  Lock,
  Sliders
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import BackButton from '../components/common/BackButton';
import jobMatchService from '../services/jobMatchService';
import analysisService from '../services/analysisService';
import LearningWorkspace from '../components/roadmap/LearningWorkspace';
import { useToast } from '../context/ToastContext';
import UpgradeModal from '../components/subscription/UpgradeModal';

function ProgressRing({ progress = 0, size = 104, strokeWidth = 9 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-color, #30415c)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={safeProgress === 100 ? 'var(--emerald, #10b981)' : 'var(--primary, #0284c7)'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #f1f5f9)', lineHeight: 1, display: 'block' }}>
          {safeProgress}%
        </span>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Mastered
        </span>
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { matchId: paramMatchId, analysisId } = useParams();
  const effectiveParamId = paramMatchId || analysisId;
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [matchId, setMatchId] = useState(effectiveParamId || null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalysisResult, setReanalysisResult] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [subRequired, setSubRequired] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Timeline Customization States
  const [selectedWeeks, setSelectedWeeks] = useState(8);
  const [isCustomWeeks, setIsCustomWeeks] = useState(false);
  const [customWeeksInput, setCustomWeeksInput] = useState('8');
  const [dailyHours, setDailyHours] = useState(1.0);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [learningStyle, setLearningStyle] = useState('balanced');
  const [regenerating, setRegenerating] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [workspaceItem, setWorkspaceItem] = useState(null);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRoadmap() {
      try {
        setLoading(true);
        setError('');

        if (effectiveParamId) {
          setMatchId(effectiveParamId);
          const res = await jobMatchService.getRoadmap(effectiveParamId);
          if (mounted) {
            if (res.has_roadmap && res.roadmap) {
              setRoadmap(res.roadmap);
            } else {
              const genRes = await jobMatchService.generateRoadmap(effectiveParamId);
              if (genRes.success && genRes.roadmap) {
                setRoadmap(genRes.roadmap);
              }
            }
          }
        } else {
          const res = await jobMatchService.getRoadmap();
          if (mounted) {
            if (res.has_roadmap && res.roadmap) {
              setRoadmap(res.roadmap);
              setMatchId(res.roadmap.analysis_id);
            } else {
              const genRes = await jobMatchService.generateRoadmap();
              if (genRes.success && genRes.roadmap) {
                setRoadmap(genRes.roadmap);
                setMatchId(genRes.roadmap.analysis_id);
              } else {
                setRoadmap(null);
              }
            }
          }
        }
      } catch (err) {
        if (mounted) {
          if (err.status === 403 || err.data?.subscription_required) {
            setSubRequired(true);
            setError(err.message || 'Personalized Career Roadmap requires an active subscription.');
          } else {
            setError(err.message || 'Failed to retrieve career roadmap.');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRoadmap();
    return () => {
      mounted = false;
    };
  }, [effectiveParamId]);

  // Synchronize timeline settings when roadmap is loaded
  useEffect(() => {
    if (roadmap) {
      const w = roadmap.total_duration_weeks || 8;
      if ([2, 4, 6, 8, 12].includes(w)) {
        setSelectedWeeks(w);
        setIsCustomWeeks(false);
      } else {
        setSelectedWeeks('custom');
        setIsCustomWeeks(true);
        setCustomWeeksInput(String(w));
      }
      if (roadmap.daily_study_hours) setDailyHours(roadmap.daily_study_hours);
      if (roadmap.study_days_per_week) setDaysPerWeek(roadmap.study_days_per_week);
      if (roadmap.learning_style) setLearningStyle(roadmap.learning_style);

      // Expand task view for all items by default
      const defaultExpanded = {};
      (roadmap.items || []).forEach((item) => {
        defaultExpanded[item.id] = true;
      });
      setExpandedTasks(defaultExpanded);
    }
  }, [roadmap?.id]);

  // Capacity planning calculations
  const effectiveWeeks = isCustomWeeks
    ? Math.max(2, Math.min(52, parseInt(customWeeksInput) || 8))
    : parseInt(selectedWeeks) || 8;
  const weeklyHours = (parseFloat(dailyHours) * parseInt(daysPerWeek)).toFixed(1);
  const totalCapacityHours = Math.round(parseFloat(weeklyHours) * effectiveWeeks);
  const isIntensive = effectiveWeeks <= 4 || parseFloat(weeklyHours) >= 15;

  // Apply timeline & regenerate roadmap
  const handleApplyTimeline = async () => {
    const targetMatchId = matchId || roadmap?.analysis_id;

    try {
      setRegenerating(true);
      const res = await jobMatchService.regenerateRoadmap(targetMatchId, {
        durationWeeks: effectiveWeeks,
        dailyStudyHours: parseFloat(dailyHours),
        studyDaysPerWeek: parseInt(daysPerWeek),
        learningStyle: learningStyle,
      });

      if (res.success && res.roadmap) {
        setRoadmap(res.roadmap);
        toast.success('Your personalized roadmap has been updated.');
      } else {
        toast.error(res.message || 'Failed to apply new timeline.');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating roadmap timeline.');
    } finally {
      setRegenerating(false);
    }
  };

  // Toggle individual daily task
  const handleToggleTask = async (item, taskIndex) => {
    const isLocked = item.order_index > 1 && roadmap.items.some((it) => it.order_index < item.order_index && it.status !== 'Completed');
    if (isLocked) {
      toast.warning(`Phase ${item.phase_number} is locked. Complete Phase ${item.phase_number - 1} first!`);
      return;
    }

    const currentTasks = Array.isArray(item.tasks) ? [...item.tasks] : [];
    if (taskIndex < 0 || taskIndex >= currentTasks.length) return;

    const task = { ...currentTasks[taskIndex] };
    task.is_completed = !task.is_completed;
    currentTasks[taskIndex] = task;

    const completedTasksCount = currentTasks.filter((t) => t.is_completed).length;
    const newProgress = Math.round((completedTasksCount / currentTasks.length) * 100);
    const newStatus = newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : 'Not Started';

    // Optimistic UI update
    setRoadmap((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.id === item.id ? { ...it, tasks: currentTasks, progress: newProgress, status: newStatus } : it
      );
      const totalProg = updatedItems.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      const overall = Math.round(totalProg / updatedItems.length);
      return {
        ...prev,
        overall_progress: overall,
        items: updatedItems
      };
    });

    try {
      await jobMatchService.updateRoadmapItem(item.id, {
        status: newStatus,
        progress: newProgress,
        tasks: currentTasks
      });
    } catch (err) {
      console.error('Failed to sync task update with MySQL', err);
      toast.error(err.message || 'Failed to update task.');
    }
  };

  // Milestone phase status update
  const handleUpdateStatus = async (itemId, newStatus, newProgress) => {
    try {
      setUpdatingItemId(itemId);
      const targetItem = roadmap.items.find((i) => i.id === itemId);
      const isLocked = targetItem && targetItem.order_index > 1 && roadmap.items.some((it) => it.order_index < targetItem.order_index && it.status !== 'Completed');
      if (isLocked && (newStatus === 'In Progress' || newStatus === 'Completed' || newProgress > 0)) {
        toast.warning(`Phase ${targetItem.phase_number} is locked. Complete earlier phases first!`);
        return;
      }

      let updatedTasks = targetItem?.tasks;
      if (Array.isArray(updatedTasks) && updatedTasks.length > 0) {
        if (newStatus === 'Completed') {
          updatedTasks = updatedTasks.map((t) => ({ ...t, is_completed: true }));
        } else if (newStatus === 'Not Started') {
          updatedTasks = updatedTasks.map((t) => ({ ...t, is_completed: false }));
        }
      }

      const res = await jobMatchService.updateRoadmapItem(itemId, {
        status: newStatus,
        progress: newProgress,
        tasks: updatedTasks
      });

      if (res.success) {
        setRoadmap((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((it) =>
            it.id === itemId ? { ...it, status: newStatus, progress: newProgress, tasks: updatedTasks } : it
          );
          return {
            ...prev,
            overall_progress: res.overall_progress,
            items: updatedItems
          };
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update milestone progress.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Re-analyze skills after completing milestones
  const handleReanalyzeSkills = async () => {
    const targetMatchId = matchId || roadmap?.analysis_id;
    if (!targetMatchId) {
      toast.error('No active match record identified for re-analysis.');
      return;
    }

    try {
      setReanalyzing(true);
      const res = await jobMatchService.reanalyzeSkills(targetMatchId);
      if (res.success) {
        setReanalysisResult(res);
        toast.success(res.message || 'Skills verified & match score updated!');
      } else {
        toast.error(res.message || 'Re-analysis could not be completed.');
      }
    } catch (err) {
      toast.error(err.message || 'Re-analysis failed.');
    } finally {
      setReanalyzing(false);
    }
  };

  // Download PDF Report
  const handleDownloadPDF = async () => {
    const targetMatchId = matchId || roadmap?.analysis_id;
    if (!targetMatchId) return;

    try {
      setGeneratingReport(true);
      toast.info('Generating Career Intelligence Report...');
      await jobMatchService.generateReport(targetMatchId);
      const url = jobMatchService.getReportDownloadUrl(targetMatchId);
      window.open(url, '_blank');
      toast.success('Career Report ready!');
    } catch (err) {
      toast.error(err.message || 'Could not generate report.');
    } finally {
      
      setGeneratingReport(false);
    }
  };

  const toggleTaskExpansion = (itemId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '450px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-primary mx-auto mb-3"></div>
          <h3 className="font-semibold text-lg text-dark">Synthesizing Personalized Career Roadmap...</h3>
          <p className="text-secondary text-sm">Resolving prerequisites and building time-based curriculum</p>
        </div>
      </div>
    );
  }

  if (subRequired) {
    return (
      <div className="page-container">
        <div className="page-header">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="page-title">Personalized Career Roadmap</h1>
          <p className="page-subtitle">A chronological learning milestone progression designed to bridge your skill gaps.</p>
        </div>

        <Card className="text-center py-5 mt-4" style={{ maxWidth: '680px', margin: '2rem auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Compass size={32} />
          </div>
          <Badge variant="blue" size="md" className="mb-2">★ PREMIUM SUBSCRIPTION REQUIRED</Badge>
          <h2 className="text-2xl font-bold text-dark mb-2">Unlock Your Career Roadmap</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm" style={{ lineHeight: 1.6 }}>
            Personalized Career Roadmaps, milestone checklists, weekly schedule configuration, and interactive assessment quizzes require an active CareerSense AI subscription.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={() => setUpgradeModalOpen(true)}
            >
              Upgrade Now (From ₹83/mo) →
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/pricing')}
            >
              Compare Plans
            </Button>
          </div>
        </Card>

        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          featureName="career_roadmap"
          reasonMessage="Personalized Career Roadmap & Sequential Progression requires an active subscription."
          onSuccessRedirect={window.location.pathname}
        />
      </div>
    );
  }

  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-3" />
          <h1 className="page-title">Personalized Career Roadmap</h1>
          <p className="page-subtitle">A chronological learning milestone progression designed to bridge your skill gaps.</p>
        </div>

        <Card className="text-center py-5 mt-4">
          <Compass size={48} className="text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-dark mb-2">No Active Career Roadmap Found</h2>
          <p className="text-secondary max-w-lg mx-auto mb-6 text-sm">
            Your personalized career roadmap is dynamically synthesized from the missing skills detected during resume and job description analysis. Compare your profile to generate your roadmap.
          </p>
          <div className="flex-center gap-3">
            <Button variant="primary" icon={Sparkles} onClick={() => navigate('/job-match')}>
              Analyze Resume against a Job Requisition →
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const completedCount = roadmap.items.filter((i) => i.status === 'Completed' || i.progress === 100).length;
  const inProgressCount = roadmap.items.filter((i) => i.status === 'In Progress' && i.progress < 100).length;
  const totalItems = roadmap.items.length;

  const allTasks = (roadmap.items || []).flatMap((it) => (Array.isArray(it.tasks) ? it.tasks : []));
  const totalTasksCount = allTasks.length;
  const completedTasksTotal = allTasks.filter((t) => t.is_completed).length;
  const remainingTasksTotal = totalTasksCount - completedTasksTotal;
  const skillsToImproveCount = totalItems;

  const activeMilestone = (roadmap.items || []).find((it) => {
    const isLocked = it.order_index > 1 && roadmap.items.some((prev) => prev.order_index < it.order_index && prev.status !== 'Completed');
    return !isLocked && it.status !== 'Completed';
  }) || (roadmap.items || [])[roadmap.items.length - 1];

  const nextMilestone = activeMilestone
    ? (roadmap.items || []).find((it) => it.order_index === activeMilestone.order_index + 1)
    : null;

  const targetDurationWeeks = roadmap.total_duration_weeks || effectiveWeeks || 8;
  const estimatedCompletionDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + targetDurationWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  const matchCtx = roadmap.match_context || {};
  const atsScore = matchCtx.match_score != null ? matchCtx.match_score : null;
  const resumeName = matchCtx.resume_filename || 'Primary Resume';
  const companyName = matchCtx.company_name || 'Target Role Requisition';

  return (
    <div className="page-container">
      {/* Top Header & Navigation */}
      <div style={{ marginBottom: '16px' }}>
        <BackButton
          to={matchId ? `/job-match-result/${matchId}` : '/dashboard'}
          label="Back"
        />
      </div>

      {/* Career Learning Command Center Hero */}
      <div
        style={{
          background: 'var(--bg-card, #111b2e)',
          border: '1px solid var(--border-color, #30415c)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md, 0 4px 16px rgba(0,0,0,0.15))'
        }}
      >
        {/* Top Context & Action Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color, #30415c)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span className="badge-pill-cyan font-mono text-xs">CAREER COMMAND CENTER</span>
              <Badge variant="blue" size="sm">Role: {roadmap.target_role}</Badge>
              {companyName && <Badge variant="gray" size="sm">Org: {companyName}</Badge>}
              {resumeName && <Badge variant="gray" size="sm">Resume: {resumeName}</Badge>}
              <Badge variant="emerald" size="sm">✓ MySQL Verified</Badge>
            </div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main, #f1f5f9)' }}>
              Career Roadmap: {roadmap.target_role}
            </h1>
            <p className="page-subtitle" style={{ margin: '6px 0 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
              Targeted curriculum to eliminate your <strong>{skillsToImproveCount} skill gaps</strong> with sequential prerequisites and time-based tracking.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {activeMilestone && (
              <Button
                variant="primary"
                size="md"
                icon={PlayCircle}
                onClick={() => setWorkspaceItem(activeMilestone)}
              >
                {roadmap.overall_progress === 100
                  ? 'Review Learning Workspace'
                  : activeMilestone.status === 'In Progress'
                  ? 'Continue Learning'
                  : 'Start Learning'}
              </Button>
            )}
            <Button
              variant="outline"
              size="md"
              icon={Download}
              loading={generatingReport}
              onClick={handleDownloadPDF}
            >
              Export PDF Report
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={Zap}
              loading={reanalyzing}
              onClick={handleReanalyzeSkills}
            >
              Re-analyze My Skills ⚡
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={Sliders}
              onClick={() => setTimelineExpanded(!timelineExpanded)}
            >
              {timelineExpanded ? 'Hide Timeline Settings' : 'Customize Timeline'}
            </Button>
          </div>
        </div>

        {/* 3 Strategic Command Center Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          
          {/* Pillar 1: Overall Progress & Mastery Ring */}
          <div
            style={{
              background: 'var(--card-subtle-bg, #162238)',
              border: '1px solid var(--border-color, #30415c)',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <ProgressRing progress={roadmap.overall_progress} size={100} strokeWidth={9} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                OVERALL ROADMAP PROGRESS
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-main, #f1f5f9)', display: 'block', marginTop: '2px' }}>
                {completedCount} of {totalItems} Phases Mastered
              </strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                <span>• Tasks Done: <strong style={{ color: 'var(--emerald, #10b981)' }}>{completedTasksTotal}</strong> / {totalTasksCount}</span>
                {atsScore != null && (
                  <span>• Current ATS Match: <strong style={{ color: 'var(--primary, #38bdf8)' }}>{atsScore}%</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Pillar 2: Active Phase & Next Milestone */}
          <div
            style={{
              background: 'var(--card-subtle-bg, #162238)',
              border: '1px solid var(--border-color, #30415c)',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary, #38bdf8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CURRENT ACTIVE FOCUS
                </span>
                <Badge variant={activeMilestone?.status === 'Completed' ? 'emerald' : 'blue'} size="sm">
                  Phase {activeMilestone?.phase_number || 1}
                </Badge>
              </div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main, #f1f5f9)', display: 'block' }}>
                {activeMilestone?.title || 'All Milestones Complete'}
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                Skill: <span style={{ color: 'var(--text-main, #f1f5f9)', fontWeight: 600 }}>{activeMilestone?.skill_name}</span> ({activeMilestone?.duration_weeks})
              </p>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color, #30415c)', fontSize: '0.775rem', color: 'var(--text-muted, #94a3b8)' }}>
              {nextMilestone ? (
                <span>Next Milestone: <strong style={{ color: 'var(--text-main, #f1f5f9)' }}>Phase {nextMilestone.phase_number} — {nextMilestone.skill_name}</strong> (🔒 locked)</span>
              ) : (
                <span style={{ color: 'var(--emerald, #10b981)' }}>🎉 Final Milestone reached!</span>
              )}
            </div>
          </div>

          {/* Pillar 3: Study Pace & Capacity Metrics */}
          <div
            style={{
              background: 'var(--card-subtle-bg, #162238)',
              border: '1px solid var(--border-color, #30415c)',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  STUDY PACE & CAPACITY
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--emerald, #10b981)', fontWeight: 600 }}>
                  Est. End: {estimatedCompletionDate}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>DAILY COMMITMENT</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main, #f1f5f9)' }}>{dailyHours}h / day</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>STUDY DAYS</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main, #f1f5f9)' }}>{daysPerWeek} days / wk</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>WEEKLY HOURS</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary, #38bdf8)' }}>{weeklyHours} hrs / wk</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>TOTAL CAPACITY</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary, #38bdf8)' }}>{totalCapacityHours} total hrs</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Measurable Score Gain Alert Banner */}
      {reanalysisResult && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#10b981', color: '#fff', padding: '10px', borderRadius: '50%' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: '800', color: '#065f46' }}>
                Measurable Career Improvement Detected!
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#047857' }}>
                Completed skills successfully verified in MySQL! Your match score has improved from{' '}
                <strong>{reanalysisResult.previous_score}%</strong> to{' '}
                <strong style={{ fontSize: '1.05rem' }}>{reanalysisResult.new_score}%</strong>.
              </p>
              {reanalysisResult.skills_improved && reanalysisResult.skills_improved.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#065f46' }}>Skills Mastered:</span>
                  {reanalysisResult.skills_improved.map((sk, idx) => (
                    <span key={idx} style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              )}
              {reanalysisResult.still_missing && reanalysisResult.still_missing.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#92400e' }}>Remaining Gaps:</span>
                  {reanalysisResult.still_missing.map((sk, idx) => (
                    <span key={idx} style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {reanalysisResult.career_readiness && (
              <Badge variant="emerald" size="lg">
                Status: {reanalysisResult.career_readiness.status}
              </Badge>
            )}
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#065f46', fontWeight: '700' }}>IMPROVEMENT</span>
              <strong style={{ fontSize: '1.5rem', color: '#059669' }}>
                +{reanalysisResult.improvement_delta}%
              </strong>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/job-match-result/${matchId}`)}
            >
              View Updated Match →
            </Button>
          </div>
        </div>
      )}

      {/* 6 Top Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>OVERALL PROGRESS</span>
            <div style={{ background: 'rgba(2, 132, 199, 0.15)', color: 'var(--primary, #38bdf8)', padding: '5px', borderRadius: '6px' }}><TrendingUp size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--primary, #38bdf8)', display: 'block' }}>{roadmap.overall_progress}%</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{completedCount} of {totalItems} Phases Mastered</span>
        </div>

        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>SKILLS TO IMPROVE</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '5px', borderRadius: '6px' }}><Target size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text-main, #f1f5f9)', display: 'block' }}>{skillsToImproveCount}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Target Competencies</span>
        </div>

        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>COMPLETED TASKS</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '5px', borderRadius: '6px' }}><CheckCircle2 size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--emerald, #34d399)', display: 'block' }}>{completedTasksTotal}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Tasks Completed</span>
        </div>

        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>REMAINING TASKS</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '5px', borderRadius: '6px' }}><Clock size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--amber, #fbbf24)', display: 'block' }}>{remainingTasksTotal}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Active Tasks Pending</span>
        </div>

        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>SELECTED DURATION</span>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '5px', borderRadius: '6px' }}><Calendar size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: 'var(--text-main, #f1f5f9)', display: 'block' }}>{roadmap.total_duration_weeks || effectiveWeeks} Weeks</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>Study Timeline</span>
        </div>

        <div style={{ background: 'var(--card-subtle-bg, #162238)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #30415c)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>WEEKLY STUDY HOURS</span>
            <div style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', padding: '5px', borderRadius: '6px' }}><Zap size={15} /></div>
          </div>
          <strong style={{ fontSize: '1.4rem', color: '#2dd4bf', display: 'block' }}>{weeklyHours} hrs</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{dailyHours}h/day × {daysPerWeek}d</span>
        </div>
      </div>

      {/* Beginner to Job-Ready Visual Career Progression Stepper */}
      <Card className="mb-6" title="Career Progression Journey" subtitle="From Foundational Skill Remediation to Job-Ready Technical Competency">
        <div style={{ padding: '8px 4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', position: 'relative' }}>
            {[
              { level: 1, title: 'Prerequisites & Core Syntax', threshold: 25, desc: 'Language fundamentals, Git & tooling' },
              { level: 2, title: 'Frameworks & REST APIs', threshold: 50, desc: 'Architecture, routing & services' },
              { level: 3, title: 'Databases & Cloud Engineering', threshold: 75, desc: 'Relational data, Docker & CI/CD' },
              { level: 4, title: 'Job-Ready Candidate', threshold: 100, desc: 'Portfolio projects & interview ready' },
            ].map((step, sIdx) => {
              const currentProg = roadmap.overall_progress || 0;
              const isPassed = currentProg >= step.threshold;
              const isActive = !isPassed && (sIdx === 0 || currentProg >= [0, 25, 50, 75][sIdx]);

              return (
                <div
                  key={step.level}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: isPassed ? '#10b981' : isActive ? '#0284c7' : 'var(--border-color, #e2e8f0)',
                    background: isPassed ? 'rgba(16, 185, 129, 0.05)' : isActive ? 'rgba(2, 132, 199, 0.05)' : 'var(--card-subtle-bg, #f8fafc)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: isPassed ? '#059669' : isActive ? '#0284c7' : 'var(--text-muted, #64748b)'
                      }}
                    >
                      LEVEL {step.level}
                    </span>
                    {isPassed ? (
                      <Badge variant="emerald" size="sm">✓ Mastered</Badge>
                    ) : isActive ? (
                      <Badge variant="blue" size="sm">⚡ Active Focus</Badge>
                    ) : (
                      <Badge variant="gray" size="sm">Upcoming</Badge>
                    )}
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main, #1e293b)', display: 'block', marginBottom: '2px' }}>
                    {step.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Timeline Planning Card */}
      {timelineExpanded && (
        <Card
          title="Plan Your Skill Improvement"
          subtitle="Customize your learning pace, daily commitment, and roadmap duration"
          className="mb-6"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Row 1: Target Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #f1f5f9)', marginBottom: '8px' }}>
                Target Roadmap Duration
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {[2, 4, 6, 8, 12].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setSelectedWeeks(w);
                      setIsCustomWeeks(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: !isCustomWeeks && selectedWeeks === w ? 'var(--primary, #0284c7)' : 'var(--border-color, #30415c)',
                      backgroundColor: !isCustomWeeks && selectedWeeks === w ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-subtle-bg, #162238)',
                      color: !isCustomWeeks && selectedWeeks === w ? 'var(--primary, #38bdf8)' : 'var(--text-main, #f1f5f9)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {w} Weeks
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomWeeks(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: isCustomWeeks ? 'var(--primary, #0284c7)' : 'var(--border-color, #30415c)',
                    backgroundColor: isCustomWeeks ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-subtle-bg, #162238)',
                    color: isCustomWeeks ? 'var(--primary, #38bdf8)' : 'var(--text-main, #f1f5f9)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Custom
                </button>

                {isCustomWeeks && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      min="2"
                      max="52"
                      value={customWeeksInput}
                      onChange={(e) => setCustomWeeksInput(e.target.value)}
                      style={{
                        width: '70px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--primary, #0284c7)',
                        backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-main, #f1f5f9)'
                      }}
                    />
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted, #94a3b8)' }}>weeks (2–52)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Daily Study Hours & Days Per Week */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {/* Daily Hours */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #f1f5f9)', marginBottom: '8px' }}>
                  Daily Study Commitment
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { value: 0.5, label: '30 min (0.5h)' },
                    { value: 1.0, label: '1 hour' },
                    { value: 2.0, label: '2 hours' },
                    { value: 3.0, label: '3+ hours' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDailyHours(opt.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: dailyHours === opt.value ? 'var(--primary, #0284c7)' : 'var(--border-color, #30415c)',
                        backgroundColor: dailyHours === opt.value ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-subtle-bg, #162238)',
                        color: dailyHours === opt.value ? 'var(--primary, #38bdf8)' : 'var(--text-main, #f1f5f9)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Days Per Week */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #f1f5f9)', marginBottom: '8px' }}>
                  Study Days Per Week
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysPerWeek(d)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: daysPerWeek === d ? 'var(--primary, #0284c7)' : 'var(--border-color, #30415c)',
                        backgroundColor: daysPerWeek === d ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-subtle-bg, #162238)',
                        color: daysPerWeek === d ? 'var(--primary, #38bdf8)' : 'var(--text-main, #f1f5f9)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Learning Style */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #f1f5f9)', marginBottom: '8px' }}>
                Learning Style
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { id: 'balanced', label: 'Balanced (Theory + Coding)', desc: 'Steady distribution of fundamentals and practice' },
                  { id: 'intensive', label: 'Intensive (Fast-Track)', desc: 'Accelerated pacing focusing on core interview requirements' },
                  { id: 'project_based', label: 'Project-Based (Hands-on First)', desc: 'Build portfolio artifacts to prove competency' }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setLearningStyle(style.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: learningStyle === style.id ? 'var(--primary, #0284c7)' : 'var(--border-color, #30415c)',
                      backgroundColor: learningStyle === style.id ? 'rgba(2, 132, 199, 0.15)' : 'var(--card-subtle-bg, #162238)',
                      color: learningStyle === style.id ? 'var(--primary, #38bdf8)' : 'var(--text-main, #f1f5f9)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={style.desc}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Box & CTA */}
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: 'var(--card-subtle-bg, #162238)',
                border: '1px solid var(--border-color, #30415c)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>WEEKLY HOURS</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main, #f1f5f9)' }}>{weeklyHours} hrs / week</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>TOTAL CAPACITY</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary, #38bdf8)' }}>{totalCapacityHours} total hours</strong>
                </div>
                {isIntensive && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.775rem',
                      fontWeight: 600
                    }}
                  >
                    <Flame size={14} className="text-amber" /> Intensive Pace
                  </span>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                icon={Sparkles}
                loading={regenerating}
                onClick={handleApplyTimeline}
              >
                {regenerating ? 'Regenerating Roadmap...' : 'Apply Timeline & Regenerate Roadmap'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Summary Card */}
      <Card className="mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              OVERALL ROADMAP PROGRESS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--primary, #38bdf8)', lineHeight: 1 }}>
                {roadmap.overall_progress}%
              </span>
              <Badge variant={roadmap.overall_progress === 100 ? 'emerald' : 'blue'} size="md">
                {roadmap.overall_progress === 100 ? '✓ Roadmap Fully Completed' : `${completedCount} of ${totalItems} Phases Mastered`}
              </Badge>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: 'var(--card-subtle-bg, #162238)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #30415c)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>TOTAL PHASES</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main, #f1f5f9)' }}>{totalItems} Phases</strong>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--card-subtle-bg, #162238)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #30415c)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>DURATION</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main, #f1f5f9)' }}>{roadmap.total_duration_weeks} Weeks</strong>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#10b981' }}>COMPLETED</span>
              <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{completedCount} / {totalItems}</strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <ProgressBar value={roadmap.overall_progress} variant="primary" height={10} />
        </div>
      </Card>

      {/* Chronological Phases Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {roadmap.items.map((item, idx) => {
          const isUpdating = updatingItemId === item.id;
          const isDone = item.status === 'Completed' || item.progress === 100;
          const isInProgress = item.status === 'In Progress' && item.progress < 100;
          const isLocked = item.order_index > 1 && roadmap.items.some((it) => it.order_index < item.order_index && it.status !== 'Completed');
          const hasTasks = Array.isArray(item.tasks) && item.tasks.length > 0;
          const isExpanded = !!expandedTasks[item.id];
          const completedTasksCount = hasTasks ? item.tasks.filter((t) => t.is_completed).length : 0;

          return (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid',
                borderColor: isDone
                  ? 'rgba(52, 211, 153, 0.4)'
                  : isLocked
                  ? 'var(--border-color, #30415c)'
                  : isInProgress
                  ? 'rgba(59, 130, 246, 0.4)'
                  : 'var(--border-color, #30415c)',
                borderLeft: `6px solid ${
                  isDone
                    ? 'var(--emerald, #10b981)'
                    : isLocked
                    ? 'var(--border-color, #64748b)'
                    : isInProgress
                    ? 'var(--primary, #0284c7)'
                    : 'var(--border-color, #cbd5e1)'
                }`,
                borderRadius: '10px',
                padding: '20px 24px',
                boxShadow: isDone
                  ? '0 2px 8px rgba(16,185,129,0.08)'
                  : isInProgress
                  ? '0 4px 12px rgba(2,132,199,0.1)'
                  : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                opacity: isLocked ? 0.75 : 1
              }}
            >
              {/* Phase Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: isDone
                        ? 'rgba(52, 211, 153, 0.2)'
                        : isLocked
                        ? 'var(--bg-card-elevated, #1c2b43)'
                        : isInProgress
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'var(--bg-card-elevated, #1c2b43)',
                      color: isDone
                        ? 'var(--emerald, #34d399)'
                        : isLocked
                        ? 'var(--text-muted, #94a3b8)'
                        : isInProgress
                        ? 'var(--primary, #3b82f6)'
                        : 'var(--text-muted, #94a3b8)',
                      border: '1px solid var(--border-color, #30415c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}
                  >
                    {isDone ? <Check size={20} /> : isLocked ? <Lock size={16} /> : item.phase_number}
                  </div>

                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main, #f1f5f9)' }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #b7c4d8)' }}>
                        Skill: <strong style={{ color: 'var(--text-main, #f1f5f9)' }}>{item.skill_name}</strong>
                      </span>
                      <span className="dot-divider">•</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #b7c4d8)' }}>
                        Duration: <strong style={{ color: 'var(--text-main, #f1f5f9)' }}>{item.duration_weeks}</strong>
                      </span>
                      <span className="dot-divider">•</span>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          backgroundColor: item.priority === 'HIGH' ? 'rgba(251, 113, 133, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          color: item.priority === 'HIGH' ? 'var(--danger, #fb7185)' : 'var(--amber, #fbbf24)',
                          border: `1px solid ${item.priority === 'HIGH' ? 'rgba(251, 113, 133, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                          padding: '1px 7px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Control Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: isDone
                        ? 'rgba(52, 211, 153, 0.15)'
                        : isLocked
                        ? 'var(--bg-card-elevated, #1c2b43)'
                        : isInProgress
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'var(--bg-card-elevated, #1c2b43)',
                      color: isDone
                        ? 'var(--emerald, #34d399)'
                        : isLocked
                        ? 'var(--text-muted, #94a3b8)'
                        : isInProgress
                        ? 'var(--primary, #3b82f6)'
                        : 'var(--text-muted, #94a3b8)',
                      border: '1px solid var(--border-color, #30415c)'
                    }}
                  >
                    {isDone ? '✓ Completed' : isLocked ? '🔒 Locked' : isInProgress ? `▶ In Progress (${item.progress || 50}%)` : 'Not Started'}
                  </span>

                  {/* Open Learning Workspace Action */}
                  <Button
                    variant={isLocked ? 'outline' : isInProgress ? 'primary' : 'outline'}
                    size="sm"
                    icon={isLocked ? Lock : PlayCircle}
                    disabled={isLocked}
                    onClick={() => setWorkspaceItem(item)}
                    title={isLocked ? `Complete Phase ${item.phase_number - 1} first to unlock` : 'Open educational learning workspace'}
                  >
                    {isLocked
                      ? `Locked (Prereq Phase ${item.phase_number - 1})`
                      : isDone
                      ? 'Review Workspace'
                      : isInProgress
                      ? 'Continue Learning'
                      : 'Start Learning'}
                  </Button>

                  {/* Reset action if completed */}
                  {isDone && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(item.id, 'Not Started', 0)}
                      title="Reset progress"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color, #30415c)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted, #b7c4d8)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Expected Outcome */}
              {item.expected_outcome && (
                <div style={{ marginBottom: '12px', background: 'var(--bg-card-elevated, #1c2b43)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #30415c)', fontSize: '0.825rem' }}>
                  <strong style={{ color: 'var(--text-main, #f1f5f9)' }}>Expected Outcome: </strong>
                  <span style={{ color: 'var(--text-sub, #cbd5e1)' }}>{item.expected_outcome}</span>
                </div>
              )}

              {/* Topics to Learn */}
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted, #b7c4d8)', textTransform: 'uppercase', letterSpacing: '0.03em', display: 'block', marginBottom: '6px' }}>
                  Curriculum &amp; Key Topics:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(item.topics || []).map((t, tidx) => (
                    <span
                      key={tidx}
                      style={{
                        backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                        border: '1px solid var(--border-color, #30415c)',
                        borderRadius: '4px',
                        padding: '4px 9px',
                        fontSize: '0.8rem',
                        color: 'var(--text-main, #f1f5f9)'
                      }}
                    >
                      • {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hands-on Practice Project */}
              {item.practice_project && (
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: hasTasks ? '14px' : '0'
                  }}
                >
                  <FolderGit2 size={18} style={{ color: 'var(--primary, #3b82f6)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '0.825rem', color: 'var(--primary, #3b82f6)', display: 'block', marginBottom: '2px' }}>
                      Hands-on Practice Project:
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main, #f1f5f9)', lineHeight: '1.4' }}>
                      {item.practice_project}
                    </p>
                  </div>
                </div>
              )}

              {/* Actionable Daily/Weekly Task Checklist */}
              {hasTasks && (
                <div style={{ borderTop: '1px solid var(--border-color, #30415c)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} style={{ color: 'var(--primary, #3b82f6)' }} />
                      <strong style={{ fontSize: '0.825rem', color: 'var(--text-main, #f1f5f9)' }}>
                        Daily Task Schedule ({completedTasksCount} / {item.tasks.length} Completed)
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleTaskExpansion(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #3b82f6)',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isExpanded ? 'Collapse Tasks' : 'View Tasks'}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                      {item.tasks.map((task, tIdx) => {
                        const isTaskDone = !!task.is_completed;
                        return (
                          <div
                            key={tIdx}
                            onClick={() => handleToggleTask(item, tIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              backgroundColor: isTaskDone ? 'rgba(52, 211, 153, 0.1)' : 'var(--bg-card-elevated, #1c2b43)',
                              border: '1px solid',
                              borderColor: isTaskDone ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-color, #30415c)',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isTaskDone ? (
                              <CheckSquare size={16} color="var(--emerald, #34d399)" style={{ flexShrink: 0 }} />
                            ) : (
                              <Square size={16} style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.825rem',
                                  color: isTaskDone ? 'var(--emerald, #34d399)' : 'var(--text-main, #f1f5f9)',
                                  textDecoration: isTaskDone ? 'line-through' : 'none'
                                }}
                              >
                                <strong>Day {task.day}: </strong>
                                {task.task_title || task.title}
                              </span>
                              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #b7c4d8)', background: 'var(--bg-surface, #111b2e)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color, #30415c)' }}>
                                {task.allocated_hours || 1}h
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Re-analysis Callout */}
      <Card className="text-center py-4 mb-4" style={{ background: 'var(--bg-card, #162238)', border: '1px solid var(--border-color, #30415c)' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', marginBottom: '6px' }}>
            Completed a Skill? Measure Your Improvement
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #b7c4d8)', marginBottom: '16px' }}>
            Once you mark any missing skill as completed, click <strong>Re-analyze My Skills</strong> to recalculate your match score in MySQL and see measurable score gains!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="lg"
              icon={Zap}
              loading={reanalyzing}
              onClick={handleReanalyzeSkills}
            >
              Re-analyze My Skills ⚡
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={Download}
              loading={generatingReport}
              onClick={handleDownloadPDF}
            >
              Generate Career Report PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Educational Learning Workspace Modal */}
      {workspaceItem && (
        <LearningWorkspace
          roadmap={roadmap}
          activeItem={workspaceItem}
          onClose={() => setWorkspaceItem(null)}
          onRoadmapUpdate={(updateRes) => {
            if (updateRes?.item) {
              setRoadmap((prev) => {
                if (!prev) return prev;
                const updatedItems = prev.items.map((it) => (it.id === updateRes.item.id ? updateRes.item : it));
                return {
                  ...prev,
                  items: updatedItems,
                  overall_progress: updateRes.overall_progress !== undefined ? updateRes.overall_progress : prev.overall_progress
                };
              });
              setWorkspaceItem(updateRes.item);
            }
          }}
        />
      )}

      {/* Subscription Paywall Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        featureName="career_roadmap"
        reasonMessage="Personalized Career Roadmap & Sequential Progression requires an active subscription."
        onSuccessRedirect={window.location.pathname}
      />
    </div>
  );
}
