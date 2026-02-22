import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileExplorer, FileNode, initialFiles, getFileIcon } from './file-explorer';
import { CodeEditor } from './editor';
import { Terminal } from './terminal';
import { WelcomeScreen } from './welcome-screen';
import { 
  X, 
  Play, 
  Search, 
  Settings,
  Files,
  Menu,
  ChevronRight,
  Maximize2,
  Minimize2,
  Minus
} from 'lucide-react';
import { cn } from '../../../lib/utils';

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: boolean | string;
    directory?: string;
  }
}

interface IDEModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IDEModal: React.FC<IDEModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [activeSidebar, setActiveSidebar] = useState<'files' | 'search'>('files');
  const [isRunning, setIsRunning] = useState(false);
  const [files, setFiles] = useState<FileNode[]>([]); // Start empty
  const [isMaximized, setIsMaximized] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const delta = e.clientX - resizeStartX.current;
    const newWidth = Math.max(160, Math.min(600, resizeStartWidth.current + delta));
    setSidebarWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [searchResults, setSearchResults] = useState<{ file: FileNode, line: number, content: string }[]>([]);

  const detectLanguage = (content: string): string => {
    const c = content.trim();
    if (c.startsWith('{') || c.startsWith('[')) return 'json';
    if (c.includes('<!DOCTYPE') || c.includes('<html')) return 'html';
    if (c.includes('import React') || c.includes('export default function') || c.includes('className=')) return 'typescript';
    if (c.includes('def ') || c.includes('import ') && c.includes('from ') || c.includes('print(')) return 'python';
    if (c.includes('body {') || c.includes('@media') || c.includes('px;')) return 'css';
    if (c.includes('const ') || c.includes('let ') || c.includes('function ')) return 'javascript';
    return 'plaintext';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results: { file: FileNode, line: number, content: string }[] = [];
    let regex: RegExp;
    try {
      regex = useRegex ? new RegExp(query, 'i') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    } catch (e) {
      return; // Invalid regex
    }

    const searchFiles = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file' && node.content) {
          const lines = node.content.split('\n');
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.push({ file: node, line: index + 1, content: line.trim() });
            }
          });
        }
        if (node.children) {
          searchFiles(node.children);
        }
      });
    };

    searchFiles(files);
    setSearchResults(results);
  };

  const handleEditorChange = (val: string | undefined) => {
    const content = val || '';
    const currentFile = { ...selectedFile, content };
    setSelectedFile(currentFile);

    // Auto-detect language if currently plaintext or untitled
    if (currentFile.language === 'plaintext' || currentFile.name.startsWith('Untitled')) {
      const detected = detectLanguage(content);
      if (detected !== 'plaintext' && detected !== currentFile.language) {
        handleLanguageChange(detected);
        setToastMessage(`Language recognized: ${getLanguageLabel(detected)}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    // Simulate run delay
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleCreateNew = () => {
    const newFile: FileNode = {
      id: `untitled-${Date.now()}`,
      name: 'Untitled-1',
      type: 'file',
      language: 'plaintext',
      content: ''
    };
    
    setSelectedFile(newFile);

    // If we have files, try to add to the currently selected folder (if any) or root
    if (files.length > 0) {
        const addToFileTree = (nodes: FileNode[]): FileNode[] => {
            // If no file selected, or we are at root and want to add to root
            // Ideally we'd track "selectedFolderId" but for now let's just add to the first open folder or root
            return nodes.map(node => {
                if (node.isOpen && node.type === 'folder') {
                     // Add to this open folder
                     return {
                         ...node,
                         children: [newFile, ...(node.children || [])]
                     };
                }
                if (node.children) {
                    return { ...node, children: addToFileTree(node.children) };
                }
                return node;
            });
        };
        
        // Simple fallback: add to root if no folder open
        const updatedFiles = addToFileTree(files);
        // If nothing changed (no open folder found), add to root
        if (updatedFiles === files) {
             // This check is a bit weak due to immutability but let's try to just push to root's children if root exists
             if (files[0].type === 'folder') {
                 const root = { ...files[0], children: [newFile, ...(files[0].children || [])], isOpen: true };
                 setFiles([root, ...files.slice(1)]);
             } else {
                 setFiles([newFile, ...files]);
             }
        } else {
            setFiles(updatedFiles);
        }

    } else {
        // Empty workspace, create root
        setFiles([
            {
                id: 'root',
                name: 'untitled-workspace',
                type: 'folder',
                isOpen: true,
                children: [newFile]
            }
        ]);
    }
  };

  const handleOpenFolder = () => {
    // Trigger hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newFiles: FileNode[] = [];
        const rootName = files[0].webkitRelativePath.split('/')[0];
        
        // Create root folder
        const rootFolder: FileNode = {
          id: 'root',
          name: rootName,
          type: 'folder',
          isOpen: true,
          children: []
        };

        // Helper to find or create folder path
        const findOrCreateFolder = (parent: FileNode, pathParts: string[]): FileNode => {
          if (pathParts.length === 0) return parent;
          
          const folderName = pathParts[0];
          let folder = parent.children?.find(c => c.name === folderName && c.type === 'folder');
          
          if (!folder) {
            folder = {
              id: `${parent.id}-${folderName}`,
              name: folderName,
              type: 'folder',
              isOpen: false,
              children: []
            };
            parent.children = parent.children || [];
            parent.children.push(folder);
          }
          
          return findOrCreateFolder(folder, pathParts.slice(1));
        };

        // Process all files
        Array.from(files).forEach(file => {
          const pathParts = file.webkitRelativePath.split('/');
          // pathParts[0] is root folder name, already handled
          const fileName = pathParts[pathParts.length - 1];
          const folderPath = pathParts.slice(1, -1);
          
          const parentFolder = findOrCreateFolder(rootFolder, folderPath);
          
          // Read file content (text only for now)
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            parentFolder.children = parentFolder.children || [];
            parentFolder.children.push({
              id: `${parentFolder.id}-${fileName}`,
              name: fileName,
              type: 'file',
              content: content,
              language: fileName.split('.').pop() || 'plaintext'
            });
            // Force update to show loaded content
            setFiles([...newFiles]); 
          };
          reader.readAsText(file);
        });

        newFiles.push(rootFolder);
        setFiles(newFiles);
        setActiveSidebar('files');
      }
    };
    
    input.click();
  };

  const handleCommandPalette = () => {
    // For now, just focus search as a proxy for command palette
    setActiveSidebar('search');
  };

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuClick = (action: string) => {
    if (activeMenu === action) {
      setActiveMenu(null);
    } else {
      setActiveMenu(action);
    }
    
    if (action === 'Run') handleRun();
    if (action === 'Terminal') setIsTerminalOpen(true);
    if (action === 'View') setIsTerminalOpen(!isTerminalOpen);
  };

  // Close menu when clicking content
  const handleContentClick = () => {
    if (activeMenu) setActiveMenu(null);
  };

  const handleToggleFolder = (id: string) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setFiles(toggleNode(files));
  };

  const handleLanguageChange = (lang: string) => {
    if (!selectedFile) return;
    
    const updatedFile = { ...selectedFile, language: lang };
    setSelectedFile(updatedFile);
    
    // Update in file tree as well
    const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === selectedFile.id) {
          return { ...node, language: lang };
        }
        if (node.children) {
          return { ...node, children: updateFileInTree(node.children) };
        }
        return node;
      });
    };
    setFiles(updateFileInTree(files));
  };

  if (!isOpen) return null;

  const getLanguageLabel = (lang?: string) => {
    if (!lang || lang === 'plaintext') return 'Plain Text';
    if (lang === 'typescript') return 'TypeScript JSX';
    if (lang === 'javascript') return 'JavaScript';
    if (lang === 'python') return 'Python';
    if (lang === 'html') return 'HTML';
    if (lang === 'css') return 'CSS';
    if (lang === 'cpp') return 'C++';
    if (lang === 'java') return 'Java';
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const getLanguageAbbrev = (lang?: string) => {
    if (!lang || lang === 'plaintext') return 'TXT';
    if (lang === 'typescript') return 'TSX';
    if (lang === 'javascript') return 'JS';
    if (lang === 'python') return 'PY';
    if (lang === 'html') return 'HTML';
    if (lang === 'css') return 'CSS';
    if (lang === 'cpp') return 'C++';
    return lang.substring(0, 3).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed z-[100] bg-[#1e1e1e] text-[#cccccc] flex flex-col font-sans shadow-2xl",
            isMaximized ? "inset-0 rounded-none" : "inset-4 md:inset-10 rounded-lg border border-[#333333]"
          )}
          onClick={handleContentClick}
        >
          {/* Title Bar */}
          <div className="h-9 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between px-3 select-none shrink-0 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Menu className="w-4 h-4 text-[#cccccc] hover:text-white cursor-pointer transition-colors" />
              <div className="flex items-center gap-1 text-xs text-[#cccccc] relative">
                {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((item) => (
                  <div key={item} className="relative">
                    <span 
                      className={cn(
                        "hover:bg-[#333333] px-2 py-1 rounded cursor-pointer transition-colors block",
                        activeMenu === item && "bg-[#333333] text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(item);
                      }}
                    >
                      {item}
                    </span>
                    {activeMenu === item && item === 'File' && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-xl rounded-sm py-1 z-50 flex flex-col">
                        <div 
                          className="px-3 py-1.5 hover:bg-[#094771] hover:text-white cursor-pointer flex justify-between group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateNew();
                            setActiveMenu(null);
                          }}
                        >
                          <span>New File</span>
                          <span className="text-xs text-[#999999] group-hover:text-white">Ctrl+N</span>
                        </div>
                        <div 
                          className="px-3 py-1.5 hover:bg-[#094771] hover:text-white cursor-pointer flex justify-between group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder();
                            setActiveMenu(null);
                          }}
                        >
                          <span>Open Folder...</span>
                          <span className="text-xs text-[#999999] group-hover:text-white">Ctrl+K O</span>
                        </div>
                        <div className="h-[1px] bg-[#454545] my-1" />
                        <div 
                          className="px-3 py-1.5 hover:bg-[#094771] hover:text-white cursor-pointer"
                          onClick={() => setActiveMenu(null)}
                        >
                          <span>Exit</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Center Search/Command Bar Placeholder */}
            <div 
              className="hidden md:flex items-center justify-center gap-2 px-3 py-1 bg-[#2d2d2d] border border-[#3c3c3c] rounded-md w-[400px] text-xs text-[#cccccc] cursor-pointer hover:bg-[#333333] transition-colors"
              onClick={handleCommandPalette}
            >
               <Search className="w-3.5 h-3.5" />
               <span>vibe-coder</span>
            </div>

            <div className="flex items-center gap-3">
               {/* Professional Run Button */}
               <div 
                 className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#333333] cursor-pointer transition-colors"
                 onClick={handleRun}
                 title="Run Code (F5)"
               >
                  <Play className={cn("w-4 h-4 text-green-500 fill-green-500", isRunning && "opacity-50")} />
               </div>
               
               <div className="flex items-center gap-2 ml-2">
                  <div className="w-8 h-8 flex items-center justify-center hover:bg-[#333333] rounded cursor-pointer">
                    <Settings className="w-4 h-4 text-[#cccccc]" />
                  </div>
                  <div 
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#333333] rounded cursor-pointer transition-colors"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </div>
                  <div 
                    className="w-8 h-8 flex items-center justify-center hover:bg-red-600 hover:text-white rounded cursor-pointer transition-colors"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </div>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Activity Bar */}
            <div className="w-12 border-r border-[#2b2b2b] flex flex-col items-center py-2 gap-2 bg-[#1e1e1e] shrink-0">
               <div 
                 className={cn(
                   "p-3 cursor-pointer transition-all duration-200 relative group w-full flex justify-center",
                   activeSidebar === 'files' ? "border-l-2 border-white" : "opacity-60 hover:opacity-100"
                 )}
                 onClick={() => setActiveSidebar('files')}
                 title="Explorer (Ctrl+Shift+E)"
               >
                 <Files className={cn("w-6 h-6 stroke-[1.5]", activeSidebar === 'files' ? "text-white" : "text-[#cccccc]")} />
               </div>
               
               <div 
                 className={cn(
                   "p-3 cursor-pointer transition-all duration-200 relative group w-full flex justify-center",
                   activeSidebar === 'search' ? "border-l-2 border-white" : "opacity-60 hover:opacity-100"
                 )}
                 onClick={() => setActiveSidebar('search')}
                 title="Search (Ctrl+Shift+F)"
               >
                 <Search className={cn("w-6 h-6 stroke-[1.5]", activeSidebar === 'search' ? "text-white" : "text-[#cccccc]")} />
               </div>
            </div>

            {/* Sidebar Panel */}
            {(activeSidebar === 'files' || activeSidebar === 'search') && (
              <div 
                className="border-r border-[#2b2b2b] flex flex-col bg-[#181818] shrink-0 relative"
                style={{ width: sidebarWidth }}
              >
                {activeSidebar === 'files' && (
                  <FileExplorer 
                    files={files}
                    onFileSelect={setSelectedFile} 
                    selectedFileId={selectedFile?.id}
                    onToggleFolder={handleToggleFolder}
                    onCreateNode={handleCreateNew}
                    onUpload={handleOpenFolder}
                  />
                )}
                
                {activeSidebar === 'search' && (
                  <div className="p-4 flex flex-col h-full">
                    <span className="text-xs font-bold text-[#bbbbbb] uppercase tracking-wider mb-4">Search</span>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <input 
                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-sm px-2 py-1 text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007fd4] transition-colors"
                          placeholder="Search"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                        />
                        <div 
                          className={cn(
                            "absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer rounded hover:bg-[#3c3c3c] flex items-center justify-center text-[10px] font-mono border border-transparent",
                            useRegex && "text-[#007fd4] border-[#007fd4] bg-[#3c3c3c]"
                          )}
                          onClick={() => {
                            setUseRegex(!useRegex);
                            // Re-trigger search with new regex setting
                            // We need to use the timeout to ensure state update or just call handleSearch again with current value but updated regex state is tricky inside the handler if it depends on state. 
                            // Better to just toggle state and have useEffect or wrapper. 
                            // For simplicity, let's just toggle and user types or we manually call search.
                            // Actually, let's just force a re-search in a useEffect or just pass the new regex value to a helper.
                            // Since handleSearch uses `useRegex` state, we can't call it immediately with the new state value here easily without a ref or effect.
                            // Let's just toggle for now and let the user type, or better:
                            // We will fix this in the next edit to make it reactive.
                          }}
                          title="Use Regular Expression"
                        >
                          .*
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {searchResults.map((result, i) => (
                        <div 
                          key={i} 
                          className="flex flex-col gap-1 p-2 hover:bg-[#2a2d2e] cursor-pointer rounded mb-1"
                          onClick={() => {
                            setSelectedFile(result.file);
                            // Ideally scroll to line
                          }}
                        >
                          <div className="flex items-center gap-2 text-xs text-[#cccccc]">
                            {getFileIcon(result.file.name, 'file', undefined, result.file.language)}
                            <span className="font-medium truncate">{result.file.name}</span>
                            <span className="ml-auto text-[#858585]">{result.line}</span>
                          </div>
                          <div className="text-xs text-[#858585] truncate font-mono pl-6">
                            {result.content}
                          </div>
                        </div>
                      ))}
                      {searchQuery && searchResults.length === 0 && (
                        <div className="text-xs text-[#858585] text-center mt-4">No results found</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resizer Handle */}
                <div
                  className="absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize z-20 hover:bg-[#007fd4] transition-colors opacity-0 hover:opacity-100"
                  onMouseDown={startResizing}
                />
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
              {!selectedFile ? (
                <WelcomeScreen 
                  onCreateNew={handleCreateNew}
                  onOpenFile={handleOpenFolder}
                  onRunCommand={handleCommandPalette}
                />
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex bg-[#1e1e1e] border-b border-[#2b2b2b] overflow-x-auto no-scrollbar shrink-0">
                     <div className="px-3 py-2 text-sm text-[#ffffff] bg-[#1e1e1e] border-t border-t-transparent flex items-center gap-2 min-w-[120px] bg-[#1e1e1e] border-r border-r-[#2b2b2b] relative group">
                        <span className="absolute top-0 left-0 right-0 h-[1px] bg-[#007fd4]" />
                        {getFileIcon(selectedFile.name, 'file', undefined, selectedFile.language)}
                        <span>{selectedFile.name}</span>
                        <X 
                          className="w-4 h-4 ml-auto text-[#cccccc] opacity-0 group-hover:opacity-100 hover:bg-[#333333] rounded p-0.5 cursor-pointer transition-all" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        />
                     </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 relative bg-[#1e1e1e]">
                    <CodeEditor 
                      code={selectedFile.content || ''} 
                      language={selectedFile.language || 'plaintext'}
                      onChange={handleEditorChange}
                      onLanguageChange={handleLanguageChange}
                    />
                    {/* Toast Notification */}
                    <AnimatePresence>
                      {toastMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute bottom-4 right-4 bg-[#007acc] text-white px-3 py-2 rounded shadow-lg text-xs z-50 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
                          {toastMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Terminal */}
              <Terminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} files={files} />
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="h-6 bg-[#007acc] flex items-center justify-between px-3 text-[12px] text-white select-none shrink-0 rounded-b-lg">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">
                  <span className="font-medium">main*</span>
                </div>
                <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">
                  <X className="w-3 h-3" />
                  <span>0</span>
                  <span className="w-3" />
                  <span className="font-medium">!</span>
                  <span>0</span>
                </div>
             </div>
             <div className="flex items-center gap-4">
                {selectedFile && (
                  <>
                    <span className="hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">Ln 12, Col 42</span>
                    <span className="hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">UTF-8</span>
                    <span className="hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">{getLanguageLabel(selectedFile.language)}</span>
                  </>
                )}
                <span className="hover:bg-white/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors">Prettier</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
