import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PanelLeftClose, 
  PanelLeftOpen,
  Eye,
  Code2,
  Monitor,
  Smartphone,
  RefreshCw,
  TerminalSquare,
  FileCode,
  FileJson,
  FolderOpen,
  Download,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
  Files,
  Search,
  GitBranch,
  Play,
  Blocks
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { PromptInputBox } from './prompt-input-box';
import { streamChat } from '../../lib/gemini';
import { ChatMessage } from './chat-message';
import { TextShimmer } from './text-shimmer';
import Editor from '@monaco-editor/react';

const HtmlIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <path fill="#E44D26" d="M19 3l9 100 36 10 36-10 9-100z"/>
    <path fill="#F16529" d="M64 113l29-8 8-90H64z"/>
    <text x="64" y="68" textAnchor="middle" fontSize="34" fontWeight="bold" fill="white" fontFamily="Arial">HTML</text>
    <text x="64" y="95" textAnchor="middle" fontSize="28" fontWeight="bold" fill="white" fontFamily="Arial">5</text>
  </svg>
);

const CssIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <path fill="#1572B6" d="M19 3l9 100 36 10 36-10 9-100z"/>
    <path fill="#33A9DC" d="M64 113l29-8 8-90H64z"/>
    <text x="64" y="75" textAnchor="middle" fontSize="38" fontWeight="bold" fill="white" fontFamily="Arial">CSS</text>
  </svg>
);

const JsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <defs>
      <linearGradient id="jsGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFF176"/>
        <stop offset="100%" stopColor="#F7DF1E"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="22" fill="url(#jsGrad)"/>
    <rect x="6" y="6" width="116" height="116" rx="18" fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="3"/>
    <text x="64" y="86" textAnchor="middle" fontSize="52" fontWeight="900" fill="#111" fontFamily="Arial" letterSpacing="3">JS</text>
  </svg>
);

const PythonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <path fill="#306998" d="M63 12c-25 0-23 11-23 11v12h23v4H31s-15-1-15 23 13 23 13 23h8v-12s0-13 13-13h23s13 0 13-12V23s2-11-23-11z"/>
    <circle cx="52" cy="25" r="4" fill="#fff"/>
    <path fill="#FFD43B" d="M65 116c25 0 23-11 23-11V93H65v-4h32s15 1 15-23-13-23-13-23h-8v12s0 13-13 13H55s-13 0-13 12v25s-2 11 23 11z"/>
    <circle cx="76" cy="103" r="4" fill="#fff"/>
  </svg>
);

const TsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128">
    <defs>
      <linearGradient id="tsGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4FA3FF"/>
        <stop offset="100%" stopColor="#3178C6"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="22" fill="url(#tsGrad)"/>
    <rect x="6" y="6" width="116" height="116" rx="18" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="3"/>
    <text x="64" y="86" textAnchor="middle" fontSize="50" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="3">TS</text>
  </svg>
);

