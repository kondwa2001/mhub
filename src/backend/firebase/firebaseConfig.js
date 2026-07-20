import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase web configuration is public by design; keep it in .env.local so
// deployments can provide their own project values without editing source code.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
}

const requiredAuthConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const requiredFullConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
export const hasFirebaseConfig = requiredAuthConfigKeys.every((key) => Boolean(firebaseConfig[key]))
export const hasFullFirebaseConfig = requiredFullConfigKeys.every((key) => Boolean(firebaseConfig[key]))

export const app = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

// Analytics only works in supported browser environments. Exporting a promise
// keeps SSR, tests, and privacy-restricted browsers from crashing on startup.
export let analytics = Promise.resolve(null)

if (app && firebaseConfig.measurementId) {
  analytics = typeof window === 'undefined'
    ? Promise.resolve(null)
    : isSupported().then((supported) => (supported ? getAnalytics(app) : null))
}
