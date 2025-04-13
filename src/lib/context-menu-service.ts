// Context menu service for FixHero Dev Inspector

// Type declaration for the global chrome object
declare const chrome: any

// Context menu item IDs
export enum ContextMenuId {
  INSPECT_ELEMENT = "fixhero-inspect-element",
  TAKE_SCREENSHOT = "fixhero-take-screenshot",
  ADD_NOTE = "fixhero-add-note",
  RUN_ACCESSIBILITY_CHECK = "fixhero-run-accessibility-check",
  OPEN_DASHBOARD = "fixhero-open-dashboard",
}

// Initialize context menu items
export function initContextMenu(): void {
  // Only initialize if we're in a Chrome extension environment
  if (typeof chrome === "undefined" || !chrome.contextMenus) {
    console.warn("Context menu API not available")
    return
  }

  // Remove existing items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create parent menu item
    chrome.contextMenus.create({
      id: "fixhero-parent",
      title: "FixHero Dev Inspector",
      contexts: ["all"],
    })

    // Create child menu items
    chrome.contextMenus.create({
      id: ContextMenuId.INSPECT_ELEMENT,
      parentId: "fixhero-parent",
      title: "Inspect Element",
      contexts: ["all"],
    })

    chrome.contextMenus.create({
      id: ContextMenuId.TAKE_SCREENSHOT,
      parentId: "fixhero-parent",
      title: "Take Screenshot",
      contexts: ["all"],
    })

    chrome.contextMenus.create({
      id: ContextMenuId.ADD_NOTE,
      parentId: "fixhero-parent",
      title: "Add Note",
      contexts: ["all"],
    })

    chrome.contextMenus.create({
      id: ContextMenuId.RUN_ACCESSIBILITY_CHECK,
      parentId: "fixhero-parent",
      title: "Run Accessibility Check",
      contexts: ["all"],
    })

    chrome.contextMenus.create({
      id: ContextMenuId.OPEN_DASHBOARD,
      parentId: "fixhero-parent",
      title: "Open Dashboard",
      contexts: ["all"],
    })
  })

  // Add click listener
  chrome.contextMenus.onClicked.addListener(handleContextMenuClick)
}

// Handle context menu clicks
function handleContextMenuClick(info: any, tab: any): void {
  switch (info.menuItemId) {
    case ContextMenuId.INSPECT_ELEMENT:
      chrome.tabs.sendMessage(tab.id, { action: "startInspection" })
      break
    case ContextMenuId.TAKE_SCREENSHOT:
      chrome.tabs.sendMessage(tab.id, { action: "takeScreenshot" })
      break
    case ContextMenuId.ADD_NOTE:
      chrome.tabs.sendMessage(tab.id, { action: "addNote" })
      break
    case ContextMenuId.RUN_ACCESSIBILITY_CHECK:
      chrome.tabs.sendMessage(tab.id, { action: "runAccessibilityCheck" })
      break
    case ContextMenuId.OPEN_DASHBOARD:
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
      break
  }
}

// Update context menu item state
export function updateContextMenuState(menuId: ContextMenuId, enabled: boolean): void {
  if (typeof chrome === "undefined" || !chrome.contextMenus) {
    return
  }

  chrome.contextMenus.update(menuId, { enabled })
}
