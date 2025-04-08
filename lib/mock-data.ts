import type { Issue, Session } from "./types"

export const mockWebsitePreview = "/placeholder.svg?height=800&width=1200"

export const mockSession: Session = {
  id: "session-123",
  startTime: Date.now() - 3600000, // 1 hour ago
  url: "https://example.com/dashboard",
  browserInfo: "Chrome 98.0.4758.102 / Windows",
  issues: [],
}

export const mockIssues: Issue[] = [
  {
    id: "issue-1",
    timestamp: Date.now() - 2700000, // 45 minutes ago
    url: "https://example.com/dashboard",
    title: "Submit button not working on form",
    elementDetails: {
      type: "button",
      selector: "#submit-button",
      xpath: "/html/body/div[1]/main/div/form/button",
      text: "Submit",
      attributes: {
        id: "submit-button",
        class: "btn btn-primary",
        type: "submit",
      },
      styles: {
        display: "block",
        position: "relative",
        width: "120px",
        height: "40px",
        "background-color": "#0070f3",
      },
      position: { x: 100, y: 200, width: 120, height: 40 },
      html: '<button id="submit-button" class="btn btn-primary" type="submit">Submit</button>',
      componentName: "SubmitButton",
    },
    screenshot: "/placeholder.svg?height=300&width=500",
    consoleErrors: [
      {
        message: "Uncaught TypeError: Cannot read properties of null (reading 'value')",
        source: "app.js",
        lineNumber: 42,
        timestamp: Date.now() - 2705000,
      },
      {
        message: "Failed to load resource: the server responded with a status of 404 (Not Found)",
        source: "https://example.com/api/submit",
        lineNumber: 0,
        timestamp: Date.now() - 2710000,
      },
    ],
    severity: "high",
    tags: ["UI Bug", "Form", "JavaScript Error"],
    browserInfo: {
      name: "Chrome",
      version: "98.0.4758.102",
      os: "Windows 10",
      screen: "1920x1080",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    },
    aiSuggestion: {
      priority: "High",
      tags: ["Form Validation", "JavaScript Error", "UI Bug"],
      analysis:
        "This appears to be a critical form submission error. The JavaScript is trying to access a value from a null element, which is preventing the form from submitting properly. This is blocking user progress and should be addressed immediately.",
    },
  },
  {
    id: "issue-2",
    timestamp: Date.now() - 1800000, // 30 minutes ago
    url: "https://example.com/dashboard/products",
    title: "Product images not loading",
    elementDetails: {
      type: "img",
      selector: ".product-image",
      xpath: "/html/body/div[1]/main/div/div[2]/img",
      text: "",
      attributes: {
        class: "product-image",
        alt: "Product Image",
        src: "https://example.com/images/product-1.jpg",
      },
      styles: {
        display: "block",
        width: "200px",
        height: "200px",
        "object-fit": "cover",
      },
      position: { x: 300, y: 400, width: 200, height: 200 },
      html: '<img class="product-image" alt="Product Image" src="https://example.com/images/product-1.jpg">',
    },
    screenshot: "/placeholder.svg?height=300&width=500",
    networkErrors: [
      {
        url: "https://example.com/images/product-1.jpg",
        status: 404,
        statusText: "Not Found",
        method: "GET",
        timestamp: Date.now() - 1805000,
      },
    ],
    severity: "medium",
    tags: ["Network Error", "Image", "UI Bug"],
    browserInfo: {
      name: "Chrome",
      version: "98.0.4758.102",
      os: "Windows 10",
      screen: "1920x1080",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    },
    aiSuggestion: {
      priority: "Medium",
      tags: ["Asset Loading", "Network Error", "UI Bug"],
      analysis:
        "Multiple product images are failing to load due to 404 errors. This affects the user experience but doesn't prevent core functionality. The image paths may be incorrect or the assets might be missing from the server.",
    },
  },
  {
    id: "issue-3",
    timestamp: Date.now() - 900000, // 15 minutes ago
    url: "https://example.com/dashboard/checkout",
    title: "Slow response on checkout page",
    elementDetails: {
      type: "div",
      selector: "#checkout-form",
      xpath: "/html/body/div[1]/main/div/div[1]",
      text: "Checkout Form",
      attributes: {
        id: "checkout-form",
        class: "checkout-container",
      },
      styles: {
        display: "flex",
        "flex-direction": "column",
        padding: "20px",
        "background-color": "#f8f9fa",
      },
      position: { x: 100, y: 100, width: 600, height: 400 },
      html: '<div id="checkout-form" class="checkout-container">Checkout Form</div>',
    },
    screenshot: "/placeholder.svg?height=300&width=500",
    networkErrors: [
      {
        url: "https://example.com/api/checkout",
        status: 200,
        statusText: "OK",
        method: "POST",
        timestamp: Date.now() - 905000,
      },
    ],
    notes:
      "The checkout page takes more than 5 seconds to respond after clicking the 'Place Order' button. Users might think the page is frozen and try to submit multiple times.",
    severity: "medium",
    tags: ["Performance", "Slow Response", "Checkout"],
    browserInfo: {
      name: "Chrome",
      version: "98.0.4758.102",
      os: "Windows 10",
      screen: "1920x1080",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    },
    aiSuggestion: {
      priority: "Medium",
      tags: ["Performance", "Checkout Flow", "UX Issue"],
      analysis:
        "The checkout API is responding slowly (>5s), which creates a poor user experience at a critical conversion point. There's no error, but the lack of feedback might cause users to abandon their purchase or submit multiple orders.",
    },
  },
  {
    id: "issue-4",
    timestamp: Date.now() - 300000, // 5 minutes ago
    url: "https://example.com/dashboard/account",
    title: "Account settings not saving",
    elementDetails: {
      type: "form",
      selector: "#account-settings-form",
      xpath: "/html/body/div[1]/main/div/form",
      text: "Account Settings",
      attributes: {
        id: "account-settings-form",
        class: "settings-form",
      },
      styles: {
        display: "grid",
        "grid-template-columns": "1fr 1fr",
        gap: "20px",
        padding: "20px",
      },
      position: { x: 100, y: 100, width: 800, height: 600 },
      html: '<form id="account-settings-form" class="settings-form">Account Settings</form>',
    },
    screenshot: "/placeholder.svg?height=300&width=500",
    consoleErrors: [
      {
        message: "Uncaught (in promise) SyntaxError: Unexpected token < in JSON at position 0",
        source: "app.js",
        lineNumber: 156,
        timestamp: Date.now() - 305000,
      },
    ],
    networkErrors: [
      {
        url: "https://example.com/api/account/settings",
        status: 500,
        statusText: "Internal Server Error",
        method: "PUT",
        timestamp: Date.now() - 310000,
      },
    ],
    notes:
      "When trying to save account settings, the form appears to submit but the changes don't persist. Refreshing the page shows the old settings.",
    severity: "critical",
    tags: ["API Error", "Form", "Account Settings"],
    browserInfo: {
      name: "Chrome",
      version: "98.0.4758.102",
      os: "Windows 10",
      screen: "1920x1080",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    },
    aiSuggestion: {
      priority: "Critical",
      tags: ["API Error", "Data Loss", "Account Management"],
      analysis:
        "The account settings API is returning a 500 error and the frontend is trying to parse HTML as JSON. This is preventing users from saving any account changes, which is a critical functionality issue that affects all users.",
    },
  },
]
