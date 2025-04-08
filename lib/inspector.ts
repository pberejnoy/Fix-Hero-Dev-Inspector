import type { ConsoleError, ElementDetails, NetworkError, BrowserInfo } from "./types"

// Store captured console errors
const capturedConsoleErrors: ConsoleError[] = []
// Store captured network errors
const capturedNetworkErrors: NetworkError[] = []

// Initialize the inspector
export function initializeInspector(options: {
  onElementSelected?: (element: HTMLElement) => void
  cleanup?: boolean
}) {
  // If cleanup is requested, remove all event listeners
  if (options.cleanup) {
    document.removeEventListener("mouseover", handleMouseOver)
    document.removeEventListener("mouseout", handleMouseOut)
    document.removeEventListener("click", handleClick, true)

    // Remove any highlighting
    const highlighted = document.querySelector(".fixhero-highlight")
    if (highlighted) {
      highlighted.classList.remove("fixhero-highlight")
    }

    return
  }

  let hoveredElement: HTMLElement | null = null

  // Handle mouse over event
  function handleMouseOver(event: MouseEvent) {
    const target = event.target as HTMLElement

    if (hoveredElement) {
      hoveredElement.classList.remove("fixhero-highlight")
    }

    hoveredElement = target
    hoveredElement.classList.add("fixhero-highlight")
  }

  // Handle mouse out event
  function handleMouseOut(event: MouseEvent) {
    if (!hoveredElement) return

    hoveredElement.classList.remove("fixhero-highlight")
    hoveredElement = null
  }

  // Handle click event
  function handleClick(event: MouseEvent) {
    if (!hoveredElement) return

    event.preventDefault()
    event.stopPropagation()

    if (options.onElementSelected) {
      options.onElementSelected(hoveredElement)
    }

    // Remove highlighting after selection
    hoveredElement.classList.remove("fixhero-highlight")
    hoveredElement = null

    // Clean up event listeners after selection
    document.removeEventListener("mouseover", handleMouseOver)
    document.removeEventListener("mouseout", handleMouseOut)
    document.removeEventListener("click", handleClick, true)
  }

  // Add event listeners
  document.addEventListener("mouseover", handleMouseOver)
  document.addEventListener("mouseout", handleMouseOut)
  document.addEventListener("click", handleClick, true)

  // Add styles for highlighting
  const style = document.createElement("style")
  style.textContent = `
    .fixhero-highlight {
      outline: 2px solid #ff5722 !important;
      outline-offset: 2px !important;
      position: relative;
    }
  `
  document.head.appendChild(style)
}

// Capture element details with enhanced inspection
export async function captureElement(element: HTMLElement) {
  // Get element details with enhanced inspection
  const elementDetails: ElementDetails = {
    type: element.tagName.toLowerCase(),
    selector: getCssSelector(element),
    xpath: getXPath(element),
    text: element.textContent || "",
    attributes: getAttributes(element),
    styles: getComputedStyles(element),
    position: element.getBoundingClientRect().toJSON(),
    html: element.outerHTML,
    componentName: getComponentName(element),
    accessibility: getAccessibilityInfo(element),
    parent: getParentInfo(element),
    children: getChildrenInfo(element),
    eventListeners: getEventListeners(element),
  }

  // Take screenshot of element
  const screenshot = await captureElementScreenshot(element)

  // Get page metadata
  const pageMetadata = getPageMetadata()

  return {
    elementDetails,
    screenshot,
    consoleErrors: capturedConsoleErrors.slice(-5), // Get the 5 most recent console errors
    networkErrors: capturedNetworkErrors.slice(-5), // Get the 5 most recent network errors
    timestamp: Date.now(),
    pageMetadata,
  }
}

