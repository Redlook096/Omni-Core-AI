import React from 'react';
import { FilePlus, FolderOpen, Command, Clock, ArrowRight, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface WelcomeScreenProps {
  onCreateNew?: () => void;
  onOpenFile?: () => void;
  onRunCommand?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateNew, onOpenFile, onRunCommand }) => {
  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col items-center justify-center text-[#cccccc] select-none p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Column: Branding & Actions */}
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                   <Zap className="w-10 h-10 text-blue-500 fill-blue-500/20" />
                   <h1 className="text-4xl font-bold text-white tracking-tight">Vibe Coder</h1>
                </div>
                <p className="text-lg text-[#858585] font-light">Code at the speed of thought.</p>
            </div>

            <div className="space-y-1">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-[#6f6f6f] mb-3">Start</h2>
                
                <button onClick={onCreateNew} className="flex items-center gap-3 text-[#3794ff] hover:text-[#5faaff] transition-colors group w-full text-left py-1.5">
                    <FilePlus className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-[15px] group-hover:underline decoration-[#3794ff]/30 underline-offset-4">New File</span>
                </button>
                
                <button onClick={onOpenFile} className="flex items-center gap-3 text-[#3794ff] hover:text-[#5faaff] transition-colors group w-full text-left py-1.5">
                    <FolderOpen className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-[15px] group-hover:underline decoration-[#3794ff]/30 underline-offset-4">Open Folder...</span>
                </button>
                
                <button onClick={onRunCommand} className="flex items-center gap-3 text-[#3794ff] hover:text-[#5faaff] transition-colors group w-full text-left py-1.5">
                    <Command className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-[15px] group-hover:underline decoration-[#3794ff]/30 underline-offset-4">Run Command...</span>
                </button>
            </div>
        </div>

        {/* Right Column: Recents & Help */}
        <div className="space-y-8">
            <div className="space-y-3">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-[#6f6f6f] mb-2">Recent</h2>
                <div className="group cursor-pointer flex items-center justify-between py-1 hover:bg-[#2a2d2e] -mx-2 px-2 rounded transition-colors" onClick={onOpenFile}>
                    <div className="flex flex-col">
                        <span className="text-[#3794ff] group-hover:text-[#5faaff] text-[15px]">vibe-coder</span>
                        <span className="text-xs text-[#858585]">~/projects/vibe-coder</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#858585] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="group cursor-pointer flex items-center justify-between py-1 hover:bg-[#2a2d2e] -mx-2 px-2 rounded transition-colors">
                    <div className="flex flex-col">
                        <span className="text-[#cccccc] group-hover:text-white text-[15px]">utils.ts</span>
                        <span className="text-xs text-[#858585]">~/projects/vibe-coder/src/lib</span>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-[#333333] grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h3 className="text-[#cccccc] font-medium text-sm">Help</h3>
                    <div className="text-[#858585] hover:text-[#cccccc] cursor-pointer transition-colors text-sm">Documentation</div>
                    <div className="text-[#858585] hover:text-[#cccccc] cursor-pointer transition-colors text-sm">Keyboard Shortcuts</div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-[#cccccc] font-medium text-sm">Customize</h3>
                    <div className="text-[#858585] hover:text-[#cccccc] cursor-pointer transition-colors text-sm">Color Themes</div>
                    <div className="text-[#858585] hover:text-[#cccccc] cursor-pointer transition-colors text-sm">Settings</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
