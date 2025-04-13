const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Read package.json to get the version
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"))
const version = packageJson.version

// Configuration
const crxFilename = `fixhero-dev-inspector-${version}.crx`
const pemFilename = "fixhero-dev-inspector.pem"

// Check if the private key exists
const pemPath = path.resolve(__dirname, `../${pemFilename}`)
if (!fs.existsSync(pemPath)) {
  console.log("Private key not found. Generating a new one...")
  // This is a placeholder. In a real scenario, you'd need to handle key generation carefully
  // and keep the key secure and consistent across builds.
  console.log("IMPORTANT: Keep this key safe and use it for all future builds!")
}

// Package the extension
const packageExtension = () => {
  console.log(`Packaging extension as ${crxFilename}...`)

  try {
    // For this example, we'll use Chrome's command-line tool to package the extension
    // In a real scenario, you might want to use a library like crx or chrome-webstore-upload
    const chromePath =
      process.platform === "win32"
        ? '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"'
        : process.platform === "darwin"
          ? '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"'
          : "google-chrome"

    const distPath = path.resolve(__dirname, "../dist")
    const crxPath = path.resolve(distPath, crxFilename)

    // Command to package the extension
    // Note: This requires Chrome to be installed and the path may vary
    const command = `${chromePath} --pack-extension=${distPath} --pack-extension-key=${pemPath}`

    console.log(`Executing: ${command}`)
    execSync(command, { stdio: "inherit" })

    console.log(`Extension packaged successfully as ${crxPath}`)
  } catch (error) {
    console.error("Error packaging extension:", error)
    process.exit(1)
  }
}

// Create the dist directory if it doesn't exist
const distDir = path.resolve(__dirname, "../dist")
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Package the extension
packageExtension()

console.log("Extension packaging completed successfully!")
