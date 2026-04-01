/**
 * Vibe Coder projects dashboard — ported from [Vibe-Coder-dashbaord](https://github.com/Redlook096/Vibe-Coder-dashbaord)
 * and wired to real Lyra project data.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Code2,
  X,
  HardDrive,
  Calendar,
  ChevronRight,
  ChevronDown,
  LayoutTemplate,
  PanelRightOpen,
  ArrowUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TextShimmer } from './text-shimmer';
import { PromptInputBox } from './prompt-input-box';

export type VibeDashboardTab = 'All' | 'Active' | 'Completed';

export type VibeDashboardProjectVM = {
  id: string;
  name: string;
  updatedAt: Date;
  tech: string;
  status: 'active' | 'completed';
  size: string;
  modules: number;
  progress?: number;
  /** Current checklist task name when status is active */
  currentTask?: string;
};

type RenameModalConfig = {
  isOpen: boolean;
  projectId?: string;
  initialName?: string;
};

const snappyEase = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: snappyEase },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: snappyEase },
  },
};

/** Matches iOS-style 36px composer control height */
const TOGGLE_PX = 36;
/** Same spring for expand + collapse so motion reverses cleanly. */
const composerBarSpring = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.82 };

const agentToggleBtnClass =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-[var(--vibe-bg)] text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/18 hover:bg-[var(--vibe-bg-elevated)] hover:text-white';

/**
 * Expandable message — toggle **left** (search / close share one slot). Field grows **left → right**; `pl-2 pr-2` + 32×32 send rail for even end-cap alignment.
 */
function AgentNetworkExpandableMessage({
  onSend,
  disabled,
  placeholder = 'Message…',
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  /** Stays true until exit animation finishes so the row width does not snap to 36px and clip the collapse. */
  const [layoutExpanded, setLayoutExpanded] = useState(false);
  const [value, setValue] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setLayoutExpanded(true);
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node) && open && value === '') {
        setOpen(false);
        setValue('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, value]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
    setValue('');
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setValue('');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue('');
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative flex min-w-0 items-center',
        layoutExpanded
          ? 'ml-auto min-h-9 min-w-0 flex-1 max-w-[min(100%,300px)]'
          : 'h-9 w-9 shrink-0',
      )}
    >
      {/* Open / close — same geometry as collapsed control (premium desktop: one stable hit target). */}
      <button
        type="button"
        aria-label={open ? 'Close message' : 'Write message'}
        disabled={disabled}
        onClick={() => !disabled && setOpen((s) => !s)}
        className={cn(
          'absolute left-0 top-1/2 z-20 -translate-y-1/2',
          agentToggleBtnClass,
          open && 'border-white/[0.14] bg-[var(--vibe-bg-elevated)] text-white/90',
          disabled && 'cursor-not-allowed opacity-35',
        )}
      >
        {open ? <X className="size-4" strokeWidth={2} aria-hidden /> : <Search className="size-4" strokeWidth={2} aria-hidden />}
      </button>

      <AnimatePresence
        initial={false}
        onExitComplete={() => setLayoutExpanded(false)}
      >
        {open && (
          <motion.form
            key="msg-form"
            onSubmit={handleSubmit}
            style={{ left: TOGGLE_PX }}
            className="absolute top-1/2 z-10 flex h-9 min-w-0 -translate-y-1/2 flex-row items-stretch overflow-hidden rounded-full border border-white/[0.12] bg-[var(--vibe-bg)] py-0 pl-3 pr-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            initial={{ width: TOGGLE_PX }}
            animate={{ width: `calc(100% - ${TOGGLE_PX}px)` }}
            exit={{ width: TOGGLE_PX, transition: composerBarSpring }}
            transition={composerBarSpring}
          >
            <div className="relative min-h-0 min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={disabled}
                className="h-9 w-full min-w-0 border-0 bg-transparent py-0 pr-2 text-[13px] leading-none text-white/90 outline-none placeholder:text-transparent antialiased disabled:opacity-50"
              />
              <AnimatePresence>
                {!value && (
                  <motion.span
                    key="ph"
                    className="pointer-events-none absolute inset-y-0 left-0 right-10 flex items-center truncate text-left text-[13px] text-white/35 select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {placeholder}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {/* Match PromptInputBox send: h-8 w-8 white circle + black ArrowUp when there is text */}
            <div className="flex h-9 shrink-0 items-center justify-end self-center">
              <button
                type="submit"
                disabled={!value.trim() || disabled}
                className={cn(
                  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none',
                  value.trim() && !disabled
                    ? 'bg-white text-black hover:opacity-80'
                    : 'bg-transparent text-white/35 hover:bg-white/10 hover:text-white/50',
                )}
                aria-label="Send message"
                title={value.trim() ? 'Send' : 'Type a message'}
              >
                <ArrowUp
                  className={cn('h-4 w-4 shrink-0', value.trim() && !disabled ? 'text-black' : 'text-current')}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Completed project — single column, neutral chrome; buttons unchanged. */
function CompletedAgentNetworkRow({
  project,
  onOpenLargePreview,
  onQuickMessage,
}: {
  project: VibeDashboardProjectVM;
  onOpenLargePreview: () => void;
  onQuickMessage?: (id: string, message: string) => void;
}) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 440, damping: 36 }}
      className="group/card relative overflow-hidden rounded-[12px] border border-white/[0.07] bg-[var(--vibe-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors duration-150 hover:border-white/[0.1] hover:bg-[var(--vibe-bg-raised)]"
    >
      <div className="from-white/12 via-white/5 pointer-events-none absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b to-transparent" aria-hidden />
      <div className="px-2 py-1.5 pl-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium leading-tight tracking-tight text-white/[0.88]" title={project.name}>
              {project.name}
            </p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-white/38">{project.tech}</p>
          </div>
          <span className="text-white/45 shrink-0 rounded border border-white/[0.1] bg-white/[0.03] px-1 py-px text-[7px] font-medium uppercase tracking-[0.14em]">
            Done
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <AgentNetworkExpandableMessage
              disabled={!onQuickMessage}
              onSend={(text) => onQuickMessage?.(project.id, text)}
            />
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 38 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenLargePreview();
            }}
            className="flex h-9 shrink-0 items-center gap-1 rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-2.5 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white"
            title="Open preview"
          >
            <PanelRightOpen className="size-3.5 text-white/55" strokeWidth={2} aria-hidden />
            <span className="hidden min-[380px]:inline">Preview</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/** In-progress indicator — neutral ring + soft pulse. */
