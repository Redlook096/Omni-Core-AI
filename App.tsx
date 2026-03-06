import React, { useState, useRef, useEffect } from 'react';
import { PromptInputBox } from './components/ui/prompt-input-box';
import { AppleStyleDock } from './components/ui/apple-style-dock';
import { GradualSpacing } from './components/ui/gradual-spacing';
import { ChatMessage } from './components/ui/chat-message';
import { streamChat, generateTitle, generateSuggestions } from './lib/gemini';
import { t } from './lib/translations';
import { AnimatePresence, motion } from 'framer-motion';
import { SquarePen, Plus, Search, X, Check, Pencil, Trash2, Settings, FileText, Lightbulb, MessageSquare, HelpCircle, Download, Code, Zap, BarChart, Bug, Languages } from 'lucide-react';
import { ThemeToggle } from './components/ui/theme-toggle';
import { FakeTextStory } from './components/ui/fake-text-story';
import { CreatorsMenu } from './components/ui/creators-menu';
import { TextShimmer } from './components/ui/text-shimmer';
import { ChatManagerModal } from './components/ui/chat-manager-modal';
import { SettingsModal } from './components/ui/settings-modal';
import { CodeRunner } from './components/ui/code-runner';
import { SiriOrb } from './components/SiriOrb';
import { cn } from './lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

const SIDEBAR_TRANSITION = { type: "spring", stiffness: 200, damping: 25, mass: 0.5 };

const sidebarVariants = {
  open: {
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30, 
      mass: 0.8,
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  closed: {
    x: "-100%",
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30, 
      mass: 0.8
    }
  }
};

