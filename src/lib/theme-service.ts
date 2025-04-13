// Theme service for FixHero Dev Inspector

// Theme types
export type Theme = "light" | "dark" | "system"

// Get the current theme
export function getTheme(): Theme {
  const savedTheme = localStorage.getItem("fixhero_theme") as Theme
  return savedTheme || "system"
}

// Set the theme
export function setTheme(theme: Theme): void {
  localStorage.setItem("fixhero_theme", theme)
  applyTheme(theme)
}

// Apply the theme to the document
export function applyTheme(theme: Theme): void {
  // If theme is system, check system preference
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    theme = prefersDark ? "dark" : "light"
  }

  // Apply the theme
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

// Initialize theme on page load
export function initTheme(): void {
  const theme = getTheme()
  applyTheme(theme)

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (getTheme() === "system") {
      applyTheme("system")
    }
  })
}
