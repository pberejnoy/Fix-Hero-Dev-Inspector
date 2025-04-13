# FixHero Dev Inspector - Pre-Submission Checklist

Use this checklist before submitting your extension to the Chrome Web Store to ensure it meets all requirements and works correctly.

## Manifest Validation

- [ ] Run `npm run validate-manifest` with no errors
- [ ] Manifest version is set to 3
- [ ] All required fields are present (name, version, description, etc.)
- [ ] Version number follows semantic versioning (x.y.z)
- [ ] Icons are specified for all required sizes (16px, 48px, 128px)
- [ ] Permissions are minimized to only what's necessary
- [ ] Keyboard shortcuts don't conflict with browser defaults

## Build Validation

- [ ] Run `npm run build` with no errors
- [ ] Run `npm run validate-build` with no errors
- [ ] All required files are included in the build
- [ ] No unnecessary files are included in the build
- [ ] ZIP file structure is correct (manifest.json at root level)

## Functionality Testing

- [ ] Extension installs without errors
- [ ] Popup opens correctly
- [ ] Authentication works (login, logout)
- [ ] Screenshots can be captured
- [ ] Notes can be added
- [ ] Sidebar can be toggled
- [ ] Dashboard opens correctly
- [ ] All keyboard shortcuts work
- [ ] Firebase integration works correctly
- [ ] Export functionality works for all formats

## UI/UX Testing

- [ ] UI renders correctly on different screen sizes
- [ ] All text is readable and properly aligned
- [ ] Buttons and controls are properly sized and spaced
- [ ] Color scheme is consistent
- [ ] Loading states are handled gracefully
- [ ] Error messages are clear and helpful

## Performance Testing

- [ ] Extension loads quickly
- [ ] Screenshots capture without significant delay
- [ ] UI remains responsive during operations
- [ ] No memory leaks (test by leaving extension open for extended periods)

## Security Testing

- [ ] Authentication is secure
- [ ] Data is stored securely
- [ ] No sensitive information is exposed in the code
- [ ] Firebase security rules are properly configured
- [ ] Content Security Policy is properly configured

## Browser Compatibility

- [ ] Works in Chrome (latest version)
- [ ] Works in Chrome (older versions if supporting them)
- [ ] Works in other browsers if applicable (Firefox, Edge)

## Documentation

- [ ] README.md is up-to-date
- [ ] Installation instructions are clear
- [ ] Usage instructions are provided
- [ ] Privacy policy is included if required
- [ ] Support contact information is provided

## Chrome Web Store Listing

- [ ] Store listing has compelling description
- [ ] Screenshots showcase key features
- [ ] Promotional images are prepared
- [ ] Privacy practices are disclosed
- [ ] Categories and tags are appropriate

## Final Checks

- [ ] Run a final test with the packaged ZIP file
- [ ] Verify all features work after fresh installation
- [ ] Check console for any errors or warnings
- [ ] Ensure extension works in incognito mode if needed
- [ ] Test with different user accounts