const itemVariants = {
  open: { 
    opacity: 1, 
    x: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
  closed: { 
    opacity: 0, 
    x: -20, 
    transition: { duration: 0.2 } 
  }
};

interface Suggestion {
  iconName: 'FileText' | 'Lightbulb' | 'MessageSquare' | 'Code' | 'Zap' | 'BarChart' | 'Bug' | 'Languages' | 'SquarePen' | 'Settings';
  text: string;
  subtext: string;
  prompt?: string;
  autoSend?: boolean;
  action?: 'open-runner' | 'open-settings' | 'open-story' | 'toggle-theme';
}

const SUGGESTIONS_POOL: Suggestion[] = [
  { iconName: 'Code', text: 'Deep Code Analyzer', subtext: 'Identify bugs & optimize', prompt: 'Act as a Senior Staff Engineer. Analyze the following code for performance bottlenecks, security vulnerabilities, and architectural flaws. Provide a structured report with actionable fixes:\n\n', autoSend: false },
  { iconName: 'Zap', text: 'Strategic Planner', subtext: 'Multi-step execution plan', prompt: 'Act as a Strategic Mastermind. Break down the following goal into a comprehensive, multi-step execution plan with timelines, risk assessments, and resource allocation:\n\n', autoSend: false },
  { iconName: 'BarChart', text: 'Data Insights Engine', subtext: 'Statistical anomaly detection', prompt: 'Act as a Lead Data Scientist. Analyze this dataset. Identify statistical anomalies, hidden correlations, and predictive trends. Output the results in a structured JSON format:\n\n', autoSend: false },
  { iconName: 'FileText', text: 'Contract Reviewer', subtext: 'Legal loophole detection', prompt: 'Act as an Expert Legal Counsel. Review the following text for potential loopholes, ambiguous clauses, and liabilities. Highlight critical risks and suggest precise revisions:\n\n', autoSend: false },
  { iconName: 'Bug', text: 'Root Cause Diagnostics', subtext: 'System failure analysis', prompt: 'Act as a Site Reliability Engineer. Diagnose the root cause of the following system error or log output. Provide a step-by-step mitigation strategy and a post-mortem summary:\n\n', autoSend: false },
  { iconName: 'Languages', text: 'Semantic Translator', subtext: 'Preserve cultural nuance', prompt: 'Act as a Master Linguist. Translate the following text, but preserve all cultural nuances, idioms, and emotional undertones. Provide the translation along with a breakdown of the linguistic choices made:\n\n', autoSend: false },
  { iconName: 'SquarePen', text: 'Code Playground', subtext: 'Write & run code instantly', action: 'open-runner' },
  { iconName: 'Settings', text: 'App Preferences', subtext: 'Customize your experience', action: 'open-settings' },
  { iconName: 'MessageSquare', text: 'Immersive Story', subtext: 'Enter story mode', action: 'open-story' }
];

const AnimatedMenuIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="relative w-5 h-5 flex justify-center items-center">
    <motion.span
      initial={false}
      animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-5 h-[2px] bg-current rounded-full absolute top-[4px] origin-center"
    />
    <motion.span
      initial={false}
      animate={isOpen ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-5 h-[2px] bg-current rounded-full absolute top-[10px]"
    />
    <motion.span
      initial={false}
      animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-5 h-[2px] bg-current rounded-full absolute top-[16px] origin-center"
    />
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'creators-menu' | 'story'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isStoryFullscreen, setIsStoryFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [aiMood, setAiMood] = useState('Neutral');
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [creativityLevel, setCreativityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [fontSize, setFontSize] = useState<'small' | 'base' | 'large'>('base');
  const [currentSuggestions, setCurrentSuggestions] = useState<Suggestion[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [runnerState, setRunnerState] = useState<{isOpen: boolean, code: string, language: string}>({ isOpen: false, code: '', language: '' });
  const handleSubmitRef = useRef<(value: string) => void>();
  
  const [history, setHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: { id: string, title: string, date: string, messages: Message[] }) => ({
          ...s,
          date: new Date(s.date)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem('currentSessionId') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Renaming State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Listen for custom run-code and set-prompt events
  useEffect(() => {
    const handleRunCode = (e: Event) => {
      const customEvent = e as CustomEvent;
      setRunnerState({
        isOpen: true,
        code: customEvent.detail.code,
        language: customEvent.detail.language
      });
    };
    
    const handleSetPrompt = (e: Event) => {
      const customEvent = e as CustomEvent;
      setInputValue(customEvent.detail);
      // Focus the input if possible
      const inputEl = document.querySelector('textarea');
      if (inputEl) {
        inputEl.focus();
      }
    };

    const handleAutoFixCode = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { code, language, error } = customEvent.detail;
      const prompt = `The following ${language} code failed to execute:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nIt produced this error:\n\`\`\`\n${error}\n\`\`\`\n\nPlease fix the code and provide the fully functional version. Ensure it is 100% functional and fixes the error.`;
      
      // Close the code runner so they can see the chat
      setRunnerState(prev => ({ ...prev, isOpen: false }));
      
      // Send the message
      if (handleSubmitRef.current) {
        handleSubmitRef.current(prompt);
      }
    };

    window.addEventListener('run-code', handleRunCode);
    window.addEventListener('set-prompt', handleSetPrompt);
    window.addEventListener('auto-fix-code', handleAutoFixCode);
    return () => {
      window.removeEventListener('run-code', handleRunCode);
      window.removeEventListener('set-prompt', handleSetPrompt);
      window.removeEventListener('auto-fix-code', handleAutoFixCode);
    };
  }, []);
  useEffect(() => {
    if (!hasStarted) {
      setInputValue(''); // Clear input on new chat
      
      // Generate dynamic suggestions based on history
      const fetchSuggestions = async () => {
        const suggestions = await generateSuggestions(history);
        if (suggestions && suggestions.length > 0) {
          setCurrentSuggestions(suggestions);
        } else {
          // Fallback if generation fails
          const shuffled = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
          setCurrentSuggestions(shuffled.slice(0, 3));
        }
      };
      
      fetchSuggestions();
    }
  }, [hasStarted, history]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    // Keep this for initial load or if skipped
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const handleScroll = () => {
    if (!mainContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainContentRef.current;
    // Check if we are near the bottom of the container
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 150;
    isUserScrolledUp.current = !isAtBottom;
  };

  const scrollToBottom = (force = false) => {
    if (!isUserScrolledUp.current || force) {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Focus edit input when activated
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingSessionId]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  }, [history]);

  // Save currentSessionId to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    } else {
      localStorage.removeItem('currentSessionId');
    }
  }, [currentSessionId]);

  // Save current session to history whenever messages update
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setHistory(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages }
          : session
      ));
    }
  }, [messages, currentSessionId]);

  // Load initial session on mount
  useEffect(() => {
    if (currentSessionId) {
      const session = history.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages);
        setHasStarted(session.messages.length > 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount

  const handleHomeClick = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setHasStarted(false);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setInputValue('');

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
      const newSession: ChatSession = {
        id: sessionId,
        title: "Generating title...",
        date: new Date(),
        messages: []
      };
      setHistory(prev => [newSession, ...prev]);
      
      // Generate title asynchronously
      generateTitle(value).then(title => {
        setHistory(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
      });
    } else {
      // Move existing session to top
      setHistory(prev => {
        const index = prev.findIndex(s => s.id === sessionId);
        if (index > 0) {
          const newHistory = [...prev];
          const [session] = newHistory.splice(index, 1);
          return [session, ...newHistory];
        }
        return prev;
      });
    }

    setHasStarted(true);
    
    // Add user message
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: value }
    ];
    setMessages(newMessages);
    setIsLoading(true);
    
    // Force scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(true), 100);

    try {
      // Add placeholder for AI response
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      let fullResponse = '';
      const customPersona = `You must respond in ${language}. Your personality/mood is ${aiMood}. Keep your responses ${responseLength} in length. Your creativity level should be ${creativityLevel}.`;
      const stream = streamChat(newMessages, value, customPersona, false, creativityLevel);
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: fullResponse };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  const handleRegenerate = async (index: number) => {
    if (index === 0) return;
    const previousUserMessage = messages[index - 1];
    if (previousUserMessage.role !== 'user') return;

    setIsLoading(true);
    
    const historyUpToNow = messages.slice(0, index - 1);
    setMessages([...historyUpToNow, previousUserMessage, { role: 'model', content: '' }]);

    const startTime = Date.now();
    let accumulatedResponse = '';
    
    try {
      const customPersona = `You must respond in ${language}. Your personality/mood is ${aiMood}. Keep your responses ${responseLength} in length. Your creativity level should be ${creativityLevel}.`;
      const stream = streamChat(historyUpToNow, previousUserMessage.content, customPersona, true, creativityLevel);
      
      for await (const chunk of stream) {
        accumulatedResponse += chunk;

        if (Date.now() - startTime >= 2000) {
           setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', content: accumulatedResponse };
            return updated;
          });
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'model', content: accumulatedResponse };
        return updated;
      });

    } catch (error) {
       console.error(error);
       setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { role: 'model', content: "Sorry, I couldn't regenerate that." };
         return updated;
       });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setHasStarted(session.messages.length > 0);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Settings State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    // Removed confirm dialog for smoother interaction
    setHistory(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleHomeClick();
    }
    showNotification('Chat deleted');
  };

  // ... (rest of the component)

  const startRenaming = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (sessionId: string) => {
    if (editTitle.trim()) {
      setHistory(prev => prev.map(s => s.id === sessionId ? { ...s, title: editTitle.trim() } : s));
    }
    setEditingSessionId(null);
  };

  const filteredHistory = history.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={cn(
      "h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center relative font-sans transition-colors duration-300 overflow-hidden",
      getFontSizeClass()
    )}>
      
      {/* Global Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "fixed top-[14px] left-[18px] z-[80] p-2 rounded-lg transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <AnimatedMenuIcon isOpen={isSidebarOpen} />
      </button>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[200] bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <motion.div
        initial="closed"
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed top-0 left-0 bottom-0 w-[260px] bg-[var(--bg-sidebar)] z-[70] flex flex-col border-r border-[var(--border-color)] transition-colors duration-500"
      >
        <div className="p-3 space-y-2">
          {/* Sidebar Header with Close Button */}
          <motion.div variants={itemVariants} className="flex items-center justify-end px-2 mb-2 h-10">
            <button 
              onClick={handleHomeClick}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] outline-none focus:outline-none"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            onClick={handleHomeClick}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group text-sm text-[var(--text-primary)] h-10 outline-none focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>{t(language, 'newChat')}</span>
          </motion.button>

          <motion.div variants={itemVariants} className="relative h-10">
            {isSearchActive ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-input)] rounded-lg border border-[var(--border-color)] h-full">
                <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] w-full placeholder:text-[var(--text-muted)] h-full"
                  onBlur={() => !searchQuery && setIsSearchActive(false)}
                />
                <button onClick={() => { setSearchQuery(''); setIsSearchActive(false); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchActive(true)}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm text-[var(--text-secondary)] h-full"
              >
                <Search className="w-4 h-4" />
                <span>{t(language, 'searchChats')}</span>
              </button>
            )}
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3">
          <motion.div variants={itemVariants} className="text-xs font-medium text-[var(--text-muted)] px-3 mb-2 mt-4">{t(language, 'history')}</motion.div>
          <motion.div variants={itemVariants}>
          <AnimatePresence initial={false}>
            {filteredHistory.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-4 text-center text-xs text-[var(--text-muted)] italic overflow-hidden"
              >
                {searchQuery ? t(language, 'noChats') : t(language, 'noChats')}
              </motion.div>
            ) : (
              filteredHistory.map((session) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, x: 0, height: 40, marginBottom: 4 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  key={session.id}
                  className={cn(
                    "group relative w-full flex items-center rounded-lg transition-colors overflow-hidden shrink-0",
                    currentSessionId === session.id ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]"
                  )}
                >
                {editingSessionId === session.id ? (
                  <div className="flex items-center w-full px-2 h-full">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(session.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(session.id)}
                      className="bg-[var(--bg-input)] text-[var(--text-primary)] text-sm rounded px-2 py-1 w-full outline-none border border-[var(--border-color)]"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button 
                    onClick={() => handleLoadSession(session)}
                    className="flex-1 text-left px-3 text-sm text-[var(--text-primary)] truncate flex items-center h-full"
                  >
                    {session.title === "Generating title..." ? (
                      <TextShimmer as="span" className="text-xs" duration={1.5}>
                        Generating title...
                      </TextShimmer>
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </button>
                )}

                {/* Hover Actions */}
                {!editingSessionId && (
                  <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-hover)] pl-2 shadow-[-10px_0_10px_var(--bg-hover)] h-full">
                    <button 
                      onClick={(e) => startRenaming(e, session)}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-md"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-app)] rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
          </AnimatePresence>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="p-3 border-t border-[var(--border-color)] space-y-1">
          <button 
            onClick={() => setIsChatManagerOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Download className="w-4 h-4" />
            <span>Manage Chats</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Settings className="w-4 h-4" />
            <span>{t(language, 'settings')}</span>
          </button>
          <button 
            onClick={() => {
              // Placeholder for help/FAQ
              alert("Help & FAQ coming soon!");
            }}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & FAQ</span>
          </button>
          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        ref={mainContentRef}
        onScroll={handleScroll}
        animate={{ paddingLeft: isSidebarOpen && !isMobile ? "260px" : "0px" }}
        transition={SIDEBAR_TRANSITION}
        className="flex-1 w-full flex flex-col items-center relative h-screen overflow-y-auto overflow-x-hidden"
      >
        
        {/* Scrollable Content Container */}
        {currentView === 'chat' ? (
          <div className={cn(
            "w-full flex flex-col items-center px-4",
            !hasStarted ? "h-screen justify-center pb-20" : "pt-8 md:pt-12 pb-40"
          )}>
            <div className="w-full max-w-3xl flex flex-col gap-8">
              
              {/* Intro Title & Suggestions */}
              <AnimatePresence mode="wait">
                {!hasStarted && (
                  <motion.div 
                    key="intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-6 w-full"
                  >
                    {/* AI Assistant Orb */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="relative flex items-center justify-center mb-10 mt-4"
                    >
                      <SiriOrb size="112px" />
                    </motion.div>

                    <GradualSpacing 
                       text={t(language, 'whatCanIHelpWith')}
                       className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] tracking-tight text-center opacity-90 mb-2"
                       delayMultiple={0.04}
                       baseDelay={0.2}
                    />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full pointer-events-auto"
                    >
                      <PromptInputBox
                        placeholder={t(language, 'whatCanIHelpWith')}
                        onSend={(msg) => handleSubmit(msg)}
                        isLoading={isLoading}
                        value={inputValue}
                        onChange={setInputValue}
                        language={language}
                      />
                    </motion.div>
                    
                    {/* Quick Action Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2">
                      {currentSuggestions.map((suggestion, i) => {
                        const IconComponent = {
                          FileText, Lightbulb, MessageSquare, Code, Zap, BarChart, Bug, Languages, SquarePen, Settings
                        }[suggestion.iconName];
                        
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            onClick={() => {
                              if (suggestion.action) {
                                if (suggestion.action === 'open-runner') setRunnerState({ isOpen: true, code: '', language: 'javascript' });
                                else if (suggestion.action === 'open-settings') setIsSettingsOpen(true);
                                else if (suggestion.action === 'open-story') setCurrentView('story');
                                else if (suggestion.action === 'toggle-theme') setIsDark(!isDark);
                              } else if (suggestion.prompt) {
                                if (suggestion.autoSend) {
                                  handleSubmit(suggestion.prompt);
                                } else {
                                  setInputValue(suggestion.prompt);
                                  setTimeout(() => {
                                    document.getElementById('prompt-textarea')?.focus();
                                  }, 50);
                                }
                              }
                            }}
                            className="flex flex-col items-start p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 hover:bg-[var(--bg-hover)] transition-all text-left group shadow-sm"
                          >
                            <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm mb-1">
                              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                {IconComponent && <IconComponent className="w-4 h-4" />}
                              </span>
                              {suggestion.text}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                              {suggestion.subtext}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Messages */}
              <AnimatePresence mode="wait">
                {hasStarted && (
                  <motion.div 
                    key={currentSessionId || 'new-session'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full flex-1 flex flex-col gap-8"
                  >
                    {messages.map((msg, idx) => {
                      const isSearching = idx > 0 && messages[idx - 1].role === 'user' && messages[idx - 1].content.startsWith('[Search: ');
                      return (
                        <ChatMessage 
                          key={idx} 
                          role={msg.role} 
                          content={msg.content} 
                          onRegenerate={() => handleRegenerate(idx)}
                          isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'model'}
                          isSearching={isSearching}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : currentView === 'creators-menu' ? (
          <div className="w-full h-full overflow-hidden flex items-center justify-center">
            <CreatorsMenu onSelect={(type) => {
              if (type === 'story') setCurrentView('story');
            }} />
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden pt-14 pb-24 flex items-center justify-center">
            <FakeTextStory onFullscreenChange={setIsStoryFullscreen} />
          </div>
        )}

      </motion.div>

      {/* Input Area */}
      {currentView === 'chat' && hasStarted && (
        <motion.div 
          initial={false}
          animate={{ 
            pointerEvents: (hasStarted && isDockHovered) ? 'none' : 'auto',
            paddingLeft: isSidebarOpen && !isMobile ? "260px" : "0px",
            opacity: (hasStarted && isDockHovered) ? 0 : 1,
            y: (hasStarted && isDockHovered) ? 20 : 0
          }}
          transition={SIDEBAR_TRANSITION}
          className="fixed bottom-10 left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
        >
          <motion.div className="w-full max-w-3xl pointer-events-auto">
            <PromptInputBox
              placeholder={t(language, 'typeMessage')}
              onSend={(msg) => handleSubmit(msg)}
              isLoading={isLoading}
              value={inputValue}
              onChange={setInputValue}
              language={language}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Dock Hover Trigger & Indicator */}
      {!isStoryFullscreen && currentView !== 'creators-menu' && (hasStarted || currentView !== 'chat') && (
        <div 
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-96 h-12 z-[200] flex items-end justify-center pb-2 cursor-pointer group"
          onMouseEnter={() => setIsDockHovered(true)}
          onMouseLeave={() => setIsDockHovered(false)}
        >
          {/* Subtle Indicator Line */}
          <div className={cn(
            "w-20 h-1.5 rounded-full transition-all duration-300",
            isDockHovered ? "bg-transparent" : "bg-[var(--text-muted)]/40 group-hover:bg-[var(--text-secondary)]/60 group-hover:w-32"
          )} />
        </div>
      )}

      {/* Dock */}
      {!isStoryFullscreen && currentView !== 'creators-menu' && (
        <div 
          className="fixed bottom-8 left-0 w-full z-[200] pointer-events-none flex justify-center"
        >
          <div className="pointer-events-auto" onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)}>
             <AppleStyleDock 
               show={currentView === 'chat' ? (!hasStarted || isDockHovered) : isDockHovered} 
               onHomeClick={() => {
                 setCurrentView('chat');
                 handleHomeClick();
               }}
               onStoryClick={() => setCurrentView('creators-menu')}
             />
          </div>
        </div>
      )}

      {/* Modals */}
      <ChatManagerModal 
        isOpen={isChatManagerOpen} 
        onClose={() => setIsChatManagerOpen(false)} 
        history={history}
        setHistory={setHistory}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        setMessages={setMessages}
        setHasStarted={setHasStarted}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={() => {
          setHistory([]);
          setMessages([]);
          setHasStarted(false);
          setCurrentSessionId(null);
          localStorage.removeItem('chatHistory');
          localStorage.removeItem('currentSessionId');
        }}
        language={language}
        setLanguage={setLanguage}
        aiMood={aiMood}
        setAiMood={setAiMood}
        responseLength={responseLength}
        setResponseLength={setResponseLength}
        creativityLevel={creativityLevel}
        setCreativityLevel={setCreativityLevel}
        fontSize={fontSize}
        setFontSize={setFontSize}
        isDark={isDark}
        setIsDark={setIsDark}
      />

      <CodeRunner 
        isOpen={runnerState.isOpen}
        onClose={() => setRunnerState(prev => ({ ...prev, isOpen: false }))}
        code={runnerState.code}
        language={runnerState.language}
      />

    </div>
  );
}
