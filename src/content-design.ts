// Content script for design platforms (Figma, Sketch, Adobe)
import { captureScreenshot } from "./utils/screenshot"

console.log("FixHero Dev Inspector: Design platform content script loaded")

// Initialize design platform specific features
function initDesignPlatformFeatures() {
  // Detect which platform we're on
  const isFigma = window.location.hostname.includes("figma.com")
  const isSketch = window.location.hostname.includes("sketch.com")
  const isAdobe = window.location.hostname.includes("adobe.com")

  // Add platform-specific listeners and features
  if (isFigma) {
    initFigmaFeatures()
  } else if (isSketch) {
    initSketchFeatures()
  } else if (isAdobe) {
    initAdobeFeatures()
  }

  // Common design platform features
  initCommonDesignFeatures()
}

// Figma-specific features
function initFigmaFeatures() {
  // Add design capture integration
  addFigmaDesignCapture()
}

// Sketch-specific features
function initSketchFeatures() {
  // Add Sketch integration
  addSketchIntegration()
}

// Adobe-specific features
function initAdobeFeatures() {
  // Add Adobe integration
  addAdobeIntegration()
}

// Common design platform features
function initCommonDesignFeatures() {
  // Add design asset capture
  addDesignAssetCapture()
}

// Add Figma design capture
function addFigmaDesignCapture() {
  // Wait for Figma UI to load
  const observer = new MutationObserver((mutations, obs) => {
    const canvas = document.querySelector(".canvas")
    if (canvas) {
      obs.disconnect() // Stop observing

      // Add capture button to Figma UI
      addCaptureButtonToFigma()
    }
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Add capture button to Figma
function addCaptureButtonToFigma() {
  // Find a good place to inject our button
  const toolbar = document.querySelector(".toolbar_view")
  if (!toolbar) return

  // Create button container
  const buttonContainer = document.createElement("div")
  buttonContainer.className = "fixhero-figma-button"
  buttonContainer.style.display = "flex"
  buttonContainer.style.alignItems = "center"
  buttonContainer.style.padding = "0 8px"

  // Create button
  const captureButton = document.createElement("button")
  captureButton.textContent = "Capture for FixHero"
  captureButton.style.background = "#FF5722"
  captureButton.style.color = "white"
  captureButton.style.border = "none"
  captureButton.style.borderRadius = "6px"
  captureButton.style.padding = "8px 12px"
  captureButton.style.fontSize = "12px"
  captureButton.style.cursor = "pointer"

  // Add click handler
  captureButton.addEventListener("click", async () => {
    try {
      // Take screenshot
      const screenshot = await captureScreenshot()

      // Get current frame/artboard name
      const frameName = getSelectedFrameName() || document.title

      // Send to background script
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({
          action: "storeDesignCapture",
          screenshot,
          title: frameName,
          url: window.location.href,
          platform: "figma",
          timestamp: Date.now(),
        })
      } else {
        console.warn("Chrome runtime is not available.")
      }

      // Show success message
      showNotification("Design captured successfully!")
    } catch (error) {
      console.error("Error capturing design:", error)
      showNotification("Failed to capture design", true)
    }
  })

  buttonContainer.appendChild(captureButton)
  toolbar.appendChild(buttonContainer)
}

// Get selected frame name in Figma
function getSelectedFrameName(): string | null {
  // This is a simplified implementation
  // In a real extension, you would need to use Figma's plugin API
  const selectedFrameElement = document.querySelector(".selected-frame-name")
  return selectedFrameElement ? selectedFrameElement.textContent : null
}

// Add Sketch integration
function addSketchIntegration() {
  // Implementation for Sketch integration
}

// Add Adobe integration
function addAdobeIntegration() {
  // Implementation for Adobe integration
}

// Add design asset capture
function addDesignAssetCapture() {
  // Implementation for design asset capture
}

// Show notification
function showNotification(message: string, isError = false) {
  // Create notification element
  const notification = document.createElement("div")
  notification.textContent = message
  notification.style.position = "fixed"
  notification.style.bottom = "20px"
  notification.style.right = "20px"
  notification.style.padding = "10px 20px"
  notification.style.borderRadius = "4px"
  notification.style.color = "white"
  notification.style.zIndex = "9999"
  notification.style.fontSize = "14px"
  notification.style.backgroundColor = isError ? "#f44336" : "#4caf50"
  notification.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)"
  notification.style.transition = "opacity 0.3s ease-in-out"

  // Add to document
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Initialize when the content script loads
initDesignPlatformFeatures()

// Declare chrome variable if it's not already defined
declare const chrome: any

// Listen for messages from the background script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Design content script received message:", message)

    switch (message.action) {
      case "captureDesign":
        // Handle design capture
        break
    }

    return true // Keep the message channel open for async responses
  })
} else {
  console.warn("Chrome runtime is not available.")
}
