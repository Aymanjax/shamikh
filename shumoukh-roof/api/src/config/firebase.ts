import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function loadCredentials(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  // Fallback: GOOGLE_APPLICATION_CREDENTIALS env var or ADC
  return {};
}

function initFirebase() {
  if (getApps().length > 0) return;

  const credentials = loadCredentials();

  if (credentials.clientEmail) {
    initializeApp({ credential: cert(credentials) });
  } else {
    initializeApp();
  }
}

initFirebase();

export const db = getFirestore();
export const auth = getAuth();
