// Background script for FixHero Dev Inspector
// Handles state management and communication between content script and popup

// Declare chrome if it's not already defined (e.g., in a testing environment)
declare const chrome: any

type Issue = {
  id: string
  timestamp: number
  url: string
  title: string
  elementDetails?: ElementDetails
  screenshot?: string
  consoleErrors?: ConsoleError[]
  networkErrors?: NetworkError[]
  notes?: string
  severity?: "low" | "medium" | "high" | "critical"
  category?: string
  tags?: string[]
  status?: "open" | "in-progress" | "resolved"
  sessionId?: string
}

type ElementDetails = {
  selector: string
  xpath: string
  text: string
  attributes: Record<string, string>
  styles: Record<string, string>
  position: { x: number; y: number; width: number; height: number }
  html: string
}

type ConsoleError = {
  message: string
  source: string
  lineNumber: number
  timestamp: number
}

type NetworkError = {
  url: string
  status: number
  statusText: string
  method: string
  timestamp: number
}

type Session = {
  id: string
  startTime: number
  issues: Issue[]
  url: string
}

// Initialize state
let currentSession: Session | null = null

// Create a new session
function createSession(url: string): Session {
  const session: Session = {
    id: generateId(),
    startTime: Date.now(),
    issues: [],
    url,
  }

  currentSession = session
  saveSession(session)
  return session
}

// Add issue to current session
function addIssue(issue: Issue): void {
  if (!currentSession) {
    return
  }

  currentSession.issues.push(issue)
  saveSession(currentSession)
}

// Save session to storage
function saveSession(session: Session): void {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [`session_${session.id}`]: session })

    // Update session list
    chrome.storage.local.get("sessions", (data) => {
      const sessions = data.sessions || []
      if (!sessions.includes(session.id)) {
        sessions.push(session.id)
        chrome.storage.local.set({ sessions })
      }
    })
  } else {
    console.warn("Chrome storage API not available. Session not saved.")
  }
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Initialize the extension
function initializeExtension() {
  // Check if Chrome APIs are available
  if (typeof chrome === "undefined") {
    console.warn("Chrome API not available. Extension may not function properly.")
    return
  }

  // Set up message listener
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "CREATE_SESSION":
          const session = createSession(message.url)
          sendResponse({ success: true, session })
          break

        case "ADD_ISSUE":
          addIssue(message.issue)
          sendResponse({ success: true })
          break

        case "GET_CURRENT_SESSION":
          sendResponse({ session: currentSession })
          break

        case "GET_ALL_SESSIONS":
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.get("sessions", (data) => {
              const sessionIds = data.sessions || []
              const promises = sessionIds.map(
                (id) =>
                  new Promise((resolve) => {
                    chrome.storage.local.get(`session_${id}`, (data) => {
                      resolve(data[`session_${id}`])
                    })
                  }),
              )

              Promise.all(promises).then((sessions) => {
                sendResponse({ sessions })
              })
            })
            return true // Keep the message channel open for async response
          } else {
            sendResponse({ sessions: [] })
          }
          break

        case "CLEAR_ALL_SESSIONS":
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.get("sessions", (data) => {
              const sessionIds = data.sessions || []
              sessionIds.forEach((id) => {
                chrome.storage.local.remove(`session_${id}`)
              })
              chrome.storage.local.set({ sessions: [] })
              currentSession = null
              sendResponse({ success: true })
            })
            return true
          } else {
            sendResponse({ success: false })
          }
          break

        case "OPEN_DASHBOARD":
          chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })
          sendResponse({ success: true })
          break
      }
    })
  } else {
    console.warn("Chrome runtime messaging not available. Extension communication will not work.")
  }

  // Set up command listener
  if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
      if (command === "open-dashboard") {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })
        return
      }

      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: command })
          }
        })
      }
    })
  }

  // Initialize session when extension is installed or updated
  if (chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            createSession(tabs[0].url)
          }
        })
      }
    })
  }
}

// Initialize the extension when the script loads
initializeExtension()
