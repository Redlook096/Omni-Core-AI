import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Type, Zap, MessageSquare, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  systemInstruction: string;
  setSystemInstruction: (value: string) => void;
  typingSpeed: 'slow' | 'normal' | 'fast';
  setTypingSpeed: (value: 'slow' | 'normal' | 'fast') => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (value: 'small' | 'medium' | 'large') => void;
}

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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
              </div>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* System Instruction */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  System Instructions
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="How should the AI behave? (e.g., 'Be concise', 'Act like a pirate')"
                  className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-secondary)] resize-none"
                />
              </div>

              {/* Typing Speed */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Typing Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setTypingSpeed(speed)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors border",
                        typingSpeed === speed
                          ? "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                          : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors border",
                        fontSize === size
                          ? "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                          : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--border-color)] my-4" />

              {/* Danger Zone */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-red-400 flex items-center gap-2">
                  Danger Zone
                </label>
                <button
                  onClick={onClearHistory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
