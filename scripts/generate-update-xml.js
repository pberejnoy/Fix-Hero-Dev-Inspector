const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { execSync } = require("child_process")

// Read package.json to get the version
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"))
const version = packageJson.version

// Configuration
const extensionId = "YOUR_EXTENSION_ID" // Replace with your actual extension ID once published
const crxFilename = `fixhero-dev-inspector-${version}.crx`
const updateUrl = `https://fixhero-dev-inspector.web.app/${crxFilename}`

// Generate the updates.xml content
const generateUpdatesXml = () => {
  console.log(`Generating updates.xml for version ${version}...`)

  // Calculate SHA256 hash of the CRX file if it exists
  let sha256 = ""
  const crxPath = path.resolve(__dirname, `../dist/${crxFilename}`)

  if (fs.existsSync(crxPath)) {
    const fileBuffer = fs.readFileSync(crxPath)
    const hashSum = crypto.createHash("sha256")
    hashSum.update(fileBuffer)
    sha256 = hashSum.digest("hex")
  } else {
    console.warn(`Warning: CRX file not found at ${crxPath}. SHA256 hash will be empty.`)
  }

  const xml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck codebase='${updateUrl}' version='${version}' hash_sha256='${sha256}' />
  </app>
</gupdate>`

  // Write the XML to the dist directory
  const outputPath = path.resolve(__dirname, "../dist/updates.xml")
  fs.writeFileSync(outputPath, xml)
  console.log(`updates.xml has been written to ${outputPath}`)
}

// Create the dist directory if it doesn't exist
const distDir = path.resolve(__dirname, "../dist")
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Generate the updates.xml file
generateUpdatesXml()

console.log("Update XML generation completed successfully!")
