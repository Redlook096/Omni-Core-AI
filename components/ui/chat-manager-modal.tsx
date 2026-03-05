import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, CheckSquare, Square, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

interface ChatManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatSession[];
  setHistory: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setHasStarted: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ChatManagerModal({
  isOpen,
  onClose,
  history,
  setHistory,
  currentSessionId,
  setCurrentSessionId,
  setMessages,
  setHasStarted
}: ChatManagerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(s => s.id)));
    }
  };

  const handleExport = () => {
    if (selectedIds.size === 0) return;
    
    const chatsToExport = history.filter(s => selectedIds.has(s.id));
    
    // Complex format: JSON stringified inside a text file with a custom header
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      chats: chatsToExport
    };
    
    const blob = new Blob([`---OMNI-CORE-AI-EXPORT---\n${JSON.stringify(exportData, null, 2)}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni-chats-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSelectedIds(new Set());
    onClose();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        if (!text.startsWith('---OMNI-CORE-AI-EXPORT---\n')) {
          alert("Invalid file format. Please use a file exported from this app.");
          return;
        }
        
        const jsonStr = text.replace('---OMNI-CORE-AI-EXPORT---\n', '');
        const data = JSON.parse(jsonStr);
        
        if (data.chats && Array.isArray(data.chats)) {
          const importedChats: ChatSession[] = data.chats.map((c: { id: string, title: string, date: string, messages: Message[] }) => ({
            ...c,
            // Ensure unique IDs to avoid collisions
            id: `imported-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            date: new Date(c.date)
          }));
          
          setHistory(prev => [...importedChats, ...prev]);
          alert(`Successfully imported ${importedChats.length} chats.`);
          onClose();
        } else {
          alert("Could not parse chat format.");
        }
      } catch (error) {
        console.error("Error importing chat:", error);
        alert("Failed to import chat.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} chats?`)) {
      setHistory(prev => prev.filter(s => !selectedIds.has(s.id)));
      
      // If current session is deleted, reset view
      if (currentSessionId && selectedIds.has(currentSessionId)) {
        setCurrentSessionId(null);
        setMessages([]);
        setHasStarted(false);
      }
      
      setSelectedIds(new Set());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manage Chats</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-app)]/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {selectedIds.size === history.length && history.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All
              </button>
              <span className="text-sm text-[var(--text-muted)]">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".txt" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-sm font-medium text-[var(--text-primary)]"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-color)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-red-500"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
            {history.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                No chat history available.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => toggleSelection(session.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                      selectedIds.has(session.id) ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]/50"
                    )}
                  >
                    {selectedIds.has(session.id) ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {session.title}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(session.date).toLocaleDateString('en-GB')} • {session.messages.length} messages
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
