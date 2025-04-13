const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },

  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
}

// Print a header
console.log(`
${colors.fg.cyan}${colors.bright}===== FixHero Dev Inspector Test Script =====${colors.reset}
`)

// Check if dist directory exists
const distPath = path.join(__dirname, "../dist")
if (!fs.existsSync(distPath)) {
  console.log(`${colors.fg.red}Error: dist directory does not exist. Run "npm run build" first.${colors.reset}`)
  process.exit(1)
}

// Check if manifest.json exists in dist
const manifestPath = path.join(distPath, "manifest.json")
if (!fs.existsSync(manifestPath)) {
  console.log(`${colors.fg.red}Error: manifest.json not found in dist directory.${colors.reset}`)
  process.exit(1)
}

// Check if required HTML files exist
const requiredFiles = ["index.html"]
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(distPath, file)))

if (missingFiles.length > 0) {
  console.log(`${colors.fg.red}Error: The following required files are missing:${colors.reset}`)
  missingFiles.forEach((file) => console.log(`  - ${file}`))
  process.exit(1)
}

// Check if assets directory exists
const assetsPath = path.join(distPath, "assets")
if (!fs.existsSync(assetsPath)) {
  console.log(`${colors.fg.red}Error: assets directory not found in dist directory.${colors.reset}`)
  process.exit(1)
}

// Check if required JS files exist
const requiredJsFiles = ["background.js", "content.js"]
const missingJsFiles = requiredJsFiles.filter((file) => !fs.existsSync(path.join(assetsPath, file)))

if (missingJsFiles.length > 0) {
  console.log(`${colors.fg.red}Error: The following required JS files are missing:${colors.reset}`)
  missingJsFiles.forEach((file) => console.log(`  - assets/${file}`))
  process.exit(1)
}

// All checks passed
console.log(`${colors.fg.green}✓ All required files are present in the dist directory.${colors.reset}`)

// Read manifest.json
try {
  const manifestContent = fs.readFileSync(manifestPath, "utf8")
  const manifest = JSON.parse(manifestContent)

  console.log(`
${colors.fg.cyan}Extension Information:${colors.reset}`)
  console.log(`  Name: ${manifest.name}`)
  console.log(`  Version: ${manifest.version}`)
  console.log(`  Description: ${manifest.description}`)

  // Check permissions
  if (manifest.permissions) {
    console.log(`
${colors.fg.yellow}Permissions:${colors.reset}`)
    manifest.permissions.forEach((permission) => console.log(`  - ${permission}`))
  }

  // Check commands
  if (manifest.commands) {
    console.log(`
${colors.fg.yellow}Keyboard Shortcuts:${colors.reset}`)
    Object.entries(manifest.commands).forEach(([command, details]) => {
      const shortcut = details.suggested_key?.default || "Not set"
      console.log(`  - ${command}: ${shortcut} (${details.description})`)
    })
  }
} catch (error) {
  console.log(`${colors.fg.red}Error reading manifest.json: ${error.message}${colors.reset}`)
}

// Check for .env file
const envPath = path.join(__dirname, "../.env")
if (!fs.existsSync(envPath)) {
  console.log(
    `
${colors.fg.yellow}Warning: .env file not found. Firebase functionality may not work correctly.${colors.reset}`,
  )
  console.log(`Create a .env file based on .env.example with your Firebase configuration.`)
} else {
  console.log(`
${colors.fg.green}✓ .env file found.${colors.reset}`)
}

// Suggest next steps
console.log(`
${colors.fg.cyan}${colors.bright}Next Steps:${colors.reset}`)
console.log(`1. ${colors.fg.green}Test in development mode:${colors.reset}`)
console.log(`   npm run dev`)
console.log(`   Open http://localhost:3000 in your browser`)
console.log(`
2. ${colors.fg.green}Load the extension in Chrome:${colors.reset}`)
console.log(`   - Open Chrome and navigate to chrome://extensions/`)
console.log(`   - Enable "Developer mode" in the top-right corner`)
console.log(`   - Click "Load unpacked" and select the dist directory`)
console.log(`
3. ${colors.fg.green}Test the extension functionality:${colors.reset}`)
console.log(`   - Click the extension icon to open the popup`)
console.log(`   - Test keyboard shortcuts:`)
console.log(`     - Ctrl+Shift+S (screenshot)`)
console.log(`     - Ctrl+Shift+N (note)`)
console.log(`     - Ctrl+Shift+D (sidebar)`)
console.log(`     - Ctrl+Shift+M (dashboard)`)

console.log(`
${colors.fg.cyan}${colors.bright}===== Test Script Complete =====${colors.reset}
`)
