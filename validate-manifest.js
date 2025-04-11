const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'manifest.json');

try {
  const manifestData = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData);

  console.log('Manifest file path:', manifestPath);

  // Validate manifest structure
  if (!manifest.manifest_version || !manifest.name || !manifest.version) {
    throw new Error('Manifest is missing required fields.');
  }

  // Validate permissions
  if (!Array.isArray(manifest.permissions)) {
    throw new Error('Permissions must be an array.');
  }
  console.log('Number of permissions:', manifest.permissions.length);

  // Validate commands
  if (manifest.commands) {
    const commandKeys = Object.keys(manifest.commands);
    if (commandKeys.length > 4) {
      throw new Error('Manifest has more than 4 commands.');
    }

    for (const commandKey of commandKeys) {
      const command = manifest.commands[commandKey];
      if (command.suggested_key && command.suggested_key.default) {
        if (!command.suggested_key.default.startsWith('Ctrl+Shift+')) {
          throw new Error(`Command "${commandKey}" does not use Ctrl+Shift.`);
        }
      }
    }
  }

  console.log('Manifest validation successful.');
} catch (error) {
  console.error('Manifest validation failed:', error.message);
}