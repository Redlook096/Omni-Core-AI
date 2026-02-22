import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Spinner } from '../spinner';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  onLanguageChange?: (lang: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange }) => {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('vibe-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      },
    });
    monaco.editor.setTheme('vibe-dark');
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] relative">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        language={language}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        loading={<div className="flex items-center justify-center h-full text-neutral-500"><Spinner /></div>}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 24,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          quickSuggestions: { other: true, comments: true, strings: true },
          suggestOnTriggerCharacters: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