// Get CSS selector for element with enhanced specificity
function getCssSelector(element: HTMLElement): string {
  // Try to get a unique ID selector
  if (element.id) {
    return `#${element.id}`
  }

  // Try to get a unique class selector
  if (element.className && typeof element.className === "string" && element.className.trim()) {
    const classes = element.className.trim().split(/\s+/).join(".")
    return `.${classes}`
  }

  // Try to get a unique attribute selector
  for (const attr of ["data-testid", "data-cy", "data-test", "name", "aria-label"]) {
    if (element.hasAttribute(attr)) {
      return `${element.tagName.toLowerCase()}[${attr}="${element.getAttribute(attr)}"]`
    }
  }

  // Get a position-based selector
  let selector = element.tagName.toLowerCase()
  const parent = element.parentElement

  if (parent) {
    const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName)

    if (siblings.length > 1) {
      const index = siblings.indexOf(element)
      selector += `:nth-child(${index + 1})`
    }
  }

  // If we have a parent, add the parent selector for more specificity
  if (parent && parent !== document.body) {
    const parentSelector = getCssSelector(parent)
    return `${parentSelector} > ${selector}`
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

// Get element attributes with enhanced detail
function getAttributes(element: HTMLElement): Record<string, string> {
  const attributes: Record<string, string> = {}

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attributes[attr.name] = attr.value
  }

  return attributes
}

// Get computed styles for element with enhanced detail
function getComputedStyles(element: HTMLElement): Record<string, string> {
  const styles: Record<string, string> = {}
  const computed = window.getComputedStyle(element)

  // Get all important styles for debugging UI issues
  const importantStyles = [
    // Layout
    "display",
    "position",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "box-sizing",
    "overflow",
    "z-index",

    // Spacing
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",

    // Visual
    "color",
    "background-color",
    "opacity",
    "visibility",
    "border",
    "border-radius",
    "box-shadow",
    "outline",

    // Typography
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "text-align",
    "text-decoration",
    "text-transform",
    "white-space",

    // Flexbox/Grid
    "flex",
    "flex-direction",
    "justify-content",
    "align-items",
    "gap",
    "grid-template-columns",
    "grid-template-rows",

    // Transitions/Animations
    "transition",
    "animation",
    "transform",
  ]

  importantStyles.forEach((style) => {
    styles[style] = computed.getPropertyValue(style)
  })

  return styles
}

// Try to determine component name from element
function getComponentName(element: HTMLElement): string | undefined {
  // Check for data attributes that might indicate component name
  for (const attr of ["data-component", "data-testid", "data-cy", "data-test"]) {
    if (element.hasAttribute(attr)) {
      return element.getAttribute(attr) || undefined
    }
  }

  // Check for class names that might indicate component name
  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(/\s+/)

    // Look for classes that might be component names (PascalCase or kebab-case)
    const componentClass = classes.find(
      (cls) =>
        /^[A-Z][a-zA-Z0-9]*$/.test(cls) || // PascalCase
        /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(cls), // kebab-case
    )

    if (componentClass) {
      return componentClass
    }
  }

  return undefined
}

// Get accessibility information
function getAccessibilityInfo(element: HTMLElement): Record<string, any> {
  const info: Record<string, any> = {}

  // Check for common accessibility attributes
  const a11yAttrs = [
    "role",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-hidden",
    "aria-expanded",
    "aria-haspopup",
    "aria-controls",
    "aria-selected",
    "aria-checked",
    "aria-disabled",
    "tabindex",
  ]

  a11yAttrs.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      info[attr] = element.getAttribute(attr)
    }
  })

  // Check if element is focusable
  info.focusable =
    element.tabIndex >= 0 || ["a", "button", "input", "select", "textarea"].includes(element.tagName.toLowerCase())

  // Check for contrast issues (simplified)
  const styles = window.getComputedStyle(element)
  info.hasText = (element.textContent || "").trim().length > 0
  info.textColor = styles.color
  info.backgroundColor = styles.backgroundColor

  return info
}

