import React, { useState, useRef, useEffect } from 'react';
import { AIInput } from './components/ui/ai-input';
import { AppleStyleDock } from './components/ui/apple-style-dock';
import { GradualSpacing } from './components/ui/gradual-spacing';
import { ChatMessage } from './components/ui/chat-message';
import { streamChat } from './lib/gemini';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { ChevronDown, PanelLeft, SquarePen, Plus, Search, User, X, Check, Zap, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { SettingsModal } from './components/ui/settings-modal';
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
      stiffness: 200, 
      damping: 25, 
      mass: 0.5,
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
      mass: 0.5,
      staggerChildren: 0.05,
      staggerDirection: -1
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
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  // Functional History State
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
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

  // Save current session to history whenever messages update
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      setHistory(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages, title: session.title === 'New Chat' ? messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '') : session.title }
          : session
      ));
    }
  }, [messages, currentSessionId]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      date: new Date(),
      messages: []
    };
    setHistory(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages([]);
    setHasStarted(false);
    return newId;
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
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

  const handleHomeClick = () => {
    createNewSession();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
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
    if (confirm('Are you sure you want to delete this chat?')) {
      setHistory(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleHomeClick();
      }
      showNotification('Chat deleted');
    }
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
      "min-h-screen w-full bg-black text-white flex flex-col items-center relative overflow-hidden font-sans",
      getFontSizeClass()
    )}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-0 left-1/2 z-[200] bg-[#1A1A1A] border border-white/10 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
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
        className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#000000] z-[70] flex flex-col border-r border-white/10"
      >
        <div className="p-3 space-y-2">
          {/* Sidebar Header with Close Button */}
          <motion.div variants={itemVariants} className="flex items-center justify-between px-2 mb-2 h-10">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-neutral-400 hover:text-white"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleHomeClick}
              className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-neutral-400 hover:text-white"
            >
              <SquarePen className="w-5 h-5" />
            </button>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            onClick={handleHomeClick}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[#1A1A1A] rounded-lg transition-colors group text-sm text-white h-10"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </motion.button>

          <motion.div variants={itemVariants} className="relative h-10">
            {isSearchActive ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] rounded-lg border border-white/10 h-full">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-neutral-500 h-full"
                  onBlur={() => !searchQuery && setIsSearchActive(false)}
                />
                <button onClick={() => { setSearchQuery(''); setIsSearchActive(false); }} className="text-neutral-400 hover:text-white shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchActive(true)}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-sm text-white/80 h-full"
              >
                <Search className="w-4 h-4" />
                <span>Search chats</span>
              </button>
            )}
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-3">
          <motion.div variants={itemVariants} className="text-xs font-medium text-white/40 px-3 mb-2 mt-4">Your chats</motion.div>
          <motion.div variants={itemVariants}>
          <AnimatePresence mode="popLayout">
            {filteredHistory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-4 text-center text-xs text-white/30 italic"
              >
                {searchQuery ? "No chats found" : "No chat history"}
              </motion.div>
            ) : (
              filteredHistory.map((session) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  key={session.id}
                  className={cn(
                    "group relative w-full flex items-center rounded-lg transition-colors mb-1 h-10",
                    currentSessionId === session.id ? "bg-[#1A1A1A]" : "hover:bg-[#1A1A1A]"
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
                      className="bg-black/50 text-white text-sm rounded px-2 py-1 w-full outline-none border border-white/20"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button 
                    onClick={() => handleLoadSession(session)}
                    className="flex-1 text-left px-3 text-sm text-white/80 truncate flex items-center h-full"
                  >
                    <span className="truncate">{session.title}</span>
                  </button>
                )}

                {/* Hover Actions */}
                {!editingSessionId && (
                  <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1A] pl-2 shadow-[-10px_0_10px_#1A1A1A] h-full">
                    <button 
                      onClick={(e) => startRenaming(e, session)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-white/10 rounded-md"
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

        <motion.div variants={itemVariants} className="p-3 border-t border-white/10">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-2 py-2 hover:bg-[#1A1A1A] rounded-xl transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-xs font-medium text-white shrink-0">
              LS
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-sm font-medium text-white truncate">Luke Simpson</div>
              <div className="text-xs text-white/50">Free</div>
            </div>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsUpgradeOpen(true);
              }}
              className="px-2 py-1 rounded-full border border-white/20 text-[10px] font-medium text-white hover:bg-white/10 transition-colors shrink-0"
            >
              Upgrade
            </div>
          </button>
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        animate={{ paddingLeft: isSidebarOpen ? "260px" : "0px" }}
        transition={SIDEBAR_TRANSITION}
        className="flex-1 w-full flex flex-col items-center relative h-screen"
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
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-neutral-400 hover:text-white mt-2"
                >
                  <PanelLeft className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Scrollable Content Container */}
        <div className="w-full h-full overflow-y-auto flex flex-col items-center pt-8 md:pt-12 pb-40 px-4">
          <div className="w-full max-w-3xl flex flex-col gap-8">
            
            {/* Intro Title */}
            <AnimatePresence mode="wait">
              {!hasStarted && (
                <motion.div 
                  key="intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ duration: 0.5 }}
                  className="mt-[20vh] flex justify-center"
                >
                  <GradualSpacing 
                     text="What can I help with?"
                     className="text-4xl md:text-5xl font-medium text-white/90 tracking-tight text-center"
                     delayMultiple={0.04}
                     baseDelay={0.2}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages */}
            <AnimatePresence mode="popLayout">
              {hasStarted && (
                <motion.div 
                  key={currentSessionId || 'new-session'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
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

        {/* Input Area */}
        <motion.div 
          layout
          initial={false}
          animate={{ 
            pointerEvents: (hasStarted && isDockHovered) ? 'none' : 'auto'
          }}
          transition={SIDEBAR_TRANSITION}
          className={cn(
            "absolute w-full max-w-3xl px-4 z-30",
            !hasStarted ? "top-1/2 -translate-y-1/2" : "bottom-12"
          )}
        >
          <AIInput
            placeholder="Ask anything..."
            minHeight={52}
            maxHeight={200}
            onSubmit={handleSubmit}
            className="shadow-2xl"
            visible={!(hasStarted && isDockHovered)}
          />
        </motion.div>

      </motion.div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpgradeOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#171717] border border-white/10 rounded-2xl p-6 z-[101] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Upgrade Plan</h2>
                <button onClick={() => setIsUpgradeOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">RECOMMENDED</div>
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-white">Pro</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">$20<span className="text-sm font-normal text-neutral-400">/mo</span></div>
                  <ul className="text-sm text-neutral-300 space-y-2 mt-3">
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Access to Gemini 1.5 Pro</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Faster response times</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500" /> Priority access</li>
                  </ul>
                  <button className="w-full mt-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors">
                    Upgrade to Pro
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-neutral-400" />
                    <span className="font-medium text-white">Free</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">$0<span className="text-sm font-normal text-neutral-400">/mo</span></div>
                  <ul className="text-sm text-neutral-400 space-y-2 mt-3">
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-neutral-500" /> Access to Gemini 1.5 Flash</li>
                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-neutral-500" /> Standard speed</li>
                  </ul>
                  <button className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors">
                    Current Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Minimalist Dock Hint - No Bubble, Just Text & Arrow */}
      <AnimatePresence>
        {(hasStarted) && !isDockHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          >
             <div className="flex flex-col items-center gap-2 opacity-50">
                <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-white">Menu</span>
                <motion.div 
                   animate={{ y: [0, 4, 0] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                   <ChevronDown className="w-5 h-5" />
                </motion.div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Hover Trigger - Expanded to fill the gap */}
      {(hasStarted) && (
        <div 
          className="fixed bottom-0 left-0 w-full h-24 z-[200] bg-transparent"
          onMouseEnter={() => setIsDockHovered(true)}
          onMouseLeave={() => setIsDockHovered(false)}
        />
      )}

      {/* Dock */}
      <div 
        className="fixed bottom-0 left-0 w-full z-[200] pointer-events-none"
      >
        <div className="pointer-events-auto" onMouseEnter={() => setIsDockHovered(true)} onMouseLeave={() => setIsDockHovered(false)}>
           <AppleStyleDock 
             show={(!hasStarted) || isDockHovered} 
             onHomeClick={handleHomeClick}
             onSettingsClick={() => setIsSettingsOpen(true)}
           />
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onClearHistory={() => {
          setMessages([]);
          setHistory([]);
          setCurrentSessionId(null);
          setHasStarted(false);
          showNotification('All history cleared');
        }}
        systemInstruction={systemInstruction}
        setSystemInstruction={setSystemInstruction}
        typingSpeed={typingSpeed}
        setTypingSpeed={setTypingSpeed}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

    </div>
  );
}
