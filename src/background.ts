// Background script for the FixHero Dev Inspector extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("FixHero Dev Inspector installed")

  // Create context menu items
  chrome.contextMenus.create({
    id: "fixhero-inspect",
    title: "Inspect with FixHero",
    contexts: ["all"],
  })

  chrome.contextMenus.create({
    id: "fixhero-screenshot",
    title: "Take Screenshot with FixHero",
    contexts: ["all"],
  })

  // Initialize first-time user experience flags
  chrome.storage.local.set({
    fixhero_first_login: true,
    fixhero_first_issue: true,
    fixhero_first_export: true,
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === "fixhero-inspect") {
    chrome.tabs.sendMessage(tab.id, { action: "startInspection" })
  } else if (info.menuItemId === "fixhero-screenshot") {
    chrome.tabs.sendMessage(tab.id, { action: "takeScreenshot" })
  }
})

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl })
    })
    return true // Indicates async response
  }

  if (message.action === "openPopup") {
    chrome.action.openPopup()
  }

  if (message.action === "getEnvironmentInfo") {
    sendResponse({
      version: chrome.runtime.getManifest().version,
      environment: process.env.NODE_ENV || "production",
    })
    return true
  }

  if (message.action === "playSound") {
    // Play sound if enabled in settings
    chrome.storage.local.get(["fixhero_settings_sounds"], (result) => {
      if (result.fixhero_settings_sounds !== false) {
        const audio = new Audio(message.soundUrl || "sounds/notification.mp3")
        audio.play().catch((error) => {
          console.error("Error playing sound:", error)
        })
      }
    })
  }
})

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return

    switch (command) {
      case "toggle-inspector":
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleInspection" })
        break
      case "take-screenshot":
        chrome.tabs.sendMessage(tabs[0].id, { action: "takeScreenshot" })
        break
      case "add-note":
        chrome.tabs.sendMessage(tabs[0].id, { action: "addNote" })
        break
      case "open-dashboard":
        chrome.action.openPopup()
        break
    }
  })
})

// Handle extension update
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log(`Update available: ${details.version}`)
  // Notify user about update
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "FixHero Update Available",
    message: `Version ${details.version} is available. Restart the browser to update.`,
  })
})

// Handle browser startup
chrome.runtime.onStartup.addListener(() => {
  // Check for any pending syncs
  chrome.storage.local.get(["fixhero_pending_sync"], (result) => {
    if (result.fixhero_pending_sync) {
      // Trigger sync when browser starts
      chrome.runtime.sendMessage({ action: "syncPending" })
    }
  })
})
