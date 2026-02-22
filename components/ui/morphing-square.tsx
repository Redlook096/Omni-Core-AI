"use client"

import React from 'react';
import { cva } from "class-variance-authority"
import { HTMLMotionProps, motion } from "framer-motion"

import { cn } from "../../lib/utils"

const morphingSquareVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface MorphingSquareProps {
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right"
}

export function MorphingSquare({
  className,
  message,
  messagePlacement = "bottom",
  ...props
}: HTMLMotionProps<"div"> & MorphingSquareProps) {
  return (
    <div className={cn(morphingSquareVariants({ messagePlacement }))}>
      <motion.div
        className={cn("bg-neutral-400/80 dark:bg-neutral-400/80 backdrop-blur-sm", className)}
        animate={{
          borderRadius: ["25%", "50%", "25%"],
          rotate: [0, 180, 360],
          scale: [1, 0.9, 1], // Subtle breathing
        }}
        transition={{
          duration: 1.5, // Slightly faster for responsiveness
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        {...props}
      />
      {message && <div className="text-xs text-neutral-500 font-medium tracking-wide">{message}</div>}
    </div>
  )
}