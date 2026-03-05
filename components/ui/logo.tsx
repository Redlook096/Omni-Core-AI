import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Hexagon } from 'lucide-react';

export function Logo() {
  const [isFirstLogo, setIsFirstLogo] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFirstLogo(prev => !prev);
    }, 4000); // Switch every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isFirstLogo ? (
          <motion.div
            key="logo1"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center text-[var(--text-primary)]"
          >
            <Hexagon className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="logo2"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center text-[var(--text-primary)]"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
