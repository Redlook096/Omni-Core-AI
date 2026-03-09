"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface TiltedDockItem {
  id: string | number;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface TiltedDockProps {
  items: TiltedDockItem[];
  className?: string;
  isHovered?: boolean;
}

export function TiltedDock({ items, className }: TiltedDockProps) {
  const [hovered, setHovered] = useState<string | number | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className={cn(
        "flex gap-6 sm:gap-10 px-8 sm:px-12 py-4 sm:py-6 rounded-3xl backdrop-blur-2xl bg-[var(--bg-card)]/60 border border-[var(--border-color)] shadow-[0_15px_40px_rgba(0,0,0,0.35)]",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
      animate={{
        rotateX: 18, // stage tilt
        rotateY: mouse.x * 10, // subtle parallax left/right
      }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="relative flex flex-col items-center justify-center cursor-pointer"
          onHoverStart={() => setHovered(item.id)}
          onHoverEnd={() => setHovered(null)}
          onClick={item.onClick}
          animate={{
            scale: hovered === item.id ? 1.4 : 1,
            z: hovered === item.id ? 120 : hovered ? -20 : 0, // depth layers
            opacity: hovered && hovered !== item.id ? 0.5 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Icon */}
          <motion.div
            animate={{
              rotateX: hovered === item.id ? -10 : 0,
              rotateY: hovered === item.id ? 10 : 0,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="text-[var(--text-primary)]"
          >
            {item.icon}
          </motion.div>

          {/* Label */}
          <motion.span
            className="absolute -bottom-8 text-xs font-medium text-[var(--text-primary)] whitespace-nowrap"
            animate={{ opacity: hovered === item.id ? 1 : 0, y: hovered === item.id ? 0 : 5 }}
            transition={{ duration: 0.2 }}
          >
            {item.label}
          </motion.span>
        </motion.div>
      ))}
    </motion.div>
  );
}
