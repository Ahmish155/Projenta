import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Reads the service account from an env var containing the full JSON
// (recommended for hosting platforms), or falls back to a local file
// at backend/serviceAccountKey.json for local development.
let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  credential = admin.credential.cert(parsed);
} else {
  const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
  try {
    const raw = fs.readFileSync(keyPath, "utf-8");
    credential = admin.credential.cert(JSON.parse(raw));
  } catch (err) {
    console.error(
      "\n[firebaseAdmin] Could not load Firebase credentials.\n" +
      "Set FIREBASE_SERVICE_ACCOUNT in .env (the full JSON, one line) OR\n" +
      "place your downloaded key at backend/serviceAccountKey.json.\n" +
      "See README.md > Firebase setup for exact steps.\n"
    );
    throw err;
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

export default admin;
