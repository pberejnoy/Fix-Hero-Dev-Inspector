/**
 * Service for managing the extension's icon state
 */

// Type declaration for the global chrome object
declare const chrome: any

// Icon states
export enum IconState {
  DEFAULT = "default",
  ACTIVE = "active",
  INSPECTING = "inspecting",
  OFFLINE = "offline",
  ERROR = "error",
}

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

/**
 * Update the extension icon based on the current state
 * @param state The current state of the extension
 */
export function updateIcon(state: IconState): void {
  if (!isExtensionEnvironment) {
    console.log("Icon update is only available in the extension environment")
    return
  }

  let iconPath: { [key: string]: string } = {}
  let title = "FixHero Dev Inspector"

  switch (state) {
    case IconState.ACTIVE:
      iconPath = {
        16: "assets/icons/icon-active-16.png",
        32: "assets/icons/icon-active-32.png",
        48: "assets/icons/icon-active-48.png",
        128: "assets/icons/icon-active-128.png",
      }
      title = "FixHero Dev Inspector (Active)"
      break
    case IconState.INSPECTING:
      iconPath = {
        16: "assets/icons/icon-inspecting-16.png",
        32: "assets/icons/icon-inspecting-32.png",
        48: "assets/icons/icon-inspecting-48.png",
        128: "assets/icons/icon-inspecting-128.png",
      }
      title = "FixHero Dev Inspector (Inspecting)"
      break
    case IconState.OFFLINE:
      iconPath = {
        16: "assets/icons/icon-offline-16.png",
        32: "assets/icons/icon-offline-32.png",
        48: "assets/icons/icon-offline-48.png",
        128: "assets/icons/icon-offline-128.png",
      }
      title = "FixHero Dev Inspector (Offline)"
      break
    case IconState.ERROR:
      iconPath = {
        16: "assets/icons/icon-error-16.png",
        32: "assets/icons/icon-error-32.png",
        48: "assets/icons/icon-error-48.png",
        128: "assets/icons/icon-error-128.png",
      }
      title = "FixHero Dev Inspector (Error)"
      break
    default:
      iconPath = {
        16: "assets/icons/icon-16.png",
        32: "assets/icons/icon-32.png",
        48: "assets/icons/icon-48.png",
        128: "assets/icons/icon-128.png",
      }
      title = "FixHero Dev Inspector"
  }

  // Update the icon
  chrome.action.setIcon({ path: iconPath })

  // Update the title
  chrome.action.setTitle({ title })
}

/**
 * Set a badge on the extension icon
 * @param text The text to display on the badge
 * @param backgroundColor The background color of the badge
 */
export function setBadge(text: string, backgroundColor = "#FF5722"): void {
  if (!isExtensionEnvironment) {
    console.log("Badge update is only available in the extension environment")
    return
  }

  // Set badge text
  chrome.action.setBadgeText({ text })

  // Set badge background color
  chrome.action.setBadgeBackgroundColor({ color: backgroundColor })
}

/**
 * Clear the badge on the extension icon
 */
export function clearBadge(): void {
  if (!isExtensionEnvironment) {
    console.log("Badge update is only available in the extension environment")
    return
  }

  // Clear badge text
  chrome.action.setBadgeText({ text: "" })
}

/**
 * Show a notification count on the badge
 * @param count The number to display
 */
export function showNotificationCount(count: number): void {
  if (count <= 0) {
    clearBadge()
    return
  }

  // Format the count (e.g., 99+ for large numbers)
  const formattedCount = count > 99 ? "99+" : count.toString()

  // Set the badge
  setBadge(formattedCount, "#FF5722")
}
