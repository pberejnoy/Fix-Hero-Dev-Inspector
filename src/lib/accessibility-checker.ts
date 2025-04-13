// Accessibility checker for FixHero Dev Inspector

export interface AccessibilityIssue {
  type: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  element?: string
  helpUrl?: string
}

export interface AccessibilityResult {
  element: string
  issues: AccessibilityIssue[]
  score: number
  timestamp: number
}

// Check accessibility for a given element
export function checkAccessibility(element: HTMLElement): AccessibilityResult {
  const issues: AccessibilityIssue[] = []

  // Get element details for reporting
  const elementDetails = getElementDetails(element)

  // Check for common accessibility issues
  checkAltText(element, issues)
  checkAriaAttributes(element, issues)
  checkColorContrast(element, issues)
  checkFocusable(element, issues)
  checkHeadings(element, issues)
  checkLabels(element, issues)

  // Calculate score (100 - deductions based on issues)
  const score = calculateScore(issues)

  return {
    element: elementDetails,
    issues,
    score,
    timestamp: Date.now(),
  }
}

// Get element details for reporting
function getElementDetails(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ""
  const classes = element.className ? `.${element.className.replace(/\s+/g, ".")}` : ""

  return `${tagName}${id}${classes}`
}

// Check for missing alt text on images
function checkAltText(element: HTMLElement, issues: AccessibilityIssue[]): void {
  if (element.tagName.toLowerCase() === "img") {
    const altAttr = element.getAttribute("alt")

    if (altAttr === null) {
      issues.push({
        type: "missing-alt",
        description: "Image is missing alt text",
        severity: "high",
        helpUrl: "https://web.dev/image-alt/",
      })
    } else if (altAttr === "") {
      // Empty alt is valid for decorative images, but we'll note it
      issues.push({
        type: "empty-alt",
        description: "Image has empty alt text (only appropriate for decorative images)",
        severity: "low",
        helpUrl: "https://web.dev/image-alt/",
      })
    }
  }
}

// Check for proper ARIA attributes
function checkAriaAttributes(element: HTMLElement, issues: AccessibilityIssue[]): void {
  // Check for invalid ARIA roles
  const role = element.getAttribute("role")
  const validRoles = [
    "alert",
    "alertdialog",
    "application",
    "article",
    "banner",
    "button",
    "cell",
    "checkbox",
    "columnheader",
    "combobox",
    "complementary",
    "contentinfo",
    "definition",
    "dialog",
    "directory",
    "document",
    "feed",
    "figure",
    "form",
    "grid",
    "gridcell",
    "group",
    "heading",
    "img",
    "link",
    "list",
    "listbox",
    "listitem",
    "log",
    "main",
    "marquee",
    "math",
    "menu",
    "menubar",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "navigation",
    "none",
    "note",
    "option",
    "presentation",
    "progressbar",
    "radio",
    "radiogroup",
    "region",
    "row",
    "rowgroup",
    "rowheader",
    "scrollbar",
    "search",
    "searchbox",
    "separator",
    "slider",
    "spinbutton",
    "status",
    "switch",
    "tab",
    "table",
    "tablist",
    "tabpanel",
    "term",
    "textbox",
    "timer",
    "toolbar",
    "tooltip",
    "tree",
    "treegrid",
    "treeitem",
  ]

  if (role && !validRoles.includes(role)) {
    issues.push({
      type: "invalid-role",
      description: `Invalid ARIA role: ${role}`,
      severity: "medium",
      helpUrl: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles",
    })
  }

  // Check for aria-* attributes without role
  const hasAriaAttrs = Array.from(element.attributes).some((attr) => attr.name.startsWith("aria-"))

  if (
    hasAriaAttrs &&
    !role &&
    !["button", "a", "input", "select", "textarea"].includes(element.tagName.toLowerCase())
  ) {
    issues.push({
      type: "aria-no-role",
      description: "Element has ARIA attributes but no role",
      severity: "low",
      helpUrl: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles",
    })
  }
}

// Check for color contrast issues (simplified)
function checkColorContrast(element: HTMLElement, issues: AccessibilityIssue[]): void {
  // This is a simplified check - a real implementation would calculate actual contrast ratios
  const style = window.getComputedStyle(element)
  const color = style.color
  const backgroundColor = style.backgroundColor

  // If both color and background are specified, we'll do a simple check
  if (color && backgroundColor && color !== "rgb(0, 0, 0)" && backgroundColor !== "rgba(0, 0, 0, 0)") {
    // Convert colors to grayscale to estimate contrast
    const colorGray = colorToGrayscale(color)
    const bgGray = colorToGrayscale(backgroundColor)

    // Calculate contrast ratio (simplified)
    const contrast = Math.abs(colorGray - bgGray)

    if (contrast < 50) {
      issues.push({
        type: "low-contrast",
        description: "Text may have insufficient contrast with background",
        severity: "medium",
        helpUrl: "https://web.dev/color-and-contrast-accessibility/",
      })
    }
  }
}

