console.log("Content script loaded!")

// Declare chrome if it's not already available globally
declare var chrome: any

chrome.runtime.sendMessage({ greeting: "hello" }, (response) => {
  console.log(response.farewell)
})
