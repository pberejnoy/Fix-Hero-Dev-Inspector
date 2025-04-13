# FixHero Dev Inspector - Project Structure

This document provides a comprehensive overview of the FixHero Dev Inspector project structure, detailing the purpose and functionality of each file and directory.

\`\`\`
FixHero Dev Inspector/
├── .env                          # Environment variables for Firebase and OpenAI API keys
├── .env.example                  # Template showing required environment variables
├── .github/                      # GitHub-specific configurations
│   └── workflows/                # CI/CD workflow definitions
│       └── deploy.yml            # Automated deployment workflow for the extension
├── .gitignore                    # Specifies files to be ignored by Git
├── LICENSE                       # MIT license file for the project
├── PROJECT_STATUS.md             # Current development status and roadmap
├── README.md                     # Project overview, setup instructions, and documentation
├── components/                   # React components organized by functionality
│   ├── dashboard/                # Components for the main dashboard interface
│   │   ├── dashboard.tsx         # Main dashboard component integrating all features
│   │   ├── inspector.tsx         # Element inspection interface and controls
│   │   ├── issue-list.tsx        # List view of captured issues and bugs
│   │   ├── settings-dialog.tsx   # Settings configuration modal
│   │   ├── subscription-settings.tsx # Subscription management interface
│   │   └── team-management.tsx   # Team collaboration management interface
│   ├── error-boundary.tsx        # React error boundary for graceful error handling
│   ├── firebase-sync-status.tsx  # Component showing Firebase synchronization status
│   ├── global-error-handler.tsx  # Global error handling for unhandled exceptions
│   ├── login-screen.tsx          # Authentication screen for user login
│   ├── sidebar.tsx               # Navigation sidebar component
│   └── ui/                       # Reusable UI components
│       ├── animated-button.tsx   # Button with animation effects
│       ├── async-button.tsx      # Button with loading state for async operations
│       ├── confetti.tsx          # Celebration animation for achievements
│       ├── keyboard-shortcut.tsx # Component for displaying keyboard shortcuts
│       ├── loading-spinner.tsx   # Loading indicator component
│       ├── ripple-effect.tsx     # Ripple animation effect for interactions
│       ├── shortcuts-help.tsx    # Help dialog for keyboard shortcuts
│       ├── skeleton.tsx          # Loading skeleton placeholder component
│       └── success-animation.tsx # Success confirmation animation
├── devtools.html                 # HTML entry point for Chrome DevTools panel
├── docs/                         # Documentation files
│   ├── auto-update-testing.md    # Guide for testing extension auto-updates
│   ├── extension-testing-guide.md # Comprehensive testing guide
│   └── pre-submission-checklist.md # Checklist for Chrome Web Store submission
├── firebase.json                 # Firebase project configuration
├── firestore.indexes.json        # Firestore database indexes configuration
├── firestore.rules               # Security rules for Firestore database
├── hooks/                        # Custom React hooks
│   ├── use-mobile.tsx            # Hook for detecting mobile devices
│   └── use-toast.ts              # Hook for displaying toast notifications
├── index.html                    # Main HTML entry point for development
├── lib/                          # Core library code and services
│   ├── ai-service.ts             # AI-powered features using OpenAI
│   ├── auth-service.ts           # Authentication service for user management
│   ├── export-service.ts         # Service for exporting issues in various formats
│   ├── firebase-config.ts        # Firebase initialization and configuration
│   ├── session-manager-enhanced.ts # Session management for debugging sessions
│   ├── subscription-service.ts   # Subscription and payment management
│   ├── sync-service.ts           # Data synchronization with Firebase
│   ├── team-service.ts           # Team collaboration functionality
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Utility functions used across the app
├── manifest.json                 # Chrome extension manifest configuration
├── options.html                  # HTML entry point for extension options page
├── package.json                  # NPM package configuration and scripts
├── panel.html                    # HTML entry point for DevTools panel content
├── popup.html                    # HTML entry point for extension popup
├── postcss.config.js             # PostCSS configuration for CSS processing
├── public/                       # Static assets
│   ├── icons/                    # Extension icons
│   │   ├── icon-16.png           # 16x16 extension icon
│   │   ├── icon-32.png           # 32x32 extension icon
│   │   ├── icon-48.png           # 48x48 extension icon
│   │   └── icon-128.png          # 128x128 extension icon
│   └── sounds/                   # Sound effects
│       ├── element-captured.mp3  # Sound for element capture
│       ├── inspection-start.mp3  # Sound for starting inspection
│       ├── inspection-stop.mp3   # Sound for stopping inspection
│       ├── notification.mp3      # General notification sound
│       ├── screenshot.mp3        # Sound for taking screenshots
│       └── success.mp3           # Success action sound
├── screenshots/                  # Screenshots for documentation
│   └── dashboard.png             # Dashboard interface screenshot
├── scripts/                      # Utility scripts for development and build
│   ├── build-validator.js        # Script to validate build output
│   ├── generate-update-xml.js    # Script to generate update manifest XML
│   ├── increment-version.js      # Script to increment extension version
│   ├── package-crx.js            # Script to package extension as CRX
│   ├── package-extension.js      # Script to package extension as ZIP
│   ├── test-extension.js         # Script to run automated tests
│   └── validate-manifest.js      # Script to validate manifest.json
├── src/                          # Source code
│   ├── background.ts             # Extension background script
│   ├── content.ts                # Content script injected into web pages
│   ├── dev/                      # Development environment setup
│   │   ├── ChromeApiContext.tsx  # Context for mocking Chrome APIs
│   │   ├── DevApp.tsx            # Development application wrapper
│   │   └── index.tsx             # Entry point for development mode
│   ├── devtools/                 # DevTools panel implementation
│   │   └── index.ts              # DevTools panel initialization
│   ├── globals.css               # Global CSS styles
│   ├── lib/                      # Source-specific library code
│   │   └── firebase.ts           # Firebase initialization for extension
│   ├── options/                  # Options page implementation
│   │   ├── Options.tsx           # Options page component
│   │   └── index.tsx             # Options page entry point
│   ├── panel/                    # DevTools panel UI
│   │   ├── Panel.tsx             # Panel component
│   │   └── index.tsx             # Panel entry point
│   ├── popup/                    # Popup implementation
│   │   ├── Popup.tsx             # Popup component
│   │   └── index.tsx             # Popup entry point
│   ├── styles/                   # Styling
│   │   └── globals.css           # Global CSS styles
│   └── utils/                    # Utility functions
│       └── screenshot.ts         # Screenshot capture utility
├── storage.rules                 # Firebase Storage security rules
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.node.json            # TypeScript configuration for Node.js
└── vite.config.ts                # Vite bundler configuration
\`\`\`

## Key Directories

### `/components`
Contains all React components organized by functionality. The dashboard directory holds components specific to the main interface, while the ui directory contains reusable UI elements used throughout the application.

### `/lib`
Core library code including services for authentication, data synchronization, and export functionality. This directory contains the business logic of the application.

### `/src`
Source code for the extension, including background and content scripts, as well as the implementation of various extension views (popup, options, devtools panel).

### `/scripts`
Utility scripts for development, building, and validation of the extension. These scripts automate common tasks and ensure the extension meets Chrome Web Store requirements.

### `/docs`
Documentation files including testing guides and submission checklists. These documents help maintain quality and provide guidance for development.

### `/public`
Static assets including icons and sound effects used by the extension.

## Key Files

### `manifest.json`
The central configuration file for the Chrome extension, defining permissions, entry points, and metadata required by Chrome.

### `vite.config.ts`
Configuration for the Vite bundler, defining how the application is built for both development and production.

### `src/background.ts`
Background script that runs persistently in the extension context, handling events and managing the extension's lifecycle.

### `src/content.ts`
Content script injected into web pages to interact with the DOM and capture issues for debugging.

### `lib/session-manager-enhanced.ts`
Core service that manages debugging sessions, including creation, updating, and deletion of sessions and issues.

### `lib/firebase-config.ts`
Firebase initialization and configuration, setting up the connection to Firestore and other Firebase services.

### `components/dashboard/dashboard.tsx`
Main dashboard interface that integrates all the extension's features, serving as the central hub for the user.

## Build and Packaging

The extension uses Vite for building and the following scripts for packaging:

- `scripts/package-extension.js`: Creates a ZIP file for Chrome Web Store submission
- `scripts/validate-manifest.js`: Ensures the manifest.json file is valid and follows best practices
- `scripts/build-validator.js`: Validates the build output for completeness

## Firebase Integration

Firebase is used for data storage and authentication:

- `firestore.rules`: Defines security rules for Firestore database access
- `storage.rules`: Defines security rules for Firebase Storage
- `lib/sync-service.ts`: Handles data synchronization between local storage and Firebase

## Development Environment

The development environment is set up to allow testing without Chrome extension APIs:

- `src/dev/ChromeApiContext.tsx`: Provides mock implementations of Chrome APIs
- `src/dev/DevApp.tsx`: Wraps the application for development mode
- `index.html`: Entry point for the development server
