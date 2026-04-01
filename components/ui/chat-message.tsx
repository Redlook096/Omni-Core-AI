import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { getCanvasExecutionMode } from '../../lib/canvas-preview';
import { 
  Copy, 
  RotateCw, 
  Check,
  Search,
  BrainCog,
  FolderCode,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MorphingSquare } from './morphing-square';
import { TextShimmer, VIBE_THINKING_SHIMMER_DURATION } from './text-shimmer';

export interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  isSearching?: boolean;
  isThinking?: boolean;
  isCanvas?: boolean;
}

const PRISM_SAFE_LANG = /^[a-z0-9+#.-]{1,32}$/i;

function safeHighlightLanguage(lang: string): string {
  const raw = String(lang ?? 'text').trim().toLowerCase();
  if (!raw || !PRISM_SAFE_LANG.test(raw)) return 'text';
  return raw;
}

const CodeBlock = ({ code, language, isStreaming }: { code: string, language: string, isStreaming?: boolean }) => {
  const safeCode = String(code ?? '');
  const safeLang = safeHighlightLanguage(language);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedCode, setEditedCode] = React.useState(safeCode);

  return (
    <div className="my-4 rounded-2xl bg-[#1e1e1e] border border-white/10 shadow-lg relative">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e1e] text-xs text-gray-400 sticky top-0 md:top-0 z-20 border-b border-white/5 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-200">Code</span>
          <span>·</span>
          <span>{safeLang}</span>
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
                    detail: { code: editedCode, language: safeLang } 
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
                  navigator.clipboard.writeText(safeCode);
                }}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setEditedCode(safeCode);
                }}
                className="hover:text-white transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([safeCode], { type: 'text/plain' });
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
                  const ext = extMap[safeLang.toLowerCase()] || 'txt';
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
                  window.dispatchEvent(new CustomEvent('run-code', { detail: { code: safeCode, language: safeLang } }));
                }}
                className="bg-white text-black px-3 py-1 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
              >
                {isStreaming && <RefreshCw className="w-3 h-3 animate-spin" />}
                {isStreaming ? 'Running...' : 'Run code'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto text-sm font-mono text-gray-300 rounded-b-2xl custom-scrollbar">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full min-h-[200px] p-4 bg-transparent text-gray-300 font-mono text-sm resize-y focus:outline-none custom-scrollbar"
            spellCheck={false}
          />
        ) : (
          <SyntaxHighlighter
            language={safeLang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
            }}
          >
            {safeCode}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

