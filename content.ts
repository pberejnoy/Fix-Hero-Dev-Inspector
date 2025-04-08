// Content script for FixHero Dev Inspector
// Handles DOM interaction, element inspection, and screenshot capture

import html2canvas from "html2canvas"

// State
let isInspecting = false
let hoveredElement: HTMLElement | null = null
let sidebarInjected = false
const consoleErrors: any[] = []
const networkErrors: any[] = []

// Initialize
function init() {
  injectStyles()
  setupConsoleErrorCapture()
  setupNetworkErrorCapture()
  setupMessageListeners()
  injectSidebar()
}

// Inject custom styles
function injectStyles() {
  const style = document.createElement("style")
  style.textContent = `
    .fixhero-highlight {
      outline: 2px solid #ff5722 !important;
      outline-offset: 2px !important;
      position: relative;
    }
    
    .fixhero-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 2147483647;
      overflow: hidden;
      transition: transform 0.3s ease;
    }
    
    .fixhero-sidebar.hidden {
      transform: translateX(100%);
    }
    
    .fixhero-sidebar-toggle {
      position: fixed;
      top: 50%;
      right: 320px;
      transform: translateY(-50%);
      background: #ff5722;
      color: white;
      border: none;
      border-radius: 4px 0 0 4px;
      padding: 8px;
      cursor: pointer;
      z-index: 2147483647;
    }
    
    .fixhero-sidebar-toggle.hidden {
      right: 0;
    }

    /* Mobile responsive styles */
    @media (max-width: 768px) {
      .fixhero-sidebar {
        width: 100%;
        max-width: 100%;
      }
      
      .fixhero-sidebar-toggle {
        right: 0;
        top: 10px;
        transform: none;
        border-radius: 4px 0 0 4px;
      }
      
      .fixhero-sidebar-toggle.hidden {
        right: 0;
      }
    }
  `
  document.head.appendChild(style)
}

// Capture console errors
function setupConsoleErrorCapture() {
  const originalConsoleError = console.error
  console.error = (...args) => {
    const error = {
      message: args.map((arg) => String(arg)).join(" "),
      timestamp: Date.now(),
      source: "console",
      lineNumber: new Error().stack?.split("\n")[2]?.match(/(\d+):\d+\)?$/)?.[1] || 0,
    }
    consoleErrors.push(error)
    originalConsoleError.apply(console, args)
  }
}

// Capture network errors
function setupNetworkErrorCapture() {
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args)
      if (!response.ok) {
        networkErrors.push({
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          method: args[1]?.method || "GET",
          timestamp: Date.now(),
        })
      }
      return response
    } catch (error) {
      networkErrors.push({
        url: args[0].toString(),
        status: 0,
        statusText: error.message,
        method: args[1]?.method || "GET",
        timestamp: Date.now(),
      })
      throw error
    }
  }

  // Also capture XHR errors
  const originalXHROpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener("load", function () {
      if (this.status >= 400) {
        networkErrors.push({
          url: this.responseURL,
          status: this.status,
          statusText: this.statusText,
          method: args[0],
          timestamp: Date.now(),
        })
      }
    })
    return originalXHROpen.apply(this, args)
  }
}

// Setup message listeners
function setupMessageListeners() {
  // Check if chrome is defined and the runtime API is available
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) {
    console.warn(
      "Chrome runtime API is not available. This script is likely running outside of a Chrome extension context.",
    )
    return
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "START_INSPECTION":
          startInspection()
          sendResponse({ success: true })
          break

        case "STOP_INSPECTION":
          stopInspection()
          sendResponse({ success: true })
          break

        case "CAPTURE_ELEMENT":
          if (hoveredElement) {
            captureElement(hoveredElement)
              .then((data) => sendResponse({ success: true, data }))
              .catch((error) => sendResponse({ success: false, error: error.message }))
            return true // Keep the message channel open for async response
          }
          sendResponse({ success: false, error: "No element selected" })
          break

        case "TAKE_SCREENSHOT":
          captureScreenshot()
            .then((screenshot) => sendResponse({ success: true, screenshot }))
            .catch((error) => sendResponse({ success: false, error: error.message }))
          return true

        case "mark-bug":
          if (document.activeElement && document.activeElement !== document.body) {
            captureElement(document.activeElement as HTMLElement).then((data) => {
              if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: "ADD_ISSUE",
                  issue: {
                    id: Date.now().toString(36),
                    timestamp: Date.now(),
                    url: window.location.href,
                    title: `Bug on ${document.title}`,
                    elementDetails: data.elementDetails,
                    screenshot: data.screenshot,
                    consoleErrors: consoleErrors.slice(-5),
                    networkErrors: networkErrors.slice(-5),
                    severity: "medium",
                  },
                })
              }
            })
          }
          break

        case "take-screenshot":
          captureScreenshot().then((screenshot) => {
            if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: "ADD_ISSUE",
                issue: {
                  id: Date.now().toString(36),
                  timestamp: Date.now(),
                  url: window.location.href,
                  title: `Screenshot of ${document.title}`,
                  screenshot,
                  consoleErrors: consoleErrors.slice(-5),
                  networkErrors: networkErrors.slice(-5),
                },
              })
            }
          })
          break

        case "add-note":
          showNoteDialog()
          break
      }
    })
  } catch (error) {
    console.error("Error setting up message listener:", error)
  }
}

