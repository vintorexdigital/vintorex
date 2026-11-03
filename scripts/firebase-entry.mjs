// Source of dist/js/firebase.js, bundled by `npm run build:firebase` (the site has no bundler, so the
// browser cannot import "firebase/app" itself). Loaded by js/main.js after the page is up.
// This web config is public by design: Firebase security comes from its rules and allowed domains, not from hiding it.
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyC0WAHlesdhaWG_ExvwuVeXGeBqBycVaaE',
  authDomain: 'vintorex-digital-solutions-024.firebaseapp.com',
  projectId: 'vintorex-digital-solutions-024',
  storageBucket: 'vintorex-digital-solutions-024.firebasestorage.app',
  messagingSenderId: '480061500420',
  appId: '1:480061500420:web:1beb791a1c2294b6759951',
  measurementId: 'G-TMWF3S1YEZ',
};

export const app = initializeApp(firebaseConfig);
// Local development and previews would pollute the statistics, so Analytics runs on the live site only.
const live = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !location.hostname.endsWith('.localhost');
export const analytics = live && await isSupported().catch(() => false) ? getAnalytics(app) : null;
