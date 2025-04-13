# Testing the Auto-Update Flow

This document outlines the steps to test the auto-update functionality of the FixHero Dev Inspector Chrome Extension.

## Prerequisites

1. A published extension on the Chrome Web Store (to get an extension ID)
2. Firebase Hosting set up and configured
3. A private key for signing the extension (.pem file)

## Testing Steps

### 1. Initial Setup

1. Make sure your extension is already published on the Chrome Web Store
2. Note your extension ID from the Chrome Web Store URL
3. Update the `extensionId` in `scripts/generate-update-xml.js` with your actual extension ID
4. Ensure you have the private key (.pem file) used to sign your extension

### 2. Create a Baseline Version

1. Set the version in `package.json` and `manifest.json` to a baseline (e.g., "1.0.0")
2. Build and package the extension:
   \`\`\`
   npm run package
   \`\`\`
3. Deploy to Firebase:
   \`\`\`
   firebase deploy
   \`\`\`
4. Install this version of the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### 3. Create an Updated Version

1. Increment the version:
   \`\`\`
   npm run increment-version
   \`\`\`
2. Make some visible changes to the extension (e.g., change a UI element color)
3. Build, package, and deploy:
   \`\`\`
   npm run deploy
   \`\`\`

### 4. Verify Auto-Update

1. Chrome checks for updates periodically (typically every few hours)
2. To force an update check:
   - Go to `chrome://extensions/`
   - Click the "Update" button (or enable "Developer mode" and click "Update extensions now")
3. Verify that your extension updates to the new version:
   - The version number should change
   - Your visible UI changes should appear

### 5. Troubleshooting

If the auto-update doesn't work:

1. Check Chrome's update logs:
   - Go to `chrome://extensions-internals/`
   - Look for your extension ID
   - Check the "Extension State" section for update attempts
2. Verify your `updates.xml` file:
   - Open `https://fixhero-dev-inspector.web.app/updates.xml` in a browser
   - Ensure it contains the correct extension ID and version
3. Check that the CRX file is accessible:
   - Try to download it directly from your Firebase Hosting URL
4. Verify the content types in Firebase Hosting:
   - Make sure `.crx` and `.xml` files are served with the correct MIME types

## Common Issues

1. **Incorrect Extension ID**: Make sure the extension ID in `updates.xml` matches your published extension ID
2. **Missing or Invalid Private Key**: The private key must be the same one used to sign the original extension
3. **MIME Type Issues**: Firebase Hosting must serve `.crx` files with the correct content type
4. **Cross-Origin Issues**: Make sure your Firebase Hosting is configured to allow cross-origin requests for update files
5. **Version Number Format**: Chrome expects version numbers in the format `major.minor.patch.build` (e.g., "1.0.0.0")

## References

- [Chrome Extension Autoupdate](https://developer.chrome.com/docs/extensions/mv3/hosting#update_manifest)
- [Firebase Hosting Configuration](https://firebase.google.com/docs/hosting/full-config)
