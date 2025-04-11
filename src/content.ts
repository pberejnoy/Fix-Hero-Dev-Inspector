// Content script for the FixHero Dev Inspector extension

// Global variables
let isInspecting = false
let highlightedElement: HTMLElement | null = null
let highlightOverlay: HTMLElement | null = null

// Initialize when the content script loads
function initialize() {
  console.log("FixHero Dev Inspector content script initialized")

  // Create a message port to the background script
  const port = chrome.runtime.connect({ name: "fixhero-content" })

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startInspection") {
      startInspection()
      sendResponse({ success: true })
    } else if (message.action === "stopInspection") {
      stopInspection()
      sendResponse({ success: true })
    } else if (message.action === "toggleInspection") {
      if (isInspecting) {
        stopInspection()
      } else {
        startInspection()
      }
      sendResponse({ success: true })
    } else if (message.action === "takeScreenshot") {
      takeScreenshot()
      sendResponse({ success: true })
    } else if (message.action === "highlightElement") {
      highlightElement(message.selector)
      sendResponse({ success: true })
    } else if (message.action === "getPageInfo") {
      sendResponse(getPageInfo())
    } else if (message.action === "addNote") {
      // Send message to open popup with note form
      chrome.runtime.sendMessage({ action: "openPopup", view: "addNote" })
      sendResponse({ success: true })
    }

    return true // Indicates async response
  })

  // Capture console errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    // Send error to background script
    chrome.runtime.sendMessage({
      action: "consoleError",
      error: args.map((arg) => String(arg)).join(" "),
    })

    // Call original console.error
    originalConsoleError.apply(console, args)
  }

  // Capture unhandled errors
  window.addEventListener("error", (event) => {
    chrome.runtime.sendMessage({
      action: "unhandledError",
      error: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || "",
      },
    })
  })

  // Capture network errors using fetch
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args)

      // If response is not ok (status outside 200-299)
      if (!response.ok) {
        chrome.runtime.sendMessage({
          action: "networkError",
          error: {
            type: "fetch",
            url: typeof args[0] === "string" ? args[0] : args[0].url,
            status: response.status,
            statusText: response.statusText,
          },
        })
      }

      return response
    } catch (error) {
      // Network error or other fetch error
      chrome.runtime.sendMessage({
        action: "networkError",
        error: {
          type: "fetch",
          url: typeof args[0] === "string" ? args[0] : args[0].url,
          message: error.message,
        },
      })

      throw error
    }
  }

  // Capture XMLHttpRequest errors
  const originalXHROpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (...args) {
    const url = args[1]

    this.addEventListener("load", () => {
      if (this.status >= 400) {
        chrome.runtime.sendMessage({
          action: "networkError",
          error: {
            type: "xhr",
            url,
            status: this.status,
            statusText: this.statusText,
          },
        })
      }
    })

    this.addEventListener("error", () => {
      chrome.runtime.sendMessage({
        action: "networkError",
        error: {
          type: "xhr",
          url,
          message: "Network error",
        },
      })
    })

    return originalXHROpen.apply(this, args)
  }
}

// Start element inspection mode
function startInspection() {
  if (isInspecting) return
  isInspecting = true

  // Create overlay for highlighting elements
  createHighlightOverlay()

  // Add event listeners
  document.addEventListener("mouseover", handleMouseOver)
  document.addEventListener("mouseout", handleMouseOut)
  document.addEventListener("click", handleClick, true)

  // Change cursor to indicate inspection mode
  document.body.classList.add("inspection-mode")

  // Play sound
  chrome.runtime.sendMessage({
    action: "playSound",
    soundUrl: "sounds/inspection-start.mp3",
  })

  // Notify user
  showNotification("Inspection mode active. Click on an element to inspect it.")
}

// Stop element inspection mode
function stopInspection() {
  if (!isInspecting) return
  isInspecting = false

  // Remove event listeners
  document.removeEventListener("mouseover", handleMouseOver)
  document.removeEventListener("mouseout", handleMouseOut)
  document.removeEventListener("click", handleClick, true)

  // Reset cursor
  document.body.classList.remove("inspection-mode")

  // Remove highlight overlay
  if (highlightOverlay && highlightOverlay.parentNode) {
    highlightOverlay.parentNode.removeChild(highlightOverlay)
    highlightOverlay = null
  }

  // Play sound
  chrome.runtime.sendMessage({
    action: "playSound",
    soundUrl: "sounds/inspection-stop.mp3",
  })

  // Notify user
  showNotification("Inspection mode deactivated.")
}

// Handle mouseover during inspection
function handleMouseOver(event: MouseEvent) {
  if (!isInspecting) return

  const target = event.target as HTMLElement
  highlightedElement = target

  // Update highlight overlay
  updateHighlightOverlay(target)

  // Prevent default behavior
  event.preventDefault()
  event.stopPropagation()
}

// Handle mouseout during inspection
function handleMouseOut(event: MouseEvent) {
  if (!isInspecting || !highlightOverlay) return

  // Hide highlight overlay
  highlightOverlay.style.display = "none"

  // Prevent default behavior
  event.preventDefault()
  event.stopPropagation()
}

