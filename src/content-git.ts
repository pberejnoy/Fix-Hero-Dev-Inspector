console.log("FixHero Dev Inspector: Git platform content script loaded")

// Initialize Git platform specific features
function initGitPlatformFeatures() {
  // Detect which platform we're on
  const isGitHub = window.location.hostname.includes("github.com")
  const isGitLab = window.location.hostname.includes("gitlab.com")
  const isBitbucket = window.location.hostname.includes("bitbucket.org")

  // Add platform-specific listeners and features
  if (isGitHub) {
    initGitHubFeatures()
  } else if (isGitLab) {
    initGitLabFeatures()
  } else if (isBitbucket) {
    initBitbucketFeatures()
  }

  // Common Git platform features
  initCommonGitFeatures()
}

// GitHub-specific features
function initGitHubFeatures() {
  // Add issue creation integration
  addIssueCreationIntegration()

  // Add PR review integration
  addPRReviewIntegration()
}

// GitLab-specific features
function initGitLabFeatures() {
  // Add merge request integration
  addMergeRequestIntegration()

  // Add issue tracking integration
  addIssueTrackingIntegration()
}

// Bitbucket-specific features
function initBitbucketFeatures() {
  // Add pull request integration
  addPullRequestIntegration()
}

// Common Git platform features
function initCommonGitFeatures() {
  // Add code snippet capture
  addCodeSnippetCapture()

  // Add commit diff analysis
  addCommitDiffAnalysis()
}

// Add issue creation integration
function addIssueCreationIntegration() {
  // Find issue creation forms
  const issueForm = document.querySelector('form[action*="/issues"]')
  if (!issueForm) return

  // Add a button to import from FixHero
  const submitButton = issueForm.querySelector('button[type="submit"]')
  if (!submitButton) return

  const importButton = document.createElement("button")
  importButton.type = "button"
  importButton.className = "btn btn-sm"
  importButton.textContent = "Import from FixHero"
  importButton.style.marginRight = "8px"

  importButton.addEventListener("click", () => {
    // Send message to background script to open issue selector
    chrome.runtime.sendMessage({
      action: "openIssueSelector",
      target: "github",
    })
  })

  submitButton.parentNode?.insertBefore(importButton, submitButton)
}

// Add PR review integration
function addPRReviewIntegration() {
  // Implementation for PR review integration
}

// Add merge request integration
function addMergeRequestIntegration() {
  // Implementation for merge request integration
}

// Add issue tracking integration
function addIssueTrackingIntegration() {
  // Implementation for issue tracking integration
}

// Add pull request integration
function addPullRequestIntegration() {
  // Implementation for pull request integration
}

// Add code snippet capture
function addCodeSnippetCapture() {
  // Find code blocks
  const codeBlocks = document.querySelectorAll("pre, .highlight")

  codeBlocks.forEach((block) => {
    // Add a capture button
    const captureButton = document.createElement("button")
    captureButton.textContent = "Capture"
    captureButton.className = "fixhero-capture-btn"
    captureButton.style.position = "absolute"
    captureButton.style.top = "5px"
    captureButton.style.right = "5px"
    captureButton.style.padding = "2px 6px"
    captureButton.style.fontSize = "12px"
    captureButton.style.background = "#FF5722"
    captureButton.style.color = "white"
    captureButton.style.border = "none"
    captureButton.style.borderRadius = "3px"
    captureButton.style.cursor = "pointer"
    captureButton.style.opacity = "0"
    captureButton.style.transition = "opacity 0.2s"

    // Position the parent relatively if it's not already
    const computedStyle = window.getComputedStyle(block)
    if (computedStyle.position === "static") {
      block.style.position = "relative"
    }

    // Show button on hover
    block.addEventListener("mouseenter", () => {
      captureButton.style.opacity = "1"
    })

    block.addEventListener("mouseleave", () => {
      captureButton.style.opacity = "0"
    })

    // Capture code on click
    captureButton.addEventListener("click", async (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Get the code content
      const code = block.textContent || ""

      // Send to background script
      try {
        // Check if chrome is defined
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage({
            action: "captureCodeSnippet",
            code,
            language: detectLanguage(block),
            url: window.location.href,
            title: document.title,
          })
        } else {
          console.error("Chrome runtime is not available.")
        }
      } catch (error) {
        console.error("Error sending message to background script:", error)
      }
    })

    block.appendChild(captureButton)
  })
}

// Detect code language
function detectLanguage(codeBlock: Element): string {
  // Check for class-based language indicators
  const classes = codeBlock.className.split(" ")

  for (const cls of classes) {
    if (cls.startsWith("language-")) {
      return cls.replace("language-", "")
    }

    if (cls.startsWith("lang-")) {
      return cls.replace("lang-", "")
    }
  }

  // Check for data attributes
  const dataLang = codeBlock.getAttribute("data-lang") || codeBlock.getAttribute("data-language")

  if (dataLang) {
    return dataLang
  }

  // Default to 'text'
  return "text"
}

// Add commit diff analysis
function addCommitDiffAnalysis() {
  // Implementation for commit diff analysis
}

// Initialize when the content script loads
initGitPlatformFeatures()

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Git content script received message:", message)

  switch (message.action) {
    case "captureCodeSnippet":
      // Handle code snippet capture
      break
    case "analyzeDiff":
      // Handle diff analysis
      break
  }

  return true // Keep the message channel open for async responses
})
