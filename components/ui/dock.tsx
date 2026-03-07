import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"
import { LucideIcon } from "lucide-react"

interface DockProps {
  className?: string
  items: {
    icon: LucideIcon
    label: string
    onClick?: () => void
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.15, y: -4 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onClick}
        className={cn(
          "relative group p-3.5 rounded-full flex items-center justify-center",
          "hover:bg-[var(--bg-hover)] transition-colors duration-300",
          className
        )}
      >
        <Icon className="w-5 h-5 text-[var(--text-primary)]" />
        <span className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2",
          "px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm",
          "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
          "transition-all duration-200 whitespace-nowrap pointer-events-none"
        )}>
          {label}
        </span>
      </motion.button>
    )
  }
)
DockIconButton.displayName = "DockIconButton"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full h-auto flex items-center justify-center p-2", className)}>
        <div className="w-full max-w-4xl flex items-center justify-center relative">
          <motion.div
            className={cn(
              "flex items-center gap-2 p-2 rounded-full",
              "backdrop-blur-xl border shadow-lg",
              "bg-[var(--bg-card)]/80 border-[var(--border-color)]",
              "hover:shadow-xl transition-shadow duration-500"
            )}
          >
            {items.map((item) => (
              <DockIconButton key={item.label} {...item} />
            ))}
          </motion.div>
        </div>
      </div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock }
