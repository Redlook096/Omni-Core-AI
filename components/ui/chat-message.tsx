import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { 
  Copy, 
  RotateCw, 
  Check,
  Search,
  BrainCog,
  FolderCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MorphingSquare } from './morphing-square';
import { TextShimmer } from './text-shimmer';

export interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  typingSpeed?: 'slow' | 'normal' | 'fast';
  isSearching?: boolean;
  isThinking?: boolean;
  isCanvas?: boolean;
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

const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedCode, setEditedCode] = React.useState(code);

  return (
    <div className="my-4 rounded-xl bg-[#1e1e1e] border border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] text-xs text-gray-400 sticky top-0 md:top-0 z-20 rounded-t-xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-200">Code</span>
          <span>·</span>
          <span>{language}</span>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  window.dispatchEvent(new CustomEvent('ask-ai-code', { 
                    detail: { code: editedCode, language } 
                  }));
                }}
                className="bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save & Ask AI
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditedCode(code);
                }}
                className="hover:text-white transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([code], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  
                  const extMap: Record<string, string> = {
                    'javascript': 'js', 'typescript': 'ts', 'python': 'py',
                    'cpp': 'cpp', 'c++': 'cpp', 'c': 'c', 'java': 'java',
                    'go': 'go', 'rust': 'rs', 'php': 'php', 'ruby': 'rb',
                    'bash': 'sh', 'sh': 'sh', 'csharp': 'cs', 'cs': 'cs',
                    'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
                    'sql': 'sql', 'markdown': 'md', 'md': 'md'
                  };
                  const ext = extMap[language.toLowerCase()] || 'txt';
                  a.download = `snippet.${ext}`;
                  
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="hover:text-white transition-colors"
              >
                Download
              </button>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('run-code', { detail: { code, language } }));
                }}
                className="bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                Run code
              </button>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto text-sm font-mono text-gray-300 rounded-b-xl custom-scrollbar">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full min-h-[200px] p-4 bg-transparent text-gray-300 font-mono text-sm resize-y focus:outline-none custom-scrollbar"
            spellCheck={false}
          />
        ) : (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
            }}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

const FormatText = React.memo(({ text, isStreaming }: { text: string, isStreaming?: boolean }) => {
  if (!text) return null;

  // Split by [Type: ...] blocks first
  const blockParts = text.split(/(\[(?:Think|Search|Canvas):\s*[\s\S]*?(?:\]|$))/g);

  return (
    <div>
      {blockParts.map((blockPart, blockIdx) => {
        const match = blockPart.match(/^\[(Think|Search|Canvas):\s*([\s\S]*?)(?:\]|$)/);
        if (match) {
          const type = match[1];
          const content = match[2];
          return (
            <div key={blockIdx} className="my-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {type === 'Think' && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                {type === 'Search' && (
                  <motion.div
                    animate={{ scale: [0.9, 1.1, 0.9], rotate: [-10, 10, -10] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center w-4 h-4"
                  >
                    <Search className="w-4 h-4 text-blue-400" />
                  </motion.div>
                )}
                {type === 'Canvas' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                {type}
              </div>
              <TextShimmer duration={2} className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                {content || '...'}
              </TextShimmer>
            </div>
          );
        }

        // Split by code blocks first (matching both closed and unclosed blocks)
        const codeBlockParts = blockPart.split(/(```[\s\S]*?(?:```|$))/g);

        return (
          <span key={blockIdx}>
            {codeBlockParts.map((codePart, codeIdx) => {
              if (codePart.startsWith('```')) {
                // It's a code block (closed or unclosed)
                const isClosed = codePart.endsWith('```') && codePart.length >= 6;
                const match = codePart.match(/```(\w+)?\n([\s\S]*?)(?:```|$)/);
                const language = match ? match[1] || 'text' : 'text';
                const code = match ? match[2] : codePart.slice(3, isClosed ? -3 : undefined);
                
                return <CodeBlock key={codeIdx} code={code} language={language} />;
              }

              // Split by headers ***
              const parts = codePart.split(/(\*\*\*.*?\*\*\*)/g);

              return (
                <span key={codeIdx}>
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
                                    ) : line.trim().startsWith('>') ? (
                                      <blockquote className="border-l-4 border-[var(--border-color)] pl-4 py-2 my-4 text-[var(--text-secondary)] italic bg-[var(--bg-hover)]/50 rounded-r-lg">
                                        {line.trim().replace(/^>[;\s]*/, '')}
                                      </blockquote>
                                    ) : (
                                      <span className={cn(line.trim() === "" ? "block h-4" : "")}>
                                         {line}
                                      </span>
                                    )}
                                    {l < arr.length - 1 && line.trim() !== "" && !line.trim().startsWith('-') && !line.trim().startsWith('•') && !line.trim().startsWith('>') && <br />}
                                  </React.Fragment>
                                ));
                              })}
                            </span>
                          );
                        })}
                      </span>
                    );
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

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, onRegenerate, isStreaming, isSearching, isThinking, isCanvas, typingSpeed = 'normal' }) => {
  const isUser = role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  let displayContent = content;
  if (isUser) {
    const match = displayContent.match(/^\[(Canvas|Search|Think):\s*(.*)\]$/s);
    if (match) {
      displayContent = match[2];
    }
  }

  // Use typewriter effect only for model messages that are streaming
  const displayedContent = useTypewriter(content, isStreaming && !isUser, typingSpeed);

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
        "flex gap-4 min-w-0 max-w-full",
        isUser ? "justify-end w-full" : "w-full"
      )}>
        <div className={cn(
          "flex flex-col gap-1 min-w-0 max-w-full flex-1",
          isUser ? "items-end" : "items-start"
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
               {isSearching ? (
                 <>
                   <motion.div
                     animate={{ scale: [0.9, 1.1, 0.9], rotate: [-10, 10, -10] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     className="flex items-center justify-center w-4 h-4"
                   >
                     <Search className="w-4 h-4 text-blue-400" />
                   </motion.div>
                   <TextShimmer as="span" className="text-sm font-medium" duration={1.5}>Searching...</TextShimmer>
                 </>
               ) : isThinking ? (
                 <>
                   <motion.div
                     animate={{ scale: [0.9, 1.1, 0.9], rotate: [0, 360] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     className="flex items-center justify-center w-4 h-4"
                   >
                     <BrainCog className="w-4 h-4 text-purple-400" />
                   </motion.div>
                   <TextShimmer as="span" className="text-sm font-medium" duration={1.5}>Thinking deeply...</TextShimmer>
                 </>
               ) : isCanvas ? (
                 <>
                   <motion.div
                     animate={{ scale: [0.9, 1.1, 0.9], y: [-2, 2, -2] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                     className="flex items-center justify-center w-4 h-4"
                   >
                     <FolderCode className="w-4 h-4 text-orange-400" />
                   </motion.div>
                   <TextShimmer as="span" className="text-sm font-medium" duration={1.5}>Creating canvas...</TextShimmer>
                 </>
               ) : (
                 <>
                   <MorphingSquare className="w-3 h-3 md:w-4 md:h-4" />
                   <span className="text-sm text-[var(--text-muted)] animate-pulse">Thinking...</span>
                 </>
               )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "text-[15px] leading-7 md:text-[16px] relative transition-all duration-300",
                isUser 
                  ? "bg-[var(--bg-user-message)] text-[var(--text-user-message)] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85vw] md:max-w-[600px]"
                  : "text-[var(--text-primary)] px-2 py-4 w-full"
              )}
            >
              {isUser ? displayContent : <FormatText text={displayedContent} isStreaming={isStreaming} />}
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
      </div>
    </motion.div>
  );
};