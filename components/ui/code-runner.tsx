import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Play, RefreshCw } from 'lucide-react';

interface CodeRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  isFixingErrors?: boolean;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ isOpen, onClose, code, language, isFixingErrors }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      runCode();
    } else {
      setOutput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, code, language]);

  const runCode = async () => {
    setIsRunning(true);
    
    const lang = language.toLowerCase();
    const cmd = lang === 'python' ? 'python main.py' : 
                lang === 'javascript' || lang === 'js' ? 'node main.js' : 
                lang === 'typescript' || lang === 'ts' ? 'ts-node main.ts' : 
                lang === 'java' ? 'java Main' : 
                lang === 'c' ? 'gcc main.c && ./a.out' : 
                lang === 'cpp' || lang === 'c++' ? 'g++ main.cpp && ./a.out' : 
                lang === 'go' ? 'go run main.go' : 
                lang === 'rust' ? 'rustc main.rs && ./main' : 
                `run ${language} code`;

    const bootText = `Microsoft Windows [Version 10.0.19045.0]\n(c) Microsoft Corporation. All rights reserved.\n\nC:\\Users\\User> ${cmd}\n`;
    setOutput(bootText + 'Running...\n');

    if (lang === 'html' || lang === 'xml' || lang === 'svg') {
      // For HTML, we render it in the iframe
      setIsRunning(false);
      return;
    }

    try {
      const wandboxCompilerMap: Record<string, string> = {
        'javascript': 'nodejs-20.17.0',
        'js': 'nodejs-20.17.0',
        'typescript': 'typescript-5.6.2',
        'ts': 'typescript-5.6.2',
        'python': 'cpython-3.13.8',
        'py': 'cpython-3.13.8',
        'cpp': 'gcc-13.2.0',
        'c++': 'gcc-13.2.0',
        'c': 'gcc-13.2.0-c',
        'java': 'openjdk-jdk-22+36',
        'go': 'go-1.23.2',
        'rust': 'rust-1.82.0',
        'php': 'php-8.3.12',
        'ruby': 'ruby-3.4.1',
        'bash': 'bash',
        'sh': 'bash',
        'csharp': 'mono-6.12.0.199',
        'cs': 'mono-6.12.0.199'
      };
      
      const compiler = wandboxCompilerMap[lang];
      
      if (!compiler) {
        setOutput(bootText + `Error: Language '${lang}' is not supported by the execution engine.\n`);
        setIsRunning(false);
        return;
      }

      // Use Wandbox API for code execution
      const response = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler: compiler,
          code: code,
          save: false
        }),
      });

      const data = await response.json();
      
      if (data.status === '0') {
        setOutput(bootText + (data.program_message || data.program_output || 'Program exited with no output.') + '\n\n');
      } else {
        const errorMsg = data.compiler_error || data.compiler_message || data.program_error || 'Error executing code.';
        setOutput(bootText + errorMsg + '\n\n[Auto-Fix] Error detected. Requesting AI to fix...\n\n');
        
        // Dispatch event to trigger AI auto-fix
        window.dispatchEvent(new CustomEvent('auto-fix-code', { 
          detail: { code, language, error: errorMsg } 
        }));
      }
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(bootText + 'Failed to execute code. Please try again later.\n\n');
    } finally {
      setIsRunning(false);
    }
  };

  const handleTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    setTerminalInput('');
    
    if (!trimmed) {
      setOutput(prev => prev + `C:\\Users\\User> ${cmd}\n`);
      return;
    }
    
    if (trimmed.toLowerCase() === 'cls' || trimmed.toLowerCase() === 'clear') {
      setOutput(`Microsoft Windows [Version 10.0.19045.0]\n(c) Microsoft Corporation. All rights reserved.\n\n`);
      return;
    }
    
    if (trimmed.toLowerCase() === 'run' || trimmed.toLowerCase().includes('python') || trimmed.toLowerCase().includes('node') || trimmed.toLowerCase().includes('gcc') || trimmed.toLowerCase().includes('g++') || trimmed.toLowerCase().includes('java') || trimmed.toLowerCase().includes('go run') || trimmed.toLowerCase().includes('rustc')) {
      setOutput(prev => prev + `C:\\Users\\User> ${cmd}\n`);
      runCode();
      return;
    }
    
    setOutput(prev => prev + `C:\\Users\\User> ${cmd}\n'${trimmed.split(' ')[0]}' is not recognized as an internal or external command,\noperable program or batch file.\n\n`);
  };

  const isHtml = language.toLowerCase() === 'html' || language.toLowerCase() === 'xml' || language.toLowerCase() === 'svg';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'p-4 pt-12 sm:p-6 sm:pt-16'}`}
          onClick={onClose}
        >
          <style>
            {`
              @keyframes fast-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
              .fast-blink {
                animation: fast-blink 0.53s step-end infinite;
              }
            `}
          </style>
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`flex flex-col bg-[#000000] overflow-hidden shadow-2xl transition-all duration-300 ${
              isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-5xl h-[85vh] border border-white/10 rounded-2xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  {isHtml ? 'Browser Preview' : 'Terminal'}
                  {isRunning && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runCode}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  title={isHtml ? "Refresh" : "Run again"}
                >
                  {isHtml ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isHtml ? 'Refresh' : 'Run'}</span>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-black">
              {isFixingErrors && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                  <div className="text-white font-medium">AI is fixing errors...</div>
                  <div className="text-gray-400 text-sm mt-2">Please wait while the code is updated.</div>
                </div>
              )}
              {isHtml ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={code}
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div 
                  className="w-full h-full p-2 sm:p-3 overflow-auto whitespace-pre-wrap relative custom-scrollbar"
                  style={{
                    background: '#000000',
                    fontFamily: 'Consolas, monospace',
                    color: '#c0c0c0',
                    fontSize: '16px',
                    lineHeight: '1.25em',
                    letterSpacing: '0'
                  }}
                  onClick={() => inputRef.current?.focus()}
                >
                  {output}
                  {!isRunning && (
                    <div className="mt-1 flex items-center relative">
                      <span>C:\Users\User&gt; {terminalInput}</span>
                      <span 
                        className="inline-block fast-blink"
                        style={{
                          width: '8px',
                          height: '1.1em',
                          background: '#c0c0c0',
                          verticalAlign: 'text-bottom'
                        }}
                      />
                      <input 
                        ref={inputRef}
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTerminalCommand(terminalInput);
                          }
                        }}
                        className="absolute opacity-0 w-full h-full cursor-text"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
