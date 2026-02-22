import React, { useState, useRef, useEffect } from 'react';
import { AIInput } from './components/ui/ai-input';
import { AppleStyleDock } from './components/ui/apple-style-dock';
import { GradualSpacing } from './components/ui/gradual-spacing';
import { ChatMessage } from './components/ui/chat-message';
import { streamChat } from './lib/gemini';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { IDEModal } from './components/ui/ide/ide-modal';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isIDEOpen, setIsIDEOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Scroll on loading state change too

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

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
    
    // 1. Clear the message content to trigger the MorphingSquare animation
    const historyUpToNow = messages.slice(0, index - 1);
    setMessages([...historyUpToNow, previousUserMessage, { role: 'model', content: '' }]);

    const startTime = Date.now();
    let accumulatedResponse = '';
    
    try {
      // 2. Start streaming with isRegeneration = true
      const stream = streamChat(historyUpToNow, previousUserMessage.content, undefined, true);
      
      for await (const chunk of stream) {
        accumulatedResponse += chunk;

        // 3. UX Logic: Only update the UI if 2 seconds have passed. 
        // If not, we just buffer the response in background.
        if (Date.now() - startTime >= 2000) {
           setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', content: accumulatedResponse };
            return updated;
          });
        }
      }

      // 4. If the stream finished faster than 2s, wait out the remaining time
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      // 5. Final flush of content
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
    setMessages([]);
    setHasStarted(false);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center relative overflow-hidden font-sans">
      
      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center max-w-5xl px-4 z-10 pt-8 md:pt-12 pb-40">
        
        {/* Intro Title */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div 
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/3 -translate-y-1/2"
            >
              <GradualSpacing 
                 text="What can I help with?"
                 className="text-4xl md:text-5xl font-medium text-white/90 tracking-tight"
                 delayMultiple={0.04}
                 baseDelay={0.2}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className={`w-full flex-1 flex flex-col gap-8 transition-opacity duration-500 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
          <LayoutGroup>
            <AnimatePresence mode='popLayout'>
              {messages.map((msg, idx) => (
                <ChatMessage 
                  key={idx} 
                  role={msg.role} 
                  content={msg.content} 
                  onRegenerate={() => handleRegenerate(idx)}
                  isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'model'}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
          <div ref={messagesEndRef} className="h-32" />
        </div>

      </div>

      {/* Input Area - Moved up to bottom-24 when active to clear space for dock */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className={`w-full max-w-3xl px-4 z-30 ${hasStarted ? 'fixed bottom-24' : 'absolute top-1/2 -translate-y-1/2'}`}
      >
        <React.Fragment key={hasStarted ? 'active' : 'idle'}>
          <AIInput
            placeholder={hasStarted ? "Ask anything..." : "Ask anything"}
            minHeight={60}
            maxHeight={200}
            onSubmit={handleSubmit}
            className="shadow-2xl"
            visible={!hasStarted || !isDockHovered}
          />
        </React.Fragment>
      </motion.div>

      {/* Minimalist Dock Hint - No Bubble, Just Text & Arrow */}
      <AnimatePresence>
        {(hasStarted || isIDEOpen) && !isDockHovered && (
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
      {(hasStarted || isIDEOpen) && (
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
             show={(!hasStarted && !isIDEOpen) || isDockHovered} 
             onHomeClick={handleHomeClick}
             onVibeCoderClick={() => setIsIDEOpen(true)}
           />
        </div>
      </div>

      <IDEModal isOpen={isIDEOpen} onClose={() => setIsIDEOpen(false)} />

    </div>
  );
}