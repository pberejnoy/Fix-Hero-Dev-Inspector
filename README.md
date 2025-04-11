# FixHero Dev Inspector

A powerful Chrome extension for web developers to inspect, debug, and report issues with websites.

![FixHero Dev Inspector](screenshots/dashboard.png)

## Features

- **Element Inspection**: Inspect and capture details of any element on a webpage
- **Screenshot Capture**: Take screenshots of the entire page or specific elements
- **Console & Network Error Logging**: Automatically capture JavaScript errors and failed network requests
- **Issue Management**: Organize issues by session, severity, and tags
- **Cloud Sync**: Sync your issues across devices with Firebase integration
- **AI-Powered Suggestions**: Get automatic tags and summaries for your issues
- **Export Options**: Export issues in various formats (Markdown, JSON, CSV, GitHub)
- **Team Collaboration**: Share sessions with team members and clients
- **Dark Mode**: Full support for light and dark themes

## Installation

### From Chrome Web Store

1. Visit the [FixHero Dev Inspector](https://chrome.google.com/webstore/detail/fixhero-dev-inspector/coming-soon) page on the Chrome Web Store
2. Click "Add to Chrome" to install the extension

### Local Development

1. Clone this repository
2. Create a `.env` file based on `.env.example` and add your Firebase credentials
3. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
4. Build the extension:
   \`\`\`
   npm run build
   \`\`\`
5. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Usage

### Keyboard Shortcuts

- `Ctrl+Alt+B`: Toggle inspection mode
- `Ctrl+Alt+S`: Take a screenshot
- `Ctrl+Alt+N`: Add a note
- `Ctrl+Alt+D`: Open dashboard

### Inspection Mode

1. Click the FixHero icon in your browser toolbar to open the popup
2. Click "Inspect Element" or use the keyboard shortcut `Ctrl+Alt+B`
3. Hover over elements on the page to highlight them
4. Click on an element to capture its details

### Managing Issues

1. Open the FixHero popup
2. Navigate to the "Issues" tab
3. View, edit, or delete captured issues
4. Export issues in various formats

### Team Collaboration

1. Open the FixHero popup
2. Click the settings icon
3. Navigate to the "Team" tab
4. Invite team members or generate sharing links

## Development

### Project Structure

\`\`\`
fixhero-dev-inspector/
├── dist/               # Compiled extension files
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── dashboard/  # Dashboard components
│   │   └── ui/         # UI components
│   ├── lib/            # Utility functions and services
│   ├── background.ts   # Background script
│   ├── content.ts      # Content script
│   ├── popup.tsx       # Popup UI
│   └── sidebar.tsx     # Sidebar UI
├── public/             # Static assets
│   ├── icons/          # Extension icons
│   └── sounds/         # Sound effects
├── screenshots/        # Screenshots for documentation
├── .env                # Environment variables (not in git)
├── .env.example        # Example environment variables
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
\`\`\`

### Available Scripts

- `npm run dev`: Start development mode with hot reloading
- `npm run build`: Build for production
- `npm run preview`: Preview the built extension
- `npm run lint`: Run linting
- `npm run test`: Run tests
- `npm run deploy`: Deploy to Firebase hosting
- `npm run package`: Create a ZIP file for Chrome Web Store submission

## Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database and Storage
3. Set up Authentication (Email/Password)
4. Add your Firebase configuration to the `.env` file

## Security Rules

Add these security rules to your Firebase project:

### Firestore Rules

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /invitations/{invitationId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
\`\`\`

### Storage Rules

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## Chrome Web Store Submission

1. Build the extension:
   \`\`\`
   npm run build
   \`\`\`
2. Package the extension:
   \`\`\`
   npm run package
   \`\`\`
3. Upload the generated `fixhero-dev-inspector.zip` file to the Chrome Web Store Developer Dashboard
4. Fill in the required information:
   - Description
   - Screenshots
   - Privacy policy
   - Website URL
5. Submit for review

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Firebase](https://firebase.google.com/)
- [Vite](https://vitejs.dev/)
\`\`\`

Let's create a .env.example file:

```plaintext file=".env.example"
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# OpenAI API Key for AI features
OPENAI_API_KEY=your-openai-api-key

# Extension Version
EXTENSION_VERSION=1.0.0
