import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

type PromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function PromptDialog({
  open,
  title,
  description,
  defaultValue = '',
  placeholder = '',
  confirmLabel = 'OK',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  // Reset field when dialog opens (sync with parent defaultValue).
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setValue(defaultValue);
    });
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-dialog-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-[400px] rounded-xl border border-[#2a2a2a] bg-[#141414] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="prompt-dialog-title" className="text-[15px] font-semibold tracking-tight text-[#f0f0f0]">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#8a8a8a]">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1.5 text-[#737373] transition-colors hover:bg-[#1f1f1f] hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="mb-5 w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2.5 text-[13px] text-[#e8e8e8] outline-none ring-0 placeholder:text-[#5c5c5c] focus:border-[#3b82f6]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onConfirm(value);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#a3a3a3] transition-colors hover:bg-[#1f1f1f] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(value)}
                className="rounded-lg bg-[#e8e8e8] px-3.5 py-2 text-[13px] font-medium text-[#0a0a0a] transition-colors hover:bg-white"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="w-full max-w-[400px] rounded-xl border border-[#2a2a2a] bg-[#141414] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-dialog-title" className="text-[15px] font-semibold tracking-tight text-[#f0f0f0]">
              {title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#9a9a9a]">{message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#a3a3a3] transition-colors hover:bg-[#1f1f1f] hover:text-white"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors',
                  danger
                    ? 'bg-[#dc2626] text-white hover:bg-[#ef4444]'
                    : 'bg-[#e8e8e8] text-[#0a0a0a] hover:bg-white'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function ToastBanner({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-6 left-1/2 z-[320] max-w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-3 text-[13px] text-[#e5e5e5] shadow-xl"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="flex-1 leading-snug">{message}</span>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded p-1 text-[#888] hover:bg-[#2a2a2a] hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
