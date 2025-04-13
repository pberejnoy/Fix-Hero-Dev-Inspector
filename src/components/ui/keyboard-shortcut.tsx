import type React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KeyboardShortcutProps {
  shortcut: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function KeyboardShortcut({ shortcut, children, side = "bottom", align = "center" }: KeyboardShortcutProps) {
  // Format the shortcut for display
  const formattedShortcut = shortcut
    .replace("Ctrl", "⌃")
    .replace("Shift", "⇧")
    .replace("Alt", "⌥")
    .replace("Command", "⌘")
    .replace(/\+/g, " + ")

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className="text-xs">
          <div className="flex flex-col items-center">
            <span>Keyboard Shortcut</span>
            <kbd className="mt-1 inline-flex items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {formattedShortcut}
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
