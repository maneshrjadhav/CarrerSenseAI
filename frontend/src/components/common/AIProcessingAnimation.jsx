import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Cpu,
  BarChart3,
  Target,
  Layers,
  Compass,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AI_PROCESSING_STAGES = [
  { id: 'extract', label: 'Extracting text from PDF...', engine: 'PyMuPDF', icon: FileText, color: '#2563eb' },
  { id: 'nlp', label: 'Tokenizing & Lemmatizing text...', engine: 'NLTK Engine', icon: Cpu, color: '#0891b2' },
  { id: 'tfidf', label: 'Generating TF-IDF vector matrix...', engine: 'Scikit-Learn', icon: BarChart3, color: '#0f766e' },
  { id: 'cosine', label: 'Computing Cosine Similarity angle...', engine: 'Vector Math', icon: Target, color: '#059669' },
  { id: 'skills', label: 'Detecting matched & missing skills...', engine: 'Skill Matrix', icon: Layers, color: '#d97706' },
  { id: 'roadmap', label: 'Synthesizing career roadmap...', engine: 'Roadmap Gen', icon: Compass, color: '#7c3aed' },
  { id: 'ready', label: 'Analysis Complete & Ready', engine: 'System Verified', icon: CheckCircle2, color: '#10b981' },
];

export default function AIProcessingAnimation({
  autoAdvance = true,
  intervalMs = 2400,
  stepIndex: externalStepIndex,
  onComplete,
  className = '',
}) {
  const [internalStep, setInternalStep] = useState(0);
  const activeIndex = externalStepIndex !== undefined ? externalStepIndex : internalStep;

  useEffect(() => {
    if (!autoAdvance || externalStepIndex !== undefined) return;

    const timer = setInterval(() => {
      setInternalStep((prev) => {
        if (prev < AI_PROCESSING_STAGES.length - 1) {
          return prev + 1;
        } else {
          if (onComplete) onComplete();
          return 0; // Loop seamlessly for demo preview
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoAdvance, externalStepIndex, intervalMs, onComplete]);

  const currentStage = AI_PROCESSING_STAGES[activeIndex] || AI_PROCESSING_STAGES[0];
  const Icon = currentStage.icon;
  const isComplete = activeIndex === AI_PROCESSING_STAGES.length - 1;

  return (
    <div className={`ai-processing-container ${className}`}>
      <div className="processing-indicator-pill">
        <div className="pill-status-pulse">
          {isComplete ? (
            <CheckCircle2 size={16} className="text-emerald animate-pop" />
          ) : (
            <Loader2 size={16} className="animate-spin text-primary" />
          )}
        </div>

        <div className="processing-text-group">
          <span className="processing-engine-tag">{currentStage.engine}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStage.id}
              className="processing-label-text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {currentStage.label}
            </motion.span>
          </AnimatePresence>
        </div>

        <span className="processing-progress-fraction">
          {activeIndex + 1}/{AI_PROCESSING_STAGES.length}
        </span>
      </div>

      {/* Progress Track Bar */}
      <div className="processing-progress-track">
        <div
          className="processing-progress-fill"
          style={{
            width: `${((activeIndex + 1) / AI_PROCESSING_STAGES.length) * 100}%`,
            backgroundColor: currentStage.color,
          }}
        />
      </div>
    </div>
  );
}

