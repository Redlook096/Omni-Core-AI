import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Zap, Settings, Palette, Moon, Sun, Monitor, Paintbrush, Globe, Smile, AlignLeft, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  language: string;
  setLanguage: (value: string) => void;
  aiMood: string;
  setAiMood: (value: string) => void;
  responseLength: 'short' | 'medium' | 'long';
  setResponseLength: (value: 'short' | 'medium' | 'long') => void;
  creativityLevel: 'low' | 'medium' | 'high';
  setCreativityLevel: (value: 'low' | 'medium' | 'high') => void;
  accentColor: 'blue' | 'purple' | 'green' | 'orange';
  setAccentColor: (value: 'blue' | 'purple' | 'green' | 'orange') => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onClearHistory,
  language,
  setLanguage,
  aiMood,
  setAiMood,
  responseLength,
  setResponseLength,
  creativityLevel,
  setCreativityLevel,
  accentColor,
  setAccentColor,
  isDark,
  setIsDark
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'advanced'>('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Zap },
  ] as const;

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Portuguese', 'Russian'];
  const moods = ['Neutral', 'Professional', 'Creative', 'Concise', 'Friendly', 'Pirate', 'Sarcastic'];

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
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            className="fixed left-1/2 top-1/2 w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl z-[101] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[var(--bg-app)]/50 border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
              <div className="hidden md:flex items-center gap-2 px-2 py-4 mb-2">
                <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Settings</h2>
              </div>
              
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                      activeTab === tab.id
                        ? "bg-[var(--accent-color)] text-white shadow-md"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-hover)] p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-xl">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8 capitalize">{activeTab}</h3>

                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Language */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        AI Language
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                              language === lang
                                ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Mood */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Smile className="w-4 h-4" />
                        AI Personality / Mood
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {moods.map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setAiMood(mood)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                              aiMood === mood
                                ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">Changes the tone and style of the AI's responses.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Theme */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Theme
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setIsDark(false)}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            !isDark
                              ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                              : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <Sun className="w-4 h-4" />
                          Light
                        </button>
                        <button
                          onClick={() => setIsDark(true)}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                            isDark
                              ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                              : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <Moon className="w-4 h-4" />
                          Dark
                        </button>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Paintbrush className="w-4 h-4" />
                        Accent Color
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {(['blue', 'purple', 'green', 'orange'] as const).map((color) => {
                          const colorMap = {
                            blue: 'bg-blue-500',
                            purple: 'bg-purple-500',
                            green: 'bg-emerald-500',
                            orange: 'bg-orange-500'
                          };
                          return (
                            <button
                              key={color}
                              onClick={() => setAccentColor(color)}
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2",
                                accentColor === color
                                  ? "border-[var(--text-primary)] scale-110 shadow-md"
                                  : "border-transparent hover:scale-105",
                                colorMap[color]
                              )}
                            >
                              {accentColor === color && <div className="w-2 h-2 bg-white rounded-full" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Response Length */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" />
                        Response Length
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['short', 'medium', 'long'] as const).map((length) => (
                          <button
                            key={length}
                            onClick={() => setResponseLength(length)}
                            className={cn(
                              "px-3 py-3 rounded-xl text-sm font-medium capitalize transition-all border",
                              responseLength === length
                                ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            {length}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Creativity Level */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Creativity Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setCreativityLevel(level)}
                            className={cn(
                              "px-3 py-3 rounded-xl text-sm font-medium capitalize transition-all border",
                              creativityLevel === level
                                ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-sm"
                                : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-[var(--border-color)] my-6" />

                    {/* Danger Zone */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-red-400 flex items-center gap-2">
                        Danger Zone
                      </label>
                      <button
                        onClick={onClearHistory}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All History
                      </button>
                      <p className="text-xs text-[var(--text-muted)] text-center">This action cannot be undone. All your chat history will be permanently deleted.</p>
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
