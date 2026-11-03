// Sign-in for customers through Firebase Authentication (email and password, Google, password reset), with the
// account record kept in db.js. The Firebase code loads only when it is needed. The admin account stays local, and
// accounts made before Firebase are moved over the first time their owner signs in. If Firebase can't be reached,
// or Authentication isn't switched on for the project yet, everything falls back to the local sign-in, so
// nobody is locked out.
import * as D from './db.js';

let loading;
const load = () => loading ||= import('./firebase/auth.js').catch(err => { console.warn('Firebase Auth unavailable:', err.message); return null; });

// The project can't do this yet (not enabled, or this domain isn't authorised): use the local fallback.
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

export async function register(fields) {
  const fb = await load();
  if (fb) {
    try {
      const { user } = await fb.createUserWithEmailAndPassword(fb.auth, fields.email.trim(), fields.password);
      await fb.updateProfile(user, { displayName: fields.name.trim() }).catch(() => {});
      fb.sendEmailVerification(user).catch(() => {});
      return D.adoptUser(fields);
    } catch (e) { if (!notReady(e)) throw friendly(e); }
  }
  return D.register(fields);
}

export async function login(email, password) {
  const local = D.userByEmail(email);
  if (local?.role === 'admin') return D.login(email, password);
  const fb = await load();
  if (fb) {
    try {
      const { user } = await fb.signInWithEmailAndPassword(fb.auth, email.trim(), password);
      return D.adoptUser({ name: user.displayName, email: user.email });
    } catch (e) {
      if (notReady(e)) return D.login(email, password);
      // An account made before Firebase: if the local password is right, create its Firebase account now.
      if (['auth/invalid-credential', 'auth/user-not-found'].includes(e.code) && await D.checkPassword(email, password)) {
        try {
          await fb.createUserWithEmailAndPassword(fb.auth, email.trim(), password);
          return D.adoptUser({ name: local.name, email });
        } catch (e2) { throw friendly(notReady(e2) ? e : e2); }
      }
      throw friendly(e);
    }
  }
  return D.login(email, password);
}

// Resolves to the signed-in customer, or null when the person closed the Google window.
export async function google() {
  const fb = await load();
  if (!fb) throw new Error('Google sign-in is unavailable right now. Use your email and password.');
  try {
    const { user } = await fb.google();
    return D.adoptUser({ name: user.displayName, email: user.email });
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
  const fb = loading && await loading;
  if (fb?.auth.currentUser) {
    try { return await fb.updatePassword(fb.auth.currentUser, next); } catch (e) { throw friendly(e); }
  }
  return D.changePassword(user, next);
}

export function logout() {
  D.logout();
  load().then(fb => fb?.signOut(fb.auth)).catch(() => {});
}
