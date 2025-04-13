/**
 * Utility for capturing screenshots in the FixHero Dev Inspector extension
 */

// Type declaration for the global chrome object
declare const chrome: any

/**
 * Captures a screenshot of the current visible tab
 * @returns Promise<string> A promise that resolves to a data URL of the screenshot
 */
export async function captureScreenshot(): Promise<string> {
  // Check if we're in a Chrome extension environment
  const isExtensionEnvironment = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id

  if (isExtensionEnvironment) {
    // Use Chrome extension API to capture screenshot
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.captureVisibleTab(null, { format: "png", quality: 100 }, (dataUrl: string) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(dataUrl)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  } else {
    // In development environment, return a placeholder
    console.log("Screenshot capture is only available in the extension environment")
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5jIDQwwAAAABJRU5ErkJggg=="
  }
}

/**
 * Captures a full page screenshot by scrolling and stitching multiple screenshots
 * Note: This is a more complex operation and may not work perfectly on all pages
 * @returns Promise<string> A promise that resolves to a data URL of the full page screenshot
 */
export async function captureFullPageScreenshot(): Promise<string> {
  // This functionality would require more complex implementation
  // involving scrolling the page and stitching multiple screenshots
  // For now, we'll just use the visible tab screenshot
  return captureScreenshot()
}

/**
 * Captures a screenshot of a specific element
 * @param selector CSS selector for the element to capture
 * @returns Promise<string> A promise that resolves to a data URL of the element screenshot
 */
export async function captureElementScreenshot(selector: string): Promise<string> {
  // In a real implementation, this would:
  // 1. Find the element
  // 2. Get its position and dimensions
  // 3. Capture a screenshot
  // 4. Crop the screenshot to the element's dimensions

  // For now, we'll just use the visible tab screenshot
  return captureScreenshot()
}
