// Firebase Authentication. Loaded by js/auth.js only when someone signs in, registers or signs out.
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, sendEmailVerification, updateProfile, updatePassword, signOut } from 'firebase/auth';
import { app } from './app.mjs';

export const auth = getAuth(app);
export const google = () => signInWithPopup(auth, new GoogleAuthProvider());
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, updateProfile, updatePassword, signOut };
