import { CornerRightUp, Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Textarea } from "./textarea";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";
import { motion, AnimatePresence } from "framer-motion";

// Simple caret coordinate calculation helper
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
  const {
    top,
    left,
    width,
    height,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    letterSpacing,
    lineHeight,
    textTransform,
    wordSpacing,
    textIndent,
    whiteSpace,
    wordWrap,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
  } = window.getComputedStyle(element);

  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  style.fontFamily = fontFamily;
  style.fontSize = fontSize;
  style.fontWeight = fontWeight;
  style.fontStyle = fontStyle;
  style.letterSpacing = letterSpacing;
  style.lineHeight = lineHeight;
  style.textTransform = textTransform;
  style.wordSpacing = wordSpacing;
  style.textIndent = textIndent;
  
  // Box sizing
  style.width = width;
  style.height = height;
  style.paddingLeft = paddingLeft;
  style.paddingRight = paddingRight;
  style.paddingTop = paddingTop;
  style.paddingBottom = paddingBottom;
  style.borderLeftWidth = borderLeftWidth;
  style.borderRightWidth = borderRightWidth;
  style.borderTopWidth = borderTopWidth;
  style.borderBottomWidth = borderBottomWidth;

  // Transfer content
  const value = element.value.substring(0, position);
  div.textContent = value;

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const spanRect = span.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();

  const coordinates = {
    top: span.offsetTop + parseInt(borderTopWidth),
    left: span.offsetLeft + parseInt(borderLeftWidth),
    height: parseInt(lineHeight)
  };

  document.body.removeChild(div);

  return coordinates;
}

interface AIInputProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string) => void;
  className?: string;
  visible?: boolean;
}

export function AIInput({
  id = "ai-input",
  placeholder = "Type your message...",
  minHeight = 60,
  maxHeight = 200,
  onSubmit,
  className,
  visible = true,
}: AIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [inputValue, setInputValue] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0, height: 24 });
  const [isFocused, setIsFocused] = useState(false);

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const { selectionStart } = textareaRef.current;
      const coords = getCaretCoordinates(textareaRef.current, selectionStart);
      // Adjust for scroll position
      const scrollTop = textareaRef.current.scrollTop;
      setCursorPosition({
        top: coords.top - scrollTop,
        left: coords.left,
        height: coords.height
      });
    }
  };

  useEffect(() => {
    updateCursorPosition();
  }, [inputValue]);

  const handleReset = () => {
    if (!inputValue.trim()) return;
    onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
    // Reset cursor position
    setTimeout(updateCursorPosition, 0);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <motion.div
        layout
        initial={{
          width: minHeight,
          borderRadius: "100%",
          opacity: 0,
        }}
        animate={visible ? {
          width: "100%",
          borderRadius: "32px",
          opacity: 1,
          scale: 1
        } : {
          width: minHeight,
          borderRadius: "100%",
          opacity: 0,
          scale: 0.8
        }}
        transition={{
          opacity: { duration: 0.3 },
          width: {
            type: "spring",
            stiffness: 100,
            damping: 18,
          },
          borderRadius: {
            type: "spring",
            stiffness: 100,
            damping: 18,
          },
        }}
        style={{ minHeight: minHeight }}
        className={cn(
          "relative mx-auto bg-black/5 dark:bg-zinc-900/80 backdrop-blur-md overflow-hidden border border-white/5 shadow-xl",
        )}
      >
        <motion.div
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full"
        >
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "w-full max-w-3xl bg-transparent pl-8 pr-24 relative z-10",
              "placeholder:text-black/50 dark:placeholder:text-zinc-500",
              "border-none ring-0 focus:ring-0",
              "text-black dark:text-zinc-100 text-wrap",
              "overflow-y-auto resize-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "transition-all duration-200 ease-out", 
              "leading-relaxed py-4", 
              "text-lg",
              `min-h-[${minHeight}px]`,
              `max-h-[${maxHeight}px]`,
              "[&::-webkit-resizer]:hidden"
            )}
            style={{ caretColor: 'transparent' }}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
              updateCursorPosition();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReset();
              }
              updateCursorPosition();
            }}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onSelect={updateCursorPosition}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onScroll={updateCursorPosition}
          />

          {/* Custom Smooth Cursor */}
          <motion.div
            className="absolute bg-black dark:bg-white w-[2px] pointer-events-none"
            animate={{
              top: cursorPosition.top,
              left: cursorPosition.left,
              height: cursorPosition.height,
              opacity: isFocused ? 1 : 0
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
              mass: 0.5
            }}
            style={{
              position: 'absolute',
              zIndex: 50
            }}
          />

          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-xl bg-black/5 dark:bg-white/5 py-2 px-2 transition-all duration-200 ease-out",
              inputValue ? "right-16" : "right-6"
            )}
          >
            <Mic className="w-5 h-5 text-black/70 dark:text-white/70" />
          </div>

          <button
            onClick={handleReset}
            type="button"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-6",
              "rounded-xl bg-black/5 dark:bg-white/10 py-2 px-2",
              "transition-all duration-200 ease-out",
              inputValue
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            <CornerRightUp className="w-5 h-5 text-black/70 dark:text-white/70" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
