import type React from "react"
import Popup from "../popup/Popup"
import Panel from "../panel/Panel"
import Options from "../options/Options"
import { ChromeApiProvider } from "./ChromeApiContext"

const DevApp: React.FC = () => {
  return (
    <ChromeApiProvider>
      <div className="dev-container">
        <div className="header">
          <h1>FixHero Dev Inspector - Development Environment</h1>
          <p>
            This page allows you to preview and test the extension components in a browser environment without loading
            the extension in Chrome.
          </p>
        </div>

        <div className="components-grid">
          <div className="component-card">
            <div className="component-header">Popup</div>
            <div className="component-content">
              <div className="popup-container">
                <Popup />
              </div>
            </div>
          </div>

          <div className="component-card">
            <div className="component-header">Panel</div>
            <div className="component-content">
              <div className="panel-container">
                <Panel />
              </div>
            </div>
          </div>

          <div className="component-card">
            <div className="component-header">Options</div>
            <div className="component-content">
              <Options />
            </div>
          </div>
        </div>
      </div>
    </ChromeApiProvider>
  )
}

export default DevApp
