import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Code2, 
  Sparkles, 
  GraduationCap, 
  Briefcase, 
  Zap, 
  X,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (persona: string) => void;
  currentPersona: string;
}

const PRESETS = [
  {
    id: 'concise',
    title: 'Executive Concise',
    icon: <Zap className="w-5 h-5" />,
    description: 'Direct, no-nonsense answers. Pure efficiency.',
    prompt: "Be extremely concise. Answer directly. No filler words. Use bullet points heavily."
  },
  {
    id: 'developer',
    title: 'Senior Engineer',
    icon: <Code2 className="w-5 h-5" />,
    description: 'Technical, code-focused, best practices.',
    prompt: "You are a Senior Software Engineer. Focus on clean code, best practices, and technical accuracy. Explain the 'why' behind solutions."
  },
  {
    id: 'creative',
    title: 'Creative Partner',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Imaginative, descriptive, and brainstorming-ready.',
    prompt: "You are a creative muse. Use evocative language. Brainstorm multiple angles. Be unconstrained and visionary."
  },
  {
    id: 'academic',
    title: 'Academic Professor',
    icon: <GraduationCap className="w-5 h-5" />,
    description: 'Detailed, educational, and thorough explanations.',
    prompt: "You are a Professor. Explain concepts deeply. Start simple, then add complexity. Use analogies and verify facts."
  },
  {
    id: 'professional',
    title: 'Professional',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Formal, polite, and business-appropriate.',
    prompt: "Maintain a strict professional tone. Be polite, formal, and objective. Suitable for business communications."
  },
  {
    id: 'el5',
    title: 'Explain Like I\'m 5',
    icon: <BrainCircuit className="w-5 h-5" />,
    description: 'Simple language for complex topics.',
    prompt: "Explain complex topics as if the user is 5 years old. Use simple analogies. Avoid jargon."
  }
];

export function PersonaModal({ isOpen, onClose, onApply, currentPersona }: PersonaModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customText, setCustomText] = useState(currentPersona);

  const handleApply = () => {
    onApply(customText);
    onClose();
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setCustomText(preset.prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
          >
            {/* Left Panel - Visual/Presets */}
            <div className="w-full md:w-1/3 bg-[#1a1a1a] border-r border-white/5 p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                  AI Intelligence
                </h2>
                <p className="text-sm text-neutral-400 mt-1">Configure the mind of your assistant.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Presets</label>
                <div className="grid grid-cols-1 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl transition-all text-left group border border-transparent",
                        selectedPreset === preset.id 
                          ? "bg-white/10 border-white/10 shadow-lg" 
                          : "hover:bg-white/5 hover:border-white/5"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg bg-black/20 text-neutral-400 group-hover:text-white transition-colors",
                        selectedPreset === preset.id && "text-white bg-purple-500/20"
                      )}>
                        {preset.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-200 group-hover:text-white">{preset.title}</div>
                        <div className="text-xs text-neutral-500 line-clamp-1">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Customization */}
            <div className="flex-1 p-6 md:p-8 flex flex-col bg-[#121212]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white">System Instructions</h3>
                <button 
                  onClick={onClose}
                  className="p-2 text-neutral-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
                <div className="relative flex-1">
                  <textarea 
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Define exactly how the AI should behave, think, and respond..."
                    className="w-full h-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none font-mono text-sm leading-relaxed"
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-neutral-600 pointer-events-none">
                    Markdown supported
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button 
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApply}
                    className="px-8 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-200 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Apply Configuration
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}