// Get parent element info
function getParentInfo(element: HTMLElement): Record<string, any> {
  const parent = element.parentElement

  if (!parent || parent === document.body) {
    return {}
  }

  return {
    tag: parent.tagName.toLowerCase(),
    id: parent.id || undefined,
    className: parent.className || undefined,
    selector: getCssSelector(parent),
  }
}

// Get children elements info
function getChildrenInfo(element: HTMLElement): Record<string, any>[] {
  const children = Array.from(element.children).slice(0, 5) // Limit to first 5 children

  return children.map((child) => ({
    tag: child.tagName.toLowerCase(),
    id: (child as HTMLElement).id || undefined,
    className: (child as HTMLElement).className || undefined,
    text: (child.textContent || "").substring(0, 50), // Truncate long text
  }))
}

// Get event listeners (simplified - browser can't access all listeners)
function getEventListeners(element: HTMLElement): string[] {
  // This is a simplified approach since we can't access all event listeners
  const commonEvents = ["click", "focus", "blur", "change", "input", "submit"]
  const events: string[] = []

  // Check for inline event handlers
  for (const attr of element.attributes) {
    if (attr.name.startsWith("on")) {
      events.push(attr.name.substring(2))
    }
  }

  // For non-inline handlers, we can only guess based on element type
  if (element.tagName === "BUTTON" || element.tagName === "A") {
    if (!events.includes("click")) events.push("click")
  }

  if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) {
    if (!events.includes("change")) events.push("change")
    if (!events.includes("input")) events.push("input")
  }

  if (element.tagName === "FORM") {
    if (!events.includes("submit")) events.push("submit")
  }

  return events
}

// Get page metadata
function getPageMetadata(): Record<string, any> {
  return {
    url: window.location.href,
    title: document.title,
    path: window.location.pathname,
    query: window.location.search,
    hash: window.location.hash,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  }
}

// Capture screenshot of element
async function captureElementScreenshot(element: HTMLElement): Promise<string> {
  try {
    // In a real extension, we would use html2canvas or browser APIs
    // For this demo, we'll return a placeholder
    return "/placeholder.svg?height=300&width=500"
  } catch (error) {
    console.error("Error capturing element screenshot:", error)
    return ""
  }
}

// Take full page screenshot
export async function takeScreenshot(): Promise<string> {
  try {
    // In a real extension, we would use browser.tabs.captureVisibleTab or similar
    // For this demo, we'll return a placeholder
    return "/placeholder.svg?height=800&width=1200"
  } catch (error) {
    console.error("Error capturing screenshot:", error)
    return ""
  }
}

// Capture console errors
export function captureConsoleErrors() {
  const originalConsoleError = console.error

  console.error = (...args) => {
    const error: ConsoleError = {
      message: args.map((arg) => String(arg)).join(" "),
      source: "console",
      lineNumber: new Error().stack?.split("\n")[2]?.match(/(\d+):\d+\)?$/)?.[1] || 0,
      timestamp: Date.now(),
    }

    capturedConsoleErrors.push(error)

    // Limit the number of stored errors
    if (capturedConsoleErrors.length > 50) {
      capturedConsoleErrors.shift()
    }

    originalConsoleError.apply(console, args)
  }

  // Return a cleanup function
  return () => {
    console.error = originalConsoleError
  }
}

