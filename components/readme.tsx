import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ReadmeComponent() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>FixHero Dev Inspector</CardTitle>
      </CardHeader>
      <CardContent className="prose">
        <h2>Installation</h2>
        <p>To install the FixHero Dev Inspector Chrome extension:</p>
        <ol>
          <li>Download or clone the repository</li>
          <li>
            Build the extension with <code>npm run build</code>
          </li>
          <li>
            Open Chrome and navigate to <code>chrome://extensions</code>
          </li>
          <li>Enable "Developer mode" in the top right</li>
          <li>Click "Load unpacked" and select the build directory</li>
        </ol>

        <h2>Development</h2>
        <p>To set up the development environment:</p>
        <ol>
          <li>
            Install dependencies with <code>npm install</code>
          </li>
          <li>
            Start the development server with <code>npm run dev</code>
          </li>
          <li>Load the extension as described in the installation steps</li>
        </ol>

        <h2>Features</h2>
        <ul>
          <li>
            <strong>Element Inspection:</strong> Capture detailed information about DOM elements
          </li>
          <li>
            <strong>Error Tracking:</strong> Automatically log console and network errors
          </li>
          <li>
            <strong>Screenshots:</strong> Capture visual evidence of issues
          </li>
          <li>
            <strong>Notes:</strong> Add contextual information to issues
          </li>
          <li>
            <strong>Export:</strong> Generate Markdown reports or create GitHub issues
          </li>
        </ul>

        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>
            <code>Ctrl+Alt+B</code> - Mark current element as bug
          </li>
          <li>
            <code>Ctrl+Alt+S</code> - Take screenshot
          </li>
          <li>
            <code>Ctrl+Alt+N</code> - Add note
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
