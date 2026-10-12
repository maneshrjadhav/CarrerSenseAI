import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  PlayCircle,
  BookOpen,
  CheckSquare,
  Code2,
  FolderGit2,
  Award,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { jobMatchService } from '../../services/jobMatchService';

export default function LearningWorkspace({
  roadmap,
  activeItem,
  onClose,
  onRoadmapUpdate
}) {
  const [selectedItem, setSelectedItem] = useState(activeItem);
  const [activeTab, setActiveTab] = useState('syllabus'); // syllabus, tasks, exercises, project, quiz
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showSolution, setShowSolution] = useState({});

  // Tasks state
  const [tasks, setTasks] = useState(activeItem?.tasks || []);
  const [isUpdatingTasks, setIsUpdatingTasks] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizError, setQuizError] = useState(null);

  // Sync when activeItem or selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setTasks(Array.isArray(selectedItem.tasks) ? selectedItem.tasks : []);
      setSelectedAnswers({});
      setQuizResult(null);
      setQuizError(null);
      setShowSolution({});
    }
  }, [selectedItem?.id]);

  if (!roadmap || !selectedItem) return null;

  const items = Array.isArray(roadmap.items) ? roadmap.items : [];

  // Helper to check if a specific item is locked
  const isItemLocked = (item) => {
    if (item.order_index === 1) return false;
    // An item is locked if any earlier phase is NOT 'Completed'
    return items.some((it) => it.order_index < item.order_index && it.status !== 'Completed');
  };

  const currentIsLocked = isItemLocked(selectedItem);
  const curriculum = selectedItem.curriculum || {};
  const syllabus = Array.isArray(curriculum.syllabus) ? curriculum.syllabus : [];
  const objectives = Array.isArray(curriculum.objectives) ? curriculum.objectives : [];
  const resources = Array.isArray(curriculum.resources) ? curriculum.resources : [];
  const exercises = Array.isArray(curriculum.exercises) ? curriculum.exercises : [];
  const quizQuestions = Array.isArray(curriculum.quiz) ? curriculum.quiz : [];

  // Copy code helper
  const handleCopyCode = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Toggle daily task checkbox
  const handleToggleTask = async (taskIndex) => {
    if (currentIsLocked || isUpdatingTasks) return;
    const updatedTasks = [...tasks];
    const target = { ...updatedTasks[taskIndex] };
    target.is_completed = !target.is_completed;
    target.status = target.is_completed ? 'Completed' : 'Not Started';
    updatedTasks[taskIndex] = target;

    setTasks(updatedTasks);
    setIsUpdatingTasks(true);

    try {
      const completedCount = updatedTasks.filter((t) => t.is_completed).length;
      const newProgress = Math.round((completedCount / updatedTasks.length) * 100);
      let newStatus = selectedItem.status;
      if (newProgress === 100 && (quizResult?.passed || selectedItem.status === 'Completed')) {
        newStatus = 'Completed';
      } else if (newProgress > 0) {
        newStatus = 'In Progress';
      }

      const res = await jobMatchService.updateRoadmapItem(selectedItem.id, {
        tasks: updatedTasks,
        progress: newProgress,
        status: newStatus
      });

      if (res?.item) {
        setSelectedItem(res.item);
        if (onRoadmapUpdate) onRoadmapUpdate(res);
      }
    } catch (err) {
      console.error('Failed to sync task:', err);
      // Rollback
      setTasks(selectedItem.tasks || []);
    } finally {
      setIsUpdatingTasks(false);
    }
  };

  // Quiz submission
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (quizResult?.passed) return; // locked once passed
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (currentIsLocked || quizSubmitting) return;

    if (Object.keys(selectedAnswers).length < quizQuestions.length) {
      setQuizError(`Please answer all ${quizQuestions.length} questions before submitting.`);
      return;
    }

    setQuizSubmitting(true);
    setQuizError(null);

    try {
      const res = await jobMatchService.submitRoadmapQuiz(selectedItem.id, selectedAnswers);
      setQuizResult(res);
      if (res?.item) {
        setSelectedItem(res.item);
        if (onRoadmapUpdate) onRoadmapUpdate(res);
      }
    } catch (err) {
      setQuizError(err.message || 'Failed to submit quiz.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizError(null);
  };

  const handleNextPhase = (nextPhase) => {
    if (nextPhase) {
      setSelectedItem(nextPhase);
      setActiveTab('syllabus');
    }
  };

  const completedTasksCount = tasks.filter((t) => t.is_completed).length;
  const taskProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(11, 18, 32, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '1280px',
          maxWidth: '100%',
          height: '92vh',
          backgroundColor: 'var(--bg-surface, #111b2e)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #30415c)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.5))'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color, #30415c)',
            backgroundColor: 'var(--bg-card, #162238)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: currentIsLocked
                  ? 'var(--bg-card-elevated, #1c2b43)'
                  : selectedItem.status === 'Completed'
                  ? 'rgba(52, 211, 153, 0.2)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: currentIsLocked
                  ? 'var(--text-muted, #94a3b8)'
                  : selectedItem.status === 'Completed'
                  ? 'var(--emerald, #34d399)'
                  : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.1rem'
              }}
            >
              {currentIsLocked ? <Lock size={20} /> : selectedItem.status === 'Completed' ? <CheckCircle2 size={22} /> : selectedItem.phase_number}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                  Phase {selectedItem.phase_number}: {selectedItem.skill_name}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor:
                      selectedItem.status === 'Completed'
                        ? 'rgba(52, 211, 153, 0.15)'
                        : selectedItem.status === 'In Progress'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'var(--bg-card-elevated, #1c2b43)',
                    color:
                      selectedItem.status === 'Completed'
                        ? 'var(--emerald, #34d399)'
                        : selectedItem.status === 'In Progress'
                        ? 'var(--primary, #3b82f6)'
                        : 'var(--text-muted, #94a3b8)',
                    border: '1px solid var(--border-color, #30415c)'
                  }}
                >
                  {currentIsLocked
                    ? '🔒 Locked'
                    : selectedItem.status === 'Completed'
                    ? '✓ Completed'
                    : selectedItem.status === 'In Progress'
                    ? `▶ In Progress (${selectedItem.progress || taskProgressPercent}%)`
                    : 'Not Started'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                  {selectedItem.duration_weeks}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted, #b7c4d8)', margin: '4px 0 0 0' }}>
                {curriculum.title || selectedItem.title}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--border-color, #30415c)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--text-muted, #b7c4d8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-main, #f1f5f9)';
                e.currentTarget.style.borderColor = 'var(--primary, #3b82f6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted, #b7c4d8)';
                e.currentTarget.style.borderColor = 'var(--border-color, #30415c)';
              }}
              aria-label="Close Learning Workspace"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Workspace Body: Left Nav + Main Educational Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: Phases Progression List */}
          <div
            style={{
              width: '280px',
              borderRight: '1px solid var(--border-color, #30415c)',
              backgroundColor: 'var(--bg-card, #162238)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-color, #30415c)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted, #b7c4d8)', textTransform: 'uppercase' }}>
                Curriculum Progression
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #b7c4d8)', marginTop: '4px' }}>
                Sequential unlock requires 100% tasks + quiz &ge; 80%
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item) => {
                  const locked = isItemLocked(item);
                  const isSelected = item.id === selectedItem.id;
                  const isDone = item.status === 'Completed';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!locked) {
                          setSelectedItem(item);
                        }
                      }}
                      disabled={locked}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'var(--primary, #3b82f6)'
                          : isDone
                          ? 'rgba(52, 211, 153, 0.3)'
                          : 'var(--border-color, #30415c)',
                        backgroundColor: isSelected
                          ? 'var(--bg-card-elevated, #1c2b43)'
                          : 'transparent',
                        textAlign: 'left',
                        cursor: locked ? 'not-allowed' : 'pointer',
                        opacity: locked ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: isDone
                            ? 'rgba(52, 211, 153, 0.2)'
                            : locked
                            ? 'var(--bg-card, #162238)'
                            : isSelected
                            ? 'var(--primary, #3b82f6)'
                            : 'var(--bg-card-elevated, #1c2b43)',
                          color: isDone
                            ? 'var(--emerald, #34d399)'
                            : locked
                            ? 'var(--text-muted, #64748b)'
                            : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          flexShrink: 0
                        }}
                      >
                        {isDone ? <Check size={16} /> : locked ? <Lock size={14} /> : item.phase_number}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected ? 'var(--text-main, #f1f5f9)' : 'var(--text-sub, #cbd5e1)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          Phase {item.phase_number}: {item.skill_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                          {isDone ? '✓ Completed' : locked ? 'Prerequisite Required' : item.duration_weeks}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Locked Warning Banner if Phase is Locked */}
            {currentIsLocked && (
              <div
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'rgba(251, 191, 36, 0.12)',
                  borderBottom: '1px solid var(--amber, #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'var(--amber, #fbbf24)',
                  fontSize: '0.85rem'
                }}
              >
                <Lock size={18} />
                <span>
                  <strong>Phase Locked:</strong> You must complete all prior phases (finish daily task schedule and score &ge; 80% on the quiz) before starting Phase {selectedItem.phase_number}.
                </span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div
              style={{
                padding: '0 24px',
                borderBottom: '1px solid var(--border-color, #30415c)',
                backgroundColor: 'var(--bg-card, #162238)',
                display: 'flex',
                gap: '8px',
                flexShrink: 0
              }}
            >
              {[
                { id: 'syllabus', label: 'Overview & Syllabus', icon: BookOpen },
                { id: 'tasks', label: `Daily Tasks (${completedTasksCount}/${tasks.length})`, icon: CheckSquare },
                { id: 'exercises', label: 'Code Exercises', icon: Code2 },
                { id: 'project', label: 'Mini-Project', icon: FolderGit2 },
                { id: 'quiz', label: 'Knowledge Quiz (80% Pass)', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '14px 18px',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
                      color: isActive ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #b7c4d8)',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-page, #0b1220)' }}>
              {/* TAB 1: OVERVIEW & SYLLABUS */}
              {activeTab === 'syllabus' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Learning Objectives Card */}
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Sparkles size={18} color="var(--primary, #3b82f6)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                        Learning Objectives
                      </h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                      {objectives.map((obj, oIdx) => (
                        <div
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: 'var(--text-main, #f1f5f9)',
                            border: '1px solid var(--border-color, #30415c)'
                          }}
                        >
                          <CheckCircle2 size={16} color="var(--emerald, #34d399)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Syllabus Modules */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                      Lesson Syllabus &amp; Technical Deep-Dive
                    </h3>

                    {syllabus.map((mod, mIdx) => (
                      <div
                        key={mIdx}
                        style={{
                          padding: '20px',
                          backgroundColor: 'var(--bg-card, #162238)',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color, #30415c)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                            {mod.module_title}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>
                            Module {mIdx + 1} of {syllabus.length}
                          </span>
                        </div>

                        {/* Concepts chips */}
                        {Array.isArray(mod.key_concepts) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {mod.key_concepts.map((kc, kIdx) => (
                              <span
                                key={kIdx}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                                  color: 'var(--text-sub, #cbd5e1)',
                                  border: '1px solid var(--border-color, #30415c)'
                                }}
                              >
                                {kc}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Deep dive paragraph */}
                        {mod.deep_dive && (
                          <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-sub, #cbd5e1)', margin: 0 }}>
                            {mod.deep_dive}
                          </p>
                        )}

                        {/* Code snippet block */}
                        {mod.code_snippet && (
                          <div
                            style={{
                              position: 'relative',
                              backgroundColor: '#070c16',
                              borderRadius: '8px',
                              border: '1px solid #1e2b42',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                padding: '6px 14px',
                                backgroundColor: '#0d1527',
                                borderBottom: '1px solid #1e2b42',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                Code Reference Example
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(mod.code_snippet, `mod_${mIdx}`)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#cbd5e1',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem'
                                }}
                              >
                                {copiedIndex === `mod_${mIdx}` ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                                <span>{copiedIndex === `mod_${mIdx}` ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre
                              style={{
                                padding: '14px',
                                margin: 0,
                                fontSize: '0.8rem',
                                color: '#e2e8f0',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                overflowX: 'auto',
                                lineHeight: '1.5'
                              }}
                            >
                              <code>{mod.code_snippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Official Documentation Links */}
                  {resources.length > 0 && (
                    <div
                      style={{
                        padding: '20px',
                        backgroundColor: 'var(--bg-card, #162238)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #30415c)'
                      }}
                    >
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', marginBottom: '14px' }}>
                        Official Documentation &amp; Reference Material
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {resources.map((res, rIdx) => {
                          const isObj = typeof res === 'object';
                          const title = isObj ? res.name : res;
                          const url = isObj ? res.url : '#';
                          const desc = isObj ? res.description : 'Official industry reference documentation.';

                          return (
                            <a
                              key={rIdx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                padding: '14px',
                                backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #30415c)',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary, #3b82f6)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color, #30415c)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main, #f1f5f9)' }}>
                                  {title}
                                </strong>
                                <ExternalLink size={14} color="var(--primary, #3b82f6)" />
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: '1.4' }}>
                                {desc}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DAILY TASKS */}
              {activeTab === 'tasks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Progress overview banner */}
                  <div
                    style={{
                      padding: '18px 22px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                        Actionable Daily Study Schedule
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted, #b7c4d8)', margin: '4px 0 0 0' }}>
                        Check off daily tasks as you complete them. Progress syncs directly with MySQL records.
                      </p>
                    </div>

                    <div style={{ minWidth: '180px', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: taskProgressPercent === 100 ? 'var(--emerald, #34d399)' : 'var(--primary, #3b82f6)' }}>
                        {completedTasksCount} of {tasks.length} Done ({taskProgressPercent}%)
                      </div>
                      <div
                        style={{
                          height: '6px',
                          backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                          marginTop: '6px'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${taskProgressPercent}%`,
                            backgroundColor: taskProgressPercent === 100 ? 'var(--emerald, #34d399)' : 'var(--primary, #3b82f6)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tasks.map((task, tIdx) => (
                      <div
                        key={tIdx}
                        onClick={() => handleToggleTask(tIdx)}
                        style={{
                          padding: '14px 18px',
                          backgroundColor: task.is_completed ? 'rgba(52, 211, 153, 0.06)' : 'var(--bg-card, #162238)',
                          borderRadius: '10px',
                          border: '1px solid',
                          borderColor: task.is_completed ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-color, #30415c)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          cursor: currentIsLocked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!task.is_completed}
                          disabled={currentIsLocked || isUpdatingTasks}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: 'var(--emerald, #34d399)',
                            marginTop: '2px',
                            cursor: 'pointer'
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '0.9rem',
                                color: task.is_completed ? 'var(--text-muted, #94a3b8)' : 'var(--text-main, #f1f5f9)',
                                textDecoration: task.is_completed ? 'line-through' : 'none'
                              }}
                            >
                              {task.title || `Day ${task.day || tIdx + 1}: ${task.task_title}`}
                            </strong>
                            {task.allocated_hours && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                                  color: 'var(--text-muted, #94a3b8)',
                                  border: '1px solid var(--border-color, #30415c)'
                                }}
                              >
                                ~{task.allocated_hours} hr
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p
                              style={{
                                fontSize: '0.8rem',
                                color: task.is_completed ? 'var(--text-muted, #64748b)' : 'var(--text-sub, #b7c4d8)',
                                margin: '4px 0 0 0',
                                lineHeight: '1.4'
                              }}
                            >
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CODE EXERCISES */}
              {activeTab === 'exercises' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    style={{
                      padding: '18px 22px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)'
                    }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                      Interactive Hands-On Code Labs
                    </h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted, #b7c4d8)', margin: '4px 0 0 0' }}>
                      Practice writing real code against these technical scenarios to reinforce your understanding.
                    </p>
                  </div>

                  {exercises.map((ex, eIdx) => (
                    <div
                      key={eIdx}
                      style={{
                        padding: '22px',
                        backgroundColor: 'var(--bg-card, #162238)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color, #30415c)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}
                    >
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                        {ex.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub, #cbd5e1)', lineHeight: '1.5', margin: 0 }}>
                        <strong>Scenario:</strong> {ex.scenario}
                      </p>

                      {/* Starter Code */}
                      <div>
                        <div
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#0d1527',
                            border: '1px solid #1e2b42',
                            borderBottom: 'none',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>Starter Code Stub</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(ex.starter_code, `starter_${eIdx}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem'
                            }}
                          >
                            {copiedIndex === `starter_${eIdx}` ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                            <span>{copiedIndex === `starter_${eIdx}` ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre
                          style={{
                            padding: '14px',
                            margin: 0,
                            fontSize: '0.8rem',
                            backgroundColor: '#070c16',
                            border: '1px solid #1e2b42',
                            borderRadius: '0 0 8px 8px',
                            color: '#e2e8f0',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            overflowX: 'auto',
                            lineHeight: '1.5'
                          }}
                        >
                          <code>{ex.starter_code}</code>
                        </pre>
                      </div>

                      {/* Show Solution Toggle */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowSolution((prev) => ({ ...prev, [eIdx]: !prev[eIdx] }))}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color, #30415c)',
                            backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                            color: 'var(--text-main, #f1f5f9)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>{showSolution[eIdx] ? 'Hide Solution' : 'Show Solution & Explanation'}</span>
                        </button>

                        {showSolution[eIdx] && (
                          <div style={{ marginTop: '12px' }}>
                            <div
                              style={{
                                padding: '6px 14px',
                                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                borderBottom: 'none',
                                borderRadius: '8px 8px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span style={{ fontSize: '0.72rem', color: 'var(--emerald, #34d399)', fontWeight: '700' }}>
                                Verified Solution
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(ex.solution, `sol_${eIdx}`)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--emerald, #34d399)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem'
                                }}
                              >
                                {copiedIndex === `sol_${eIdx}` ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copiedIndex === `sol_${eIdx}` ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre
                              style={{
                                padding: '14px',
                                margin: 0,
                                fontSize: '0.8rem',
                                backgroundColor: '#070c16',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                borderRadius: '0 0 8px 8px',
                                color: '#a7f3d0',
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                overflowX: 'auto',
                                lineHeight: '1.5'
                              }}
                            >
                              <code>{ex.solution}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MINI-PROJECT */}
              {activeTab === 'project' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FolderGit2 size={22} color="var(--primary, #3b82f6)" />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                        Portfolio Milestone Project
                      </h3>
                    </div>

                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main, #f1f5f9)', lineHeight: '1.6', margin: 0 }}>
                      {selectedItem.practice_project || curriculum.project}
                    </p>

                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, #30415c)'
                      }}
                    >
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--emerald, #34d399)', margin: '0 0 8px 0' }}>
                        Expected Career Capability &amp; Resume Bullet Point
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub, #cbd5e1)', margin: 0, lineHeight: '1.5' }}>
                        "{selectedItem.expected_outcome || curriculum.outcome}"
                      </p>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', marginBottom: '10px' }}>
                        Project Deliverables Checklist:
                      </h4>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-sub, #cbd5e1)', fontSize: '0.85rem', lineHeight: '1.7' }}>
                        <li>Scaffold modular project repository with clean folder structure (src, test, docs).</li>
                        <li>Implement core architectural patterns with strict input validation and error handling.</li>
                        <li>Write automated test suites verifying happy path and failure edge cases.</li>
                        <li>Include a comprehensive README.md with setup instructions, architectural diagrams, and sample payloads.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: KNOWLEDGE QUIZ (ASSESSMENT) */}
              {activeTab === 'quiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Assessment Intro */}
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={20} color="var(--primary, #3b82f6)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)', margin: 0 }}>
                          Phase Assessment &amp; Knowledge Verification
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted, #b7c4d8)', margin: '4px 0 0 0' }}>
                        Answer all {quizQuestions.length} questions. You must score <strong>80% or higher</strong> to pass. Passing the quiz and completing daily tasks marks this milestone complete and unlocks the next phase.
                      </p>
                    </div>

                    {quizResult && (
                      <div
                        style={{
                          padding: '10px 18px',
                          borderRadius: '10px',
                          backgroundColor: quizResult.passed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)',
                          border: `1px solid ${quizResult.passed ? 'var(--emerald, #34d399)' : 'var(--danger, #fb7185)'}`,
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: quizResult.passed ? 'var(--emerald, #34d399)' : 'var(--danger, #fb7185)' }}>
                          {quizResult.score}%
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: quizResult.passed ? 'var(--emerald, #34d399)' : 'var(--danger, #fb7185)' }}>
                          {quizResult.passed ? 'PASSED (>= 80%)' : 'FAILED (< 80%)'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Unlock Announcement Banner if Passed */}
                  {quizResult?.passed && (
                    <div
                      style={{
                        padding: '18px 22px',
                        backgroundColor: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid var(--emerald, #34d399)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 size={24} color="var(--emerald, #34d399)" />
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--emerald, #34d399)' }}>
                            Congratulations! Assessment Passed ({quizResult.correct_count} / {quizResult.total_questions} Correct).
                          </strong>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-sub, #cbd5e1)', marginTop: '2px' }}>
                            {quizResult.phase_completed
                              ? 'All criteria met: Phase marked Complete and next milestone unlocked!'
                              : `Quiz passed! Complete any remaining daily tasks to complete this milestone.`}
                          </div>
                        </div>
                      </div>

                      {quizResult.next_phase && (
                        <button
                          type="button"
                          onClick={() => handleNextPhase(quizResult.next_phase)}
                          style={{
                            padding: '9px 18px',
                            backgroundColor: 'var(--primary, #3b82f6)',
                            color: '#ffffff',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <span>Start Phase {quizResult.next_phase.phase_number}</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Error banner */}
                  {quizError && (
                    <div
                      style={{
                        padding: '12px 18px',
                        backgroundColor: 'rgba(251, 113, 133, 0.12)',
                        border: '1px solid var(--danger, #fb7185)',
                        borderRadius: '8px',
                        color: 'var(--danger, #fb7185)',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{quizError}</span>
                    </div>
                  )}

                  {/* Quiz Questions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {quizQuestions.map((q, qIdx) => {
                      const userChoice = selectedAnswers[q.id];
                      const qResult = quizResult?.results?.find((r) => r.id === q.id);

                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: '20px',
                            backgroundColor: 'var(--bg-card, #162238)',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: qResult
                              ? qResult.is_correct
                                ? 'rgba(52, 211, 153, 0.4)'
                                : 'rgba(251, 113, 133, 0.4)'
                              : 'var(--border-color, #30415c)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main, #f1f5f9)' }}>
                              <span style={{ color: 'var(--primary, #3b82f6)', marginRight: '8px' }}>Q{qIdx + 1}.</span>
                              {q.question}
                            </div>
                            {qResult && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  padding: '3px 10px',
                                  borderRadius: '9999px',
                                  backgroundColor: qResult.is_correct ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)',
                                  color: qResult.is_correct ? 'var(--emerald, #34d399)' : 'var(--danger, #fb7185)',
                                  border: `1px solid ${qResult.is_correct ? 'var(--emerald, #34d399)' : 'var(--danger, #fb7185)'}`
                                }}
                              >
                                {qResult.is_correct ? 'Correct' : 'Incorrect'}
                              </span>
                            )}
                          </div>

                          {/* Options */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userChoice === optIdx;
                              const isCorrectOpt = qResult && qResult.correct_index === optIdx;

                              let optBg = 'var(--bg-card-elevated, #1c2b43)';
                              let optBorder = 'var(--border-color, #30415c)';

                              if (qResult) {
                                if (isCorrectOpt) {
                                  optBg = 'rgba(52, 211, 153, 0.15)';
                                  optBorder = 'var(--emerald, #34d399)';
                                } else if (isSelected && !qResult.is_correct) {
                                  optBg = 'rgba(251, 113, 133, 0.15)';
                                  optBorder = 'var(--danger, #fb7185)';
                                }
                              } else if (isSelected) {
                                optBg = 'rgba(59, 130, 246, 0.15)';
                                optBorder = 'var(--primary, #3b82f6)';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectAnswer(q.id, optIdx)}
                                  disabled={!!quizResult?.passed}
                                  style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: `1px solid ${optBorder}`,
                                    backgroundColor: optBg,
                                    color: 'var(--text-main, #f1f5f9)',
                                    fontSize: '0.85rem',
                                    textAlign: 'left',
                                    cursor: quizResult?.passed ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      border: `2px solid ${isSelected ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #64748b)'}`,
                                      backgroundColor: isSelected ? 'var(--primary, #3b82f6)' : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />}
                                  </div>
                                  <span style={{ flex: 1 }}>{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation if graded */}
                          {qResult && (
                            <div
                              style={{
                                padding: '10px 14px',
                                backgroundColor: 'var(--bg-surface, #111b2e)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #30415c)',
                                fontSize: '0.8rem',
                                color: 'var(--text-sub, #cbd5e1)',
                                lineHeight: '1.4'
                              }}
                            >
                              <strong style={{ color: 'var(--text-main, #f1f5f9)' }}>Explanation: </strong>
                              {qResult.explanation || q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Footer */}
                  <div
                    style={{
                      padding: '18px 22px',
                      backgroundColor: 'var(--bg-card, #162238)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #30415c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #b7c4d8)' }}>
                      Questions Answered: {Object.keys(selectedAnswers).length} of {quizQuestions.length}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {quizResult && !quizResult.passed && (
                        <button
                          type="button"
                          onClick={handleRetakeQuiz}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #30415c)',
                            backgroundColor: 'var(--bg-card-elevated, #1c2b43)',
                            color: 'var(--text-main, #f1f5f9)',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <RotateCcw size={16} />
                          <span>Retake Quiz</span>
                        </button>
                      )}

                      {!quizResult?.passed && (
                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          disabled={quizSubmitting || currentIsLocked}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--primary, #3b82f6)',
                            color: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: quizSubmitting || currentIsLocked ? 'not-allowed' : 'pointer',
                            opacity: quizSubmitting || currentIsLocked ? 0.6 : 1
                          }}
                        >
                          <Award size={18} />
                          <span>{quizSubmitting ? 'Grading Assessment...' : 'Submit Assessment'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

