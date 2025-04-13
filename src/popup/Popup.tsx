import type React from "react"
import "./Popup.css"

const Popup: React.FC = () => {
  return (
    <div className="popup">
      <h1>FixHero Dev Inspector</h1>
      <p>This is a basic popup for the extension.</p>
      <button>Click me!</button>
    </div>
  )
}

export default Popup
