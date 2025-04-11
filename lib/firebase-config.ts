import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBdkuls9jYVHzTNG9Do97BAwYGLfpxMWtk",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fixhero-dev-inspector.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "fixhero-dev-inspector",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fixhero-dev-inspector.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "389417979443",
  appId: process.env.FIREBASE_APP_ID || "1:389417979443:web:1add25cb313301a7ba5d46",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-652BW1G2GY",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

export { app, db, storage, auth }
