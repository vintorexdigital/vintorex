// The Firebase app shared by the Analytics and Auth bundles (built by `npm run build:firebase`).
// This web config is public by design: Firebase security comes from its rules, authorised domains and an
// API key restricted to vintorex.com, not from hiding it.
import { initializeApp } from 'firebase/app';

export const app = initializeApp({
  apiKey: 'AIzaSyC0WAHlesdhaWG_ExvwuVeXGeBqBycVaaE',
  authDomain: 'vintorex-digital-solutions-024.firebaseapp.com',
  projectId: 'vintorex-digital-solutions-024',
  storageBucket: 'vintorex-digital-solutions-024.firebasestorage.app',
  messagingSenderId: '480061500420',
  appId: '1:480061500420:web:1beb791a1c2294b6759951',
  measurementId: 'G-TMWF3S1YEZ',
});
