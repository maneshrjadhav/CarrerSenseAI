import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  Minimize2,
  Maximize2,
  ExternalLink,
  Target,
  Compass,
  FileText,
  TrendingUp,
  BookOpen,
  Code
} from 'lucide-react';
import chatService from '../../services/chatService';

const SUGGESTED_PROMPTS = [
  { label: '🎯 Explain my top skill gaps', query: 'Explain my top skill gaps for my target role' },
  { label: "📖 Help me study today's lesson", query: "Help me study today's lesson for my active roadmap milestone" },
  { label: '💻 Explain this code', query: 'Explain the technical code example from my current milestone' },
  { label: '🎙️ Prepare me for a technical interview', query: 'Prepare me for a technical interview on my missing skills' },
  { label: '🗺️ Review my roadmap progress', query: 'Review my roadmap progress and tell me what is next' },
  { label: '📄 Improve my resume for ATS', query: 'How can I improve my resume for ATS screening and job match?' },
  { label: '🇮🇳 हिंदी मार्गदर्शन (Hindi)', query: 'मेरे टारगेट रोल और स्किल गैप के बारे में हिंदी में समझाइए' },
  { label: '🇮🇳 मराठी मार्गदर्शन (Marathi)', query: 'माझ्या करिअर रोडमॅप आणि कौशल्यांबद्दल मराठीत माहिती द्या' }
];

const INITIAL_WELCOME = {
  role: 'assistant',
  content: `Hello! 👋 I am your **CareerSense AI Career Assistant**.\n\nI am connected directly to your profile and MySQL records. You can ask me anything about your:\n- **Resume Quality & ATS Score**\n- **Target Job Match & Missing Skills**\n- **Personalized Learning Roadmap & Study Tasks**\n- **Technical Interview Preparation**\n\nFeel free to ask in English, Hindi, or Marathi! How can I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function CareerAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('careersense_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [INITIAL_WELCOME];
  });
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/health');
        if (res.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch {
        setIsOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('careersense_chat_history', JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: text, timestamp: time };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      // Format history for backend
      const backendHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await chatService.sendMessage(text, backendHistory);
      const assistantMsg = {
        role: 'assistant',
        content: res.reply || 'Here is what I found based on your candidate profile.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `I ran into a connection issue: ${err.message || 'Please verify backend connectivity'}. Please try again shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME]);
    sessionStorage.removeItem('careersense_chat_history');
  };

  // Simple Markdown renderer for chat responses
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ margin: '8px 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main, #0f172a)' }}>
            {formatInline(line.substring(4))}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} style={{ margin: '6px 0 3px 0', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main, #1e293b)' }}>
            {formatInline(line.substring(5))}
          </h5>
        );
      }
      // Bullet list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
        const itemContent = line.trim().substring(2);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
            <span style={{ color: 'var(--primary-color, #0284c7)', fontWeight: 'bold' }}>•</span>
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{formatInline(itemContent)}</span>
          </div>
        );
      }
      // Numbered list items
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
            <span style={{ color: 'var(--primary-color, #0284c7)', fontWeight: '700', fontSize: '0.85rem' }}>{numMatch[1]}.</span>
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{formatInline(numMatch[2])}</span>
          </div>
        );
      }
      // Empty lines
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Regular paragraphs
      return (
        <p key={idx} style={{ margin: '2px 0', fontSize: '0.85rem', lineHeight: '1.5' }}>
          {formatInline(line)}
        </p>
      );
    });
  };

  // Inline formatting helper (**bold**, `code`, etc.)
  const formatInline = (str) => {
    const parts = [];
    let remaining = str;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={keyIdx++}>{boldMatch[1]}</span>);
        parts.push(<strong key={keyIdx++} style={{ fontWeight: 700 }}>{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }

      // Check for inline code `code`
      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)/s);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={keyIdx++}>{codeMatch[1]}</span>);
        parts.push(
          <code key={keyIdx++} style={{ background: 'var(--hover-bg, rgba(125,125,125,0.15))', color: 'var(--text-main)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
        continue;
      }

      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }
    return parts;
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -3px rgba(2, 132, 199, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '0.9rem',
            fontWeight: 700
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 14px 28px -3px rgba(2, 132, 199, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(2, 132, 199, 0.45)';
          }}
          aria-label="Open AI Career Assistant"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Sparkles size={20} />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                border: '2px solid #ffffff'
              }}
            />
          </div>
          <span>Career AI Assistant</span>
        </button>
      )}

      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: isMaximized ? 'min(720px, calc(100vw - 32px))' : '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: isMaximized ? 'min(760px, calc(100vh - 48px))' : '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--bg-surface, #111b2e)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.4))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUpChat 0.25s ease-out',
            border: '1px solid var(--border-color, #30415c)',
            transition: 'width 0.2s ease, height 0.2s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Bot size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.95rem', fontWeight: '700' }}>CareerSense AI Assistant</strong>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isOnline ? '#34d399' : '#fb7185',
                      display: 'inline-block',
                      boxShadow: isOnline ? '0 0 6px #34d399' : 'none'
                    }}
                    title={isOnline ? "AI Online • Live MySQL Context" : "Offline • Reconnecting"}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {isOnline ? 'Online • Profile, Match & Roadmap Context' : 'Offline • Reconnecting...'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.85,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Restore standard size" : "Expand chat window"}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.85,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  opacity: 0.85,
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-card, #162238)',
              borderBottom: '1px solid var(--border-color, #30415c)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}
          >
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.query)}
                disabled={loading}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color, #30415c)',
                  background: 'var(--bg-card-elevated, #1c2b43)',
                  color: 'var(--text-main, #f1f5f9)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = 'var(--primary, #3b82f6)';
                    e.currentTarget.style.color = 'var(--primary, #3b82f6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #30415c)';
                  e.currentTarget.style.color = 'var(--text-main, #f1f5f9)';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-surface, #111b2e)'
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '11px 15px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : m.isError
                        ? 'var(--danger-light, #fef2f2)'
                        : 'var(--bg-card-elevated, #1c2b43)',
                      color: isUser
                        ? '#ffffff'
                        : m.isError
                        ? 'var(--danger, #dc2626)'
                        : 'var(--text-main, #f1f5f9)',
                      border: isUser ? 'none' : '1px solid var(--border-color, #30415c)',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {isUser ? m.content : renderFormattedText(m.content)}
                  </div>
                  {m.timestamp && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #b7c4d8)', marginTop: '3px', padding: '0 4px' }}>
                      {m.timestamp}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--bg-card-elevated, #1c2b43)', border: '1px solid var(--border-color, #30415c)', borderRadius: '14px', width: 'fit-content' }}>
                <div className="spinner-primary" style={{ width: '14px', height: '14px' }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #b7c4d8)' }}>
                  Career AI reasoning with candidate profile...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border-color, #30415c)',
              background: 'var(--bg-card, #162238)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask about skills, roadmap milestones, code, or interview prep... (Shift+Enter for newline)"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(120, Math.max(38, e.target.scrollHeight))}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #30415c)',
                background: 'var(--bg-card-elevated, #1c2b43)',
                color: 'var(--text-main, #f1f5f9)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.4',
                maxHeight: '120px'
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || loading}
              style={{
                padding: '10px 14px',
                background: inputValue.trim() && !loading ? 'var(--primary, #3b82f6)' : 'var(--border-color, #30415c)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