// Capture network errors
export function captureNetworkErrors() {
  const originalFetch = window.fetch

  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args)

      if (!response.ok) {
        capturedNetworkErrors.push({
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          method: args[1]?.method || "GET",
          timestamp: Date.now(),
        })

        // Limit the number of stored errors
        if (capturedNetworkErrors.length > 50) {
          capturedNetworkErrors.shift()
        }
      }

      return response
    } catch (error: any) {
      capturedNetworkErrors.push({
        url: args[0].toString(),
        status: 0,
        statusText: error.message,
        method: args[1]?.method || "GET",
        timestamp: Date.now(),
      })

      // Limit the number of stored errors
      if (capturedNetworkErrors.length > 50) {
        capturedNetworkErrors.shift()
      }

      throw error
    }
  }

  // Also capture XHR errors
  const originalXHROpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener("load", function () {
      if (this.status >= 400) {
        capturedNetworkErrors.push({
          url: this.responseURL,
          status: this.status,
          statusText: this.statusText,
          method: args[0],
          timestamp: Date.now(),
        })

        // Limit the number of stored errors
        if (capturedNetworkErrors.length > 50) {
          capturedNetworkErrors.shift()
        }
      }
    })

    return originalXHROpen.apply(this, args)
  }

  // Return a cleanup function
  return () => {
    window.fetch = originalFetch
    XMLHttpRequest.prototype.open = originalXHROpen
  }
}

// Get browser information
export async function getBrowserInfo(): Promise<BrowserInfo> {
  // In a real extension, we would use browser APIs to get this information
  // For this demo, we'll return mock data
  const userAgent = navigator.userAgent
  let browserName = "Unknown"
  let browserVersion = ""
  let os = "Unknown"

  // Detect browser
  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox"
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    browserName = "Samsung Browser"
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browserName = "Opera"
  } else if (userAgent.indexOf("Trident") > -1) {
    browserName = "Internet Explorer"
  } else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Edge"
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome"
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari"
  }

  // Get version
  const browserMatch = userAgent.match(new RegExp(`${browserName}\\/([0-9\\.]+)`))
  if (browserMatch && browserMatch[1]) {
    browserVersion = browserMatch[1]
  }

  // Detect OS
  if (userAgent.indexOf("Win") > -1) {
    os = "Windows"
  } else if (userAgent.indexOf("Mac") > -1) {
    os = "MacOS"
  } else if (userAgent.indexOf("Linux") > -1) {
    os = "Linux"
  } else if (userAgent.indexOf("Android") > -1) {
    os = "Android"
  } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
    os = "iOS"
  }

  return {
    name: browserName,
    version: browserVersion,
    os,
    screen: `${window.screen.width}x${window.screen.height}`,
    userAgent,
  }
}

// Highlight problematic elements
export function highlightProblematicElements() {
  // This would identify and highlight elements with potential issues
  // For example: low contrast, small click targets, missing alt text, etc.

  // For demo purposes, we'll just highlight a few random elements
  const elements = document.querySelectorAll("button, a, input")

  elements.forEach((element, index) => {
    if (index % 3 === 0) {
      // Highlight every third element
      element.classList.add("problematic-element")
    }
  })

  // Add styles for highlighting
  const style = document.createElement("style")
  style.textContent = `
    .problematic-element {
      outline: 2px dashed #ff0000 !important;
      outline-offset: 2px !important;
      position: relative;
    }
  `
  document.head.appendChild(style)

  // Return a cleanup function
  return () => {
    document.querySelectorAll(".problematic-element").forEach((el) => {
      el.classList.remove("problematic-element")
    })
    document.head.removeChild(style)
  }
}

// Identify slow-loading elements
export function identifySlowElements() {
  // This would identify elements that are slow to render or interact with
  // For demo purposes, we'll just highlight a few random elements

  const elements = document.querySelectorAll("img, iframe, video")

  elements.forEach((element, index) => {
    if (index % 2 === 0) {
      // Highlight every second element
      element.classList.add("slow-element")
    }
  })

  // Add styles for highlighting
  const style = document.createElement("style")
  style.textContent = `
    .slow-element {
      outline: 2px dashed #ffcc00 !important;
      outline-offset: 2px !important;
      position: relative;
    }
  `
  document.head.appendChild(style)

  // Return a cleanup function
  return () => {
    document.querySelectorAll(".slow-element").forEach((el) => {
      el.classList.remove("slow-element")
    })
    document.head.removeChild(style)
  }
}
