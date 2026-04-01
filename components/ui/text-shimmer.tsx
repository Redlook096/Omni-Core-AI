import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/** Unified timing + text color for Vibe checklist, chat “Thinking”, and mini code file headers (#0a0a0a UI). */
export const VIBE_THINKING_SHIMMER_DURATION = 2.05;
export const vibeThinkingShimmerClassName =
  'text-[12px] font-medium tracking-tight text-[#a3a3a3]';

interface TextShimmerProps {
  children: string;
  as?: 'p' | 'span' | 'div';
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 3.1,
  spread = 2,
}: TextShimmerProps) {
  const safeText = typeof children === 'string' ? children : String(children ?? '');
  const MotionComponent = useMemo(() => {
    if (Component === 'span') return motion.span;
    if (Component === 'div') return motion.div;
    return motion.p;
  }, [Component]);

  const dynamicSpread = useMemo(() => {
    return safeText.length * spread;
  }, [safeText, spread]);

  return (
    <MotionComponent
      className={cn(
        className,
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        /* Visible on dark UIs (#0a0a0a) without relying on .dark ancestor */
        '[color:transparent] [--base-color:#5a5a5a] [--base-gradient-color:#f5f5f5]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        'dark:[--base-color:#6b6b6b] dark:[--base-gradient-color:#fafafa] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]'
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          color: 'transparent',
        } as React.CSSProperties
      }
    >
      {safeText}
    </MotionComponent>
  );
}

/**
 * Checklist status indicator — rotating conic “sweep” aligned with TextShimmer grays (#525252 → #e5e5e5).
 */
export function ShimmerOrb({
  className,
  label,
  speed = 'fast',
}: {
  className?: string;
  label?: string;
  /** `slow` = waiting on mini-code / same row idle; `fast` = plan still streaming */
  speed?: 'fast' | 'slow';
}) {
  const duration = speed === 'fast' ? 1.15 : 3.25;
  return (
    <span
      className={cn('inline-flex h-4 w-4 shrink-0 items-center justify-center', className)}
      role={label ? 'status' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <motion.span
        className="flex h-[15px] w-[15px] items-center justify-center rounded-full p-[2px]"
        style={{
          background:
            'conic-gradient(from 0deg, #3f3f3f, #d4d4d4, #737373, #a3a3a3, #3f3f3f)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        <span className="block h-full w-full rounded-full bg-[#0a0a0a]" aria-hidden />
      </motion.span>
    </span>
  );
}
