// Shared server sessions and passwords, with verified Firebase sign-in for existing accounts and Google users.
import * as D from './db.js';

let loading;
const load = () => loading ||= import('./firebase/auth.js').catch(err => { console.warn('Firebase Auth unavailable:', err.message); return null; });

// Firebase can be unavailable on domains where it has not been configured.
const NOT_READY = new Set(['auth/configuration-not-found', 'auth/operation-not-allowed', 'auth/admin-restricted-operation', 'auth/invalid-api-key', 'auth/api-key-not-valid.-please-pass-a-valid-api-key.', 'auth/unauthorized-domain', 'auth/network-request-failed']);
const MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Choose a password of at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/user-disabled': 'This account is blocked. Contact support.',
  'auth/requires-recent-login': 'For your security, sign out, sign in again and then change your password.',
};
const friendly = e => Object.assign(new Error(MESSAGES[e.code] || e.message || 'Something went wrong. Please try again.'), { code: e.code });
const notReady = e => NOT_READY.has(e?.code);
const cancelled = e => ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e?.code);

export async function register(fields) { return D.register(fields); }
export async function login(email, password) {
  try { return await D.login(email, password); }
  catch (error) {
    if (error.status !== 401) throw error;
    const fb = await load();
    if (!fb) throw error;
    try {
      const { user } = await fb.signInWithEmailAndPassword(fb.auth, email.trim(), password);
      return await D.adoptUser({ name: user.displayName || user.email.split('@')[0], email: user.email }, await user.getIdToken());
    } catch (firebaseError) {
      if (notReady(firebaseError)) throw error;
      throw friendly(firebaseError);
    }
  }
}

// Resolves to the signed-in customer, or null when the person closed the Google window.
export async function google() {
  const fb = await load();
  if (!fb) throw new Error('Google sign-in is unavailable right now. Use your email and password.');
  try {
    const { user } = await fb.google();
    return D.adoptUser({ name: user.displayName || user.email.split('@')[0], email: user.email }, await user.getIdToken());
  } catch (e) {
    if (cancelled(e)) return null;
    throw friendly(notReady(e) ? Object.assign(e, { message: 'Google sign-in is not available yet. Use your email and password.' }) : e);
  }
}

export async function resetPassword(email) {
  const fb = await load();
  if (!fb) throw new Error('Password reset is unavailable right now. Please contact support.');
  try { await fb.sendPasswordResetEmail(fb.auth, email.trim()); }
  catch (e) { if (e.code !== 'auth/user-not-found') throw friendly(notReady(e) ? Object.assign(e, { message: 'Password reset is not available yet. Please contact support.' }) : e); }
}

export async function changePassword(user, next) {
  if (loading) {
    const fb = await loading;
    if (fb?.auth.currentUser) {
      try { await fb.updatePassword(fb.auth.currentUser, next); }
      catch (error) { throw friendly(error); }
    }
  }
  return D.changePassword(user, next);
}

export async function logout() {
  await D.logout();
  load().then(fb => fb?.signOut(fb.auth)).catch(() => {});
}
