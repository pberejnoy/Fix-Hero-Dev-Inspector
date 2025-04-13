# FixHero Dev Inspector - Extension Testing Guide

This guide provides a step-by-step process for testing the FixHero Dev Inspector Chrome extension to ensure it works correctly after building.

## 1. Validate Manifest and Build

Before testing the extension in Chrome, run the validation scripts to check for any issues:

\`\`\`bash
# Validate the manifest.json file
npm run validate-manifest

# Build the extension
npm run build

# Validate the build output
npm run validate-build
\`\`\`

Fix any issues reported by the validation scripts before proceeding.

## 2. Install the Extension in Chrome

### Method 1: Load Unpacked (for development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `dist` directory
4. The extension should appear in your extensions list without errors

### Method 2: Install from ZIP (for testing packaged extension)

1. Run `npm run build-extension` to create a ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Drag and drop the ZIP file onto the extensions page
5. The extension should install without errors

## 3. Test Basic Functionality

### Popup

1. Click the FixHero Dev Inspector icon in the Chrome toolbar
2. Verify that the popup opens correctly
3. Check that the UI renders properly without visual glitches
4. Verify that all buttons and controls are clickable

### Authentication

1. Test login with valid credentials
2. Test login with invalid credentials (should show error message)
3. Test logout functionality
4. Verify that authentication state persists across browser sessions

## 4. Test Core Features

### Screenshots

1. Navigate to any website
2. Use the keyboard shortcut `Ctrl+Shift+S` (or `Command+Shift+S` on Mac) to take a screenshot
3. Verify that a screenshot is captured and saved
4. Check that the screenshot appears in the extension's history

### Notes

1. Navigate to any website
2. Use the keyboard shortcut `Ctrl+Shift+N` (or `Command+Shift+N` on Mac) to add a note
3. Enter some text and save the note
4. Verify that the note is saved and appears in the extension's history

### Sidebar

1. Navigate to any website
2. Use the keyboard shortcut `Ctrl+Shift+D` (or `Command+Shift+D` on Mac) to toggle the sidebar
3. Verify that the sidebar appears and disappears correctly
4. Check that the sidebar displays relevant information

### Dashboard

1. Use the keyboard shortcut `Ctrl+Shift+M` (or `Command+Shift+M` on Mac) to open the dashboard
2. Verify that the dashboard opens in a new tab
3. Check that all dashboard features work correctly

## 5. Test Firebase Integration

1. Take a screenshot and verify it's uploaded to Firebase Storage
2. Add a note and verify it's saved to Firestore
3. Check that data is retrieved correctly when viewing history
4. Verify that data is associated with the correct user account

## 6. Test Export Functionality

1. Capture several screenshots and notes
2. Test exporting data in Markdown format
3. Test exporting data in CSV format
4. Test exporting data in JSON format
5. Verify that exported files contain the correct data

## 7. Check for Errors

1. Open Chrome DevTools (F12 or Ctrl+Shift+I)
2. Navigate to the Console tab
3. Perform all the above tests while monitoring for errors
4. Fix any errors that appear in the console

## 8. Cross-Browser Testing (Optional)

If your extension supports other browsers:

1. Test in Firefox using web-ext
2. Test in Edge by loading the unpacked extension
3. Verify that all features work consistently across browsers

## 9. Performance Testing

1. Test the extension on a page with many elements
2. Verify that screenshots capture correctly on complex pages
3. Check that the extension doesn't significantly slow down page loading

## 10. Final Verification

1. Uninstall and reinstall the extension
2. Verify that all features still work after reinstallation
3. Check that user data is preserved (if using Firebase)

## Troubleshooting Common Issues

### Extension Not Loading

- Check that the manifest.json is valid
- Verify that all required files are included in the build
- Look for errors in the Chrome extensions page

### Firebase Authentication Issues

- Verify that Firebase is properly configured
- Check that the correct API keys are being used
- Ensure that authentication methods are enabled in Firebase console

### Keyboard Shortcuts Not Working

- Check for conflicts with other extensions or browser shortcuts
- Verify that the commands are correctly defined in manifest.json
- Try reloading the extension

### Content Script Issues

- Check that content scripts are being injected correctly
- Verify that the matches patterns are correct
- Look for errors in the console when the content script runs
\`\`\`

Let's create a pre-submission checklist:
