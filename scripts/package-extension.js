const AdmZip = require("adm-zip")
const fs = require("fs")
const path = require("path")
const { version } = require("../package.json")

// Create a new zip file
const zip = new AdmZip()

// Add the dist directory (Vite build output)
const distPath = path.join(__dirname, "../dist")
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.')
  process.exit(1)
}

// Add all files from dist directory
const addDirectoryToZip = (directory, zipPath) => {
  const files = fs.readdirSync(directory)

  for (const file of files) {
    const filePath = path.join(directory, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      addDirectoryToZip(filePath, path.join(zipPath, file))
    } else {
      const fileData = fs.readFileSync(filePath)
      zip.addFile(path.join(zipPath, file), fileData)
    }
  }
}

addDirectoryToZip(distPath, "")

// Add manifest.json from the dist directory (it should be there after the build)
if (!fs.existsSync(path.join(distPath, "manifest.json"))) {
  console.error("Error: manifest.json not found in dist directory.")
  process.exit(1)
}

// Create the zip file
const outputPath = path.join(__dirname, `../fixhero-dev-inspector-v${version}.zip`)
zip.writeZip(outputPath)

console.log(`Extension packaged successfully: ${outputPath}`)
