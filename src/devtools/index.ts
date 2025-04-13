// Declare the chrome variable for use in non-Chrome Extension environments (e.g., testing)
declare var chrome: any

// Create a panel in Chrome DevTools
chrome.devtools.panels.create(
  "FixHero", // title
  "/icons/icon-32.png", // icon
  "/panel.html", // content
  (panel) => {
    // code invoked when panel is created
    console.log("FixHero DevTools panel created")
  },
)