function AgentNetworkPulseLoader() {
  return (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
      <motion.div
        className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent blur-[0.5px]"
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative h-[26px] w-[26px] rounded-full border-2 border-white/[0.08] border-t-white/75 border-r-white/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-1 w-1 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
      </div>
    </div>
  );
}

const TechIcon = ({ tech }: { tech: string }) => {
  const t = tech.toLowerCase();

  if (t === 'react') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="relative flex items-center justify-center w-full h-full group-hover:scale-110 transition-transform duration-500"
      >
        <div className="absolute w-6 h-2.5 border border-white/60 rounded-[50%] rotate-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        <div className="absolute w-6 h-2.5 border border-white/60 rounded-[50%] rotate-60 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        <div className="absolute w-6 h-2.5 border border-white/60 rounded-[50%] -rotate-60 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      </motion.div>
    );
  }

  if (t === 'node.js' || t === 'node') {
    return (
      <motion.div
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.6, ease: snappyEase }}
        className="relative flex items-center justify-center w-full h-full"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-6 h-6 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </motion.div>
    );
  }

  if (t === 'python') {
    return (
      <motion.div className="relative flex items-center justify-center w-full h-full group-hover:rotate-12 transition-transform duration-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-6 h-6 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        >
          <path d="M12 2c-5.5 0-5.5 2.5-5.5 2.5v3.5h5.5v1.5H6.5C4 9.5 4 12 4 12s0 2.5 2.5 2.5h2v-3.5h5.5c2.5 0 2.5-2.5 2.5-2.5V5c0-2.5-2.5-3-4.5-3z" />
          <path d="M12 22c5.5 0 5.5-2.5 5.5-2.5v-3.5H12v-1.5h5.5c2.5 0 2.5-2.5 2.5-2.5s0-2.5-2.5-2.5h-2v3.5H10c-2.5 0-2.5 2.5-2.5 2.5v3.5c0 2.5 2.5 3 4.5 3z" />
          <circle cx="9" cy="5.5" r="0.5" fill="currentColor" />
          <circle cx="15" cy="18.5" r="0.5" fill="currentColor" />
        </svg>
      </motion.div>
    );
  }

  if (t === 'rust') {
    return (
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="relative flex items-center justify-center w-full h-full"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-6 h-6 text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        >
          <circle cx="12" cy="12" r="8" strokeDasharray="4 4" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </motion.div>
    );
  }

  if (t === 'go') {
    return (
      <motion.div className="relative flex items-center justify-center w-full h-full font-black text-white/80 tracking-tighter text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:-translate-y-1 transition-transform duration-300">
        GO
      </motion.div>
    );
  }

  if (t === 'typescript' || t === 'ts') {
    return (
      <motion.div className="relative flex items-center justify-center w-full h-full group-hover:scale-110 transition-transform duration-300">
        <div className="border-[1.5px] border-white/80 text-white/80 text-[11px] font-bold px-1.5 py-0.5 rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          TS
        </div>
      </motion.div>
    );
  }

  if (t === 'html') {
    return (
      <motion.div className="relative flex items-center justify-center w-full h-full text-[10px] font-bold text-white/80">
        HTML
      </motion.div>
    );
  }

  if (t === 'css') {
    return (
      <motion.div className="relative flex items-center justify-center w-full h-full text-[10px] font-bold text-white/80">
        CSS
      </motion.div>
    );
  }

  return (
    <motion.div className="flex items-center justify-center w-full h-full group-hover:scale-110 transition-transform duration-300">
      <Code2 className="text-white/80 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" size={20} strokeWidth={1.5} />
    </motion.div>
  );
};

