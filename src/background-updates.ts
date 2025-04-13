// Import the context menu service
import { initContextMenu } from "./lib/context-menu-service"

// Initialize context menu when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`FixHero Dev Inspector installed: ${details.reason}`)

  // Initialize context menu
  initContextMenu()

  // Other initialization code...
})
