import React from "react"
import ReactDOM from "react-dom/client"
import DevApp from "./DevApp"
import "../styles/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DevApp />
  </React.StrictMode>,
)