// Start element inspection mode
function startInspection() {
  if (isInspecting) return

  isInspecting = true

  document.addEventListener("mouseover", handleMouseOver)
  document.addEventListener("mouseout", handleMouseOut)
  document.addEventListener("click", handleClick, true)
}

// Stop element inspection mode
function stopInspection() {
  if (!isInspecting) return

  isInspecting = false

  document.removeEventListener("mouseover", handleMouseOver)
  document.removeEventListener("mouseout", handleMouseOut)
  document.removeEventListener("click", handleClick, true)

  if (hoveredElement) {
    hoveredElement.classList.remove("fixhero-highlight")
    hoveredElement = null
  }
}

// Handle mouse over event
function handleMouseOver(event: MouseEvent) {
  if (!isInspecting) return

  const target = event.target as HTMLElement

  if (hoveredElement) {
    hoveredElement.classList.remove("fixhero-highlight")
  }

  hoveredElement = target
  hoveredElement.classList.add("fixhero-highlight")
}

// Handle mouse out event
function handleMouseOut(event: MouseEvent) {
  if (!isInspecting || !hoveredElement) return

  hoveredElement.classList.remove("fixhero-highlight")
  hoveredElement = null
}

// Handle click event
function handleClick(event: MouseEvent) {
  if (!isInspecting || !hoveredElement) return

  event.preventDefault()
  event.stopPropagation()

  captureElement(hoveredElement)
    .then((data) => {
      // Check if chrome is defined
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "ADD_ISSUE",
          issue: {
            id: Date.now().toString(36),
            timestamp: Date.now(),
            url: window.location.href,
            title: `Issue on ${document.title}`,
            elementDetails: data.elementDetails,
            screenshot: data.screenshot,
            consoleErrors: consoleErrors.slice(-5),
            networkErrors: networkErrors.slice(-5),
            severity: "medium",
          },
        })
      }

      // Send message to sidebar
      const sidebarFrame = document.getElementById("fixhero-sidebar-frame") as HTMLIFrameElement
      if (sidebarFrame && sidebarFrame.contentWindow) {
        sidebarFrame.contentWindow.postMessage(
          {
            type: "ELEMENT_CAPTURED",
            data,
          },
          "*",
        )
      }
    })
    .catch((error) => console.error("Error capturing element:", error))

  stopInspection()
}

// Capture element details and screenshot
async function captureElement(element: HTMLElement) {
  // Get element details
  const elementDetails = {
    selector: getCssSelector(element),
    xpath: getXPath(element),
    text: element.textContent || "",
    attributes: getAttributes(element),
    styles: getComputedStyles(element),
    position: element.getBoundingClientRect().toJSON(),
    html: element.outerHTML,
  }

  // Take screenshot of element
  const screenshot = await captureElementScreenshot(element)

  return {
    elementDetails,
    screenshot,
    timestamp: Date.now(),
  }
}

