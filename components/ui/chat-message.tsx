import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { 
  Copy, 
  RotateCw, 
  Check,
  Bot,
  User
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

const useTypewriter = (text: string, speed: number = 50, isEnabled: boolean = false) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isEnabled) {
      setDisplayedText(text);
      return;
    }

    if (displayedText.length >= text.length) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const currentLength = displayedText.length;
      // Find the next space or punctuation to define a "word" chunk
      // We look ahead from the current position
      const remaining = text.slice(currentLength);
      const nextSpace = remaining.indexOf(' ');
      
      let nextChunkLength = 1;
      if (nextSpace !== -1) {
        nextChunkLength = nextSpace + 1; // Include the space
      } else {
        nextChunkLength = remaining.length; // Rest of the string
      }

      setDisplayedText(text.slice(0, currentLength + nextChunkLength));
    }, speed);

    return () => clearTimeout(timeoutId);
  }, [text, displayedText, speed, isEnabled]);

  return isEnabled ? displayedText : text;
};

const FormatText = ({ text, isStreaming }: { text: string, isStreaming?: boolean }) => {
  if (!text) return null;

  // Split by headers ***
  const parts = text.split(/(\*\*\*.*?\*\*\*)/g);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {parts.map((part, i) => {
        if (part.startsWith('***') && part.endsWith('***')) {
          return (
            <h3 key={i} className="text-xl md:text-2xl font-bold mt-8 mb-4 text-white/95 tracking-tight border-b border-white/10 pb-2">
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
                return <strong key={j} className="font-bold text-white">{subPart.slice(2, -2)}</strong>;
              }

              // Split by italics *
              const italicParts = subPart.split(/(\*.*?\*)/g);
              return (
                <span key={j}>
                  {italicParts.map((subSubPart, k) => {
                    if (subSubPart.startsWith('*') && subSubPart.endsWith('*')) {
                      return <em key={k} className="italic text-neutral-300">{subSubPart.slice(1, -1)}</em>;
                    }
                    
                    // Handle newlines and bullet points
                    return subSubPart.split('\n').map((line, l, arr) => (
                      <React.Fragment key={l}>
                        {line.trim().startsWith('- ') || line.trim().startsWith('• ') ? (
                          <span className="flex items-start gap-3 ml-2 my-2 text-neutral-300">
                             <span className="mt-2 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 opacity-80" />
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
          className="inline-block w-2 h-5 bg-white ml-1 align-middle"
        />
      )}
    </motion.div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, onRegenerate, isStreaming }) => {
  const isUser = role === 'user';
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Use typewriter effect only for model messages that are streaming
  const displayedContent = useTypewriter(content, 50, isStreaming && !isUser);

  const handleCopy = async () => {
    setIsCopying(true);
    await navigator.clipboard.writeText(content);
    
    // Smooth timing for the "Satisfying" feel
    setTimeout(() => {
      setIsCopying(false);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }, 800);
  };

  const handleRegenerateClick = () => {
    setIsRegenerating(true);
    onRegenerate?.();
    setTimeout(() => setIsRegenerating(false), 2500); // Sync with the 2s logic
  };

  // If content is empty and it's the model, show the MorphingSquare loader
  const showLoader = !isUser && !content && isStreaming;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // Cubic bezier
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex flex-col gap-1 min-w-0",
        isUser ? "items-end" : "items-start",
        "max-w-full"
      )}>
        {showLoader ? (
          <div className="flex items-center gap-3 py-4 px-2">
             <MorphingSquare className="w-3 h-3 md:w-4 md:h-4" />
             <span className="text-sm text-neutral-500 animate-pulse">Thinking...</span>
          </div>
        ) : (
          <div
            className={cn(
              "text-[15px] leading-7 md:text-[16px] relative",
              isUser 
                ? "bg-[#27272a] text-white px-5 py-2.5 rounded-3xl shadow-sm max-w-[85vw] md:max-w-[600px]" 
                : "text-neutral-200 px-0 py-0 w-full"
            )}
          >
            {isUser ? content : <FormatText text={displayedContent} isStreaming={isStreaming} />}
          </div>
        )}
        
        {!isUser && !showLoader && content && (
          <div className="flex items-center gap-3 mt-1 px-1">
            {/* Copy Button with Ring Spinner */}
            <motion.button 
              onClick={handleCopy}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-lg transition-colors relative overflow-hidden"
              title="Copy"
            >
              <AnimatePresence mode='wait' initial={false}>
                {isCopying ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Spinner variant="ring" size={14} className="text-neutral-400" />
                  </motion.div>
                ) : isCopied ? (
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

            {/* Regenerate Button with Ring Spinner */}
            <motion.button 
              onClick={handleRegenerateClick}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-lg transition-colors"
              title="Regenerate response"
            >
              <AnimatePresence mode='wait' initial={false}>
                {isRegenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Spinner variant="ring" size={14} className="text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="icon"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};