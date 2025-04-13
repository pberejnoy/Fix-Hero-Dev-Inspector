const fs = require("fs")
const path = require("path")

// Read package.json
const packageJsonPath = path.resolve(__dirname, "../package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

// Parse the current version
const currentVersion = packageJson.version
const versionParts = currentVersion.split(".")
const [major, minor, patch] = versionParts.map(Number)

// Increment the patch version
const newVersion = `${major}.${minor}.${patch + 1}`
packageJson.version = newVersion

// Update package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")

// Update manifest.json
const manifestJsonPath = path.resolve(__dirname, "../manifest.json")
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, "utf8"))
manifestJson.version = newVersion
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + "\n")

console.log(`Version incremented from ${currentVersion} to ${newVersion}`)
