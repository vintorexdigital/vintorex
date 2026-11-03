// Google Analytics through Firebase. Loaded by js/main.js after the page is up.
import { getAnalytics, isSupported } from 'firebase/analytics';
import { app } from './app.mjs';

// Local development and previews would pollute the statistics, so Analytics runs on the live site only.
const live = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !location.hostname.endsWith('.localhost');
export const analytics = live && await isSupported().catch(() => false) ? getAnalytics(app) : null;