// Handle click during inspection
function handleClick(event: MouseEvent) {
  if (!isInspecting || !highlightedElement) return

  // Capture element details
  const elementDetails = captureElementDetails(highlightedElement)

  // Send to background script
  chrome.runtime.sendMessage({
    action: "elementCaptured",
    elementDetails,
  })

  // Stop inspection
  stopInspection()

  // Prevent default behavior
  event.preventDefault()
  event.stopPropagation()

  // Play sound
  chrome.runtime.sendMessage({
    action: "playSound",
    soundUrl: "sounds/element-captured.mp3",
  })

  // Show confirmation
  showNotification("Element captured successfully!")
}

// Create highlight overlay
function createHighlightOverlay() {
  if (highlightOverlay) return

  highlightOverlay = document.createElement("div")
  highlightOverlay.style.position = "absolute"
  highlightOverlay.style.border = "2px solid #ff5722"
  highlightOverlay.style.backgroundColor = "rgba(255, 87, 34, 0.1)"
  highlightOverlay.style.pointerEvents = "none"
  highlightOverlay.style.zIndex = "9999"
  highlightOverlay.style.display = "none"
  highlightOverlay.style.transition = "all 0.1s ease-in-out"
  highlightOverlay.style.boxShadow = "0 0 10px rgba(255, 87, 34, 0.5)"

  document.body.appendChild(highlightOverlay)
}

// Update highlight overlay position and size
function updateHighlightOverlay(element: HTMLElement) {
  if (!highlightOverlay) return

  const rect = element.getBoundingClientRect()

  highlightOverlay.style.top = `${rect.top + window.scrollY}px`
  highlightOverlay.style.left = `${rect.left + window.scrollX}px`
  highlightOverlay.style.width = `${rect.width}px`
  highlightOverlay.style.height = `${rect.height}px`
  highlightOverlay.style.display = "block"
}

// Highlight a specific element by selector
function highlightElement(selector: string) {
  try {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    createHighlightOverlay()
    updateHighlightOverlay(element)

    // Auto-remove highlight after 3 seconds
    setTimeout(() => {
      if (highlightOverlay) {
        highlightOverlay.style.display = "none"
      }
    }, 3000)
  } catch (error) {
    console.error("Error highlighting element:", error)
  }
}

// Capture element details
function captureElementDetails(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(element)

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id,
    className: element.className,
    textContent: element.textContent?.trim().substring(0, 100) || "",
    attributes: Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    })),
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    styles: {
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      display: computedStyle.display,
      position: computedStyle.position,
      visibility: computedStyle.visibility,
      zIndex: computedStyle.zIndex,
    },
    xpath: getXPath(element),
    selector: getCssSelector(element),
  }
}

// Get XPath for an element
function getXPath(element: HTMLElement): string {
  if (!element) return ""

  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  if (element === document.body) {
    return "/html/body"
  }

  if (!element.parentElement) {
    return ""
  }

  const sameTagSiblings = Array.from(element.parentElement.children).filter(
    (sibling) => sibling.tagName === element.tagName,
  )

  const index = sameTagSiblings.indexOf(element) + 1

  return `${getXPath(element.parentElement)}/${element.tagName.toLowerCase()}[${index}]`
}

// Get CSS selector for an element
function getCssSelector(element: HTMLElement): string {
  if (!element) return ""

  if (element.id) {
    return `#${element.id}`
  }

  if (element === document.body) {
    return "body"
  }

  if (!element.parentElement) {
    return ""
  }

  // Use classes if available
  if (element.className) {
    const classes = element.className
      .split(" ")
      .filter((c) => c.trim().length > 0)
      .map((c) => `.${c}`)
      .join("")

    if (classes && document.querySelectorAll(classes).length === 1) {
      return classes
    }
  }

  // Use tag name and nth-child
  const index = Array.from(element.parentElement.children).indexOf(element) + 1
  return `${getCssSelector(element.parentElement)} > ${element.tagName.toLowerCase()}:nth-child(${index})`
}

// Take a screenshot of the current page
function takeScreenshot() {
  chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
    if (response && response.screenshot) {
      // Send screenshot to background script
      chrome.runtime.sendMessage({
        action: "screenshotCaptured",
        screenshot: response.screenshot,
      })

      // Play sound
      chrome.runtime.sendMessage({
        action: "playSound",
        soundUrl: "sounds/screenshot.mp3",
      })

      // Show confirmation
      showNotification("Screenshot captured successfully!")
    } else {
      showNotification("Failed to capture screenshot.", "error")
    }
  })
}

// Get page information
function getPageInfo() {
  return {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    meta: Array.from(document.querySelectorAll("meta")).map((meta) => ({
      name: meta.getAttribute("name") || meta.getAttribute("property") || "",
      content: meta.getAttribute("content") || "",
    })),
  }
}

// Show notification
function showNotification(message: string, type: "info" | "error" = "info") {
  const notification = document.createElement("div")
  notification.textContent = message
  notification.style.position = "fixed"
  notification.style.bottom = "20px"
  notification.style.right = "20px"
  notification.style.padding = "10px 15px"
  notification.style.borderRadius = "4px"
  notification.style.color = "#fff"
  notification.style.backgroundColor = type === "info" ? "#ff5722" : "#f44336"
  notification.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)"
  notification.style.zIndex = "10000"
  notification.style.transition = "opacity 0.3s ease-in-out"
  notification.style.animation = "slide-in-up 0.3s ease-out"

  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slide-out-up 0.3s ease-in"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Declare chrome variable for use in non-extension environments
declare const chrome: any

// Initialize the content script
initialize()