function GenerationProgress({ isStreaming, steps }: { isStreaming: boolean, steps: string[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    if (steps.length > 0 && !showChecklist) {
      const timer = setTimeout(() => {
        setShowChecklist(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [steps.length, showChecklist]);

  useEffect(() => {
    if (!isStreaming || !showChecklist) {
      return;
    }
    
    const timeout = setTimeout(() => setCurrentStep(0), 0);
    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isStreaming, steps.length, showChecklist]);

  return (
    <div className="mt-4 space-y-3">
      {(!showChecklist || steps.length === 0) && isStreaming && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-[14px] font-medium px-1"
        >
          <TextShimmer className="font-medium">Thinking...</TextShimmer>
        </motion.div>
      )}
      
      {showChecklist && steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCompleted = !isStreaming || index < currentStep;
            const isActive = isStreaming && index === currentStep;

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-3 text-[13px] transition-all duration-500 p-2.5 rounded-xl border",
                  isActive ? "bg-blue-500/5 border-blue-500/20 text-[var(--text-primary)] font-medium shadow-sm" : 
                  isCompleted ? "bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-secondary)]" : 
                  "bg-transparent border-transparent text-[var(--text-muted)] opacity-50"
                )}
              >
                {isCompleted && !isActive ? (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--border-color)] shrink-0" />
                )}
                <span className="flex-1">{step}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VibeCoder() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Microsoft Windows [Version 10.0.19045.3803]',
    '(c) Microsoft Corporation. All rights reserved.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: 'Welcome to Vibe Coder! Describe the application or feature you want to build, and I will help you create it.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [autoFixCount, setAutoFixCount] = useState(0);
  const lastErrorRef = useRef<string>('');
  
  const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Coder App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 flex items-center justify-center min-h-screen">
  <div class="text-center p-8">
    <h1 class="text-4xl font-bold text-blue-600 mb-4">Welcome to Vibe Coder</h1>
    <p class="text-lg text-gray-600">Describe what you want to build in the chat, and I will generate the code for you!</p>
  </div>
</body>
</html>`;

  const [files, setFiles] = useState<Record<string, { code: string, language: string, icon: React.ElementType, color: string }>>({});
  const [debouncedFiles, setDebouncedFiles] = useState<Record<string, { code: string, language: string, icon: React.ElementType, color: string }>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFiles(files);
    }, 1000);
    return () => clearTimeout(timer);
  }, [files]);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [previewKey, setPreviewKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendRef = useRef<((message: string) => Promise<void>) | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'preview_error' && !isLoading) {
        const errorMsg = String(e.data.error);
        if (errorMsg !== lastErrorRef.current && autoFixCount < 3) {
          lastErrorRef.current = errorMsg;
          setAutoFixCount(prev => prev + 1);
          if (handleSendRef.current) {
            handleSendRef.current(`I encountered this error in the preview: ${errorMsg}. Please fix it.`);
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isLoading, autoFixCount]);

  const getPreviewHtml = () => {
    let html = debouncedFiles['index.html']?.code || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
    
    const scrollbarStyle = `<style>
      ::-webkit-scrollbar { height: 12px; width: 12px; }
      ::-webkit-scrollbar-track { background: #f8f9fa; }
      ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 6px; border: 3px solid #f8f9fa; }
      ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
      body { overflow-x: auto !important; overflow-y: auto !important; }
    </style>`;
    
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${scrollbarStyle}\n</head>`);
    } else {
      html = `${scrollbarStyle}\n${html}`;
    }
    
    // Inject CSS files
    const cssFiles = Object.entries(debouncedFiles).filter(([name]) => name.endsWith('.css'));
    if (cssFiles.length > 0) {
      const styles = cssFiles.map(([, file]) => `<style>\n${file.code}\n</style>`).join('\n');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styles}\n</head>`);
      } else {
        html = `${styles}\n${html}`;
      }
    }
    
    // Inject JS files
    const jsFiles = Object.entries(debouncedFiles).filter(([name]) => name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx'));
    if (jsFiles.length > 0) {
      const hasReact = jsFiles.some(([name, file]) => 
        name.endsWith('.jsx') || name.endsWith('.tsx') || file.code.includes('react')
      );

      let reactScripts = '';
      if (hasReact) {
        reactScripts = `
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script type="importmap">
            {
              "imports": {
                "react": "https://esm.sh/react@18?dev",
                "react-dom": "https://esm.sh/react-dom@18?dev",
                "react-dom/client": "https://esm.sh/react-dom@18/client?dev",
                "lucide-react": "https://esm.sh/lucide-react?dev",
                "framer-motion": "https://esm.sh/framer-motion?dev",
                "recharts": "https://esm.sh/recharts?dev",
                "clsx": "https://esm.sh/clsx?dev",
                "tailwind-merge": "https://esm.sh/tailwind-merge?dev",
                "next-themes": "https://esm.sh/next-themes?dev",
                "class-variance-authority": "https://esm.sh/class-variance-authority?dev",
                "@radix-ui/react-slot": "https://esm.sh/@radix-ui/react-slot?dev",
                "@radix-ui/react-dialog": "https://esm.sh/@radix-ui/react-dialog?dev",
                "@radix-ui/react-dropdown-menu": "https://esm.sh/@radix-ui/react-dropdown-menu?dev",
                "@radix-ui/react-popover": "https://esm.sh/@radix-ui/react-popover?dev",
                "@radix-ui/react-tooltip": "https://esm.sh/@radix-ui/react-tooltip?dev",
                "@radix-ui/react-tabs": "https://esm.sh/@radix-ui/react-tabs?dev",
                "@radix-ui/react-accordion": "https://esm.sh/@radix-ui/react-accordion?dev",
                "@radix-ui/react-avatar": "https://esm.sh/@radix-ui/react-avatar?dev",
                "@radix-ui/react-checkbox": "https://esm.sh/@radix-ui/react-checkbox?dev",
                "@radix-ui/react-label": "https://esm.sh/@radix-ui/react-label?dev",
                "@radix-ui/react-radio-group": "https://esm.sh/@radix-ui/react-radio-group?dev",
                "@radix-ui/react-select": "https://esm.sh/@radix-ui/react-select?dev",
                "@radix-ui/react-slider": "https://esm.sh/@radix-ui/react-slider?dev",
                "@radix-ui/react-switch": "https://esm.sh/@radix-ui/react-switch?dev",
                "@radix-ui/react-toast": "https://esm.sh/@radix-ui/react-toast?dev",
                "@radix-ui/react-scroll-area": "https://esm.sh/@radix-ui/react-scroll-area?dev",
                "@radix-ui/react-separator": "https://esm.sh/@radix-ui/react-separator?dev",
                "react-router-dom": "https://esm.sh/react-router-dom?dev",
                "date-fns": "https://esm.sh/date-fns?dev",
                "zod": "https://esm.sh/zod?dev",
                "react-hook-form": "https://esm.sh/react-hook-form?dev",
                "@hookform/resolvers/zod": "https://esm.sh/@hookform/resolvers/zod?dev",
                "react-icons/": "https://esm.sh/react-icons/"
              }
            }
          </script>
        `;
      }

      // Combine all JS/TS into one script to avoid import issues between local files
      // We strip out local imports (e.g. import { App } from './App')
      let combinedCode = '';
      
      // Sort files so index/main are at the end
      const sortedJsFiles = [...jsFiles].sort(([nameA], [nameB]) => {
        const isMainA = nameA.includes('index') || nameA.includes('main') || nameA.includes('App');
        const isMainB = nameB.includes('index') || nameB.includes('main') || nameB.includes('App');
        if (isMainA && !isMainB) return 1;
        if (!isMainA && isMainB) return -1;
        return 0;
      });

      sortedJsFiles.forEach(([name, file]) => {
        let code = file.code;
        // Remove local imports
        code = code.replace(/import\s+[\s\S]*?\s+from\s+['"](\.\/|\.\.\/|@\/|components\/|lib\/|hooks\/|utils\/|ui\/).*?['"];?/g, '');
        // Remove side-effect local imports (e.g. import './index.css')
        code = code.replace(/import\s+['"](\.\/|\.\.\/|@\/|components\/|lib\/|hooks\/|utils\/|ui\/).*?['"];?/g, '');
        // Remove all .css imports
        code = code.replace(/import\s+['"].*?\.css['"];?/g, '');
        // Remove export { ... } statements
        code = code.replace(/export\s+\{[\s\S]*?\}(?:\s+from\s+['"].*?['"])?;?/g, '');
        // Remove export * from statements
        code = code.replace(/export\s+\*\s+from\s+['"].*?['"];?/g, '');
        // Remove export keywords
        code = code.replace(/export\s+default\s+/g, '');
        code = code.replace(/export\s+/g, '');
        combinedCode += `\n// --- ${name} ---\n${code}\n`;
      });

      const errorCatchingScript = `
        <script>
          window.onerror = function(msg, url, line, col, error) {
            document.body.innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace; background: #111; height: 100vh; width: 100vw; box-sizing: border-box;"><h3>Runtime Error</h3><p>' + msg + '</p><pre style="margin-top: 10px; opacity: 0.7; white-space: pre-wrap;">' + (error ? error.stack : '') + '</pre></div>';
            window.parent.postMessage({ type: 'preview_error', error: msg }, '*');
          };
          window.addEventListener('unhandledrejection', function(event) {
            document.body.innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace; background: #111; height: 100vh; width: 100vw; box-sizing: border-box;"><h3>Unhandled Promise Rejection</h3><p>' + event.reason + '</p></div>';
            window.parent.postMessage({ type: 'preview_error', error: event.reason }, '*');
          });
        </script>
      `;

      if (hasReact) {
        combinedCode += `\n\nif (typeof App !== 'undefined') window.__vibeApp = App;\nelse if (typeof Main !== 'undefined') window.__vibeApp = Main;\nelse if (typeof Index !== 'undefined') window.__vibeApp = Index;\n`;
      }

      const scriptType = hasReact ? 'type="text/babel" data-type="module" data-presets="react,typescript"' : 'type="module"';
      let finalScript = `${errorCatchingScript}\n${reactScripts}\n<script ${scriptType}>\n${combinedCode}\n</script>`;
      
      if (hasReact) {
        finalScript += `\n<script type="text/babel" data-type="module">
          import React from 'react';
          import { createRoot } from 'react-dom/client';
          setTimeout(() => {
            const RootComponent = window.__vibeApp || (() => React.createElement('div', {className: 'p-4 text-red-500'}, 'Error: Could not find main component (App, Main, or Index) to render.'));
            const rootElement = document.getElementById('root');
            if (rootElement && !rootElement.hasChildNodes()) {
              const root = createRoot(rootElement);
              root.render(React.createElement(RootComponent));
            }
          }, 100);
        </script>`;
      }
      
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${finalScript}\n</body>`);
      } else {
        html = `${html}\n${finalScript}`;
      }
    }
    
    return html;
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      let lang = 'text';
      let icon = FileCode;
      let color = 'text-gray-400';
      
      if (newFileName.endsWith('.html')) { lang = 'html'; icon = HtmlIcon; color = ''; }
      else if (newFileName.endsWith('.css')) { lang = 'css'; icon = CssIcon; color = ''; }
      else if (newFileName.endsWith('.js') || newFileName.endsWith('.jsx')) { lang = 'javascript'; icon = JsIcon; color = ''; }
      else if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) { lang = 'typescript'; icon = TsIcon; color = ''; }
      else if (newFileName.endsWith('.py')) { lang = 'python'; icon = PythonIcon; color = ''; }
      else if (newFileName.endsWith('.json')) { lang = 'json'; icon = FileJson; color = 'text-green-400'; }

      setFiles(prev => ({
        ...prev,
        [newFileName]: {
          code: '',
          language: lang,
          icon,
          color
        }
      }));
      setSelectedFile(newFileName);
    }
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newHistory = [...terminalHistory, `C:\\Users\\User\\vibe-coder> ${terminalInput}`];
      if (terminalInput.trim().toLowerCase() === 'dir') {
        newHistory.push(
          ' Volume in drive C has no label.',
          ' Volume Serial Number is 1234-5678',
          '',
          ' Directory of C:\\Users\\User\\vibe-coder',
          '',
          '15/03/2026  01:48 PM    <DIR>          .',
          '15/03/2026  01:48 PM    <DIR>          ..',
          '15/03/2026  01:48 PM             1,024 package.json',
          '               1 File(s)          1,024 bytes',
          '               2 Dir(s)  100,000,000,000 bytes free'
        );
      } else if (terminalInput.trim().toLowerCase() === 'cls') {
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      } else if (terminalInput.trim() !== '') {
        newHistory.push(`'${terminalInput}' is not recognized as an internal or external command,`, 'operable program or batch file.');
      }
      newHistory.push('');
      setTerminalHistory(newHistory);
      setTerminalInput('');
      setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setGenerationSteps(["Analyzing requirements & architecture"]);

    try {
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      const stream = streamChat(
        messages, 
        message, 
        "You are an expert AI software engineer. The user wants to build a web application. You MUST output multiple files to build a complete, production-ready application.\nFirst, provide a JSON array of the specific tasks you will perform to build this app, wrapped in a ```json:plan block. For example:\n```json:plan\n[\"Setup application structure\", \"Implement Tailwind layout for dashboard\", \"Create interactive components\", \"Add dark mode toggle\"]\n```\nThen, output each file's code wrapped in a markdown block with the language AND filename specified like this: ```html:index.html ...code... ``` or ```css:styles.css ...code... ``` or ```js:script.js ...code... ```. Go above and beyond to make it polished and professional. ALWAYS generate projects with an iOS-like, professional, minimalistic, and smooth design (unless told a certain theme). Use smooth animations, clean typography, and subtle shadows. IMPORTANT: The preview environment supports React, Tailwind, framer-motion, lucide-react, and recharts via ESM imports. You can use standard ES modules (e.g., `import React from 'react'`). Do NOT include CDN links in index.html, they are injected automatically.", 
        false, 
        'medium'
      );
      
      let parsedPlan = false;

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = fullResponse;
          return updated;
        });

        if (!parsedPlan) {
          const planRegex = /```json:plan\n([\s\S]*?)\n```/;
          const planMatch = fullResponse.match(planRegex);
          if (planMatch) {
            try {
              const plan = JSON.parse(planMatch[1]);
              if (Array.isArray(plan) && plan.length > 0) {
                setGenerationSteps(plan);
                parsedPlan = true;
              }
            } catch {
              // Ignore parse errors while streaming
            }
          }
        }
        
        // Extract all code blocks
        const codeBlockRegex = /```(\w+)?(?:[:|](\S+))?\n([\s\S]*?)(?:```|$)/g;
        let match;
        const extractedFiles: Record<string, { code: string, language: string, icon: React.ElementType, color: string }> = {};
        
        // Reset regex index
        codeBlockRegex.lastIndex = 0;
        
        while ((match = codeBlockRegex.exec(fullResponse)) !== null) {
          const lang = (match[1] || 'text').toLowerCase();
          const specifiedName = match[2];
          const code = match[3];
          
          let baseName = specifiedName || '';
          let icon = FileCode;
          let color = 'text-gray-400';
          
          if (!baseName) {
            if (lang === 'html') {
              baseName = 'index.html';
              icon = HtmlIcon;
              color = '';
            } else if (lang === 'css') {
              baseName = 'styles.css';
              icon = CssIcon;
              color = '';
            } else if (lang === 'javascript' || lang === 'js') {
              baseName = 'script.js';
              icon = JsIcon;
              color = '';
            } else if (lang === 'typescript' || lang === 'ts') {
              baseName = 'script.ts';
              icon = TsIcon;
              color = '';
            } else if (lang === 'python' || lang === 'py') {
              baseName = 'script.py';
              icon = PythonIcon;
              color = '';
            } else if (lang === 'json') {
              baseName = 'data.json';
              icon = FileJson;
              color = 'text-green-400';
            } else {
              baseName = `file.${lang}`;
            }
          } else {
            if (baseName.endsWith('.html')) { icon = HtmlIcon; color = ''; }
            else if (baseName.endsWith('.css')) { icon = CssIcon; color = ''; }
            else if (baseName.endsWith('.js') || baseName.endsWith('.jsx')) { icon = JsIcon; color = ''; }
            else if (baseName.endsWith('.ts') || baseName.endsWith('.tsx')) { icon = TsIcon; color = ''; }
            else if (baseName.endsWith('.py')) { icon = PythonIcon; color = ''; }
            else if (baseName.endsWith('.json')) { icon = FileJson; color = 'text-green-400'; }
          }
          
          let fileName = baseName;
          let counter = 1;
          while (extractedFiles[fileName]) {
            const parts = baseName.split('.');
            const ext = parts.pop();
            fileName = `${parts.join('.')}${counter}.${ext}`;
            counter++;
          }
          
          extractedFiles[fileName] = {
            code,
            language: lang,
            icon,
            color
          };
        }
        
        if (Object.keys(extractedFiles).length > 0) {
          setFiles(prev => ({ ...prev, ...extractedFiles }));
          setSelectedFile(prev => prev || Object.keys(extractedFiles)[0]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
      setPreviewKey(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Left Sidebar (Chat) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '33.333%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col h-full border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/80 backdrop-blur-xl z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-[15px] text-[var(--text-primary)] tracking-tight">Vibe Coder</h2>
                  <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mt-0.5">AI Workspace</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMessages([{ role: 'model', content: 'Welcome to Vibe Coder! Describe the application or feature you want to build, and I will help you create it.' }])}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title="New Session"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  title="Close Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isStreaming = isLoading && idx === messages.length - 1 && msg.role === 'model';
                const hasCode = msg.content.includes('```');
                const textContent = msg.content.replace(/```[\s\S]*?(?:```|$)/g, '').trim();
                
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    {textContent && (
                      <ChatMessage 
                        role={msg.role}
                        content={textContent}
                        isStreaming={isStreaming && !hasCode}
                      />
                    )}
                    {(msg.role === 'model' && (hasCode || isStreaming)) && (
                      <div className={cn(
                        "ml-12 p-5 rounded-[20px] border transition-all duration-500 shadow-sm",
                        isStreaming 
                          ? "border-blue-500/30 bg-blue-500/5 shadow-blue-500/5" 
                          : "border-[var(--border-color)] bg-[var(--bg-card)]"
                      )}>
                        <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-color)] pb-3">
                          {isStreaming ? (
                            <div className="relative flex items-center justify-center w-6 h-6">
                              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          <span className={cn(
                            "font-medium text-[14px]",
                            isStreaming ? "text-blue-500" : "text-[var(--text-primary)]"
                          )}>
                            {isStreaming ? (
                              <TextShimmer className="inline-block">Generating application...</TextShimmer>
                            ) : (
                              'Application updated'
                            )}
                          </span>
                        </div>
                        
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                          <GenerationProgress isStreaming={isStreaming} steps={generationSteps} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]">
              {/* Action Chips */}
              <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1">
                <button 
                  onClick={() => handleSend('Build a Pomodoro timer')}
                  className="px-4 py-1.5 rounded-full bg-[var(--bg-card)] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap transition-all border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30"
                >
                  Build a Pomodoro timer
                </button>
                <button 
                  onClick={() => handleSend('Create a weather dashboard')}
                  className="px-4 py-1.5 rounded-full bg-[var(--bg-card)] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap transition-all border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30"
                >
                  Create a weather dashboard
                </button>
                <button 
                  onClick={() => handleSend('Make a simple calculator')}
                  className="px-4 py-1.5 rounded-full bg-[var(--bg-card)] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap transition-all border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30"
                >
                  Make a simple calculator
                </button>
              </div>
              
              {/* Input Box */}
              <PromptInputBox
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isLoading={isLoading}
                placeholder="Describe your app..."
                className="bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-[24px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-300"
                hideOptions={true}
                customActions={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-full transition-all flex items-center gap-1.5 px-3 py-1.5 border h-8 bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-[13px] font-medium">Add Context</span>
                    </button>
                    <div className="h-4 w-[1px] bg-[var(--border-color)] mx-1" />
                    <button
                      type="button"
                      onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                      className={cn(
                        "rounded-full transition-all flex items-center gap-1.5 px-3 py-1.5 border h-8",
                        isTerminalOpen 
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                          : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <TerminalSquare className="w-4 h-4" />
                      <span className="text-[13px] font-medium">Terminal</span>
                    </button>
                  </div>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Panel (Workspace) */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] relative">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-card)] border border-[var(--border-color)]"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] overflow-x-auto custom-scrollbar gap-4">
          {/* Segmented Control */}
          <div className="flex items-center bg-[var(--bg-input)] rounded-lg p-1 border border-[var(--border-color)] shrink-0 shadow-inner">
            {[
              { id: 'preview', icon: Eye, label: 'Preview' },
              { id: 'code', icon: Code2, label: 'Code' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'preview' | 'code')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" /> {/* Spacer */}

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[var(--bg-card)] rounded-lg p-1 border border-[var(--border-color)]">
              <button 
                onClick={() => setDeviceView('desktop')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  deviceView === 'desktop' ? "bg-[var(--bg-hover)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeviceView('mobile')}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  deviceView === 'mobile' ? "bg-[var(--bg-hover)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-md transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button 
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([files[selectedFile]?.code || defaultHtml], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = selectedFile;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Download Current File"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewKey(prev => prev + 1)}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Refresh Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
              onClick={() => alert("Deployment feature coming soon!")}
            >
              Deploy
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-0 overflow-hidden flex flex-col relative">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="flex-1 flex justify-center items-center relative min-h-0">
            <div className={cn(
              "w-full h-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden transition-all duration-300 relative z-10 flex flex-col",
              (deviceView === 'mobile' && activeTab === 'preview' && !isFullscreen) ? "max-w-[375px] max-h-[812px] border-[12px] border-black rounded-[40px] shadow-2xl" : "max-w-full border-0 rounded-none",
              isFullscreen ? "fixed inset-0 z-50 rounded-none border-none max-w-full max-h-full" : ""
            )}>
              {activeTab === 'preview' && (
                Object.keys(files).length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-app)]">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mb-6 shadow-sm">
                      <Eye className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No preview available</p>
                    <p className="text-xs mt-2 opacity-60">Describe an app to begin vibe coding.</p>
                  </div>
                ) : (
                  <div className={cn("w-full h-full flex flex-col bg-white relative overflow-hidden", (deviceView === 'mobile' && !isFullscreen) ? "rounded-[28px]" : "rounded-none")}>
                    {isLoading && (
                      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                        <p className="text-gray-600 font-medium animate-pulse">Building your app...</p>
                      </div>
                    )}
                    {deviceView === 'mobile' && !isFullscreen && (
                      <div className="absolute top-0 inset-x-0 h-7 bg-black z-20 flex justify-center rounded-t-[28px]">
                        <div className="w-32 h-6 bg-black rounded-b-3xl" />
                      </div>
                    )}
                    {isFullscreen && (
                      <button 
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                    )}
                    <iframe 
                      key={previewKey}
                      srcDoc={getPreviewHtml()}
                      className={cn(
                        "flex-1 w-full border-none bg-white",
                        (deviceView === 'mobile' && !isFullscreen) ? "pt-7" : ""
                      )}
                      title="Live Preview" 
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                )
              )}
              {activeTab === 'code' && (
                  <div className="w-full h-full flex relative bg-black text-[#cccccc] rounded-none overflow-hidden">
                    {/* VS Code Activity Bar */}
                    <div className="w-12 bg-[#111111] flex flex-col items-center py-2 gap-4 shrink-0 z-10 border-r border-[#222]">
                      <button 
                        onClick={() => { setIsFileTreeOpen(true); setIsSearchOpen(false); }}
                        className={cn("relative transition-colors", isFileTreeOpen && !isSearchOpen ? "text-white" : "text-[#858585] hover:text-white")}
                      >
                        <Files className="w-6 h-6 stroke-[1.5]" />
                        {isFileTreeOpen && !isSearchOpen && <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-[#007acc]" />}
                      </button>
                      <button 
                        onClick={() => { setIsSearchOpen(true); setIsFileTreeOpen(false); }}
                        className={cn("relative transition-colors", isSearchOpen ? "text-white" : "text-[#858585] hover:text-white")}
                      >
                        <Search className="w-6 h-6 stroke-[1.5]" />
                        {isSearchOpen && <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-[#007acc]" />}
                      </button>
                    </div>
                    {isFileTreeOpen && !isSearchOpen && (
                      <div className="w-64 border-r border-[#222] bg-[#111111] flex flex-col overflow-hidden shrink-0">
                        <div className="text-[11px] font-semibold text-[#cccccc] mb-2 px-5 pt-3 uppercase tracking-wider flex justify-between items-center">
                          Explorer
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setIsCreatingFile(true); setTimeout(() => newFileInputRef.current?.focus(), 50); }} className="hover:text-white transition-colors" title="New File">
                              <FileCode className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setIsFileTreeOpen(false)} className="hover:text-white transition-colors">
                              <PanelLeftClose className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                          {isCreatingFile && (
                            <div className="flex items-center gap-1.5 text-[13px] py-1 px-4 bg-[#222]">
                              <FileCode className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                              <input
                                ref={newFileInputRef}
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCreateFile();
                                  if (e.key === 'Escape') { setIsCreatingFile(false); setNewFileName(''); }
                                }}
                                onBlur={() => {
                                  if (newFileName.trim()) handleCreateFile();
                                  else setIsCreatingFile(false);
                                }}
                                className="flex-1 bg-transparent border border-[#007acc] outline-none text-white px-1"
                                placeholder="filename.ext"
                              />
                            </div>
                          )}
                          {Object.keys(files).sort().map((filename) => {
                            const file = files[filename];
                            const Icon = file.icon;
                            const parts = filename.split('/');
                            const name = parts[parts.length - 1];
                            const depth = parts.length - 1;
                            
                            return (
                              <div 
                                key={filename}
                                onClick={() => setSelectedFile(filename)}
                                className={cn(
                                  "flex items-center gap-1.5 text-[13px] py-1 px-4 cursor-pointer transition-colors",
                                  selectedFile === filename 
                                    ? "bg-[#222] text-white" 
                                    : "text-[#cccccc] hover:bg-[#1a1a1a]"
                                )}
                                style={{ paddingLeft: `${(depth * 12) + 16}px` }}
                                title={filename}
                              >
                                <Icon className={cn("w-3.5 h-3.5 shrink-0", file.color)} />
                                <span className="truncate">{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {isSearchOpen && (
                      <div className="w-64 border-r border-[#222] bg-[#111111] flex flex-col overflow-hidden shrink-0">
                        <div className="text-[11px] font-semibold text-[#cccccc] mb-2 px-5 pt-3 uppercase tracking-wider flex justify-between items-center">
                          Search
                          <button onClick={() => setIsSearchOpen(false)} className="hover:text-white transition-colors">
                            <PanelLeftClose className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="px-4 py-2">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search files..."
                            className="w-full bg-[#222] border border-[#333] text-white text-[13px] px-2 py-1 outline-none focus:border-[#007acc]"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                          {searchQuery && Object.keys(files).filter(f => files[f].code.toLowerCase().includes(searchQuery.toLowerCase())).map((filename) => {
                            const file = files[filename];
                            const Icon = file.icon;
                            const parts = filename.split('/');
                            const name = parts[parts.length - 1];
                            
                            return (
                              <div 
                                key={filename}
                                onClick={() => setSelectedFile(filename)}
                                className={cn(
                                  "flex items-center gap-1.5 text-[13px] py-1 px-4 cursor-pointer transition-colors",
                                  selectedFile === filename 
                                    ? "bg-[#222] text-white" 
                                    : "text-[#cccccc] hover:bg-[#1a1a1a]"
                                )}
                                title={filename}
                              >
                                <Icon className={cn("w-3.5 h-3.5 shrink-0", file.color)} />
                                <span className="truncate">{name}</span>
                              </div>
                            );
                          })}
                          {searchQuery && Object.keys(files).filter(f => files[f].code.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="text-[#858585] text-[13px] px-4 py-2">No results found.</div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col bg-black overflow-hidden min-w-0">
                      <div className="flex items-center overflow-x-auto custom-scrollbar bg-[#111111] shrink-0 border-b border-[#222]">
                        {!isFileTreeOpen && !isSearchOpen && (
                          <button onClick={() => setIsFileTreeOpen(true)} className="px-3 text-[#858585] hover:text-[#cccccc] transition-colors shrink-0">
                            <PanelLeftOpen className="w-4 h-4" />
                          </button>
                        )}
                        {Object.keys(files).map((filename) => {
                          const file = files[filename];
                          const isSelected = selectedFile === filename;
                          return (
                            <button
                              key={filename}
                              onClick={() => setSelectedFile(filename)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-[13px] min-w-fit transition-colors border-r border-[#222]",
                                isSelected 
                                  ? "bg-black text-white border-t border-t-[#007acc]" 
                                  : "bg-[#111111] text-[#969696] hover:bg-[#1a1a1a] border-t border-t-transparent"
                              )}
                            >
                              {React.createElement(file.icon, { className: cn("w-3.5 h-3.5", file.color) })}
                              {filename}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1 overflow-hidden bg-black">
                        {Object.keys(files).length === 0 ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#858585] bg-black">
                            <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#222] flex items-center justify-center mb-6 shadow-sm">
                              <Code2 className="w-8 h-8 opacity-40" />
                            </div>
                            <p className="text-sm font-medium">No files yet</p>
                            <p className="text-xs mt-2 opacity-60">Create a new file in the Explorer to begin coding.</p>
                          </div>
                        ) : (
                          <Editor
                            height="100%"
                            path={selectedFile || Object.keys(files)[0]}
                            language={(files[selectedFile] || Object.values(files)[0])?.language === 'js' ? 'javascript' : (files[selectedFile] || Object.values(files)[0])?.language === 'ts' ? 'typescript' : (files[selectedFile] || Object.values(files)[0])?.language}
                            theme="black-theme"
                            beforeMount={(monaco) => {
                              monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                                target: monaco.languages.typescript.ScriptTarget.Latest,
                                allowNonTsExtensions: true,
                                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                                module: monaco.languages.typescript.ModuleKind.CommonJS,
                                noEmit: true,
                                esModuleInterop: true,
                                jsx: monaco.languages.typescript.JsxEmit.React,
                                reactNamespace: "React",
                                allowJs: true,
                                typeRoots: ["node_modules/@types"]
                              });
                              monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                                target: monaco.languages.typescript.ScriptTarget.Latest,
                                allowNonTsExtensions: true,
                                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                                module: monaco.languages.typescript.ModuleKind.CommonJS,
                                noEmit: true,
                                esModuleInterop: true,
                                jsx: monaco.languages.typescript.JsxEmit.React,
                                reactNamespace: "React",
                                allowJs: true,
                                typeRoots: ["node_modules/@types"]
                              });
                              monaco.editor.defineTheme('black-theme', {
                                base: 'vs-dark',
                                inherit: true,
                                rules: [],
                                colors: {
                                  'editor.background': '#000000',
                                  'editor.lineHighlightBackground': '#111111',
                                }
                              });
                            }}
                            value={(files[selectedFile] || Object.values(files)[0])?.code}
                            onChange={(value) => {
                              if (value !== undefined && selectedFile) {
                                setFiles(prev => ({
                                  ...prev,
                                  [selectedFile]: {
                                    ...prev[selectedFile],
                                    code: value
                                  }
                                }));
                              }
                            }}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                              wordWrap: 'off',
                              scrollBeyondLastLine: false,
                              smoothScrolling: true,
                              cursorBlinking: 'smooth',
                              cursorSmoothCaretAnimation: 'on',
                              formatOnPaste: true,
                              quickSuggestions: { other: true, comments: true, strings: true },
                              suggestOnTriggerCharacters: true,
                              acceptSuggestionOnEnter: "on",
                              tabCompletion: "on",
                              wordBasedSuggestions: "currentDocument",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
          
          {/* Terminal */}
          <AnimatePresence>
            {isTerminalOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: '15vh', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  "w-full bg-[#0C0C0C] border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden shrink-0 z-20",
                  !(deviceView === 'mobile' && activeTab === 'preview' && !isFullscreen) ? "rounded-none border-0 border-t" : "rounded-xl mt-4"
                )}
              >
                {/* CMD Content */}
                <div 
                  className="flex-1 p-2 overflow-y-auto font-['Consolas','Lucida_Console',monospace] text-[14px] text-[#CCCCCC] cursor-text"
                  onClick={() => document.getElementById('cmd-input')?.focus()}
                >
                  {terminalHistory.map((line, i) => (
                    <div key={i} className="min-h-[20px] whitespace-pre-wrap">{line}</div>
                  ))}
                  <div className="flex items-center">
                    <span className="mr-2">C:\Users\User\vibe-coder&gt;</span>
                    <input
                      id="cmd-input"
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={handleTerminalSubmit}
                      className="flex-1 bg-transparent border-none outline-none text-[#CCCCCC] font-['Consolas','Lucida_Console',monospace] text-[14px] caret-[#CCCCCC]"
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <div ref={terminalEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
