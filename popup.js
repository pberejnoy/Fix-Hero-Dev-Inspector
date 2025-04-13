document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("screenshotBtn").addEventListener("click", () => {
    chrome.tabs.captureVisibleTab(null, {}, (image) => {
      console.log("Screenshot captured", image)
      // You can display the image or send it to the background script
    })
  })

  document.getElementById("addNoteBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: "options.html" })
  })
})
