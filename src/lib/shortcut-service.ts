// Keyboard shortcut service for FixHero Dev Inspector

// Default shortcuts
export const DEFAULT_SHORTCUTS = {
  takeScreenshot: {
    key: "S",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Take a screenshot of the current page",
  },
  addNote: {
    key: "N",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Add a note about the current page",
  },
  toggleSidebar: {
    key: "D",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Toggle the FixHero sidebar",
  },
  openDashboard: {
    key: "M",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Open the FixHero dashboard",
  },
  startInspection: {
    key: "I",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Start element inspection",
  },
  findProblems: {
    key: "P",
    ctrl: true,
    shift: true,
    alt: false,
    description: "Find problems on the page",
  },
}

// Shortcut type
export interface Shortcut {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  description: string
}

// Get all shortcuts
export function getShortcuts(): Record<string, Shortcut> {
  try {
    const savedShortcuts = localStorage.getItem("fixhero_shortcuts")
    if (savedShortcuts) {
      return JSON.parse(savedShortcuts)
    }
    return DEFAULT_SHORTCUTS
  } catch (error) {
    console.error("Error getting shortcuts:", error)
    return DEFAULT_SHORTCUTS
  }
}

// Get a specific shortcut
export function getShortcut(name: string): Shortcut | null {
  const shortcuts = getShortcuts()
  return shortcuts[name] || null
}

// Update a shortcut
export function updateShortcut(name: string, shortcut: Shortcut): void {
  try {
    const shortcuts = getShortcuts()
    shortcuts[name] = shortcut
    localStorage.setItem("fixhero_shortcuts", JSON.stringify(shortcuts))
  } catch (error) {
    console.error("Error updating shortcut:", error)
  }
}

// Reset shortcuts to defaults
export function resetShortcuts(): void {
  try {
    localStorage.setItem("fixhero_shortcuts", JSON.stringify(DEFAULT_SHORTCUTS))
  } catch (error) {
    console.error("Error resetting shortcuts:", error)
  }
}

// Format shortcut for display
export function formatShortcut(shortcut: Shortcut): string {
  const parts = []

  if (shortcut.ctrl) {
    parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl")
  }

  if (shortcut.shift) {
    parts.push("Shift")
  }

  if (shortcut.alt) {
    parts.push(navigator.platform.includes("Mac") ? "Option" : "Alt")
  }

  parts.push(shortcut.key.toUpperCase())

  return parts.join(" + ")
}

// Check if a keyboard event matches a shortcut
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return (
    event.key.toUpperCase() === shortcut.key.toUpperCase() &&
    event.ctrlKey === shortcut.ctrl &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt
  )
}

// Initialize keyboard shortcuts
export function initShortcuts(): void {
  // Only initialize if we're in a browser environment
  if (typeof window === "undefined") return

  // Ensure we have shortcuts in localStorage
  if (!localStorage.getItem("fixhero_shortcuts")) {
    localStorage.setItem("fixhero_shortcuts", JSON.stringify(DEFAULT_SHORTCUTS))
  }

  // Add global keyboard listener
  document.addEventListener("keydown", handleKeyDown)
}

// Handle keyboard events
function handleKeyDown(event: KeyboardEvent): void {
  // Don't trigger shortcuts when typing in input fields
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    (event.target instanceof HTMLElement && event.target.isContentEditable)
  ) {
    return
  }

  // Get all shortcuts
  const shortcuts = getShortcuts()

  // Check each shortcut
  for (const [name, shortcut] of Object.entries(shortcuts)) {
    if (matchesShortcut(event, shortcut)) {
      // Prevent default browser behavior
      event.preventDefault()

      // Trigger the appropriate action
      triggerShortcutAction(name)
      break
    }
  }
}

// Trigger action based on shortcut name
function triggerShortcutAction(name: string): void {
  // Send message to content script or background script
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.sendMessage({ action: name })
  } else {
    console.log(`Shortcut triggered: ${name}`)
  }
}
