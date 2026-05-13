import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAJHC0lWUhGV3Zem9ddZsv7pOIVYRwunW0",
  authDomain: "updonemark.firebaseapp.com",
  projectId: "updonemark",
  storageBucket: "updonemark.firebasestorage.app",
  messagingSenderId: "1052940404927",
  appId: "1:1052940404927:web:bfc7ddadf4fd825e3b5e0a",
  measurementId: "G-RQEJP3FZS6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
// Initialize analytics conditionally to avoid issues in dev/test environments
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export default app;
