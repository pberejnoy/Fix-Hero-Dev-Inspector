const fs = require("fs")
const path = require("path")

// Define the build directory
const buildDir = path.join(__dirname, "../dist")

// Check if the build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Error: Build directory does not exist. Run "npm run build" first.')
  process.exit(1)
}

// Required files to check
const requiredFiles = [
  "manifest.json",
  "popup.html",
  "options.html",
  "assets/background.js",
  "assets/content.js",
  "assets/icons/icon-16.png",
  "assets/icons/icon-32.png",
  "assets/icons/icon-48.png",
  "assets/icons/icon-128.png",
]

// Check each required file
const missingFiles = []
requiredFiles.forEach((file) => {
  const filePath = path.join(buildDir, file)
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file)
  }
})

if (missingFiles.length > 0) {
  console.error("Error: The following required files are missing from the build:")
  missingFiles.forEach((file) => {
    console.error(`  - ${file}`)
  })
  process.exit(1)
}

// Validate manifest.json
const manifestPath = path.join(buildDir, "manifest.json")
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

  // Check required manifest fields
  const requiredFields = ["manifest_version", "name", "version", "description", "icons", "action"]
  const missingFields = requiredFields.filter((field) => !manifest[field])

  if (missingFields.length > 0) {
    console.error("Error: The following required fields are missing from manifest.json:")
    missingFields.forEach((field) => {
      console.error(`  - ${field}`)
    })
    process.exit(1)
  }

  // Check icon paths
  const iconSizes = ["16", "32", "48", "128"]
  const missingIcons = iconSizes.filter((size) => !manifest.icons[size])

  if (missingIcons.length > 0) {
    console.error("Error: The following icon sizes are missing from manifest.json:")
    missingIcons.forEach((size) => {
      console.error(`  - ${size}`)
    })
    process.exit(1)
  }

  // Verify icon paths
  for (const size in manifest.icons) {
    const iconPath = path.join(buildDir, manifest.icons[size])
    if (!fs.existsSync(iconPath)) {
      console.error(`Error: Icon file ${manifest.icons[size]} does not exist.`)
      process.exit(1)
    }
  }

  // Check content_security_policy format
  if (manifest.content_security_policy) {
    if (typeof manifest.content_security_policy === "object") {
      if (!manifest.content_security_policy.extension_pages) {
        console.warn("Warning: content_security_policy.extension_pages is missing.")
      }
    } else {
      console.error("Error: content_security_policy should be an object with extension_pages property.")
      process.exit(1)
    }
  }

  console.log("Manifest validation successful!")
} catch (error) {
  console.error("Error parsing manifest.json:", error)
  process.exit(1)
}

// Check HTML files for correct script references
const htmlFiles = ["popup.html", "options.html"]
htmlFiles.forEach((htmlFile) => {
  const htmlPath = path.join(buildDir, htmlFile)
  const htmlContent = fs.readFileSync(htmlPath, "utf8")

  // Check for script tags with incorrect paths
  if (htmlContent.includes('src="src/') || htmlContent.includes('src="./src/')) {
    console.error(`Error: ${htmlFile} contains script references to src/ directory which won't exist in the build.`)
    process.exit(1)
  }
})

console.log("Build validation successful! The extension is ready for deployment.")
