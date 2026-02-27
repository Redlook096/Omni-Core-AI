import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isCollapsed?: boolean;
}

export function ThemeToggle({ isDark, toggleTheme, isCollapsed }: ThemeToggleProps) {
  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-10 relative overflow-hidden"
    >
      <div className="relative w-4 h-4 shrink-0">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : 180,
            opacity: isDark ? 1 : 0
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute inset-0"
        >
          <Moon className="w-4 h-4" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? -180 : 0,
            opacity: isDark ? 0 : 1
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute inset-0"
        >
          <Sun className="w-4 h-4" />
        </motion.div>
      </div>
      
      {!isCollapsed && (
        <div className="relative flex-1 h-full flex items-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isDark ? 'dark' : 'light'}
              initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute left-0 truncate w-full text-left"
            >
              {isDark ? 'Dark mode' : 'Light mode'}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </motion.button>
  );
}
