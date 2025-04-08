import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ExtensionInfo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>About FixHero Dev Inspector</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          FixHero Dev Inspector is a Chrome extension designed to streamline bug reporting by automatically capturing
          technical details when issues are encountered.
        </p>

        <h3 className="font-semibold mb-2">Key Features:</h3>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Element inspection with detailed technical information</li>
          <li>Automatic console and network error logging</li>
          <li>Screenshot capture</li>
          <li>Note-taking for contextual information</li>
          <li>Export to Markdown and GitHub integration</li>
          <li>Keyboard shortcuts for quick actions</li>
        </ul>

        <h3 className="font-semibold mb-2">How to Use:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click the extension icon to open the popup</li>
          <li>Use "Inspect Element" to select problematic elements</li>
          <li>Take screenshots or add notes as needed</li>
          <li>Export your findings as Markdown or GitHub issues</li>
        </ol>
      </CardContent>
    </Card>
  )
}
