import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye,
  Code2,
  CheckCircle2,
  Loader2,
  Search,
  RotateCcw,
  Plus,
  MoreHorizontal,
  Layers,
  Globe,
  ChevronLeft,
  FileCode,
  FileJson,
  X
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

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    
    const timeout = setTimeout(() => setCurrentStep(0), 0);
    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 2000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isStreaming, steps.length]);

  return (
    <div className="mt-2 space-y-2">
      {steps.length > 0 && (
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const isCompleted = !isStreaming || index < currentStep;
            const isActive = isStreaming && index === currentStep;

            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                className={cn(
                  "flex items-center gap-3 text-[13px] font-medium transition-all duration-300 py-1.5",
                  isCompleted && !isActive ? "text-[#8a8a8a] bg-transparent" : 
                  isActive ? "text-[#f5f5f5] bg-transparent" : 
                  "text-[#525252] bg-transparent"
                )}
              >
                {isCompleted && !isActive ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-[#3b82f6] animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#333]" />
                )}
                {isActive ? (
                  <TextShimmer className="flex-1 font-medium">{step}</TextShimmer>
                ) : (
                  <span className="flex-1">{step}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VibeCoder() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Microsoft Windows [Version 10.0.19045.3803]',
    '(c) Microsoft Corporation. All rights reserved.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([
    { role: 'model', content: 'Welcome to Vibe Coder! Describe the application or feature you want to build, and I will help you create it.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixingError, setIsFixingError] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [autoFixCount, setAutoFixCount] = useState(0);
  const lastErrorRef = useRef<string>('');

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

  const handleSendRef = useRef<((message: string, isAutoFix?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'preview_error' && !isLoading) {
        const errorMsg = String(e.data.error);
        if (errorMsg !== lastErrorRef.current && autoFixCount < 3) {
          lastErrorRef.current = errorMsg;
          setAutoFixCount(prev => prev + 1);
          if (handleSendRef.current) {
            handleSendRef.current(`I encountered this error in the preview: ${errorMsg}. Please fix it by removing or replacing the missing import.`, true);
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
        // Handle export default function/class
        code = code.replace(/export\s+default\s+(function|class)\s+([A-Za-z0-9_]+)/g, '$1 $2');
        // Handle export default variable
        code = code.replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.__vibeApp = $1;');
        // Remove remaining export keywords
        code = code.replace(/export\s+default\s+/g, '');
        code = code.replace(/export\s+const\s+/g, 'const ');
        code = code.replace(/export\s+function\s+/g, 'function ');
        code = code.replace(/export\s+class\s+/g, 'class ');
        code = code.replace(/export\s+let\s+/g, 'let ');
        code = code.replace(/export\s+/g, '');
        combinedCode += `\n// --- ${name} ---\n${code}\n`;
      });

      const errorCatchingScript = `
        <script>
          window.addEventListener('error', function(event) {
            const msg = event.message || (event.error && event.error.message) || 'Unknown Error';
            document.body.innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace; background: #0a0a0a; height: 100vh; width: 100vw; box-sizing: border-box;"><h3>Runtime Error</h3><p>' + msg + '</p><pre style="margin-top: 10px; opacity: 0.7; white-space: pre-wrap;">' + (event.error ? event.error.stack : '') + '</pre></div>';
            window.parent.postMessage({ type: 'preview_error', error: msg }, '*');
          }, true);
          window.addEventListener('unhandledrejection', function(event) {
            const msg = (event.reason && event.reason.message) || event.reason || 'Unhandled Promise Rejection';
            document.body.innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace; background: #0a0a0a; height: 100vh; width: 100vw; box-sizing: border-box;"><h3>Unhandled Promise Rejection</h3><p>' + msg + '</p></div>';
            window.parent.postMessage({ type: 'preview_error', error: msg }, '*');
          });
        </script>
      `;

      if (hasReact) {
        combinedCode += `\n\nif (typeof App !== 'undefined' && !window.__vibeApp) window.__vibeApp = App;\nelse if (typeof Main !== 'undefined' && !window.__vibeApp) window.__vibeApp = Main;\nelse if (typeof Index !== 'undefined' && !window.__vibeApp) window.__vibeApp = Index;\nelse if (typeof Dashboard !== 'undefined' && !window.__vibeApp) window.__vibeApp = Dashboard;\nelse if (typeof Page !== 'undefined' && !window.__vibeApp) window.__vibeApp = Page;\n`;
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
    setTimeout(() => {
      const container = messagesEndRef.current?.parentElement?.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const handleTerminalSubmit = async (e: React.KeyboardEvent<HTMLInputElement>, commandOverride?: string) => {
    if (e.key === 'Enter') {
      const input = (commandOverride ?? terminalInput).trim();
      const newHistory = [...terminalHistory, `C:\\Users\\User\\vibe-coder> ${input}`];
      setTerminalInput('');
      
      if (input.toLowerCase() === 'dir') {
        newHistory.push(
          ' Volume in drive C has no label.',
          ' Volume Serial Number is 1234-5678',
          '',
          ' Directory of C:\\Users\\User\\vibe-coder',
          '',
          '03/16/2026  10:00 AM    <DIR>          .',
          '03/16/2026  10:00 AM    <DIR>          ..',
          ...Object.keys(files).map(name => `03/16/2026  10:00 AM             1,024 ${name}`),
          `               ${Object.keys(files).length} File(s)          ${Object.keys(files).length * 1024} bytes`,
          '               2 Dir(s)  100,000,000,000 bytes free'
        );
      } else if (input.toLowerCase() === 'cls') {
        setTerminalHistory([]);
        return;
      } else if (input.startsWith('python ') || input.startsWith('py ')) {
        const filename = input.split(' ')[1];
        if (files[filename]) {
          newHistory.push(`Running ${filename}...`);
          setTerminalHistory(newHistory);
          setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
          
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(window as any).loadPyodide) {
              await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(window as any).pyodide) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).pyodide = await (window as any).loadPyodide();
            }
            
            let output = '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).pyodide.setStdout({ batched: (str: string) => { output += str + '\\n'; } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).pyodide.setStderr({ batched: (str: string) => { output += str + '\\n'; } });
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (window as any).pyodide.runPythonAsync(files[filename].code);
            
            setTerminalHistory(prev => [...prev, output.trim() || '']);
          } catch (err: unknown) {
            setTerminalHistory(prev => [...prev, String(err)]);
          }
          setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
          return;
        } else {
          newHistory.push(`python: can't open file '${filename}': [Errno 2] No such file or directory`);
        }
      } else if (input.startsWith('node ')) {
        const filename = input.split(' ')[1];
        if (files[filename]) {
          newHistory.push(`Running ${filename}...`);
          setTerminalHistory(newHistory);
          setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
          
          const output: string[] = [];
          const originalLog = console.log;
          const originalError = console.error;
          
          console.log = (...args) => { output.push(args.join(' ')); originalLog(...args); };
          console.error = (...args) => { output.push(args.join(' ')); originalError(...args); };
          
          try {
            const runCode = new Function(files[filename].code);
            runCode();
          } catch (err: unknown) {
            output.push(String(err));
          }
          
          console.log = originalLog;
          console.error = originalError;
          
          setTerminalHistory(prev => [...prev, ...output]);
          setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
          return;
        } else {
          newHistory.push(`node: Cannot find module '${filename}'`);
        }
      } else if (input !== '') {
        newHistory.push(`'${input}' is not recognized as an internal or external command,`, 'operable program or batch file.');
      }
      newHistory.push('');
      setTerminalHistory(newHistory);
      setTimeout(() => terminalEndRef.current?.scrollIntoView(), 10);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  handleSendRef.current = async (message: string, isAutoFix = false) => {
    await handleSend(message, isAutoFix);
  };

  const handleSend = async (message: string, isAutoFix = false) => {
    if (!message.trim() || isLoading) return;

    if (message.startsWith("[Deploy: ")) {
      const actualMessage = message.replace("[Deploy: ", "").slice(0, -1);
      setMessages([...messages, { role: 'user', content: `Deploying application: ${actualMessage}` }]);
      setIsLoading(true);
      setGenerationSteps(["Preparing deployment", "Building assets", "Deploying to Vercel"]);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', content: "Deployment successful! Your app is live at `https://vibe-coder-app.vercel.app`." }]);
        setIsLoading(false);
        setGenerationSteps([]);
      }, 3000);
      return;
    }

    if (message.startsWith("[Format: ")) {
      const actualMessage = message.replace("[Format: ", "").slice(0, -1);
      setMessages([...messages, { role: 'user', content: `Formatting code: ${actualMessage}` }]);
      setIsLoading(true);
      setGenerationSteps(["Running Prettier", "Fixing lint errors", "Formatting complete"]);
      
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument').run();
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', content: "Code formatting complete. The current file has been formatted according to standard style guidelines." }]);
        setIsLoading(false);
        setGenerationSteps([]);
      }, 1000);
      return;
    }

    if (message.startsWith("[Terminal: ")) {
      const actualMessage = message.replace("[Terminal: ", "").slice(0, -1);
      setMessages([...messages, { role: 'user', content: `Running command: \`${actualMessage}\`` }]);
      setIsLoading(true);
      setGenerationSteps([`Executing ${actualMessage}`, "Processing output"]);
      
      // Simulate running the command in the terminal
      setIsTerminalOpen(true);
      
      setTimeout(() => {
        // Trigger the terminal submit logic
        const fakeEvent = { key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>;
        handleTerminalSubmit(fakeEvent, actualMessage);
        
        setMessages(prev => [...prev, { role: 'model', content: "```bash\n$ " + actualMessage + "\nCommand executed successfully in the terminal.\n```" }]);
        setIsLoading(false);
        setGenerationSteps([]);
      }, 1000);
      return;
    }
    
    if (isAutoFix) {
      setIsFixingError(true);
    }

    const newMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setGenerationSteps([]);

    try {
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      const stream = streamChat(
        messages, 
        message, 
        "You are an expert AI software engineer. The user wants to build a web application. You MUST output multiple files to build a complete, production-ready application.\nFirst, provide a JSON array of the specific tasks you will perform to build this app, wrapped in a ```json:plan block. For example:\n```json:plan\n[\"Setup application structure\", \"Implement Tailwind layout for dashboard\", \"Create interactive components\", \"Add dark mode toggle\"]\n```\nThen, output each file's code wrapped in a markdown block with the language AND filename specified like this: ```html:index.html ...code... ``` or ```css:styles.css ...code... ``` or ```js:script.js ...code... ```. Go above and beyond to make it polished and professional. ALWAYS generate projects with an iOS-like, professional, minimalistic, and smooth design (unless told a certain theme). Use smooth animations, clean typography, and subtle shadows. IMPORTANT: The preview environment supports React, Tailwind, framer-motion, lucide-react, and recharts via ESM imports. You can use standard ES modules (e.g., `import React from 'react'`). Do NOT include CDN links in index.html, they are injected automatically. CRITICAL: Do NOT output any conversational text, explanations, or markdown outside of the code blocks. Just output the plan block and the code blocks.", 
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
      setIsFixingError(false);
      setPreviewKey(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#ededed] font-sans overflow-hidden select-none" style={{ letterSpacing: '-0.01em' }}>
      
      {/* --- LEFT SIDEBAR (Chat History) --- */}
      <div className="w-[380px] flex flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-4 pt-6 space-y-6 pb-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex flex-col space-y-2", msg.role === 'user' ? "items-end mb-8" : "items-start")}>
                {msg.role === 'user' ? (
                  <>
                    <div className="flex items-center gap-2 max-w-[90%]">
                      <div className="p-1.5 rounded-full bg-[#1e293b] text-[#60a5fa] shrink-0">
                        <Globe size={14} />
                      </div>
                      <div className="bg-[#171717] px-[14px] py-2.5 rounded-2xl rounded-tr-sm text-[13.5px] border border-[#262626] text-[#e5e5e5] break-words">
                        {msg.content}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-5">
                    {idx === messages.length - 1 && isLoading && generationSteps.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 py-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 size={16} className="text-[#3b82f6]" />
                        </motion.div>
                        <TextShimmer className="text-[14px] font-medium tracking-wide">Thinking deeply...</TextShimmer>
                      </motion.div>
                    )}
                    
                    {idx === messages.length - 1 && generationSteps.length > 0 && (
                      <div className="py-2">
                        <GenerationProgress isStreaming={isLoading} steps={generationSteps} />
                      </div>
                    )}

                    {(() => {
                      const displayContent = msg.content.replace(/```[\s\S]*?(?:```|$)/g, '').trim();
                      return displayContent ? (
                        <div className="text-[14px] leading-[1.6] text-[#e5e5e5] prose prose-invert max-w-none prose-pre:bg-[#111] prose-pre:border prose-pre:border-[#222]">
                          <ChatMessage content={displayContent} />
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
          <PromptInputBox
            mode="coder"
            value={input}
            onChange={setInput}
            onSend={(msg) => handleSend(msg)}
            isLoading={isLoading}
            placeholder="Ask a follow-up..."
          />
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#404040] px-1">
             <div className="flex gap-4">
               <span className="hover:text-gray-400 cursor-pointer transition-colors">Upgrade to Team for more credits</span>
             </div>
             <span className="text-[#10b981] font-semibold hover:underline cursor-pointer flex items-center gap-1">Upgrade Plan <span className="text-[8px] text-[#404040]">✕</span></span>
          </div>
        </div>
      </div>

      {/* --- FILE EXPLORER --- */}
      <div className="w-[280px] flex flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
        <div className="p-[14px] flex items-center gap-[22px] text-[#525252]">
          <CustomDoc />
          <Search size={17} className="hover:text-white cursor-pointer transition-colors" />
          <Layers size={17} className="hover:text-white cursor-pointer transition-colors" />
        </div>
        
        <div className="px-4 py-3.5 flex items-center justify-between">
           <span className="text-[11px] font-bold text-[#737373] tracking-[0.12em] uppercase">PROJECT</span>
           <div className="flex items-center gap-3 text-[#525252]">
              <button onClick={() => { setIsCreatingFile(true); setTimeout(() => newFileInputRef.current?.focus(), 50); }} className="hover:text-white transition-colors">
                <Plus size={14} />
              </button>
              <CustomFolder />
              <RotateCcw size={14} className="hover:text-white cursor-pointer transition-colors" />
              <div className="w-[14px] h-[14px] border border-[#525252] rounded-[2px] flex items-center justify-center text-[7px] font-bold hover:border-white cursor-pointer transition-colors">
                □
              </div>
              <MoreHorizontal size={14} className="hover:text-white cursor-pointer transition-colors" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {isCreatingFile && (
            <div className="flex items-center gap-3 px-4 py-[7px] bg-[#1a1a1a]">
              {(() => {
                let Icon = CustomDoc;
                let color = 'text-gray-400';
                if (newFileName.endsWith('.html')) { Icon = HtmlIcon; color = ''; }
                else if (newFileName.endsWith('.css')) { Icon = CssIcon; color = ''; }
                else if (newFileName.endsWith('.js') || newFileName.endsWith('.jsx')) { Icon = JsIcon; color = ''; }
                else if (newFileName.endsWith('.ts') || newFileName.endsWith('.tsx')) { Icon = TsIcon; color = ''; }
                else if (newFileName.endsWith('.py')) { Icon = PythonIcon; color = ''; }
                else if (newFileName.endsWith('.json')) { Icon = FileJson; color = 'text-green-400'; }
                return <Icon className={cn("w-4 h-4", color)} />;
              })()}
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
                className="flex-1 bg-transparent border border-[#404040] outline-none text-white text-[13px] px-1 py-0.5 rounded-sm"
                placeholder="filename.ext"
              />
            </div>
          )}
          
          {Object.keys(files).sort().map((filename) => {
            const file = files[filename];
            const Icon = file.icon;
            const isSelected = selectedFile === filename;
            
            return (
              <FileRow 
                key={filename} 
                icon={<Icon className={cn("w-3.5 h-3.5", file.color)} />} 
                label={filename} 
                active={isSelected}
                onClick={() => setSelectedFile(filename)}
                onRename={(e) => {
                  e.stopPropagation();
                  const newName = prompt("Enter new file name:", filename);
                  if (newName && newName !== filename && !files[newName]) {
                    setFiles(prev => {
                      const newFiles = { ...prev };
                      newFiles[newName] = newFiles[filename];
                      delete newFiles[filename];
                      return newFiles;
                    });
                    if (selectedFile === filename) {
                      setSelectedFile(newName);
                    }
                  }
                }}
                onRemove={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete ${filename}?`)) {
                    setFiles(prev => {
                      const newFiles = { ...prev };
                      delete newFiles[filename];
                      return newFiles;
                    });
                    if (selectedFile === filename) {
                      const remainingFiles = Object.keys(files).filter(f => f !== filename);
                      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
                    }
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex flex-col relative bg-[#0a0a0a] min-w-0">
        {/* Workspace Top Toolbar */}
        <div className="h-[56px] flex items-center justify-between px-4 shrink-0 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-3 px-1 text-[#525252]">
                <ChevronLeft size={18} className="cursor-pointer hover:text-white transition-colors" />
                <div className="flex gap-[1px] bg-[#141414] p-[3px] rounded-[10px] border border-[#1f1f1f]">
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={cn("p-1.5 px-2 rounded-[7px] transition-all flex items-center justify-center", activeTab === 'preview' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#737373] hover:text-white')}
                  >
                    <Eye size={17} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('code')}
                    className={cn("p-1.5 px-2 rounded-[7px] transition-all flex items-center justify-center", activeTab === 'code' ? 'bg-[#262626] text-white shadow-sm' : 'text-[#737373] hover:text-white')}
                  >
                    <Code2 size={17} />
                  </button>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-5 text-[#737373]">
             {activeTab === 'code' && Object.keys(files).length > 0 && selectedFile && (
               <select
                 value={(files[selectedFile] || Object.values(files)[0])?.language || 'plaintext'}
                 onChange={(e) => {
                   const newLang = e.target.value;
                   setFiles(prev => ({
                     ...prev,
                     [selectedFile]: {
                       ...prev[selectedFile],
                       language: newLang
                     }
                   }));
                 }}
                 className="bg-[#141414] text-[#a3a3a3] border border-[#262626] rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#404040] hover:text-white transition-colors cursor-pointer"
               >
                 <option value="html">HTML</option>
                 <option value="css">CSS</option>
                 <option value="javascript">JavaScript</option>
                 <option value="typescript">TypeScript</option>
                 <option value="python">Python</option>
                 <option value="json">JSON</option>
                 <option value="plaintext">Plain Text</option>
               </select>
             )}
             <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="hover:text-white transition-colors">
               <TerminalIcon />
             </button>
             <MoreHorizontal size={18} className="cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 flex flex-col relative min-h-0">
           {activeTab === 'code' ? (
             Object.keys(files).length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center px-12">
                 <div className="w-full max-w-[480px] flex flex-col items-center text-center">
                    <div className="opacity-[0.05] grayscale mb-10">
                       <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 19h20L12 2zm0 3.8L18.4 17H5.6L12 5.8z" />
                       </svg>
                    </div>
                    <p className="text-[#525252] text-[14px] mb-12 font-medium">Ask the agent to fix errors or add new features</p>
                    <div className="w-full space-y-[18px]">
                       <ShortcutRow label="Go to File" keys={['Ctrl', 'P']} />
                       <ShortcutRow label="Find in Files" keys={['Ctrl', 'Shift', 'F']} />
                       <ShortcutRow label="Command Palette" keys={['Ctrl', 'Shift', 'P']} />
                       <ShortcutRow label="Terminal" keys={['Ctrl', '`']} />
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex-1 relative">
                 <Editor
                    height="100%"
                    path={selectedFile || Object.keys(files)[0]}
                    language={(files[selectedFile] || Object.values(files)[0])?.language === 'js' ? 'javascript' : (files[selectedFile] || Object.values(files)[0])?.language === 'ts' ? 'typescript' : (files[selectedFile] || Object.values(files)[0])?.language}
                    theme="vibe-dark"
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    beforeMount={(monaco) => {
                      // Add Python basic completions
                      monaco.languages.registerCompletionItemProvider('python', {
                        provideCompletionItems: (model, position) => {
                          const word = model.getWordUntilPosition(position);
                          const range = {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: word.startColumn,
                            endColumn: word.endColumn,
                          };
                          const suggestions = [
                            {
                              label: 'print',
                              kind: monaco.languages.CompletionItemKind.Function,
                              insertText: 'print(${1:value})',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Prints the values to a stream, or to sys.stdout by default.',
                              range: range
                            },
                            {
                              label: 'def',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'def ${1:name}(${2:args}):\n\t${3:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Define a function',
                              range: range
                            },
                            {
                              label: 'class',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'class ${1:Name}:\n\tdef __init__(self):\n\t\t${2:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Define a class',
                              range: range
                            },
                            {
                              label: 'import',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'import ${1:module}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Import a module',
                              range: range
                            },
                            {
                              label: 'from',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'from ${1:module} import ${2:name}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Import a specific name from a module',
                              range: range
                            },
                            {
                              label: 'if',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'if ${1:condition}:\n\t${2:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'If statement',
                              range: range
                            },
                            {
                              label: 'for',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'For loop',
                              range: range
                            },
                            {
                              label: 'while',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'while ${1:condition}:\n\t${2:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'While loop',
                              range: range
                            },
                            {
                              label: 'try',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Try-except block',
                              range: range
                            },
                            {
                              label: 'with',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'with ${1:expression} as ${2:name}:\n\t${3:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'With statement',
                              range: range
                            },
                            {
                              label: 'return',
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: 'return ${1:value}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Return statement',
                              range: range
                            },
                            {
                              label: '__init__',
                              kind: monaco.languages.CompletionItemKind.Method,
                              insertText: 'def __init__(self${1:, args}):\n\t${2:pass}',
                              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              documentation: 'Initialize a class instance',
                              range: range
                            },
                            {
                              label: 'self',
                              kind: monaco.languages.CompletionItemKind.Variable,
                              insertText: 'self',
                              documentation: 'Reference to the current instance of the class',
                              range: range
                            }
                          ];
                          return { suggestions: suggestions };
                        }
                      });

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
                      monaco.editor.defineTheme('vibe-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': '#0a0a0a',
                          'editor.lineHighlightBackground': '#141414',
                          'editorLineNumber.foreground': '#404040',
                          'editorIndentGuide.background': '#1f1f1f',
                          'editorIndentGuide.activeBackground': '#404040',
                          'editorSuggestWidget.background': '#1e1e1e',
                          'editorSuggestWidget.border': '#454545',
                          'editorSuggestWidget.foreground': '#d4d4d4',
                          'editorSuggestWidget.highlightForeground': '#18a3ff',
                          'editorSuggestWidget.selectedBackground': '#04395e',
                          'editorHoverWidget.background': '#1e1e1e',
                          'editorHoverWidget.border': '#454545',
                          'editorWidget.background': '#1e1e1e',
                          'editorWidget.border': '#454545',
                        }
                      });
                    }}
                    value={(files[selectedFile] || Object.values(files)[0])?.code}
                    onChange={(value) => {
                      if (value !== undefined && selectedFile) {
                        setFiles(prev => {
                          const currentFile = prev[selectedFile];
                          return {
                            ...prev,
                            [selectedFile]: {
                              ...currentFile,
                              code: value
                            }
                          };
                        });
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
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true, indentation: true },
                      renderLineHighlight: 'all',
                      renderWhitespace: 'selection',
                      quickSuggestions: { other: true, comments: true, strings: true },
                      quickSuggestionsDelay: 10,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: "on",
                      tabCompletion: "on",
                      wordBasedSuggestions: "allDocuments",
                      suggestSelection: "first",
                      snippetSuggestions: "inline",
                      suggest: {
                        showIcons: true,
                        showStatusBar: true,
                        preview: true,
                        previewMode: 'subwordSmart',
                        filterGraceful: true,
                        snippetsPreventQuickSuggestions: false,
                        localityBonus: true,
                        shareSuggestSelections: true,
                        showInlineDetails: true,
                        showMethods: true,
                        showFunctions: true,
                        showConstructors: true,
                        showDeprecated: true,
                        showFields: true,
                        showVariables: true,
                        showClasses: true,
                        showStructs: true,
                        showInterfaces: true,
                        showModules: true,
                        showProperties: true,
                        showEvents: true,
                        showOperators: true,
                        showUnits: true,
                        showValues: true,
                        showConstants: true,
                        showEnums: true,
                        showEnumMembers: true,
                        showKeywords: true,
                        showWords: true,
                        showColors: true,
                        showFiles: true,
                        showReferences: true,
                        showFolders: true,
                        showTypeParameters: true,
                        showSnippets: true,
                      },
                      inlineSuggest: { enabled: true },
                      hover: { enabled: true, delay: 300 },
                      parameterHints: { enabled: true },
                      fixedOverflowWidgets: true,
                      padding: { top: 16 }
                    }}
                  />
               </div>
             )
           ) : (
             <div className="flex-1 relative bg-[#0a0a0a]">
                {isLoading && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md">
                    <div className="w-10 h-10 border-2 border-[#333] border-t-white rounded-full animate-spin mb-4" />
                    <TextShimmer className="text-white font-medium tracking-widest text-xs uppercase">
                      {isFixingError ? 'Fixing error...' : 'Building preview...'}
                    </TextShimmer>
                  </div>
                )}
                {Object.keys(files).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#404040] bg-[#0a0a0a]">
                    <Eye size={64} className="mb-4 opacity-10" />
                    <p className="text-[14px] font-medium opacity-50 uppercase tracking-[0.2em]">Preview Mode</p>
                  </div>
                ) : (
                  <iframe 
                    key={previewKey}
                    srcDoc={getPreviewHtml()}
                    className="w-full h-full border-none bg-white"
                    title="Live Preview" 
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                )}
             </div>
           )}
           
           {/* Terminal Overlay */}
           {isTerminalOpen && (
             <div className="absolute bottom-0 left-0 right-0 h-64 bg-[#0C0C0C] border-t border-[#1a1a1a] flex flex-col z-20" style={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
               <div className="flex items-center justify-between px-4 py-2 bg-white text-black">
                 <div className="flex items-center gap-2">
                   <TerminalIcon />
                   <span className="text-[12px] font-semibold">Command Prompt</span>
                 </div>
                 <button onClick={() => setIsTerminalOpen(false)} className="text-black hover:bg-[#e81123] hover:text-white px-3 py-1 transition-colors">
                   <X size={14} />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 text-[14px] text-[#CCCCCC]" onClick={() => document.getElementById('cmd-input')?.focus()}>
                 {terminalHistory.map((line, i) => (
                   <div key={i} className="whitespace-pre-wrap leading-tight">{line}</div>
                 ))}
                 <div className="flex items-center mt-1 relative leading-tight">
                   <span className="mr-2">C:\Users\User\vibe-coder&gt;</span>
                   <div className="relative flex-1 flex items-center">
                     <span className="whitespace-pre">{terminalInput}</span>
                     <span className="inline-block w-[8px] h-[15px] bg-[#CCCCCC] ml-[1px] terminal-cursor"></span>
                     <input
                       id="cmd-input"
                       type="text"
                       value={terminalInput}
                       onChange={(e) => setTerminalInput(e.target.value)}
                       onKeyDown={handleTerminalSubmit}
                       className="absolute inset-0 opacity-0 cursor-text"
                       autoFocus
                       onBlur={(e) => e.target.focus()}
                     />
                   </div>
                 </div>
                 <div ref={terminalEndRef} />
               </div>
             </div>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes terminal-blink {
          0%, 49.9% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .terminal-cursor {
          animation: terminal-blink 1s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f1f1f;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #262626;
        }
      `}} />
    </div>
  );
}

const CustomFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const CustomDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const FileRow = ({ icon, label, inset = false, hasDot = false, onClick, active = false, onRename, onRemove }: { icon: React.ReactNode, label: string, inset?: boolean, hasDot?: boolean, onClick?: () => void, active?: boolean, onRename?: (e: React.MouseEvent) => void, onRemove?: (e: React.MouseEvent) => void }) => (
  <div onClick={onClick} title={label} className={cn("flex items-center gap-3 px-4 py-[7px] cursor-pointer group transition-colors relative", inset ? 'pl-[38px]' : '', active ? 'bg-[#1a1a1a] text-white' : 'hover:bg-[#111111] text-[#8a8a8a]')}>
    <span className={cn("flex-shrink-0 flex items-center justify-center w-3.5", active ? 'text-white' : 'text-[#525252]')}>
      {icon}
    </span>
    <span className="flex-1 truncate text-[13px] font-medium group-hover:text-[#f5f5f5] tracking-tight">{label}</span>
    {hasDot && <div className="w-[3px] h-[3px] bg-red-500 rounded-full mr-1"></div>}
    <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-[#111111] pl-2">
      {onRename && (
        <button onClick={onRename} className="p-1 hover:bg-[#2a2a2a] rounded text-[#8a8a8a] hover:text-white transition-colors" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="p-1 hover:bg-[#e81123] rounded text-[#8a8a8a] hover:text-white transition-colors" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
      )}
    </div>
  </div>
);

const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
  <div className="flex justify-between items-center text-[13px] text-[#525252] group px-1">
    <span className="group-hover:text-[#9e9e9e] transition-colors">{label}</span>
    <div className="flex items-center gap-1.5">
      {keys.map((key: string, i: number) => (
        <React.Fragment key={key}>
          <span className="bg-[#141414] border border-[#1f1f1f] px-[6px] py-[3px] rounded-[5px] text-[10.5px] font-mono min-w-[30px] text-center text-[#737373] shadow-sm">
            {key}
          </span>
          {i < keys.length - 1 && <span className="text-[#333] text-[9px]">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);
