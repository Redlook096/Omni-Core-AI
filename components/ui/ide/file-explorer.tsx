import React from 'react';
import { 
  Folder, 
  ChevronRight, 
  ChevronDown,
  File,
  Plus,
  Upload,
  FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { TSIcon, JSIcon, PythonIcon, HTMLIcon, CSSIcon, ReactIcon, JSONIcon } from './icons';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
  language?: string;
  content?: string;
}

export const initialFiles: FileNode[] = [
  {
    id: 'root',
    name: 'vibe-coder',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        isOpen: true,
        children: [
          { id: 'app.tsx', name: 'App.tsx', type: 'file', language: 'typescript', content: '// App.tsx code' },
          { id: 'index.css', name: 'index.css', type: 'file', language: 'css', content: '/* styles */' },
          { id: 'utils.ts', name: 'utils.ts', type: 'file', language: 'typescript', content: '// utils' },
        ]
      },
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        isOpen: false,
        children: [
          { id: 'button.tsx', name: 'Button.tsx', type: 'file', language: 'typescript', content: 'export const Button = () => <button>Click me</button>;' },
        ]
      },
      { id: 'package.json', name: 'package.json', type: 'file', language: 'json', content: '{}' },
      { id: 'ts', name: 'tsconfig.json', type: 'file', language: 'json', content: '{}' },
    ]
  }
];

export const getFileIcon = (name: string, type: 'file' | 'folder', isOpen?: boolean, language?: string) => {
  if (type === 'folder') {
    return isOpen ? <ChevronDown className="w-4 h-4 text-[#cccccc]" /> : <ChevronRight className="w-4 h-4 text-[#cccccc]" />;
  }

  // Language based icons
  const lang = language?.toLowerCase();
  const iconClass = "w-4 h-4";
  
  if (lang === 'typescript' || lang === 'tsx') return <TSIcon className={iconClass} />;
  if (lang === 'javascript' || lang === 'jsx') return <JSIcon className={iconClass} />;
  if (lang === 'html') return <HTMLIcon className={iconClass} />;
  if (lang === 'css') return <CSSIcon className={iconClass} />;
  if (lang === 'python') return <PythonIcon className={iconClass} />;
  if (lang === 'json') return <JSONIcon className={iconClass} />;
  
  // Extension based fallbacks
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <TSIcon className={iconClass} />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <JSIcon className={iconClass} />;
  if (name.endsWith('.css')) return <CSSIcon className={iconClass} />;
  if (name.endsWith('.json')) return <JSONIcon className={iconClass} />;
  if (name.endsWith('.html')) return <HTMLIcon className={iconClass} />;
  if (name.endsWith('.py')) return <PythonIcon className={iconClass} />;
  
  return <File className="w-4 h-4 text-[#cccccc]" />;
};

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFileId?: string;
  onToggleFolder: (id: string) => void;
  onCreateNode?: () => void;
  onUpload?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, selectedFileId, onToggleFolder, onCreateNode, onUpload }) => {
  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div 
          className={cn(
            "flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] transition-colors text-[13px] select-none border-l-2 border-transparent",
            selectedFileId === node.id && "bg-[#37373d] text-white border-blue-400",
            !selectedFileId && "text-[#cccccc]"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              onToggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
        >
          <span className="opacity-100 w-4 flex justify-center">
            {node.type === 'folder' && (
               node.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
          
          {node.type === 'folder' ? (
             <Folder className={cn("w-4 h-4", node.isOpen ? "text-[#cccccc]" : "text-[#cccccc]")} />
          ) : getFileIcon(node.name, node.type, undefined, node.language)}
          
          <span className={cn("truncate ml-1", selectedFileId === node.id ? "text-white" : "text-[#cccccc]")}>
            {node.name}
          </span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
          >
            {renderTree(node.children, depth + 1)}
          </motion.div>
        )}
      </div>
    ));
  };

  if (files.length === 0) {
    return (
      <div className="h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] items-center justify-center text-[#858585] text-xs p-4 text-center">
        <p>No folder opened</p>
        <button 
          onClick={onUpload}
          className="mt-4 px-3 py-1.5 bg-[#007acc] text-white rounded hover:bg-[#0062a3] transition-colors"
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b]">
      <div className="p-3 text-xs font-bold text-[#bbbbbb] uppercase tracking-wider flex items-center justify-between">
        <span>Explorer</span>
        <div className="flex gap-2">
           <Plus className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={onCreateNode} title="New File" />
           <Upload className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={onUpload} title="Open Folder" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderTree(files)}
      </div>
    </div>
  );
};
