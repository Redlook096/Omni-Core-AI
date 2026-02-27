import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { PromptInputBox } from './components/ui/prompt-input-box';
import { AppleStyleDock } from './components/ui/apple-style-dock';
import { GradualSpacing } from './components/ui/gradual-spacing';
import { ChatMessage } from './components/ui/chat-message';
import { streamChat, generateTitle } from './lib/gemini';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, PanelLeft, SquarePen, Plus, Search, User, X, Check, Zap, Pencil, Trash2, Settings, FileText, Lightbulb, MessageSquare, Compass, HelpCircle, Download, Upload } from 'lucide-react';
import { SettingsModal } from './components/ui/settings-modal';
import { ThemeToggle } from './components/ui/theme-toggle';
import { FakeTextStory } from './components/ui/fake-text-story';
import { CreatorsMenu } from './components/ui/creators-menu';
import { TextShimmer } from './components/ui/text-shimmer';
import { ChatManagerModal } from './components/ui/chat-manager-modal';
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

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'creators-menu' | 'story'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isStoryFullscreen, setIsStoryFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isChatManagerOpen, setIsChatManagerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleTheme = (e?: React.MouseEvent) => {
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
  
  const [history, setHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date)
        }));
      } catch (e) {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    let sessionId = currentSessionId;
    let isNewSession = false;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
      isNewSession = true;
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

    try {
      // Add placeholder for AI response
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      let fullResponse = '';
      const stream = streamChat(newMessages, value);
      
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
      const stream = streamChat(historyUpToNow, previousUserMessage.content, undefined, true);
      
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
  const [systemInstruction, setSystemInstruction] = useState('');
  const [typingSpeed, setTypingSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
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
      "min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col items-center relative overflow-hidden font-sans transition-colors duration-300",
      getFontSizeClass()
    )}>
      
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
          <motion.div variants={itemVariants} className="flex items-center justify-between px-2 mb-2 h-10">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleHomeClick}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            onClick={handleHomeClick}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group text-sm text-[var(--text-primary)] h-10"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
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
                <span>Search chats</span>
              </button>
            )}
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3">
          <motion.div variants={itemVariants} className="text-xs font-medium text-[var(--text-muted)] px-3 mb-2 mt-4">Your chats</motion.div>
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
                {searchQuery ? "No chats found" : "No chat history"}
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
                      <TextShimmer className="text-xs" duration={1.5}>
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
            <span>Settings</span>
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
        animate={{ paddingLeft: isSidebarOpen && !isMobile ? "260px" : "0px" }}
        transition={SIDEBAR_TRANSITION}
        className="flex-1 w-full flex flex-col items-center relative min-h-screen"
      >
        
        {/* Header Toggle (Visible when sidebar closed) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 pointer-events-none"
        >
          <div className="pointer-events-auto">
            <AnimatePresence>
              {!isSidebarOpen && (
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-2"
                >
                  <PanelLeft className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Scrollable Content Container */}
        {currentView === 'chat' ? (
          <div className="w-full flex flex-col items-center pt-8 md:pt-12 pb-40 px-4">
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
                    className="mt-[10vh] flex flex-col items-center gap-8 w-full"
                  >
                    <GradualSpacing 
                       text="What can I help with?"
                       className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] tracking-tight text-center opacity-90"
                       delayMultiple={0.04}
                       baseDelay={0.2}
                    />
                    
                    {/* Quick Action Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                      {[
                        { icon: <FileText className="w-4 h-4" />, text: "Summarize a long document", subtext: "Extract key points quickly" },
                        { icon: <Lightbulb className="w-4 h-4" />, text: "Brainstorm creative ideas", subtext: "For your next big project" },
                        { icon: <MessageSquare className="w-4 h-4" />, text: "Draft a professional email", subtext: "To a client or colleague" },
                        { icon: <Compass className="w-4 h-4" />, text: "Explain a complex topic", subtext: "Make it easy to understand" }
                      ].map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + (i * 0.1), duration: 0.4 }}
                          onClick={() => handleSubmit(suggestion.text)}
                          className="flex flex-col items-start p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/50 hover:bg-[var(--bg-hover)] transition-all text-left group shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium text-sm mb-1">
                            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{suggestion.icon}</span>
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {suggestion.subtext}
                          </div>
                        </motion.button>
                      ))}
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
                    {messages.map((msg, idx) => (
                      <ChatMessage 
                        key={idx} 
                        role={msg.role} 
                        content={msg.content} 
                        onRegenerate={() => handleRegenerate(idx)}
                        isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'model'}
                        typingSpeed={typingSpeed}
                      />
                    ))}
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

        {/* Input Area */}
        {currentView === 'chat' && (
          <motion.div 
            layout
            initial={false}
            animate={{ 
              pointerEvents: (hasStarted && isDockHovered) ? 'none' : 'auto',
              paddingLeft: isSidebarOpen && !isMobile ? "260px" : "0px",
              opacity: (hasStarted && isDockHovered) ? 0 : 1,
              y: (hasStarted && isDockHovered) ? 20 : 0
            }}
            transition={SIDEBAR_TRANSITION}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none",
              !hasStarted ? "bottom-[15vh]" : "bottom-10"
            )}
          >
            <div className="w-full max-w-3xl px-4 pointer-events-auto">
              <PromptInputBox
                placeholder="Ask anything..."
                onSend={(msg) => handleSubmit(msg)}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* Dock Hover Trigger */}
      {!isStoryFullscreen && currentView !== 'creators-menu' && (hasStarted || currentView !== 'chat') && (
        <div 
          className="fixed bottom-0 left-0 w-full h-8 z-[200] bg-transparent"
          onMouseEnter={() => setIsDockHovered(true)}
          onMouseLeave={() => setIsDockHovered(false)}
        />
      )}

      {/* Dock */}
      {!isStoryFullscreen && currentView !== 'creators-menu' && (
        <div 
          className="fixed bottom-0 left-0 w-full z-[200] pointer-events-none"
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

    </div>
  );
}
