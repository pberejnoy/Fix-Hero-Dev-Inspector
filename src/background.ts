// Type declaration for the global chrome object
declare const chrome: any

// Add this import at the top of the file
import { updateIcon, showNotificationCount } from "./lib/icon-service"
// Add this import at the top of the file
import { backgroundTaskManager, TaskType, TaskPriority } from "./lib/background-task-manager"

// Check if we're in a Chrome extension environment
const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

// Initialize state
let state = {
  isInspecting: false,
  activeSessions: {},
  pendingScreenshots: {},
  pendingNotes: {},
}

console.log("Background script loaded!")

// Only run extension-specific code if we're in an extension environment
if (isExtensionEnvironment) {
  console.log("FixHero Dev Inspector background script running in extension environment")

  // Listen for installation
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("FixHero Dev Inspector installed!")
    console.log(`FixHero Dev Inspector installed: ${details.reason}`)

    // Set up initial storage if needed
    if (details.reason === "install") {
      chrome.storage.local.set({
        settings: {
          theme: "light",
          autoSync: true,
          defaultSeverity: "medium",
          notificationSounds: true,
          screenshotQuality: "high",
        },
        sessions: [],
        lastActiveSession: null,
      })
    }

    // Show welcome page on install or update
    if (details.reason === "install") {
      chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") })
    }

    // Create context menu items
    createContextMenus()
  })

  // Then, in the initialization code, add these tasks:
  // Register sync task
  backgroundTaskManager.registerTask({
    id: "sync-data",
    type: TaskType.SYNC,
    priority: TaskPriority.MEDIUM,
    execute: async () => {
      console.log("Syncing data...")
      // Sync data with Firebase
      // This would be implemented with Firebase
    },
    interval: 5 * 60 * 1000, // Every 5 minutes
  })

  // Register cleanup task
  backgroundTaskManager.registerTask({
    id: "cleanup-old-data",
    type: TaskType.CLEANUP,
    priority: TaskPriority.LOW,
    execute: async () => {
      console.log("Cleaning up old data...")
      // Clean up old data
      // This would remove old sessions, screenshots, etc.
    },
    interval: 24 * 60 * 60 * 1000, // Once a day
  })

  // Register analytics task
  backgroundTaskManager.registerTask({
    id: "send-analytics",
    type: TaskType.ANALYTICS,
    priority: TaskPriority.LOW,
    execute: async () => {
      console.log("Sending analytics...")
      // Send analytics data
      // This would send usage data to Firebase Analytics
    },
    interval: 30 * 60 * 1000, // Every 30 minutes
  })

  // Create context menu items
  function createContextMenus() {
    // Remove existing items to avoid duplicates
    chrome.contextMenus.removeAll(() => {
      // Main menu item
      chrome.contextMenus.create({
        id: "fixhero-main",
        title: "FixHero Dev Inspector",
        contexts: ["all"],
      })

      // Inspect element
      chrome.contextMenus.create({
        id: "fixhero-inspect",
        parentId: "fixhero-main",
        title: "Inspect Element",
        contexts: ["all"],
      })

      // Take screenshot
      chrome.contextMenus.create({
        id: "fixhero-screenshot",
        parentId: "fixhero-main",
        title: "Take Screenshot",
        contexts: ["all"],
      })

      // Add note
      chrome.contextMenus.create({
        id: "fixhero-note",
        parentId: "fixhero-main",
        title: "Add Note",
        contexts: ["all"],
      })

      // Report issue
      chrome.contextMenus.create({
        id: "fixhero-report",
        parentId: "fixhero-main",
        title: "Report Issue",
        contexts: ["all"],
      })

      // Separator
      chrome.contextMenus.create({
        id: "fixhero-separator",
        parentId: "fixhero-main",
        type: "separator",
        contexts: ["all"],
      })

      // Open dashboard
      chrome.contextMenus.create({
        id: "fixhero-dashboard",
        parentId: "fixhero-main",
        title: "Open Dashboard",
        contexts: ["all"],
      })
    })
  }

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id) return

    switch (info.menuItemId) {
      case "fixhero-inspect":
        chrome.tabs.sendMessage(tab.id, { action: "startInspection" })
        break
      case "fixhero-screenshot":
        chrome.tabs.sendMessage(tab.id, { action: "takeScreenshot" })
        break
      case "fixhero-note":
        chrome.tabs.sendMessage(tab.id, { action: "addNote" })
        break
      case "fixhero-report":
        chrome.tabs.sendMessage(tab.id, { action: "reportIssue", elementInfo: info.targetElementId })
        break
      case "fixhero-dashboard":
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
        break
    }
  })

  // Listen for commands (keyboard shortcuts)
  chrome.commands.onCommand.addListener((command) => {
    console.log(`Command received: ${command}`)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (!activeTab || !activeTab.id) return

      switch (command) {
        case "take-screenshot":
          chrome.tabs.sendMessage(activeTab.id, { action: "take-screenshot" })
          break
        case "add-note":
          chrome.tabs.sendMessage(activeTab.id, { action: "add-note" })
          break
        case "toggle-sidebar":
          chrome.tabs.sendMessage(activeTab.id, { action: "toggle-sidebar" })
          break
        case "open-dashboard":
          chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
          break
      }
    })
  })

  // Listen for messages from content scripts or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension")
    if (request.greeting === "hello") sendResponse({ farewell: "goodbye" })
  })
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message.action)

    // Handle different message types
    switch (message.action) {
      case "store-screenshot":
        handleStoreScreenshot(message, sender, sendResponse)
        break
      case "store-note":
        handleStoreNote(message, sender, sendResponse)
        break
      case "get-page-data":
        handleGetPageData(message, sender, sendResponse)
        break
      case "playSound":
        handlePlaySound(message, sender, sendResponse)
        break
      case "elementCaptured":
        handleElementCaptured(message, sender, sendResponse)
        break
      case "consoleError":
        handleConsoleError(message, sender, sendResponse)
        break
      case "networkError":
        handleNetworkError(message, sender, sendResponse)
        break
      case "unhandledError":
        handleUnhandledError(message, sender, sendResponse)
        break
      case "getState":
        sendResponse({ state })
        break
      case "updateState":
        state = { ...state, ...message.state }
        sendResponse({ success: true })
        break
      case "updateContextMenus":
        // Update context menus based on current state
        updateContextMenus(message.isInspecting)
        sendResponse({ success: true })
        break
      // Then, in the message handler, add this case:
      case "updateIcon":
        updateIcon(message.state)
        if (message.badgeCount) {
          showNotificationCount(message.badgeCount)
        }
        sendResponse({ success: true })
        break
    }

    // Keep the message channel open for async responses
    return true
  })

  // Update context menus based on state
  function updateContextMenus(isInspecting) {
    if (isInspecting) {
      chrome.contextMenus.update("fixhero-inspect", {
        title: "Stop Inspection",
      })
    } else {
      chrome.contextMenus.update("fixhero-inspect", {
        title: "Inspect Element",
      })
    }
  }

  // Handle tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
      // Notify content script that the page has loaded
      chrome.tabs.sendMessage(tabId, { action: "pageLoaded", url: tab.url }).catch(() => {
        // Content script might not be loaded yet, which is fine
      })
    }
  })
}

