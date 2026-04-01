import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Play, RefreshCw } from 'lucide-react';
import { buildPreviewSrcDoc, getCanvasExecutionMode } from '../../lib/canvas-preview';

export type CanvasExecutionMode = 'preview' | 'terminal';

interface CodeRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  isFixingErrors?: boolean;
  /** Web languages → live iframe; Python and others → terminal (Wandbox). */
  executionMode?: CanvasExecutionMode;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
  isOpen,
  onClose,
  code,
  language,
  isFixingErrors,
  executionMode: executionModeProp,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [previewDoc, setPreviewDoc] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executionMode = executionModeProp ?? getCanvasExecutionMode(language);
  const usePreview = executionMode === 'preview';

  const previewErrorDedupRef = useRef<{ msg: string; t: number }>({ msg: '', t: 0 });
  const prevFixingRef = useRef<boolean>(false);
  const [showFixedCode, setShowFixedCode] = useState(false);
  const autoFixAttemptsRef = useRef<Record<string, number>>({});
  const [autoFixExhausted, setAutoFixExhausted] = useState(false);
  const [autoFixLastError, setAutoFixLastError] = useState<string>('');

  const canonicalizePreviewError = useCallback((err: string) => {
    const e = String(err || '').toLowerCase();
    if (e.includes('illegal return statement')) return 'illegal_return_statement';
    if (e.includes('minified react error')) return 'react_minified_error';
    if (e.includes('no usable root export')) return 'no_usable_root_export';
    if (e.includes('unable to resolve preview entry file')) return 'no_preview_entry';
    if (e.includes('referenceerror') || e.includes('typeerror')) return 'runtime_reference_type_error';
    return e.replace(/\s+/g, ' ').trim().slice(0, 140);
  }, []);

  useEffect(() => {
    if (!isOpen || !usePreview) return;

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== 'preview_error' || typeof e.data?.error !== 'string') return;

      const cw = iframeRef.current?.contentWindow;
      if (!cw || e.source !== cw) return;

      const err = String(e.data.error);
      const now = Date.now();
      const last = previewErrorDedupRef.current;
      if (err === last.msg && now - last.t < 1200) return;
      previewErrorDedupRef.current = { msg: err, t: now };

      const sig = canonicalizePreviewError(err);
      const attempts = autoFixAttemptsRef.current[sig] ?? 0;
      if (attempts >= 2) {
        setAutoFixExhausted(true);
        setAutoFixLastError(err);
        return;
      }
      autoFixAttemptsRef.current[sig] = attempts + 1;
      setAutoFixExhausted(false);
      setAutoFixLastError(err);

      window.dispatchEvent(
        new CustomEvent('auto-fix-code', {
          detail: { code, language, error: err },
        })
      );
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [isOpen, usePreview, code, language, canonicalizePreviewError]);

  useEffect(() => {
    if (!isFixingErrors) {
      // If the fix succeeded, allow future auto-fix cycles again.
      setAutoFixExhausted(false);
    }
  }, [isFixingErrors]);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    const lang = language.toLowerCase();

    if (usePreview) {
      try {
        setPreviewDoc(buildPreviewSrcDoc(code, lang));
        setIframeKey((k) => k + 1);
      } catch (e) {
        console.error(e);
        window.dispatchEvent(
          new CustomEvent('auto-fix-code', {
            detail: {
              code,
              language,
              error: e instanceof Error ? e.message : 'Preview build failed',
            },
          })
        );
      }
      setIsRunning(false);
      return;
    }

    const cmd =
      lang === 'python'
        ? 'python main.py'
        : lang === 'javascript' || lang === 'js'
          ? 'node main.js'
          : lang === 'typescript' || lang === 'ts'
            ? 'ts-node main.ts'
            : lang === 'java'
              ? 'java Main'
              : lang === 'c'
                ? 'gcc main.c && ./a.out'
                : lang === 'cpp' || lang === 'c++'
                  ? 'g++ main.cpp && ./a.out'
                  : lang === 'go'
                    ? 'go run main.go'
                    : lang === 'rust'
                      ? 'rustc main.rs && ./main'
                      : `run ${language} code`;

    const bootText = `Microsoft Windows [Version 10.0.19045.0]\n(c) Microsoft Corporation. All rights reserved.\n\nC:\\Users\\User> ${cmd}\n`;
    setOutput(bootText + 'Running...\n');

    try {
      const wandboxCompilerMap: Record<string, string> = {
        javascript: 'nodejs-20.17.0',
        js: 'nodejs-20.17.0',
        typescript: 'typescript-5.6.2',
        ts: 'typescript-5.6.2',
        python: 'cpython-3.13.8',
        py: 'cpython-3.13.8',
        cpp: 'gcc-13.2.0',
        'c++': 'gcc-13.2.0',
        c: 'gcc-13.2.0-c',
        java: 'openjdk-jdk-22+36',
        go: 'go-1.23.2',
        rust: 'rust-1.82.0',
        php: 'php-8.3.12',
        ruby: 'ruby-3.4.1',
        bash: 'bash',
        sh: 'bash',
        csharp: 'mono-6.12.0.199',
        cs: 'mono-6.12.0.199',
      };

      const compiler = wandboxCompilerMap[lang];

      if (!compiler) {
        setOutput(bootText + `Error: Language '${lang}' is not supported by the execution engine.\n`);
        setIsRunning(false);
        return;
      }

      const response = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler: compiler,
          code: code,
          save: false,
        }),
      });

      const data = await response.json();

      if (data.status === '0') {
        setOutput(bootText + (data.program_message || data.program_output || 'Program exited with no output.') + '\n\n');
      } else {
        const errorMsg = data.compiler_error || data.compiler_message || data.program_error || 'Error executing code.';
        setOutput(bootText + errorMsg + '\n\n[Auto-Fix] Error detected. Requesting AI to fix...\n\n');

        window.dispatchEvent(
          new CustomEvent('auto-fix-code', {
            detail: { code, language, error: errorMsg },
          })
        );
      }
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(bootText + 'Failed to execute code. Please try again later.\n\n');
    } finally {
      setIsRunning(false);
    }
  }, [code, language, usePreview]);

  useEffect(() => {
    if (isOpen) {
      runCode();
    } else {
      setOutput('');
      setPreviewDoc('');
      setShowFixedCode(false);
    }
  }, [isOpen, runCode]);

  useEffect(() => {
    // Auto-reveal the updated code after an auto-fix pass completes.
    if (prevFixingRef.current && !isFixingErrors) {
      setShowFixedCode(true);
    }
    prevFixingRef.current = Boolean(isFixingErrors);
  }, [isFixingErrors]);

  const handleTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    setTerminalInput('');

    if (!trimmed) {
      setOutput((prev) => prev + `C:\\Users\\User> ${cmd}\n`);
      return;
    }

    if (trimmed.toLowerCase() === 'cls' || trimmed.toLowerCase() === 'clear') {
      setOutput(`Microsoft Windows [Version 10.0.19045.0]\n(c) Microsoft Corporation. All rights reserved.\n\n`);
      return;
    }

    if (
      trimmed.toLowerCase() === 'run' ||
      trimmed.toLowerCase().includes('python') ||
      trimmed.toLowerCase().includes('node') ||
      trimmed.toLowerCase().includes('gcc') ||
      trimmed.toLowerCase().includes('g++') ||
      trimmed.toLowerCase().includes('java') ||
      trimmed.toLowerCase().includes('go run') ||
      trimmed.toLowerCase().includes('rustc')
    ) {
      setOutput((prev) => prev + `C:\\Users\\User> ${cmd}\n`);
      runCode();
      return;
    }

    setOutput(
      (prev) =>
        prev +
        `C:\\Users\\User> ${cmd}\n'${trimmed.split(' ')[0]}' is not recognized as an internal or external command,\noperable program or batch file.\n\n`
    );
  };

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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`flex flex-col bg-[#000000] overflow-hidden shadow-2xl transition-all duration-300 ${
              isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-5xl h-[85vh] border border-white/10 rounded-2xl'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  {usePreview ? 'Live preview' : 'Terminal'}
                  {isRunning && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runCode}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  title={usePreview ? 'Refresh preview' : 'Run again'}
                >
                  {usePreview ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline">{usePreview ? 'Refresh' : 'Run'}</span>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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

            <div className="flex-1 relative overflow-hidden bg-black min-h-0">
              {autoFixExhausted && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm px-6 text-center">
                  <div className="text-white font-medium text-sm">Auto-fix stopped</div>
                  <div className="text-gray-300 text-xs leading-relaxed max-w-[520px]">
                    The preview keeps failing with the same runtime error. You can reload, or manually edit the canvas code.
                  </div>
                  <div className="w-full max-w-[520px]">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-gray-200/80 overflow-auto max-h-[120px] whitespace-pre-wrap">
                      {autoFixLastError}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Retry running the current code without triggering auto-fix.
                        setIframeKey((k) => k + 1);
                        setAutoFixExhausted(false);
                      }}
                      className="px-3 py-1.5 rounded border border-white/10 bg-white/5 text-[11.5px] text-white/85 hover:bg-white/10 transition-colors"
                    >
                      Reload preview
                    </button>
                  </div>
                </div>
              )}
              {isFixingErrors && !autoFixExhausted && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                  <div className="text-white font-medium text-sm">Repairing preview…</div>
                  <div className="text-gray-400 text-xs mt-1">Updating the code and re-running.</div>
                </div>
              )}
              {usePreview ? (
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={previewDoc || buildPreviewSrcDoc(code, language)}
                  className="w-full h-full min-h-[320px] border-none bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Live preview"
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
                    letterSpacing: '0',
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
                          verticalAlign: 'text-bottom',
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

            {showFixedCode && !isFixingErrors && (
              <div className="border-t border-white/10 bg-[#070707] px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Fixed code</p>
                  <button
                    type="button"
                    onClick={() => setShowFixedCode(false)}
                    className="px-2 py-1 rounded border border-white/10 text-[10.5px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <pre className="custom-scrollbar max-h-[190px] overflow-auto bg-black/40 border border-white/10 rounded-md p-3 font-mono text-[11px] leading-[1.5] text-white/80 whitespace-pre-wrap">
                  {code}
                </pre>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
