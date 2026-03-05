import { cn } from "@/lib/utils";
import React from "react";

interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
}

export const SiriOrb: React.FC<SiriOrbProps> = ({
  size = "192px",
  className,
  colors,
  animationDuration = 20,
}) => {
  const defaultColors = {
    bg: "transparent",
    c1: "#ffffff",
    c2: "#ffffff",
    c3: "#f8f9fa",
  };

  const finalColors = { ...defaultColors, ...colors };
  const sizeValue = parseInt(size.replace("px", ""), 10);

  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.001, 1.1);

  return (
    <div
      className={cn("siri-orb", className)}
      style={
        {
          width: size,
          height: size,
          "--bg": finalColors.bg,
          "--c1": finalColors.c1,
          "--c2": finalColors.c2,
          "--c3": finalColors.c3,
          "--animation-duration": `${animationDuration}s`,
          "--blur-amount": `${blurAmount}px`,
          "--contrast-amount": contrastAmount,
        } as React.CSSProperties
      }
    />
  );
};
