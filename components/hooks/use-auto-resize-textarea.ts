import { useEffect, useRef, useCallback } from "react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

export function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Use a ghost element to measure height to avoid "jumpiness" caused by 
      // shrinking the actual element to measure scrollHeight.
      const ghost = document.createElement('textarea');
      ghost.style.visibility = 'hidden';
      ghost.style.position = 'absolute';
      ghost.style.top = '0';
      ghost.style.left = '-9999px';
      ghost.style.height = '0px'; // Important for measuring scrollHeight
      ghost.style.width = `${textarea.clientWidth}px`;
      ghost.value = textarea.value;

      // Copy styles affecting layout
      const styles = window.getComputedStyle(textarea);
      ghost.style.fontSize = styles.fontSize;
      ghost.style.fontFamily = styles.fontFamily;
      ghost.style.fontWeight = styles.fontWeight;
      ghost.style.lineHeight = styles.lineHeight;
      ghost.style.letterSpacing = styles.letterSpacing;
      ghost.style.padding = styles.padding;
      ghost.style.border = styles.border;
      ghost.style.boxSizing = styles.boxSizing;

      document.body.appendChild(ghost);
      
      const newHeight = Math.max(
        minHeight,
        Math.min(
          ghost.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );
      
      document.body.removeChild(ghost);

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}