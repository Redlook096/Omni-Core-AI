import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

import { FileNode } from './file-explorer';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  files?: FileNode[];
}

export const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose, files = [] }) => {
  const [lines, setLines] = useState<string[]>([
    'Windows PowerShell',
    'Copyright (C) Microsoft Corporation. All rights reserved.',
    '',
    'Try the new cross-platform PowerShell https://aka.ms/pscore6',
    ''
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('Terminal');
  const [currentPath, setCurrentPath] = useState('C:\\Users\\VibeCoder\\Project');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isOpen, activeTab]);

  // Keep focus on input
  useEffect(() => {
    if (isOpen && inputRef.current && activeTab === 'Terminal') {
      inputRef.current.focus();
    }
  }, [isOpen, lines, activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input; 
      setLines(prev => [...prev, `PS ${currentPath}> ${cmd}`, ...processCommand(cmd.trim())]);
      setInput('');
    }
  };

  const processCommand = (cmd: string): string[] => {
    if (!cmd) return [];
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        return ['Available commands: help, clear, ls, dir, echo [text], node [script], cd [path], mkdir [name], touch [name], pwd, whoami, date'];
      case 'clear':
      case 'cls':
        setTimeout(() => setLines([]), 10);
        return [];
      case 'ls':
      case 'dir':
        // Flatten the file tree for the current directory (mocked as root for now)
        // In a real implementation, we'd traverse based on currentPath
        // For now, we just list the root files if we are at root, or just list everything flat if we want to be lazy, 
        // but let's try to list the top level of 'files' prop since we are at 'Project' root.
        
        // Assuming 'files' prop contains the root 'vibe-coder' folder usually.
        // Let's find the children of the root folder.
        const root = files.find(f => f.id === 'root');
        const currentDirFiles = root?.children || [];

        const fileLines = currentDirFiles.map(f => {
            const date = '2/20/2026   7:00 PM';
            const type = f.type === 'folder' ? 'd-----' : '-a----';
            const length = f.content ? f.content.length.toString().padStart(10) : '       0';
            return `${type}        ${date}   ${length} ${f.name}`;
        });

        return [
            `    Directory: ${currentPath}`,
            '',
            'Mode                 LastWriteTime         Length Name',
            '----                 -------------         ------ ----',
            ...fileLines,
            ''
        ];
      case 'cd':
        if (args.length === 0) return [];
        if (args[0] === '..') {
            // Mock going up
            return [];
        }
        // Mock going down
        return [];
      case 'pwd':
        return [currentPath];
      case 'whoami':
        return ['vibe-coder\\user'];
      case 'date':
        return [new Date().toString()];
      case 'mkdir':
        return args.length > 0 ? [`Directory created: ${args[0]}`] : ['usage: mkdir <directory_name>'];
      case 'touch':
        return args.length > 0 ? [`File created: ${args[0]}`] : ['usage: touch <filename>'];
      case 'npm':
        if (args[0] === 'start' || (args[0] === 'run' && args[1] === 'dev')) {
             return ['> vibe-coder@0.0.0 dev', '> vite', '', '  VITE v6.2.0  ready in 345 ms', '', '  ➜  Local:   http://localhost:3000/', '  ➜  Network: use --host to expose'];
        }
        return [`npm command '${args.join(' ')}' executed.`];
      default:
        if (cmd.startsWith('echo ')) return [cmd.substring(5)];
        if (cmd.startsWith('node ')) return [`Running script: ${cmd.substring(5)}...`, 'Done.'];
        return [`'${command}' is not recognized as an internal or external command,`, 'operable program or batch file.', ''];
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="h-48 bg-black border-t border-[#2b2b2b] flex flex-col font-mono text-sm select-text"
      onClick={() => activeTab === 'Terminal' && inputRef.current?.focus()}
    >
      <style>
        {`
          @keyframes terminal-blink {
            50% { opacity: 0; }
          }
          .terminal-cursor {
            display: inline-block;
            width: 8px;
            height: 16px;
            background: #c0c0c0;
            animation: terminal-blink 1s steps(1) infinite;
            vertical-align: text-bottom;
            margin-left: 1px;
          }
        `}
      </style>
      <div className="flex items-center justify-between px-4 py-0 bg-[#1e1e1e] border-b border-[#2b2b2b] select-none h-8">
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-wide font-medium text-[#969696]">
           {['Problems', 'Output', 'Debug Console', 'Terminal'].map(tab => (
             <span 
               key={tab}
               className={cn(
                 "cursor-pointer h-8 flex items-center border-b border-transparent hover:text-[#cccccc] transition-colors",
                 activeTab === tab && "text-white border-white"
               )}
               onClick={() => setActiveTab(tab)}
             >
               {tab}
             </span>
           ))}
        </div>
        <div className="flex items-center gap-3">
           <Minimize2 className="w-3.5 h-3.5 text-[#cccccc] cursor-pointer hover:text-white" />
           <X className="w-3.5 h-3.5 text-[#cccccc] cursor-pointer hover:text-white" onClick={onClose} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 font-['Consolas',_'Courier_New',_monospace] text-[#cccccc] text-[13px] leading-5">
        {activeTab === 'Terminal' ? (
          <>
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
            ))}
            <div className="flex items-center">
              <span className="text-[#cccccc] mr-2">PS {currentPath}&gt;</span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="text-[#cccccc]">{input}</span>
                <span className="terminal-cursor" />
              </div>
            </div>
            <div ref={bottomRef} />
          </>
        ) : (
          <div className="text-[#858585] italic p-2">No output for {activeTab}</div>
        )}
      </div>
    </div>
  );
};
