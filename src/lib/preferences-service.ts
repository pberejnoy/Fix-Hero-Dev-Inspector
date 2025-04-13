// Preferences service for FixHero Dev Inspector

// Type declaration for the global chrome object
declare const chrome: any

// Default preferences
export const DEFAULT_PREFERENCES = {
  theme: "system", // "light", "dark", "system"
  autoSync: true,
  notificationSounds: true,
  defaultSeverity: "medium",
  screenshotQuality: "high",
  showContextMenu: true,
  enableAccessibilityChecks: true,
  enablePerformanceMonitoring: true,
  enableOfflineMode: true,
  batchOperationsEnabled: true,
  maxSessionsToKeep: 50,
  maxIssuesPerSession: 200,
  compressScreenshots: true,
  autoTagIssues: true,
  keyboardShortcutsEnabled: true,
  advancedSearchEnabled: true,
  exportFormats: ["markdown", "json", "csv", "github", "cursor", "notion"],
}

// Preferences type
export type Preferences = typeof DEFAULT_PREFERENCES

// Get all preferences
export async function getPreferences(): Promise<Preferences> {
  return new Promise((resolve) => {
    // Check if we're in a Chrome extension environment
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get("preferences", (result) => {
        if (result.preferences) {
          // Merge with default preferences to ensure all fields exist
          resolve({ ...DEFAULT_PREFERENCES, ...result.preferences })
        } else {
          // Initialize with default preferences
          chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES })
          resolve(DEFAULT_PREFERENCES)
        }
      })
    } else {
      // Fallback to localStorage for development environment
      try {
        const storedPrefs = localStorage.getItem("fixhero_preferences")
        if (storedPrefs) {
          resolve({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) })
        } else {
          localStorage.setItem("fixhero_preferences", JSON.stringify(DEFAULT_PREFERENCES))
          resolve(DEFAULT_PREFERENCES)
        }
      } catch (error) {
        console.error("Error getting preferences:", error)
        resolve(DEFAULT_PREFERENCES)
      }
    }
  })
}

// Get a specific preference
export async function getPreference<K extends keyof Preferences>(key: K): Promise<Preferences[K]> {
  const preferences = await getPreferences()
  return preferences[key]
}

// Update preferences
export async function updatePreferences(updates: Partial<Preferences>): Promise<Preferences> {
  const currentPreferences = await getPreferences()
  const updatedPreferences = { ...currentPreferences, ...updates }

  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ preferences: updatedPreferences }, () => {
        resolve(updatedPreferences)
      })
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem("fixhero_preferences", JSON.stringify(updatedPreferences))
        resolve(updatedPreferences)
      } catch (error) {
        console.error("Error updating preferences:", error)
        resolve(currentPreferences)
      }
    }
  })
}

// Reset preferences to defaults
export async function resetPreferences(): Promise<Preferences> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({ preferences: DEFAULT_PREFERENCES }, () => {
        resolve(DEFAULT_PREFERENCES)
      })
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem("fixhero_preferences", JSON.stringify(DEFAULT_PREFERENCES))
        resolve(DEFAULT_PREFERENCES)
      } catch (error) {
        console.error("Error resetting preferences:", error)
        resolve(DEFAULT_PREFERENCES)
      }
    }
  })
}

// Listen for preference changes
export function onPreferencesChanged(callback: (preferences: Preferences) => void): () => void {
  const listener = (changes: any, areaName: string) => {
    if (areaName === "sync" && changes.preferences) {
      callback(changes.preferences.newValue)
    }
  }

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }

  // Fallback for development environment (no change detection)
  return () => {}
}