// Get CSS selector for element
function getCssSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`
  }

  if (element.className && typeof element.className === "string") {
    return `.${element.className.trim().replace(/\s+/g, ".")}`
  }

  let selector = element.tagName.toLowerCase()
  const parent = element.parentElement

  if (parent) {
    const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName)

    if (siblings.length > 1) {
      const index = siblings.indexOf(element)
      selector += `:nth-child(${index + 1})`
    }
  }

  return selector
}

// Get XPath for element
function getXPath(element: HTMLElement): string {
  if (element === document.body) {
    return "/html/body"
  }

  let path = ""
  let current = element

  while (current && current !== document.body) {
    let index = 1
    let sibling = current.previousElementSibling

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.tagName.toLowerCase()
    path = `/${tagName}[${index}]${path}`

    current = current.parentElement as HTMLElement
  }

  return `/html/body${path}`
}

// Get element attributes
function getAttributes(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {}

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attributes[attr.name] = attr.value
  }

  return attributes
}

// Get computed styles for element
function getComputedStyles(element: HTMLElement): Record<string, string> {
  const styles: Record<string, string> = {}
  const computed = window.getComputedStyle(element)

  const importantStyles = [
    "display",
    "position",
    "width",
    "height",
    "margin",
    "padding",
    "color",
    "background-color",
    "font-size",
    "font-family",
    "border",
    "border-radius",
    "z-index",
    "opacity",
    "visibility",
  ]

  importantStyles.forEach((style) => {
    styles[style] = computed.getPropertyValue(style)
  })

  return styles
}

// Capture screenshot of element
async function captureElementScreenshot(element: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      logging: false,
      scale: window.devicePixelRatio,
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error capturing element screenshot:", error)
    return ""
  }
}

// Capture full page screenshot
async function captureScreenshot(): Promise<string> {
  try {
    const canvas = await html2canvas(document.documentElement, {
      logging: false,
      scale: window.devicePixelRatio,
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error capturing screenshot:", error)
    return ""
  }
}

// Show note dialog
function showNoteDialog() {
  const dialog = document.createElement("div")
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    width: 90%;
    max-width: 400px;
  `

  dialog.innerHTML = `
    <h3 style="margin-top: 0; font-family: sans-serif;">Add Note</h3>
    <textarea id="fixhero-note-input" style="width: 100%; height: 100px; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: sans-serif;"></textarea>
    <div style="display: flex; justify-content: flex-end; gap: 8px;">
      <button id="fixhero-note-cancel" style="padding: 8px 16px; border: none; border-radius: 4px; background: #f1f1f1; cursor: pointer; font-family: sans-serif;">Cancel</button>
      <button id="fixhero-note-save" style="padding: 8px 16px; border: none; border-radius: 4px; background: #ff5722; color: white; cursor: pointer; font-family: sans-serif;">Save</button>
    </div>
  `

  document.body.appendChild(dialog)

  const noteInput = document.getElementById("fixhero-note-input") as HTMLTextAreaElement
  const cancelButton = document.getElementById("fixhero-note-cancel")
  const saveButton = document.getElementById("fixhero-note-save")

  noteInput.focus()

  cancelButton?.addEventListener("click", () => {
    document.body.removeChild(dialog)
  })

  saveButton?.addEventListener("click", () => {
    const note = noteInput.value.trim()

    if (note) {
      captureScreenshot().then((screenshot) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: "ADD_ISSUE",
            issue: {
              id: Date.now().toString(36),
              timestamp: Date.now(),
              url: window.location.href,
              title: `Note on ${document.title}`,
              notes: note,
              screenshot,
            },
          })
        }
      })
    }

    document.body.removeChild(dialog)
  })
}

// Inject sidebar iframe
function injectSidebar() {
  if (sidebarInjected) return

  // Check if chrome runtime is available
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.getURL) {
    console.warn("Chrome runtime API is not available. Sidebar injection skipped.")
    return
  }

  try {
    const sidebarContainer = document.createElement("div")
    sidebarContainer.className = "fixhero-sidebar hidden"
    sidebarContainer.id = "fixhero-sidebar-container"

    const iframe = document.createElement("iframe")
    iframe.id = "fixhero-sidebar-frame"
    iframe.style.cssText = "width: 100%; height: 100%; border: none;"
    iframe.src = chrome.runtime.getURL("sidebar.html")

    sidebarContainer.appendChild(iframe)

    const toggleButton = document.createElement("button")
    toggleButton.className = "fixhero-sidebar-toggle"
    toggleButton.id = "fixhero-sidebar-toggle"
    toggleButton.innerHTML = "◀"
    toggleButton.title = "Toggle FixHero Sidebar"

    toggleButton.addEventListener("click", () => {
      const sidebar = document.getElementById("fixhero-sidebar-container")
      if (sidebar) {
        const isHidden = sidebar.classList.contains("hidden")
        sidebar.classList.toggle("hidden")
        toggleButton.innerHTML = isHidden ? "▶" : "◀"
        toggleButton.classList.toggle("hidden", !isHidden)
      }
    })

    document.body.appendChild(sidebarContainer)
    document.body.appendChild(toggleButton)

    sidebarInjected = true

    // Listen for messages from sidebar
    window.addEventListener("message", (event) => {
      if (event.data.type === "START_INSPECTION") {
        startInspection()
      } else if (event.data.type === "STOP_INSPECTION") {
        stopInspection()
      }
    })
  } catch (error) {
    console.error("Error injecting sidebar:", error)
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

// Create a session when the page loads
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
  try {
    chrome.runtime.sendMessage({
      type: "CREATE_SESSION",
      url: window.location.href,
    })
  } catch (error) {
    console.warn("Error creating session:", error)
  }
} else {
  console.warn("Chrome runtime messaging is not available. Session creation skipped.")
}
