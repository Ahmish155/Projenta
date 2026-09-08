import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

// Values come from your Firebase project settings (Project settings > General > Your apps > SDK setup).
// These are public identifiers, not secrets — safe to ship in frontend code.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Vite bakes VITE_* vars in at BUILD time, not runtime. If any are missing —
// e.g. they weren't set on the hosting platform before the build ran — fail
// loudly and visibly instead of letting the whole app crash to a blank white
// screen with nothing but a console error to go on.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError =
  missingKeys.length > 0
    ? `Missing Firebase config: ${missingKeys.join(", ")}. These must be set as environment variables BEFORE the frontend is built — check your hosting platform's env vars and trigger a fresh build.`
    : null;

let app, auth, googleProvider, facebookProvider, githubProvider;

if (!firebaseConfigError) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();
  githubProvider = new GithubAuthProvider();
}

export { auth, googleProvider, facebookProvider, githubProvider };