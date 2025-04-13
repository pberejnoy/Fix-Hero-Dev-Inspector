const fs = require("fs")
const path = require("path")

// Define source and destination directories
const sourceIconsDir = path.join(__dirname, "../public/icons")
const destIconsDir = path.join(__dirname, "../dist/assets/icons")

// Create destination directory if it doesn't exist
if (!fs.existsSync(destIconsDir)) {
  fs.mkdirSync(destIconsDir, { recursive: true })
}

// Copy icon files
const iconFiles = ["icon-16.png", "icon-32.png", "icon-48.png", "icon-128.png"]
iconFiles.forEach((iconFile) => {
  const sourcePath = path.join(sourceIconsDir, iconFile)
  const destPath = path.join(destIconsDir, iconFile)

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath)
    console.log(`Copied ${iconFile} to ${destPath}`)
  } else {
    console.error(`Error: Icon file ${sourcePath} does not exist`)
    process.exit(1)
  }
})

// Copy sound files
const sourceSoundsDir = path.join(__dirname, "../public/sounds")
const destSoundsDir = path.join(__dirname, "../dist/sounds")

// Create destination directory if it doesn't exist
if (!fs.existsSync(destSoundsDir)) {
  fs.mkdirSync(destSoundsDir, { recursive: true })
}

// Copy all sound files
if (fs.existsSync(sourceSoundsDir)) {
  const soundFiles = fs.readdirSync(sourceSoundsDir)
  soundFiles.forEach((soundFile) => {
    const sourcePath = path.join(sourceSoundsDir, soundFile)
    const destPath = path.join(destSoundsDir, soundFile)

    fs.copyFileSync(sourcePath, destPath)
    console.log(`Copied ${soundFile} to ${destPath}`)
  })
} else {
  console.warn(`Warning: Sounds directory ${sourceSoundsDir} does not exist`)
}

console.log("Asset copying completed successfully")
