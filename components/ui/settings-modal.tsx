import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Zap, Settings, Palette, Moon, Sun, Monitor, Globe, Smile, AlignLeft, Sparkles, Type, MessageSquare, CornerDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { t } from '../../lib/translations';

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
  fontSize: 'small' | 'base' | 'large';
  setFontSize: (value: 'small' | 'base' | 'large') => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  sendWithEnter: boolean;
  setSendWithEnter: (value: boolean) => void;
  messageStyle: 'modern' | 'classic';
  setMessageStyle: (value: 'modern' | 'classic') => void;
  aiName: string;
  setAiName: (value: string) => void;
  aiMemory: string;
  setAiMemory: (value: string) => void;
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (value: 'sans' | 'serif' | 'mono') => void;
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
  fontSize,
  setFontSize,
  isDark,
  setIsDark,
  sendWithEnter,
  setSendWithEnter,
  messageStyle,
  setMessageStyle,
  aiName,
  setAiName,
  aiMemory,
  setAiMemory,
  fontFamily,
  setFontFamily
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'advanced'>('general');

  const tabs = [
    { id: 'general', label: t(language, 'general'), icon: Settings },
    { id: 'appearance', label: t(language, 'appearance'), icon: Palette },
    { id: 'advanced', label: t(language, 'advanced'), icon: Zap },
  ] as const;

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Italian', 'Portuguese', 'Russian'];
  
  const moodOptions = [
    { id: 'Neutral', label: 'Neutral', desc: 'Balanced and objective', icon: AlignLeft },
    { id: 'Professional', label: 'Professional', desc: 'Formal and concise', icon: Monitor },
    { id: 'Creative', label: 'Creative', desc: 'Imaginative and expressive', icon: Sparkles },
    { id: 'Friendly', label: 'Friendly', desc: 'Warm and approachable', icon: Smile },
    { id: 'Pirate', label: 'Pirate', desc: 'Arrr matey!', icon: Zap },
    { id: 'Sarcastic', label: 'Sarcastic', desc: 'Witty and dry', icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            className="fixed left-1/2 top-1/2 w-full max-w-4xl h-[600px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl z-[101] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[var(--bg-app)]/30 border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
              <div className="hidden md:flex items-center gap-2 px-3 py-4 mb-4">
                <Settings className="w-5 h-5 text-[var(--text-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t(language, 'settings')}</h2>
              </div>
              
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[var(--bg-card)]">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-md hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-2xl">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-8 capitalize">{t(language, activeTab)}</h3>

                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* AI Identity */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Smile className="w-4 h-4 text-[var(--text-secondary)]" />
                        AI Identity
                      </label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Name</label>
                          <input
                            type="text"
                            value={aiName}
                            onChange={(e) => setAiName(e.target.value)}
                            placeholder="e.g. Gemini, Assistant, Jarvis"
                            className="w-full max-w-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Memory / Custom Instructions</label>
                          <textarea
                            value={aiMemory}
                            onChange={(e) => setAiMemory(e.target.value)}
                            placeholder="What would you like the AI to remember about you or how it should behave?"
                            rows={3}
                            className="w-full p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-shadow resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* AI Mood */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                        AI Personality
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {moodOptions.map((mood) => {
                          const Icon = mood.icon;
                          const isActive = aiMood === mood.id;
                          return (
                            <button
                              key={mood.id}
                              onClick={() => setAiMood(mood.id)}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                isActive 
                                  ? "bg-[var(--bg-card)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)] shadow-sm" 
                                  : "bg-[var(--bg-input)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                              )}
                            >
                              <div className={cn(
                                "p-2 rounded-lg",
                                isActive ? "bg-[var(--text-primary)] text-[var(--bg-card)]" : "bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className={cn("text-sm font-medium", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]")}>
                                  {mood.label}
                                </div>
                                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                  {mood.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Language */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'aiLanguage')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full max-w-xs p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-shadow"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>{t(language, lang)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Theme */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'theme')}
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsDark(false)}
                          className={cn(
                            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium",
                            !isDark
                              ? "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                              : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <Sun className="w-4 h-4" />
                          {t(language, 'light')}
                        </button>
                        <button
                          onClick={() => setIsDark(true)}
                          className={cn(
                            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium",
                            isDark
                              ? "bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]"
                              : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <Moon className="w-4 h-4" />
                          {t(language, 'dark')}
                        </button>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Font Family */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Type className="w-4 h-4 text-[var(--text-secondary)]" />
                        Font Family
                      </label>
                      <div className="flex bg-[var(--bg-input)] rounded-lg p-1 w-fit border border-[var(--border-color)]">
                        {(['sans', 'serif', 'mono'] as const).map((font) => (
                          <button
                            key={font}
                            onClick={() => setFontFamily(font)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                              fontFamily === font
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                            )}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Font Size */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Type className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'fontSize')}
                      </label>
                      <div className="flex bg-[var(--bg-input)] rounded-lg p-1 w-fit border border-[var(--border-color)]">
                        {(['small', 'base', 'large'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                              fontSize === size
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                            )}
                          >
                            {t(language, size)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Message Style */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                        Message Bubble Style
                      </label>
                      <div className="flex bg-[var(--bg-input)] rounded-lg p-1 w-fit border border-[var(--border-color)]">
                        {(['modern', 'classic'] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => setMessageStyle(style)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                              messageStyle === style
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                            )}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Response Length */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'responseLength')}
                      </label>
                      <div className="flex bg-[var(--bg-input)] rounded-lg p-1 w-fit border border-[var(--border-color)]">
                        {(['short', 'medium', 'long'] as const).map((length) => (
                          <button
                            key={length}
                            onClick={() => setResponseLength(length)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                              responseLength === length
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                            )}
                          >
                            {t(language, length)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Creativity Level */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'creativityLevel')}
                      </label>
                      <div className="flex bg-[var(--bg-input)] rounded-lg p-1 w-fit border border-[var(--border-color)]">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setCreativityLevel(level)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                              creativityLevel === level
                                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                            )}
                          >
                            {t(language, level)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Send with Enter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <CornerDownLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                        Send Message Behavior
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">Send with Enter</div>
                          <div className="text-xs text-[var(--text-muted)]">Press Enter to send, Shift+Enter for new line</div>
                        </div>
                        <button
                          onClick={() => setSendWithEnter(!sendWithEnter)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]",
                            sendWithEnter ? "bg-[var(--accent-color)]" : "bg-[var(--text-muted)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              sendWithEnter ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Data Management */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                        Data Management
                      </label>
                      <button
                        onClick={() => {
                          const history = localStorage.getItem('chatHistory') || '[]';
                          const blob = new Blob([history], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg transition-colors text-sm font-medium w-fit"
                      >
                        Export Chat History
                      </button>
                      <p className="text-xs text-[var(--text-muted)]">Download all your chat history as a JSON file.</p>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Danger Zone */}
                    <div className="space-y-3 pt-4">
                      <label className="text-sm font-medium text-red-500 flex items-center gap-2">
                        {t(language, 'dangerZone')}
                      </label>
                      <button
                        onClick={onClearHistory}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors text-sm font-medium w-fit"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t(language, 'clearAllHistory')}
                      </button>
                      <p className="text-xs text-[var(--text-muted)]">This action cannot be undone. All your chat history will be permanently deleted.</p>
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