// Message handlers
async function handleStoreScreenshot(message, sender, sendResponse) {
  try {
    // Get current user and active session
    const { currentUser, activeSession } = await getCurrentUserAndSession()

    if (!currentUser) {
      // Store screenshot locally if not logged in
      const screenshots = (await getLocalData("screenshots")) || []
      screenshots.push({
        id: generateId(),
        url: message.url,
        title: message.title,
        timestamp: message.timestamp,
        screenshot: message.screenshot,
      })
      await setLocalData("screenshots", screenshots)
    } else {
      // Store in Firebase if logged in
      // This would be implemented with Firebase Storage
      console.log("Storing screenshot in Firebase")
    }

    sendResponse({ success: true })
  } catch (error) {
    console.error("Error storing screenshot:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleStoreNote(message, sender, sendResponse) {
  try {
    // Get current user and active session
    const { currentUser, activeSession } = await getCurrentUserAndSession()

    if (!currentUser) {
      // Store note locally if not logged in
      const notes = (await getLocalData("notes")) || []
      notes.push({
        id: generateId(),
        url: message.url,
        title: message.title,
        timestamp: message.timestamp,
        content: message.content,
      })
      await setLocalData("notes", notes)
    } else {
      // Store in Firebase if logged in
      // This would be implemented with Firestore
      console.log("Storing note in Firebase")
    }

    sendResponse({ success: true })
  } catch (error) {
    console.error("Error storing note:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleGetPageData(message, sender, sendResponse) {
  try {
    const url = message.url

    // Get data for the current page
    const screenshots = (await getLocalData("screenshots")) || []
    const notes = (await getLocalData("notes")) || []

    // Filter by URL
    const pageScreenshots = screenshots.filter((s) => s.url === url)
    const pageNotes = notes.filter((n) => n.url === url)

    sendResponse({
      success: true,
      data: {
        screenshots: pageScreenshots,
        notes: pageNotes,
      },
    })
  } catch (error) {
    console.error("Error getting page data:", error)
    sendResponse({ success: false, error: error.message })
  }
}

function handlePlaySound(message, sender, sendResponse) {
  try {
    // Check if sound notifications are enabled
    chrome.storage.local.get("settings", (result) => {
      const settings = result.settings || {}
      if (settings.notificationSounds !== false) {
        // Play the sound
        const audio = new Audio(chrome.runtime.getURL(message.soundUrl))
        audio.play()
      }
    })

    sendResponse({ success: true })
  } catch (error) {
    console.error("Error playing sound:", error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleElementCaptured(message, sender, sendResponse) {
  try {
    // Get current user and active session
    const { currentUser, activeSession } = await getCurrentUserAndSession()

    // Create a new issue
    const issue = {
      id: generateId(),
      timestamp: Date.now(),
      url: sender.tab?.url || "",
      title: `Element: ${message.elementDetails.tagName || "Unknown"}`,
      severity: "medium", // Default severity
      elementDetails: message.elementDetails,
      consoleErrors: [],
      networkErrors: [],
      notes: "",
      tags: [],
    }

    if (!currentUser) {
      // Store issue locally if not logged in
      const issues = (await getLocalData("issues")) || []
      issues.push(issue)
      await setLocalData("issues", issues)
    } else {
      // Store in Firebase if logged in
      // This would be implemented with Firestore
      console.log("Storing issue in Firebase")
    }

    sendResponse({ success: true, issue })
  } catch (error) {
    console.error("Error handling element capture:", error)
    sendResponse({ success: false, error: error.message })
  }
}

function handleConsoleError(message, sender, sendResponse) {
  // Store console error for the current page
  // This would be associated with the active session or issue
  console.log("Console error:", message.error)
  sendResponse({ success: true })
}

function handleNetworkError(message, sender, sendResponse) {
  // Store network error for the current page
  // This would be associated with the active session or issue
  console.log("Network error:", message.error)
  sendResponse({ success: true })
}

function handleUnhandledError(message, sender, sendResponse) {
  // Store unhandled error for the current page
  // This would be associated with the active session or issue
  console.log("Unhandled error:", message.error)
  sendResponse({ success: true })
}

// Helper functions
async function getCurrentUserAndSession() {
  // This would get the current user from Firebase Auth
  // and the active session from storage
  return {
    currentUser: null, // Would be the Firebase user
    activeSession: null, // Would be the active session
  }
}

async function getLocalData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key])
    })
  })
}

async function setLocalData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve(true)
    })
  })
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}
