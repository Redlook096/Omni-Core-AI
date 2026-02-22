"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";

import { cn } from "../../lib/utils";

interface GradualSpacingProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  baseDelay?: number; // Added to sync with other animations
  framerProps?: Variants;
  className?: string;
}

export function GradualSpacing({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  baseDelay = 1.0, // Default delay to sync with input expansion
  framerProps = {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 0.9 },
    visible: { opacity: 1, filter: "blur(0px)", scale: 1 },
  },
  className,
}: GradualSpacingProps) {
  const centerIndex = text.length / 2;

  return (
    <div className="flex justify-center space-x-1">
      <AnimatePresence>
        {text.split("").map((char, i) => {
          const distanceFromCenter = Math.abs(i - centerIndex);
          
          return (
            <motion.h1
              key={i}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={framerProps}
              transition={{
                duration,
                // Add baseDelay to the spread delay so it starts after input expansion
                delay: baseDelay + (distanceFromCenter * delayMultiple),
                ease: "easeOut",
              }}
              className={cn("drop-shadow-sm", className)}
            >
              {char === " " ? <span>&nbsp;</span> : char}
            </motion.h1>
          );
        })}
      </AnimatePresence>
    </div>
  );
}