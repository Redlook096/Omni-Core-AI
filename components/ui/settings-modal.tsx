import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Zap, Settings, Palette, Moon, Sun, Monitor, Globe, Smile, AlignLeft, Sparkles, Type, MessageSquare, CornerDownLeft, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { t } from '../../lib/translations';
import { Slider } from './slider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './dropdown-menu';

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
  aiMemory: string;
  setAiMemory: (value: string) => void;
  fontFamily: 'sans' | 'serif' | 'mono';
  setFontFamily: (value: 'sans' | 'serif' | 'mono') => void;
  developerMode: boolean;
  setDeveloperMode: (value: boolean) => void;
  streamResponses: boolean;
  setStreamResponses: (value: boolean) => void;
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
  aiMemory,
  setAiMemory,
  fontFamily,
  setFontFamily,
  developerMode,
  setDeveloperMode,
  streamResponses,
  setStreamResponses
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'advanced'>('general');

  const [localResponseLength, setLocalResponseLength] = useState(
    responseLength === 'short' ? 0 : responseLength === 'medium' ? 50 : 100
  );
  const [localCreativity, setLocalCreativity] = useState(
    creativityLevel === 'low' ? 0 : creativityLevel === 'medium' ? 50 : 100
  );
  const [localFontSize, setLocalFontSize] = useState(
    fontSize === 'small' ? 0 : fontSize === 'base' ? 50 : 100
  );

  // Sync local state when props change
  React.useEffect(() => {
    setLocalResponseLength(responseLength === 'short' ? 0 : responseLength === 'medium' ? 50 : 100);
  }, [responseLength]);

  React.useEffect(() => {
    setLocalCreativity(creativityLevel === 'low' ? 0 : creativityLevel === 'medium' ? 50 : 100);
  }, [creativityLevel]);

  React.useEffect(() => {
    setLocalFontSize(fontSize === 'small' ? 0 : fontSize === 'base' ? 50 : 100);
  }, [fontSize]);

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

  const handleResetDefaults = () => {
    setLanguage('English');
    setAiMood('Neutral');
    setResponseLength('medium');
    setCreativityLevel('medium');
    setFontSize('base');
    setIsDark(true);
    setSendWithEnter(true);
    setFontFamily('sans');
    setDeveloperMode(false);
    setStreamResponses(true);
  };

  const getPersonalityPreviewText = () => {
    let text = "Here is a preview of how the AI will respond based on your current settings.";
    
    if (aiMood === 'Pirate') {
      text = "Arrr matey! Here be a preview of how yer AI companion will be speakin' to ye, based on the settings ye've chosen.";
    } else if (aiMood === 'Sarcastic') {
      text = "Oh, look. Another preview text. I'm sure you're absolutely thrilled to see how your settings affect this completely generic sentence.";
    } else if (aiMood === 'Professional') {
      text = "This is a demonstration of the AI's response format, reflecting your current configuration parameters.";
    } else if (aiMood === 'Creative') {
      text = "Imagine a world where words dance across the screen... this preview is a glimpse into that vibrant reality, shaped by your choices.";
    } else if (aiMood === 'Friendly') {
      text = "Hi there! This is just a quick preview to show you how your AI buddy will chat with you using these settings. Hope you like it!";
    }

    return text;
  };

  const getFormattingPreviewText = () => {
    let text = "The AI will generate responses with a balanced level of detail and standard phrasing.";
    
    if (creativityLevel === 'low') {
      text = "The AI will generate highly factual, precise, and deterministic responses.";
    } else if (creativityLevel === 'high') {
      text = "The AI will generate highly imaginative, varied, and expressive responses, exploring novel ideas.";
    }

    if (responseLength === 'short') {
      text = text.split(',')[0] + '.';
      if (text.length > 60) text = text.substring(0, 60) + '...';
    } else if (responseLength === 'long') {
      text += " It will elaborate extensively on the topic, providing comprehensive background information, multiple examples, and deeper analysis to ensure you have a complete understanding of the subject matter.";
    }

    return text;
  };

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
              
              <div className="mt-auto hidden md:block pt-4">
                <button
                  onClick={handleResetDefaults}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]/50 hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Reset to Defaults
                </button>
              </div>
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

                <AnimatePresence mode="wait">
                  {activeTab === 'general' && (
                    <motion.div 
                      key="general"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
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

                      {/* Live Preview */}
                      <div className="mt-6 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--text-primary)]" />
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Live Preview</span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                          "{getPersonalityPreviewText()}"
                        </p>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Language */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                        {t(language, 'aiLanguage')}
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-between w-full max-w-xs p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-shadow">
                          {t(language, language)}
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                          {languages.map((lang) => (
                            <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)}>
                              {t(language, lang)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Response Length */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                          <AlignLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                          {t(language, 'responseLength')}
                        </label>
                        <span className="text-xs text-[var(--text-muted)] capitalize">{responseLength}</span>
                      </div>
                      <div className="px-2">
                        <Slider
                          value={[localResponseLength]}
                          onValueChange={(val) => {
                            setLocalResponseLength(val[0]);
                            if (val[0] < 33) setResponseLength('short');
                            else if (val[0] < 66) setResponseLength('medium');
                            else setResponseLength('long');
                          }}
                          max={100}
                          step={1}
                        />
                        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                          <span className={cn(responseLength === 'short' && "text-[var(--text-primary)] font-medium")}>Short</span>
                          <span className={cn(responseLength === 'medium' && "text-[var(--text-primary)] font-medium")}>Medium</span>
                          <span className={cn(responseLength === 'long' && "text-[var(--text-primary)] font-medium")}>Long</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Creativity Level */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                          {t(language, 'creativityLevel')}
                        </label>
                        <span className="text-xs text-[var(--text-muted)] capitalize">{creativityLevel}</span>
                      </div>
                      <div className="px-2">
                        <Slider
                          value={[localCreativity]}
                          onValueChange={(val) => {
                            setLocalCreativity(val[0]);
                            if (val[0] < 33) setCreativityLevel('low');
                            else if (val[0] < 66) setCreativityLevel('medium');
                            else setCreativityLevel('high');
                          }}
                          max={100}
                          step={1}
                        />
                        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                          <span className={cn(creativityLevel === 'low' && "text-[var(--text-primary)] font-medium")}>Precise</span>
                          <span className={cn(creativityLevel === 'medium' && "text-[var(--text-primary)] font-medium")}>Balanced</span>
                          <span className={cn(creativityLevel === 'high' && "text-[var(--text-primary)] font-medium")}>Creative</span>
                        </div>
                      </div>
                    </div>

                    {/* Formatting Live Preview */}
                    <div className="mt-8 p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--text-primary)]" />
                      <div className="flex items-center gap-2 mb-3">
                        <AlignLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Output Formatting Preview</span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                        "{getFormattingPreviewText()}"
                      </p>
                    </div>
                  </motion.div>
                  )}

                  {activeTab === 'appearance' && (
                    <motion.div 
                      key="appearance"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
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
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-between w-full max-w-xs p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] transition-shadow capitalize">
                          {fontFamily}
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                          {(['sans', 'serif', 'mono'] as const).map((font) => (
                            <DropdownMenuItem key={font} onClick={() => setFontFamily(font)} className="capitalize">
                              {font}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Font Size */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                          <Type className="w-4 h-4 text-[var(--text-secondary)]" />
                          {t(language, 'fontSize')}
                        </label>
                        <span className="text-xs text-[var(--text-muted)] capitalize">{fontSize}</span>
                      </div>
                      <div className="px-2">
                        <Slider
                          value={[localFontSize]}
                          onValueChange={(val) => {
                            setLocalFontSize(val[0]);
                            if (val[0] < 33) setFontSize('small');
                            else if (val[0] < 66) setFontSize('base');
                            else setFontSize('large');
                          }}
                          max={100}
                          step={1}
                        />
                        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                          <span className={cn(fontSize === 'small' && "text-[var(--text-primary)] font-medium")}>Small</span>
                          <span className={cn(fontSize === 'base' && "text-[var(--text-primary)] font-medium")}>Base</span>
                          <span className={cn(fontSize === 'large' && "text-[var(--text-primary)] font-medium")}>Large</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  )}

                  {activeTab === 'advanced' && (
                    <motion.div 
                      key="advanced"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      {/* Developer Mode */}
                      <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[var(--text-secondary)]" />
                        Developer Mode
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">Enable Developer Features</div>
                          <div className="text-xs text-[var(--text-muted)]">Show token usage, latency, and raw JSON responses</div>
                        </div>
                        <button
                          onClick={() => setDeveloperMode(!developerMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]",
                            developerMode ? "bg-[var(--accent-color)]" : "bg-[var(--text-muted)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 shrink-0 transform rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-black/10 transition-transform",
                              developerMode ? "bg-[var(--bg-app)] translate-x-6" : "bg-white translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* Stream Responses */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                        Stream Responses
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">Real-time Streaming</div>
                          <div className="text-xs text-[var(--text-muted)]">See the AI's response as it's being generated</div>
                        </div>
                        <button
                          onClick={() => setStreamResponses(!streamResponses)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]",
                            streamResponses ? "bg-[var(--accent-color)]" : "bg-[var(--text-muted)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 shrink-0 transform rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-black/10 transition-transform",
                              streamResponses ? "bg-[var(--bg-app)] translate-x-6" : "bg-white translate-x-1"
                            )}
                          />
                        </button>
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
                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]",
                            sendWithEnter ? "bg-[var(--accent-color)]" : "bg-[var(--text-muted)]"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 shrink-0 transform rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-black/10 transition-transform",
                              sendWithEnter ? "bg-[var(--bg-app)] translate-x-6" : "bg-white translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="h-px w-full bg-[var(--border-color)]" />

                    {/* AI Memory */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                        Custom Instructions
                      </label>
                      <div className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)]">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">AI Memory</div>
                          <div className="text-xs text-[var(--text-muted)]">Add custom instructions or context for the AI to remember across all chats.</div>
                        </div>
                        <textarea
                          value={aiMemory}
                          onChange={(e) => {
                            setAiMemory(e.target.value);
                            localStorage.setItem('aiMemory', e.target.value);
                          }}
                          placeholder="e.g., Always respond in markdown, I am a senior developer, etc."
                          className="w-full h-24 p-2 text-sm bg-transparent border border-[var(--border-color)] rounded-md outline-none focus:ring-1 focus:ring-[var(--accent-color)] resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        />
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
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
