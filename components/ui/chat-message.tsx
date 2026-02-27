import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { 
  Copy, 
  RotateCw, 
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from './spinner';
import { MorphingSquare } from './morphing-square';

export interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

const useTypewriter = (text: string, isEnabled: boolean = false, speed: 'slow' | 'normal' | 'fast' = 'normal') => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);

  useEffect(() => {
    if (!isEnabled) {
      index.current = text.length;
      return;
    }

    // If text was reset (e.g. new message), reset index
    if (text.length < index.current) {
        index.current = 0;
        setTimeout(() => setDisplayedText(''), 0);
    }
    
    // If already caught up, do nothing
    if (index.current >= text.length) {
        return;
    }

    let animationId: number;

    const animate = () => {
      if (index.current < text.length) {
        // Calculate how many characters to add based on "distance" to target
        const distance = text.length - index.current;
        
        let divisor = 10;
        if (speed === 'slow') divisor = 20;
        if (speed === 'fast') divisor = 5;

        // Add at least 1 char, but speed up if falling behind
        const step = Math.max(1, Math.ceil(distance / divisor)); 
        
        index.current = Math.min(index.current + step, text.length);
        setDisplayedText(text.slice(0, index.current));
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [text, isEnabled, speed]);

  return isEnabled ? displayedText : text;
};

const FormatText = React.memo(({ text, isStreaming }: { text: string, isStreaming?: boolean }) => {
  if (!text) return null;

  // Split by headers ***
  const parts = text.split(/(\*\*\*.*?\*\*\*)/g);

  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith('***') && part.endsWith('***')) {
          return (
            <h3 key={i} className="text-xl md:text-2xl font-bold mt-8 mb-4 text-[var(--text-primary)] tracking-tight border-b border-[var(--border-color)] pb-2">
              {part.slice(3, -3)}
            </h3>
          );
        }

        // Split by bold **
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((subPart, j) => {
              if (subPart.startsWith('**') && subPart.endsWith('**')) {
                return <strong key={j} className="font-bold text-[var(--text-primary)]">{subPart.slice(2, -2)}</strong>;
              }

              // Split by italics *
              const italicParts = subPart.split(/(\*.*?\*)/g);
              return (
                <span key={j}>
                  {italicParts.map((subSubPart, k) => {
                    if (subSubPart.startsWith('*') && subSubPart.endsWith('*')) {
                      return <em key={k} className="italic text-[var(--text-secondary)]">{subSubPart.slice(1, -1)}</em>;
                    }
                    
                    // Handle newlines and bullet points
                    return subSubPart.split('\n').map((line, l, arr) => (
                      <React.Fragment key={l}>
                        {line.trim().startsWith('- ') || line.trim().startsWith('• ') ? (
                          <span className="flex items-start gap-3 ml-2 my-2 text-[var(--text-secondary)]">
                             <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0 opacity-80" />
                             <span className="flex-1 leading-relaxed">{line.trim().substring(2)}</span>
                          </span>
                        ) : (
                          <span className={cn(line.trim() === "" ? "block h-4" : "")}>
                             {line}
                          </span>
                        )}
                        {l < arr.length - 1 && line.trim() !== "" && !line.trim().startsWith('-') && !line.trim().startsWith('•') && <br />}
                      </React.Fragment>
                    ));
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
      {isStreaming && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-5 bg-[var(--text-primary)] ml-1 align-middle"
        />
      )}
    </div>
  );
});

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, onRegenerate, isStreaming }) => {
  const isUser = role === 'user';
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Use typewriter effect only for model messages that are streaming
  const displayedContent = useTypewriter(content, isStreaming && !isUser, 'normal');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateClick = () => {
    onRegenerate?.();
  };

  // If content is empty and it's the model, show the MorphingSquare loader
  const showLoader = !isUser && !content && isStreaming;

  return (
    <motion.div 
      layout={!isStreaming}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex w-full mb-8 relative group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Thread Line for AI messages */}
      {!isUser && (
        <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--border-color)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />
      )}

      <div className={cn(
        "flex flex-col gap-1 min-w-0 max-w-full",
        isUser ? "items-end" : "items-start w-full"
      )}>
        <AnimatePresence mode="wait">
          {showLoader ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 py-4 px-2"
            >
               <MorphingSquare className="w-3 h-3 md:w-4 md:h-4" />
               <span className="text-sm text-[var(--text-muted)] animate-pulse">Thinking...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
              className={cn(
                "text-[15px] leading-7 md:text-[16px] relative transition-all duration-300",
                isUser 
                  ? "bg-[var(--bg-user-message)] text-[var(--text-user-message)] px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85vw] md:max-w-[600px]" 
                  : "text-[var(--text-primary)] px-6 py-4 w-full border-none rounded-xl backdrop-blur-sm"
              )}
            >
              {isUser ? content : <FormatText text={displayedContent} isStreaming={isStreaming} />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isUser && !showLoader && content && (
          <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Copy Button */}
            <motion.button 
              onClick={handleCopy}
              whileHover={{ scale: 1.1, backgroundColor: "var(--bg-hover)" }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-colors relative overflow-hidden"
              title="Copy"
            >
              <AnimatePresence mode='wait' initial={false}>
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Regenerate Button */}
            <motion.button 
              onClick={handleRegenerateClick}
              whileHover={{ scale: 1.1, backgroundColor: "var(--bg-hover)" }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-colors"
              title="Regenerate response"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};