const FormatText = React.memo(({ text, isStreaming }: { text: string, isStreaming?: boolean }) => {
  const safe = String(text ?? '');
  if (!safe) return null;

  // Split by [Type: ...] blocks first
  const blockParts = safe.split(/(\[(?:Think|Search|Canvas):\s*[\s\S]*?(?:\]|$))/g);

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
              <TextShimmer
                duration={VIBE_THINKING_SHIMMER_DURATION}
                className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap"
              >
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

                return (
                  <CodeBlock
                    key={codeIdx}
                    code={String(code ?? '')}
                    language={String(language)}
                    isStreaming={isStreaming}
                  />
                );
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
                                return subSubPart.split('\n').map((line, l, arr) => {
                                  const trimmedLine = line.trim();
                                  
                                  // Checklist patterns
                                  const isUnchecked = trimmedLine.startsWith('- [ ] ');
                                  const isChecked = trimmedLine.startsWith('- [x] ') || trimmedLine.startsWith('- [X] ');
                                  const isError = trimmedLine.startsWith('- [!] ') || trimmedLine.startsWith('- [E] ');
                                  const isCheckboxLine = isUnchecked || isChecked || isError;
                                  const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ');

                                  return (
                                    <React.Fragment key={l}>
                                      {isCheckboxLine ? (
                                        <span className="flex items-start gap-3 ml-2 my-2 text-[var(--text-secondary)]">
                                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0 opacity-80" />
                                          <span className="flex-1 leading-relaxed">
                                            {trimmedLine.substring(6)}
                                          </span>
                                        </span>
                                      ) : isBullet ? (
                                        <span className="flex items-start gap-3 ml-2 my-2 text-[var(--text-secondary)]">
                                           <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0 opacity-80" />
                                           <span className="flex-1 leading-relaxed">{trimmedLine.substring(2)}</span>
                                        </span>
                                      ) : trimmedLine.startsWith('>') ? (
                                        <blockquote className="border-l-4 border-[var(--border-color)] pl-4 py-2 my-4 text-[var(--text-secondary)] italic bg-[var(--bg-hover)]/50 rounded-r-lg">
                                          {trimmedLine.replace(/^>[;\s]*/, '')}
                                        </blockquote>
                                      ) : (
                                        <span className={cn(trimmedLine === "" ? "block h-4" : "")}>
                                           {line}
                                        </span>
                                      )}
                                      {l < arr.length - 1 && trimmedLine !== "" && !isBullet && !isUnchecked && !isChecked && !isError && !trimmedLine.startsWith('>') && <br />}
                                    </React.Fragment>
                                  );
                                });
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

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, onRegenerate, isStreaming, isSearching, isThinking, isCanvas }) => {
  const isUser = role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const safeContent = typeof content === 'string' ? content : String(content ?? '');
  let displayContent = safeContent;
  if (isUser) {
    const autoFixMatch = safeContent.match(/^\[Error:\s*([^\]]+)\]\s*([\s\S]*)$/);
    if (autoFixMatch) {
      const headline = autoFixMatch[1].trim();
      const rest = autoFixMatch[2].trim();
      const langHint = headline.match(/The\s+([\w+-]+)\s+code\s+failed/i)?.[1] ?? '';
      const isPreviewFix = getCanvasExecutionMode(langHint || 'text') === 'preview';

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full mb-8 justify-center"
        >
          <div
            className={cn(
              'w-full max-w-[90%] md:max-w-[600px] rounded-2xl border p-4 text-left shadow-sm',
              isPreviewFix
                ? 'border-amber-500/35 bg-amber-950/20'
                : 'border-slate-500/30 bg-[var(--bg-card)]'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw
                className={cn('w-4 h-4 shrink-0', isPreviewFix ? 'text-amber-400' : 'text-slate-400')}
              />
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  isPreviewFix ? 'text-amber-200/90' : 'text-slate-300'
                )}
              >
                {isPreviewFix ? 'Live preview — fix request' : 'Runner — fix request'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">{headline}</p>
            <div className="rounded-lg bg-black/30 border border-white/5 p-3 max-h-40 overflow-y-auto custom-scrollbar">
              <pre className="text-[11px] leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap font-mono">
                {rest.length > 6000 ? `${rest.slice(0, 6000)}…` : rest}
              </pre>
            </div>
          </div>
        </motion.div>
      );
    }

    const canvasMatch = displayContent.match(/^\[(Canvas|Search|Think|Reasoning|Project|Deploy|Format|Terminal):\s*(.*)\]$/s);
    if (canvasMatch) {
      displayContent = canvasMatch[2];
    }
  }

  const displayedContent = safeContent;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(safeContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateClick = () => {
    onRegenerate?.();
  };

  // If content is empty and it's the model, show the MorphingSquare loader
  const showLoader = !isUser && !safeContent && isStreaming;

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
                  <TextShimmer as="span" className="text-sm font-medium" duration={VIBE_THINKING_SHIMMER_DURATION}>
                    Searching...
                  </TextShimmer>
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
                  <TextShimmer as="span" className="text-sm font-medium" duration={VIBE_THINKING_SHIMMER_DURATION}>
                    Thinking deeply...
                  </TextShimmer>
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
                  <TextShimmer as="span" className="text-sm font-medium" duration={VIBE_THINKING_SHIMMER_DURATION}>
                    Building live preview or running in terminal…
                  </TextShimmer>
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
                "text-[15px] leading-relaxed relative transition-all duration-300",
                isUser 
                  ? "bg-[var(--bg-user-message)] text-[var(--text-user-message)] px-5 py-3.5 rounded-[22px] rounded-br-[6px] max-w-[85vw] md:max-w-[600px] shadow-sm border border-[var(--border-color)]"
                  : "text-[var(--text-primary)] px-2 py-4 w-full"
              )}
            >
              {isUser ? displayContent : <FormatText text={displayedContent} isStreaming={isStreaming} />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isUser && !showLoader && safeContent && (
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