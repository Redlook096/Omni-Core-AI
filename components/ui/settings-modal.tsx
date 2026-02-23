import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Trash2, Shield, Monitor, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
  systemInstruction?: string;
  setSystemInstruction?: (value: string) => void;
  typingSpeed?: 'slow' | 'normal' | 'fast';
  setTypingSpeed?: (value: 'slow' | 'normal' | 'fast') => void;
  fontSize?: 'small' | 'medium' | 'large';
  setFontSize?: (value: 'small' | 'medium' | 'large') => void;
}

type Tab = 'general' | 'appearance' | 'data';

export function SettingsModal({ 
  isOpen, 
  onClose, 
  onClearHistory,
  systemInstruction,
  setSystemInstruction,
  typingSpeed,
  setTypingSpeed,
  fontSize,
  setFontSize
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const tabs = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'data', label: 'Data Controls', icon: Shield },
  ];

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to delete all chat history?')) {
      onClearHistory?.();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#171717] border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#1a1a1a] border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col">
              <div className="text-lg font-medium text-white mb-6 px-2">Settings</div>
              <div className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-white/10 text-white"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-lg font-medium text-white capitalize">{activeTab}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-white mb-2">System Instruction</div>
                        <div className="text-xs text-neutral-400 mb-3">Customize how the AI behaves and responds.</div>
                        <textarea 
                          value={systemInstruction}
                          onChange={(e) => setSystemInstruction?.(e.target.value)}
                          placeholder="e.g., You are a helpful coding assistant who prefers concise answers..."
                          className="w-full h-32 bg-[#262626] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/20 outline-none resize-none"
                        />
                      </div>
                      
                      <div className="h-[1px] bg-white/5" />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">Typing Speed</div>
                          <div className="text-xs text-neutral-400">Adjust how fast the AI types</div>
                        </div>
                        <div className="flex bg-[#262626] rounded-lg p-1 border border-white/10">
                          {(['slow', 'normal', 'fast'] as const).map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setTypingSpeed?.(speed)}
                              className={cn(
                                "px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors",
                                typingSpeed === speed ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                              )}
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-white mb-4">Font Size</div>
                      <div className="flex bg-[#262626] rounded-lg p-1 border border-white/10 w-fit">
                        {(['small', 'medium', 'large'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize?.(size)}
                            className={cn(
                              "px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors",
                              fontSize === size ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-white/5" />

                    <div>
                      <div className="text-sm font-medium text-white mb-4">Theme</div>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => setTheme('system')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                            theme === 'system'
                              ? "bg-white/10 border-emerald-500/50"
                              : "bg-[#262626] border-transparent hover:bg-[#333]"
                          )}
                        >
                          <Monitor className="w-6 h-6 text-neutral-400" />
                          <span className="text-xs text-neutral-300">System</span>
                        </button>
                        <button
                          onClick={() => setTheme('light')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                            theme === 'light'
                              ? "bg-white/10 border-emerald-500/50"
                              : "bg-[#262626] border-transparent hover:bg-[#333]"
                          )}
                        >
                          <Sun className="w-6 h-6 text-neutral-400" />
                          <span className="text-xs text-neutral-300">Light</span>
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                            theme === 'dark'
                              ? "bg-white/10 border-emerald-500/50"
                              : "bg-[#262626] border-transparent hover:bg-[#333]"
                          )}
                        >
                          <Moon className="w-6 h-6 text-neutral-400" />
                          <span className="text-xs text-neutral-300">Dark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Clear all chats</div>
                          <div className="text-xs text-neutral-400 mt-1">Delete all chat history from this device. This action cannot be undone.</div>
                        </div>
                      </div>
                      <button 
                        onClick={handleClearHistory}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Delete All History
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