// Convert RGB color to grayscale value (0-255)
function colorToGrayscale(color: string): number {
  // Extract RGB values
  const match = color.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?$$/)
  if (!match) return 128 // Default mid-gray

  const r = Number.parseInt(match[1], 10)
  const g = Number.parseInt(match[2], 10)
  const b = Number.parseInt(match[3], 10)

  // Convert to grayscale using luminance formula
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

// Check for focusable elements
function checkFocusable(element: HTMLElement, issues: AccessibilityIssue[]): void {
  const tagName = element.tagName.toLowerCase()
  const role = element.getAttribute("role")

  // Check if element looks interactive but isn't focusable
  if (
    (tagName === "div" || tagName === "span") &&
    (role === "button" || role === "link") &&
    element.getAttribute("tabindex") === null
  ) {
    issues.push({
      type: "not-focusable",
      description: "Interactive element is not keyboard focusable (missing tabindex)",
      severity: "high",
      helpUrl: "https://web.dev/keyboard-access/",
    })
  }

  // Check for positive tabindex (should generally be avoided)
  const tabindex = element.getAttribute("tabindex")
  if (tabindex !== null && Number.parseInt(tabindex, 10) > 0) {
    issues.push({
      type: "positive-tabindex",
      description: "Positive tabindex values should be avoided as they disrupt natural tab order",
      severity: "medium",
      helpUrl: "https://web.dev/keyboard-access/",
    })
  }
}

// Check for proper heading structure
function checkHeadings(element: HTMLElement, issues: AccessibilityIssue[]): void {
  const tagName = element.tagName.toLowerCase()

  // Check if it's a heading
  if (tagName.match(/^h[1-6]$/)) {
    const level = Number.parseInt(tagName.substring(1), 10)

    // Check for empty headings
    if (!element.textContent || element.textContent.trim() === "") {
      issues.push({
        type: "empty-heading",
        description: "Heading has no content",
        severity: "high",
        helpUrl: "https://web.dev/heading-levels/",
      })
    }

    // Check for heading levels (simplified - would need document context for full check)
    if (level > 1) {
      // In a real implementation, we would check if this heading skips levels
      // For now, we'll just note that proper heading hierarchy is important
      issues.push({
        type: "heading-info",
        description: "Ensure heading levels follow a logical hierarchy (h1, then h2, etc.)",
        severity: "low",
        helpUrl: "https://web.dev/heading-levels/",
      })
    }
  }
}

// Check for form labels
function checkLabels(element: HTMLElement, issues: AccessibilityIssue[]): void {
  const tagName = element.tagName.toLowerCase()

  // Check input elements
  if (tagName === "input" || tagName === "select" || tagName === "textarea") {
    const id = element.id
    const ariaLabelledby = element.getAttribute("aria-labelledby")
    const ariaLabel = element.getAttribute("aria-label")
    const type = element.getAttribute("type")

    // Skip hidden inputs and buttons (which use value as label)
    if (type === "hidden" || type === "button" || type === "submit" || type === "reset") {
      return
    }

    // Check for labelling
    if (!id && !ariaLabelledby && !ariaLabel) {
      issues.push({
        type: "missing-label",
        description: "Form control has no associated label",
        severity: "high",
        helpUrl: "https://web.dev/labels-and-text-alternatives/",
      })
    } else if (id) {
      // Check if there's a <label> element that references this input
      const hasLabel = document.querySelector(`label[for="${id}"]`) !== null
      if (!hasLabel && !ariaLabelledby && !ariaLabel) {
        issues.push({
          type: "missing-label",
          description: "Form control has ID but no associated label element",
          severity: "high",
          helpUrl: "https://web.dev/labels-and-text-alternatives/",
        })
      }
    }
  }
}

// Calculate accessibility score based on issues
function calculateScore(issues: AccessibilityIssue[]): number {
  let score = 100

  // Deduct points based on severity
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 25
        break
      case "high":
        score -= 15
        break
      case "medium":
        score -= 10
        break
      case "low":
        score -= 5
        break
    }
  }

  // Ensure score doesn't go below 0
  return Math.max(0, score)
}
