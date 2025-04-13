const fs = require("fs")
const path = require("path")
const chalk = require("chalk") // For colored console output

// Path to the manifest file
const manifestPath = path.join(__dirname, "../manifest.json")
\
console.log(chalk.cyan.bold("
=== FixHero Dev Inspector Manifest Validator ===
"))

// Read the manifest file
try {
  const manifestContent = fs.readFileSync(manifestPath, "utf8")
  let manifest

  try {
    manifest = JSON.parse(manifestContent)
    console.log(chalk.green("✓ manifest.json is valid JSON
"))
  } catch (parseError) {
    console.error(chalk.red(`Error: manifest.json contains invalid JSON: ${parseError.message}`))
    process.exit(1)
  }

  // Check required fields
  console.log(chalk.cyan("Checking required fields:"))
  const requiredFields = ["manifest_version", "name", "version", "description"]
  const missingFields = requiredFields.filter((field) => !manifest[field])

  if (missingFields.length > 0) {
    console.error(chalk.red(`Error: Missing required fields in manifest.json: ${missingFields.join(", ")}`))
    process.exit(1)
  } else {
    console.log(chalk.green("✓ All required fields are present"))
  }

  // Check manifest version
  if (manifest.manifest_version !== 3) {
    console.error(chalk.red("Error: manifest_version must be 3 for Chrome extensions."))
    process.exit(1)
  } else {
    console.log(chalk.green("✓ manifest_version is 3"))
  }

  // Check version format
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(manifest.version)) {
    console.error(chalk.red("Error: version must follow the format x.y.z (e.g., 1.0.0)"))
    process.exit(1)
  } else {
    console.log(chalk.green(`✓ version format is valid: ${manifest.version}`))
  }

  // Check action (popup)
  if (!manifest.action) {
    console.warn(chalk.yellow("Warning: No 'action' field found. Extension won't have a popup."))
  } else {
    if (!manifest.action.default_popup) {
      console.warn(chalk.yellow("Warning: No 'default_popup' specified in 'action'."))
    } else {
      const popupPath = path.join(__dirname, "..", manifest.action.default_popup)
      if (!fs.existsSync(popupPath)) {
        console.error(chalk.red(`Error: default_popup file '${manifest.action.default_popup}' does not exist.`))
      } else {
        console.log(chalk.green(`✓ default_popup file exists: ${manifest.action.default_popup}`))
      }
    }

    // Check icons in action
    if (!manifest.action.default_icon) {
      console.warn(chalk.yellow("Warning: No 'default_icon' specified in 'action'."))
    } else {
      console.log(chalk.green("✓ default_icon is specified in action"))
    }
  }

  // Check background
  if (!manifest.background) {
    console.warn(chalk.yellow("Warning: No 'background' field found. Extension won't have a background script."))
  } else {
    if (manifest.background.service_worker) {
      const serviceWorkerPath = path.join(__dirname, "..", manifest.background.service_worker)
      if (!fs.existsSync(serviceWorkerPath)) {
        console.error(chalk.red(`Error: service_worker file '${manifest.background.service_worker}' does not exist.`))
      } else {
        console.log(chalk.green(`✓ service_worker file exists: ${manifest.background.service_worker}`))
      }
    } else {
      console.warn(chalk.yellow("Warning: No 'service_worker' specified in 'background'."))
    }
  }

  // Check icons
  console.log(chalk.cyan("
Checking icons:"))
  if (!manifest.icons) {
    console.warn(chalk.yellow("Warning: No 'icons' field found. Extension won't have icons."))
  } else {
    const requiredIconSizes = ["16", "48", "128"]
    const missingIconSizes = requiredIconSizes.filter((size) => !manifest.icons[size])

    if (missingIconSizes.length > 0) {
      console.warn(chalk.yellow(`Warning: Missing recommended icon sizes: ${missingIconSizes.join(", ")}px`))
    } else {
      console.log(chalk.green("✓ All recommended icon sizes are present"))
    }

    // Check if icon files exist
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      const fullIconPath = path.join(__dirname, "..", iconPath)
      if (!fs.existsSync(fullIconPath)) {
        console.error(chalk.red(`Error: Icon file '${iconPath}' for size ${size}px does not exist.`))
      } else {
        console.log(chalk.green(`✓ Icon file for ${size}px exists: ${iconPath}`))
      }
    }
  }

  // Check permissions
  console.log(chalk.cyan("
Checking permissions:"))
  if (!manifest.permissions || manifest.permissions.length === 0) {
    console.warn(chalk.yellow("Warning: No permissions specified. Extension may have limited functionality."))
  } else {
    console.log(chalk.green(`✓ Permissions specified: ${manifest.permissions.join(", ")}`))

    // Check for potentially problematic permissions
    const sensitivePermissions = ["tabs", "<all_urls>", "webNavigation", "webRequest", "management"]
    const usedSensitivePermissions = manifest.permissions.filter((perm) => sensitivePermissions.includes(perm))

    if (usedSensitivePermissions.length > 0) {
      console.warn(
        chalk.yellow(
          `Warning: Using sensitive permissions that may trigger extra review: ${usedSensitivePermissions.join(", ")}`,
        ),
      )
    }
  }

  // Check host permissions
  if (manifest.host_permissions && manifest.host_permissions.includes("<all_urls>")) {
    console.warn(chalk.yellow("Warning: Using '<all_urls>' host permission may trigger extra review."))
  }

  // Check content scripts
  console.log(chalk.cyan("
Checking content scripts:"))
  if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
    console.warn(chalk.yellow("Warning: No content scripts specified."))
  } else {
    for (let i = 0; i < manifest.content_scripts.length; i++) {
      const contentScript = manifest.content_scripts[i]

      if (!contentScript.matches || contentScript.matches.length === 0) {
        console.error(chalk.red(`Error: Content script #${i + 1} does not specify any matches.`))
      } else {
        console.log(chalk.green(`✓ Content script #${i + 1} has matches: ${contentScript.matches.join(", ")}`))
      }

      if (!contentScript.js || contentScript.js.length === 0) {
        console.error(chalk.red(`Error: Content script #${i + 1} does not specify any JS files.`))
      } else {
        // Check if JS files exist
        for (const jsFile of contentScript.js) {
          const jsPath = path.join(__dirname, "..", jsFile)
          if (!fs.existsSync(jsPath)) {
            console.error(chalk.red(`Error: Content script JS file '${jsFile}' does not exist.`))
          } else {
            console.log(chalk.green(`✓ Content script JS file exists: ${jsFile}`))
          }
        }
      }
    }
  }

  // Check commands (keyboard shortcuts)
  console.log(chalk.cyan("
Checking commands:"))
  if (!manifest.commands || Object.keys(manifest.commands).length === 0) {
    console.warn(chalk.yellow("Warning: No keyboard shortcuts specified."))
  } else {
    for (const [commandName, command] of Object.entries(manifest.commands)) {
      console.log(chalk.green(`✓ Command '${commandName}' defined`))

      if (command.suggested_key) {
        const { default: defaultKey, mac } = command.suggested_key

        // Check for conflicting shortcuts
        const problematicShortcuts = [
          "Ctrl+N",
          "Ctrl+T",
          "Ctrl+W",
          "Ctrl+Shift+N",
          "Ctrl+Shift+T",
          "Ctrl+Shift+W",
          "Ctrl+Shift+I",
          "Ctrl+Shift+J",
          "F12",
        ]

        if (defaultKey && problematicShortcuts.some((s) => defaultKey.includes(s))) {
          console.warn(
            chalk.yellow(
              `Warning: Command "${commandName}" uses ${defaultKey}, which may conflict with browser shortcuts.`,
            ),
          )
        } else if (defaultKey) {
          console.log(chalk.green(`✓ Default shortcut for '${commandName}': ${defaultKey}`))
        }

        if (mac && problematicShortcuts.some((s) => mac.includes(s.replace("Ctrl", "Command")))) {
          console.warn(
            chalk.yellow(
              `Warning: Command "${commandName}" uses ${mac} on Mac, which may conflict with browser shortcuts.`,
            ),
          )
        } else if (mac) {
          console.log(chalk.green(`✓ Mac shortcut for '${commandName}': ${mac}`))
        }
      } else {
        console.warn(chalk.yellow(`Warning: Command '${commandName}' has no suggested key.`))
      }
    }
  }

  // Check web_accessible_resources
  if (manifest.web_accessible_resources) {
    console.log(chalk.cyan("
Checking web_accessible_resources:"))
    for (const resource of manifest.web_accessible_resources) {
      if (!resource.resources || resource.resources.length === 0) {
        console.warn(chalk.yellow("Warning: web_accessible_resources entry has no resources specified."))
      } else {
        console.log(chalk.green(`✓ web_accessible_resources specified with ${resource.resources.length} resources`))
      }

      if (!resource.matches || resource.matches.length === 0) {
        console.error(chalk.red("Error: web_accessible_resources entry has no matches specified."))
      } else {
        console.log(chalk.green(`✓ web_accessible_resources has matches: ${resource.matches.join(", ")}`))
      }
    }
  }

  // Check devtools_page
  if (manifest.devtools_page) {
    const devtoolsPath = path.join(__dirname, "..", manifest.devtools_page)
    if (!fs.existsSync(devtoolsPath)) {
      console.error(chalk.red(`Error: devtools_page file '${manifest.devtools_page}' does not exist.`))
    } else {
      console.log(chalk.green(`✓ devtools_page file exists: ${manifest.devtools_page}`))
    }
  }

  // Check options_page
  if (manifest.options_page) {
    const optionsPath = path.join(__dirname, "..", manifest.options_page)
    if (!fs.existsSync(optionsPath)) {
      console.error(chalk.red(`Error: options_page file '${manifest.options_page}' does not exist.`))
    } else {
      console.log(chalk.green(`✓ options_page file exists: ${manifest.options_page}`))
    }
  }

  console.log(chalk.cyan.bold("
=== Manifest Validation Complete ===
"))
} catch (error) {
  console.error(chalk.red("Error reading or parsing manifest.json:", error.message))
  process.exit(1)
}
