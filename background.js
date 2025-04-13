console.log("Background script running")

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed")
})

chrome.contextMenus.create({
  id: "search-selection",
  title: "Search Selection",
  contexts: ["selection"],
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-selection") {
    console.log("Search selection clicked", info.selectionText)
    // Perform search or other action with the selected text
  }
})
