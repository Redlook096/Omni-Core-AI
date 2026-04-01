import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Paperclip, Square, X, StopCircle, Mic, Terminal, Search, Brain, Paintbrush, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TextareaAutosize, { TextareaAutosizeProps } from "react-textarea-autosize";
import { cn } from "../../lib/utils";

// Embedded CSS for minimal custom styles
const styles = `
  *:focus-visible {
    outline-offset: 0 !important;
    --ring-offset: 0 !important;
  }
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  textarea::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 3px;
  }
  textarea::-webkit-scrollbar-thumb:hover {
    background-color: var(--text-muted);
  }
`;



// Inject styles into document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Textarea Component
interface TextareaProps extends TextareaAutosizeProps {
  className?: string;
}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <TextareaAutosize
    className={cn(
      "flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--text-muted)] transition-[height] duration-200 ease-out",
      className
    )}
    ref={ref}
    minRows={1}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// Tooltip Components
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Dialog Components
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] md:max-w-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border border-[var(--border-color)] bg-[var(--bg-card)] p-0 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-[var(--bg-hover)] p-2 hover:bg-[var(--bg-app)] transition-all">
        <X className="h-5 w-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-[var(--text-primary)]", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-[var(--accent-color)] hover:opacity-80 text-white",
      outline: "border border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)]",
      ghost: "bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)]",
    };
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "h-8 w-8 rounded-full aspect-[1/1]",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// VoiceRecorder Component
interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, time, onStartRecording, onStopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const randomValues = React.useMemo(() => {
    return Array.from({ length: visualizerBars }).map((_, i) => {
      // Pseudo-random based on index to avoid Math.random() in render
      const pseudoRandom1 = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const pseudoRandom2 = (Math.cos(i * 78.233) * 43758.5453) % 1;
      return {
        height: Math.max(15, Math.abs(pseudoRandom1) * 100),
        duration: 0.5 + Math.abs(pseudoRandom2) * 0.5
      };
    });
  }, [visualizerBars]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full transition-all duration-300 py-3",
        isRecording ? "opacity-100" : "opacity-0 h-0"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-sm text-[var(--text-secondary)]">{formatTime(time)}</span>
      </div>
      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
        {randomValues.map((val, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-[var(--text-secondary)] animate-pulse"
            style={{
              height: `${val.height}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${val.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ImageViewDialog Component
interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}
const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw] md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl"
        >
          <img
            src={imageUrl}
            alt="Full preview"
            className="w-full max-h-[80vh] object-contain rounded-2xl"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// PromptInput Context and Components
interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});
function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-input)]/80 backdrop-blur-md p-2 shadow-sm transition-all duration-300 focus-within:ring-1 focus-within:ring-[var(--border-color)]",
              isLoading && "border-[var(--text-muted)]",
              className
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
}
const PromptInputTextarea: React.FC<PromptInputTextareaProps & React.ComponentProps<typeof Textarea>> = ({
  className,
  onKeyDown,
  placeholder,
  ...props
}) => {
  const { value, setValue, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const sendWithEnter = localStorage.getItem('sendWithEnter') !== 'false';
    if (e.key === "Enter" && !e.shiftKey && sendWithEnter) {
      e.preventDefault();
      onSubmit?.();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !sendWithEnter) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Textarea
      id="prompt-textarea"
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-base", className)}
      disabled={disabled}
      placeholder={placeholder}
      maxRows={10}
      {...props}
    />
  );
};

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}
const PromptInputActions: React.FC<PromptInputActionsProps> = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

type SlashPaletteItem = {
  id: string;
  label: string;
  command: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: 'search' | 'think' | 'canvas' | 'vibe';
};

const SLASH_PALETTE_ITEMS: SlashPaletteItem[] = [
  { id: 'search', label: 'Search', command: '/search', icon: Search, kind: 'search' },
  { id: 'think', label: 'Think', command: '/think', icon: Brain, kind: 'think' },
  { id: 'canvas', label: 'Canvas', command: '/canvas', icon: Paintbrush, kind: 'canvas' },
  { id: 'vibe', label: 'Vibe Coder', command: '/vibe coder', icon: Wand2, kind: 'vibe' },
];

function stripSlashToken(value: string): string {
  return value.replace(/(?:^|\s)\/[^\n]*$/, '').replace(/\s+$/, '');
}

// Main PromptInputBox Component

export type PreviewElementRefChip = { id: string; kind: string; path: string };

interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  hideOptions?: boolean;
  customActions?: React.ReactNode;
  mode?: 'chat' | 'coder';
  /** Preview pick pills (Vibe Coder) — shown above the textarea; merged into the outgoing message. */
  previewElementRefs?: PreviewElementRefChip[];
  onPreviewElementRefsChange?: React.Dispatch<React.SetStateAction<PreviewElementRefChip[]>>;
  /** When user picks “Vibe Coder” from the / command palette (chat mode). */
  onSlashVibeCoder?: (promptBeforeSlash: string) => void;
}
export const PromptInputBox = React.forwardRef((props: PromptInputBoxProps, ref: React.Ref<HTMLDivElement>) => {
  const {
    onSend = () => {},
    isLoading = false,
    placeholder = "Type your message here...",
    className,
    value,
    onChange,
    hideOptions = false,
    customActions,
    mode = 'chat',
    previewElementRefs = [],
    onPreviewElementRefsChange,
    onSlashVibeCoder,
  } = props;
  const [internalInput, setInternalInput] = React.useState("");
  const input = value !== undefined ? value : internalInput;
  const setInput = (newVal: string) => {
    setInternalInput(newVal);
    if (onChange) onChange(newVal);
  };
  const [files, setFiles] = React.useState<File[]>([]);
  const [filePreviews, setFilePreviews] = React.useState<{ [key: string]: string }>({});
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  
  const [showTerminal, setShowTerminal] = React.useState(false);

  /** Chat-only: set via / command palette (Search / Think / Canvas / Vibe Coder). */
  const [selectedChatCommand, setSelectedChatCommand] = React.useState<
    'search' | 'think' | 'canvas' | 'vibe' | null
  >(null);
  const [slashHighlight, setSlashHighlight] = React.useState(0);

  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const promptBoxRef = React.useRef<HTMLDivElement>(null);

  const handleToggleChange = (value: string) => {
    if (mode !== 'coder') return;
    if (value === "terminal") {
      setShowTerminal((prev) => !prev);
    }
  };

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const processFile = React.useCallback((file: File) => {
    if (!isImageFile(file)) {
      console.log("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      console.log("File too large (max 10MB)");
      return;
    }
    setFiles([file]);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result as string });
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => isImageFile(file));
    if (imageFiles.length > 0) processFile(imageFiles[0]);
  }, [processFile]);

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove && filePreviews[fileToRemove.name]) setFilePreviews({});
    setFiles([]);
  };

  const openImageModal = (imageUrl: string) => setSelectedImage(imageUrl);

  const handlePaste = React.useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          break;
        }
      }
    }
  }, [processFile]);

  React.useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const buildPreviewRefBlock = () => {
    if (!previewElementRefs.length) return '';
    return previewElementRefs
      .map((r) => `[Preview element: ${r.kind}]${r.path ? ` ${r.path}` : ''}`)
      .join('\n');
  };

  const handleSubmit = async () => {
    const refBlock = buildPreviewRefBlock();
    const hasRefs = refBlock.length > 0;

    if (mode === 'chat' && selectedChatCommand === 'vibe') {
      const t = input.trim();
      if (!t) return;
      onSlashVibeCoder?.(t);
      setInput('');
      setSelectedChatCommand(null);
      setFiles([]);
      setFilePreviews({});
      return;
    }

    if (input.trim() || files.length > 0 || hasRefs) {
      let messagePrefix = "";

      if (mode === 'coder') {
        if (showTerminal) messagePrefix = "[Terminal: ";
      } else {
        if (selectedChatCommand === 'search') messagePrefix = "[Search: ";
        else if (selectedChatCommand === 'think') messagePrefix = "[Think: ";
        else if (selectedChatCommand === 'canvas') messagePrefix = "[Canvas: ";
      }

      const base = messagePrefix ? `${messagePrefix}${input}]` : input;
      const formattedInput = hasRefs ? (base.trim() ? `${refBlock}\n\n${base}` : refBlock) : base;

      onSend(formattedInput, files);
      setInput('');
      setFiles([]);
      setFilePreviews({});
      if (mode === 'chat') setSelectedChatCommand(null);
    }
  };

  const handleStartRecording = () => console.log("Started recording");

  const handleStopRecording = (duration: number) => {
    console.log(`Stopped recording after ${duration} seconds`);
    setIsRecording(false);
    onSend(`[Voice message - ${duration} seconds]`, []);
  };

  const hasContent =
    input.trim() !== "" || files.length > 0 || previewElementRefs.length > 0;

  const slashMatch = React.useMemo(() => {
    if (mode !== 'chat' || hideOptions) return null;
    const m = input.match(/(?:^|\s)\/([^\n]*)$/);
    if (!m) return null;
    return { query: m[1].trim().toLowerCase() };
  }, [input, mode, hideOptions]);

  const slashItemsFiltered = React.useMemo(() => {
    if (!slashMatch) return [];
    const q = slashMatch.query;
    return SLASH_PALETTE_ITEMS.filter((it) => {
      if (!q) return true;
      const label = it.label.toLowerCase();
      const cmd = it.command.replace(/^\//, '').toLowerCase();
      return label.includes(q) || cmd.includes(q) || it.id.startsWith(q);
    });
  }, [slashMatch]);

  const showSlashPalette = Boolean(slashMatch && slashItemsFiltered.length > 0);

  React.useEffect(() => {
    setSlashHighlight(0);
  }, [slashMatch?.query]);

  React.useEffect(() => {
    setSlashHighlight((h) =>
      slashItemsFiltered.length === 0 ? 0 : Math.min(h, slashItemsFiltered.length - 1),
    );
  }, [slashItemsFiltered.length]);

  const applySlashItem = React.useCallback(
    (item: SlashPaletteItem) => {
      const base = stripSlashToken(input);
      setSelectedChatCommand(item.kind);
      setInput(base);
      setTimeout(() => {
        const el = document.getElementById('prompt-textarea') as HTMLTextAreaElement | null;
        if (!el) return;
        // Prevent scroll jumps caused by focusing an element inside the scrollable chat container.
        try {
          (el as unknown as { focus: (opts?: { preventScroll?: boolean }) => void }).focus({
            preventScroll: true,
          });
        } catch {
          el.focus();
        }
      }, 0);
    },
    [input, setInput],
  );

  const handleSlashKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSlashPalette || slashItemsFiltered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashHighlight((i) => (i + 1) % slashItemsFiltered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashHighlight((i) =>
          (i - 1 + slashItemsFiltered.length) % slashItemsFiltered.length,
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const item = slashItemsFiltered[slashHighlight];
        if (item) applySlashItem(item);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInput(stripSlashToken(input));
      }
    },
    [
      showSlashPalette,
      slashItemsFiltered,
      slashHighlight,
      applySlashItem,
      input,
      setInput,
    ],
  );

  return (
    <>
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className={cn(
          "w-full transition-colors duration-300 ease-in-out relative overflow-visible",
          isRecording && "border-red-500/70",
          className
        )}
        disabled={isLoading || isRecording}
        ref={ref || promptBoxRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {showSlashPalette && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 14, scale: 0.97, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.55 }}
              className="absolute bottom-full left-0 right-0 z-[60] mb-3 px-0.5 pointer-events-auto"
            >
              <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--vibe-bg-surface)] shadow-[0_16px_48px_var(--shadow-color)] overflow-hidden py-1 ring-1 ring-[var(--border-color)]">
                {slashItemsFiltered.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(ev) => ev.preventDefault()}
                      onClick={() => applySlashItem(item)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150',
                        idx === slashHighlight ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]',
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" />
                      <span className="font-semibold text-[var(--text-primary)] text-sm tracking-tight">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] ml-auto font-mono opacity-90">
                        {item.command}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {previewElementRefs.length > 0 && !isRecording && (
          <div className="flex flex-wrap gap-2 px-0 pb-1.5 pt-0.5">
            {previewElementRefs.map((ref) => (
              <div
                key={ref.id}
                className="group inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                title={ref.path || ref.kind}
              >
                <span
                  className="max-w-[140px] truncate text-[11px] font-semibold capitalize tracking-[0.02em] text-white"
                  style={{
                    textShadow:
                      '0.4px 0 0 rgba(56, 189, 248, 0.45), -0.4px 0 0 rgba(248, 113, 113, 0.42)',
                  }}
                >
                  {ref.kind}
                </span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-[var(--text-muted)] opacity-80 transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:opacity-100"
                  aria-label="Remove reference"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewElementRefsChange?.((prev) => prev.filter((p) => p.id !== ref.id));
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && !isRecording && (
          <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") && filePreviews[file.name] && (
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                    onClick={() => openImageModal(filePreviews[file.name])}
                  >
                    <img
                      src={filePreviews[file.name]}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "transition-opacity duration-300",
            isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"
          )}
        >
          <PromptInputTextarea
            placeholder={
              mode === 'coder'
                ? showTerminal
                  ? "Run terminal command..."
                  : placeholder
                : selectedChatCommand === 'search'
                  ? "Search the web…"
                  : selectedChatCommand === 'think'
                    ? "Think through…"
                    : selectedChatCommand === 'canvas'
                      ? "Canvas prompt…"
                      : selectedChatCommand === 'vibe'
                        ? "What should Vibe Coder build…"
                        : placeholder
            }
            className="text-base"
            onKeyDown={handleSlashKeyDown}
          />
        </div>

        {isRecording && (
          <VoiceRecorder
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
          />
        )}

        <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
          <div
            className={cn(
              "flex items-center gap-1 transition-opacity duration-300",
              isRecording ? "opacity-0 invisible h-0" : "opacity-100 visible"
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <PromptInputAction tooltip="Upload image">
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    className="flex h-8 w-8 text-[var(--text-secondary)] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    disabled={isRecording}
                  >
                    <Paperclip className="h-5 w-5 transition-colors" />
                    <input
                      ref={uploadInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
                        if (e.target) e.target.value = "";
                      }}
                      accept="image/*"
                    />
                  </button>
                </PromptInputAction>

                {mode === 'chat' && selectedChatCommand && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedChatCommand}
                      initial={{ opacity: 0, x: -6, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -4, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      className="flex items-center"
                    >
                      {(() => {
                        const meta = SLASH_PALETTE_ITEMS.find((it) => it.kind === selectedChatCommand);
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                          <div
                            className="flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/[0.07] pl-2 pr-1 py-1 text-[11px] font-medium text-sky-100/95 shadow-[0_0_20px_rgba(56,189,248,0.12)]"
                            title={`${meta.label} — ${meta.command}`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0 text-sky-300/90" />
                            <span className="max-w-[120px] truncate sm:max-w-[180px]">{meta.label}</span>
                            <span className="font-mono text-[10px] text-sky-400/80">{meta.command}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 text-sky-300/70 hover:bg-white/10 hover:text-white"
                              aria-label="Clear mode"
                              onClick={() => setSelectedChatCommand(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                )}

                {!hideOptions && mode === 'coder' && (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleChange('terminal')}
                      className={cn(
                        'rounded-full transition-all flex items-center gap-1 px-2 py-1 border h-8',
                        showTerminal
                          ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-[var(--text-primary)]'
                          : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                      )}
                    >
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <motion.div
                          animate={{ rotate: showTerminal ? 360 : 0, scale: showTerminal ? 1.1 : 1 }}
                          whileHover={{ rotate: showTerminal ? 360 : 15, scale: 1.1, transition: { type: 'spring', stiffness: 300, damping: 10 } }}
                          transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                        >
                          <Terminal className={cn('w-4 h-4', showTerminal ? 'text-[var(--text-primary)]' : 'text-inherit')} />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {showTerminal && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs overflow-hidden whitespace-nowrap text-[var(--text-primary)] flex-shrink-0"
                          >
                            Terminal
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                )}
                {customActions}
            </div>
          </div>

          <PromptInputAction
            tooltip={
              isLoading
                ? "Stop generation"
                : isRecording
                ? "Stop recording"
                : hasContent
                ? "Send message"
                : "Voice message"
            }
          >
            <Button
              variant="default"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300",
                isRecording
                  ? "bg-transparent hover:bg-[var(--bg-hover)] text-red-500 hover:text-red-400"
                  : hasContent
                  ? "bg-white hover:opacity-80 text-black"
                  : "bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              onClick={() => {
                if (isRecording) setIsRecording(false);
                else if (hasContent) handleSubmit();
                else setIsRecording(true);
              }}
              disabled={isLoading && !hasContent}
            >
              {isLoading ? (
                <Square className="h-4 w-4 fill-[var(--bg-app)] animate-pulse" />
              ) : isRecording ? (
                <StopCircle className="h-5 w-5 text-red-500" />
              ) : hasContent ? (
                <ArrowUp className="h-4 w-4 text-black" />
              ) : (
                <Mic className="h-5 w-5 text-[var(--text-primary)] transition-colors" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>

      <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
});
PromptInputBox.displayName = "PromptInputBox";