const ProjectCard = ({
  project,
  activeMenu,
  toggleMenu,
  handleOpenRename,
  handleDelete,
  onOpenProject,
}: {
  project: VibeDashboardProjectVM;
  activeMenu: string | null;
  toggleMenu: (id: string, e: React.MouseEvent) => void;
  handleOpenRename: (project: VibeDashboardProjectVM, e: React.MouseEvent) => void;
  handleDelete: (id: string, e: React.MouseEvent) => void;
  onOpenProject: (id: string) => void;
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      role="button"
      tabIndex={0}
      onClick={() => onOpenProject(project.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenProject(project.id);
      }}
      className="group relative bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 backdrop-blur-3xl transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col h-full cursor-pointer"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] overflow-hidden">
            <TechIcon tech={project.tech} />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => toggleMenu(project.id, e)}
              className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all"
            >
              <MoreVertical size={18} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
              {activeMenu === project.id && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: snappyEase }}
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl p-px shadow-[0_24px_60px_rgba(0,0,0,0.75)] agents-shimmer-border"
                >
                  <div className="overflow-hidden rounded-[11px] border border-white/[0.08] bg-[var(--vibe-bg)]">
                    <button
                      type="button"
                      onClick={(e) => handleOpenRename(project, e)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-light text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Edit2 size={14} strokeWidth={1.5} /> Rename
                    </button>
                    <div className="h-px w-full bg-white/[0.06]" />
                    <button
                      type="button"
                      onClick={(e) => handleDelete(project.id, e)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-light text-white/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={14} strokeWidth={1.5} /> Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <h3 className="text-xl font-light tracking-tight mb-6 truncate text-white/90 group-hover:text-white transition-colors">
          {project.name}
        </h3>

        <div className="space-y-4 mb-6 flex-1 mt-2">
          <div className="flex justify-between items-center text-sm group/metric">
            <span className="text-white/40 font-light flex items-center gap-2">
              <HardDrive size={14} className="text-white/20" /> Total Size
            </span>
            <span className="text-white/80 font-medium tracking-wide">{project.size}</span>
          </div>
          <div className="flex justify-between items-center text-sm group/metric">
            <span className="text-white/40 font-light flex items-center gap-2">
              <Calendar size={14} className="text-white/20" /> Last Edited
            </span>
            <span className="text-white/80 font-medium tracking-wide text-right text-[11px] sm:text-sm">
              {project.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
              {project.updatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {project.status === 'active' && (
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-[10px] text-white/60 font-mono uppercase tracking-wider min-w-0">
                <span className="truncate max-w-[180px]" title={project.currentTask ?? ''}>
                  {project.currentTask ?? 'Working…'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/80 shrink-0">
                {Math.floor(project.progress ?? 0)}%
              </span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                initial={{ width: `${project.progress ?? 0}%` }}
                animate={{ width: `${project.progress ?? 0}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-5 border-t border-white/[0.05] mt-auto">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono uppercase tracking-widest">
            {project.status === 'active' ? (
              <motion.span
                className="bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-transparent"
                initial={{ backgroundPosition: '200% 0' }}
                animate={{ backgroundPosition: '-200% 0' }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'linear',
                }}
              >
                In Progress
              </motion.span>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span>Completed</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono uppercase tracking-widest group-hover:text-white transition-colors">
            {project.tech}
            <ChevronRight size={12} strokeWidth={1.5} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export type VibeProjectsDashboardProps = {
  projects: VibeDashboardProjectVM[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  activeTab: VibeDashboardTab;
  onActiveTabChange: (t: VibeDashboardTab) => void;
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
  /** Create a fresh project from the top prompt box. Must also auto-send the prompt into Vibe Coder. */
  onCreateProjectFromPrompt: (prompt: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  autoStartDraft?: { prompt: string; defaultTitle: string } | null;
  onAutoStartCreate: () => void;
  /** Live preview HTML for a project (iframe srcDoc). */
  getProjectPreviewSrcDoc?: (projectId: string) => string | null;
  /** Opens the project and sends a follow-up to Vibe Coder. */
  onQuickMessageToVibe?: (projectId: string, message: string) => void;
};

export function VibeProjectsDashboard({
  projects,
  searchQuery,
  onSearchQueryChange,
  activeTab,
  onActiveTabChange,
  onNewProject,
  onOpenProject,
  onCreateProjectFromPrompt,
  onRenameProject,
  onDeleteProject,
  autoStartDraft,
  onAutoStartCreate,
  getProjectPreviewSrcDoc,
  onQuickMessageToVibe,
}: VibeProjectsDashboardProps) {
  const [modal, setModal] = useState<RenameModalConfig>({ isOpen: false });
  const [inputValue, setInputValue] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [largePreviewId, setLargePreviewId] = useState<string | null>(null);
  const [transitionProjectName, setTransitionProjectName] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setActiveMenu(null);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || p.status.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const activeNetworkProjects = projects.filter((p) => p.status === 'active');
  const completedNetworkProjects = projects.filter((p) => p.status === 'completed');
  const projectsByRecency = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [projects],
  );

  const largePreviewProject = useMemo(
    () => (largePreviewId ? projects.find((p) => p.id === largePreviewId) ?? null : null),
    [largePreviewId, projects],
  );
  const largePreviewSrcDoc = largePreviewId
    ? getProjectPreviewSrcDoc?.(largePreviewId) ?? null
    : null;

  const handleOpenRename = (project: VibeDashboardProjectVM, e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue(project.name);
    setModal({ isOpen: true, projectId: project.id, initialName: project.name });
    setActiveMenu(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteProject(id);
    setActiveMenu(null);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const agentNetworkHasActiveWork = activeNetworkProjects.length > 0;

  const handleGettingStartedSend = (message: string) => {
    const text = message.trim();
    if (!text) return;
    setTransitionProjectName('New workspace');
    window.setTimeout(() => {
      onCreateProjectFromPrompt(text);
    }, 520);
  };

  const openProjectWithTransition = (id: string) => {
    const p = projects.find((x) => x.id === id);
    setTransitionProjectName(p?.name ?? 'Opening workspace');
    window.setTimeout(() => onOpenProject(id), 520);
  };

  return (
    <div className="vibe-surface min-h-screen bg-[var(--vibe-bg)] text-[var(--vibe-text)] font-sans selection:bg-[var(--accent-color)]/20 relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
            x: ['-5%', '5%', '-5%'],
            y: ['-5%', '5%', '-5%'],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[80vw] h-[80vw] rounded-full bg-white/[0.02] blur-[100px]"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
            x: ['5%', '-5%', '5%'],
            y: ['5%', '-5%', '5%'],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute w-[60vw] h-[60vw] rounded-full bg-white/[0.015] blur-[80px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Spacer (was a header bar). Keep layout identical without rendering a header element. */}
      <div aria-hidden className="relative z-20 h-20 shrink-0" />

      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[1600px] mx-auto p-8 md:p-12 flex flex-col min-h-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: snappyEase }}
            className="mb-8"
          >
            <div className="mx-auto flex w-full max-w-[980px] flex-col items-center text-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
                Getting started
              </p>
              <h2 className="mt-3 text-[30px] leading-[1.05] md:text-[44px] font-light tracking-tight text-white/95">
                What do you want to build?
              </h2>
              <p className="mt-3 max-w-[62ch] text-sm md:text-[15px] leading-relaxed text-white/50">
                Describe the app, features, and vibe. Use the box below to kick off your first workspace.
              </p>

              <div className="mt-5 w-full max-w-[720px] mx-auto">
                <PromptInputBox
                  mode="chat"
                  placeholder="e.g. Build a sleek portfolio site with a projects page and a contact form…"
                  onSend={(msg) => handleGettingStartedSend(msg)}
                  className="w-full"
                />
                <p className="mt-3 text-[11px] text-white/35">
                  Tip: include your tech stack and any UI references.
                </p>
              </div>
            </div>
          </motion.div>

          {autoStartDraft && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">From chat</p>
                <p className="mt-1 text-lg font-light text-white/90 truncate">{autoStartDraft.defaultTitle}</p>
                <p className="mt-1 text-sm text-white/50 line-clamp-2">{autoStartDraft.prompt}</p>
              </div>
              <button
                type="button"
                onClick={onAutoStartCreate}
                className="rounded-full border border-white/15 bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors shrink-0"
              >
                Create &amp; start
              </button>
            </motion.div>
          )}

          <div className="flex items-end justify-between gap-6 mb-8 relative z-30">
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-3 text-2xl md:text-3xl font-light text-white tracking-tight hover:opacity-80 transition-opacity group"
              >
                {activeTab === 'All' ? 'Everything' : activeTab === 'Active' ? 'In Progress' : 'Completed'}
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                  <ChevronDown size={16} className={`transition-transform duration-300 ease-out ${isFilterOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ duration: 0.2, ease: snappyEase }}
                    className="absolute left-0 top-full mt-4 w-56 bg-[var(--vibe-bg)]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden py-2 origin-top-left"
                  >
                    {(['All', 'Active', 'Completed'] as VibeDashboardTab[]).map((tab) => {
                      const label =
                        tab === 'All' ? 'Everything' : tab === 'Active' ? 'In Progress' : 'Completed';
                      const count =
                        tab === 'All'
                          ? projects.length
                          : tab === 'Active'
                            ? activeCount
                            : completedCount;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            onActiveTabChange(tab);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                            activeTab === tab ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                          }`}
                        >
                          <span>{label}</span>
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{count}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full max-w-[420px]">
              <div className="relative group">
                <Search
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white/70 transition-colors"
                  size={16}
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/[0.12] rounded-none py-2 pl-7 pr-7 text-sm font-light text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      type="button"
                      onClick={() => onSearchQueryChange('')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors p-1 rounded-full hover:bg-white/10"
                      aria-label="Clear search"
                    >
                      <X size={14} strokeWidth={2} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  activeMenu={activeMenu}
                  toggleMenu={toggleMenu}
                  handleOpenRename={handleOpenRename}
                  handleDelete={handleDelete}
                  onOpenProject={openProjectWithTransition}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.5, ease: snappyEase }}
              className="flex-1 flex flex-col items-center justify-center text-white/20 py-24"
            >
              <div className="relative flex items-center justify-center mb-10">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-32 h-32 rounded-full border border-dashed border-white/10"
                />
                <motion.div
                  animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-48 h-48 rounded-full border border-dashed border-white/[0.05]"
                />
                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05),inset_0_1px_2px_rgba(255,255,255,0.1)] backdrop-blur-md z-10">
                  {searchQuery ? (
                    <Search size={32} strokeWidth={1} className="text-white/60" />
                  ) : (
                    <FolderGit2 size={32} strokeWidth={1} className="text-white/60" />
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-light text-white/90 mb-3 tracking-tight">
                {searchQuery
                  ? 'No matches found'
                  : activeTab === 'Active'
                    ? 'Nothing in progress'
                    : activeTab === 'Completed'
                      ? 'No completed projects yet'
                      : 'Workspace is empty'}
              </h3>
              <p className="font-light text-sm text-white/40 mb-10 max-w-md text-center leading-relaxed">
                {searchQuery
                  ? `We couldn't find any projects matching "${searchQuery}". Try adjusting your search terms or filters.`
                  : activeTab === 'Active'
                    ? 'Nothing is currently running in this view. Active builds and streaming tasks show up here once you start or resume work in Vibe Coder.'
                    : activeTab === 'Completed'
                      ? 'Agents may still be running tasks inside Vibe Coder. Finished projects land here after the build checklist completes — switch to In Progress or Everything to follow live work.'
                      : 'You have no projects in your workspace yet. Use the box above to describe what you want to build to get started.'}
              </p>

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="px-6 py-2.5 rounded-full text-sm font-medium tracking-wide bg-white/[0.05] text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
                >
                  Clear Search
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onActiveTabChange('All')}
                    className="px-6 py-2.5 rounded-full text-sm font-medium tracking-wide bg-white/[0.05] text-white hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
                  >
                    View everything
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {transitionProjectName && (
          <motion.div
            className="fixed inset-0 z-[900] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => {
              // Allow quick cancel if user clicks outside; transition is cosmetic.
              setTransitionProjectName(null);
            }}
          >
            <motion.div
              className="absolute inset-0 bg-[var(--vibe-bg)]/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0, filter: 'blur(12px)' }}
              animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.02, y: -6, opacity: 0, filter: 'blur(14px)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }}
              className="relative w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[var(--vibe-bg)]/92 px-6 py-5 shadow-[0_40px_120px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
              <p className="relative text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">
                Opening
              </p>
              <p className="relative mt-2 text-[15px] font-medium tracking-tight text-white/90 truncate">
                {transitionProjectName}
              </p>
              <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="absolute inset-y-0 left-0 w-24 rounded-full bg-gradient-to-r from-transparent via-white/55 to-transparent"
                  initial={{ x: '-40%' }}
                  animate={{ x: ['-40%', '220%'] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setModal({ isOpen: false })}
              className="absolute inset-0 bg-[var(--vibe-bg)]/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, y: 20, filter: 'blur(12px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
              className="relative w-full max-w-lg bg-[var(--vibe-bg)] border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-light tracking-tight text-white/90">Rename Project</h2>
                  <button
                    type="button"
                    onClick={() => setModal({ isOpen: false })}
                    className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = inputValue.trim();
                    if (!v || !modal.projectId) return;
                    onRenameProject(modal.projectId, v);
                    setModal({ isOpen: false });
                  }}
                >
                  <div className="mb-10">
                    <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-3">
                      Project Identifier
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="e.g. core-engine-v2"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3.5 text-white font-light placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModal({ isOpen: false })}
                      className="px-5 py-2.5 rounded-full text-sm font-medium tracking-wide text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="px-6 py-2.5 rounded-full text-sm font-medium tracking-wide bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {largePreviewId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[860] flex items-center justify-center p-3 sm:p-6 md:p-8"
          >
            <motion.div
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 bg-[var(--vibe-bg)]/82 backdrop-blur-md"
              onClick={() => setLargePreviewId(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-network-preview-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: 'spring', damping: 22, stiffness: 440, mass: 0.72 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-[1] flex h-[min(92vh,980px)] min-h-[420px] w-[min(98vw,1420px)] flex-col overflow-hidden rounded-[20px] border border-white/12 bg-[var(--vibe-bg)] shadow-[0_50px_140px_rgba(0,0,0,0.92),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.09] bg-gradient-to-r from-[#141414] via-[#101010] to-[#0c0c0c] px-5 py-4 sm:px-7">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">Preview</p>
                  <h2
                    id="agent-network-preview-title"
                    className="mt-1 truncate text-base font-medium tracking-tight text-white"
                  >
                    {largePreviewProject?.name ?? 'Project'}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-light text-white/40">
                    Full-size canvas — same runtime as main Vibe Coder preview
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (largePreviewId) onOpenProject(largePreviewId);
                      setLargePreviewId(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-[11px] font-medium text-white/95 transition-colors hover:bg-white/12 sm:px-4"
                    title="Open in Vibe Coder"
                  >
                    <LayoutTemplate size={14} strokeWidth={2} />
                    <span className="hidden sm:inline">Open workspace</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLargePreviewId(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
                    aria-label="Close preview"
                  >
                    <X size={20} strokeWidth={2} />
                  </motion.button>
                </div>
              </header>
              <div className="relative min-h-0 flex-1 bg-[var(--vibe-bg-deep)]">
                <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />
                {largePreviewSrcDoc ? (
                  <iframe
                    title={`Preview ${largePreviewProject?.name ?? ''}`}
                    className="absolute inset-0 z-0 h-full w-full border-0"
                    srcDoc={largePreviewSrcDoc}
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <Code2 size={36} className="text-white/15" strokeWidth={1.25} />
                    <p className="text-sm font-light text-white/45">No previewable HTML in this workspace yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
