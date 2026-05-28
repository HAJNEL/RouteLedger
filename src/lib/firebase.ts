import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let fbApp;
let db: any = null;
let auth: any = null;
let isRealFirebase = false;

// Check if we have valid Firebase configuration in firebase-applet-config.json
if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
  try {
    fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(fbApp);
    isRealFirebase = true;
    console.log("Firebase services connected successfully in RouteLedger.");
  } catch (error) {
    console.error("Discovered Firebase init error, falling back securely:", error);
  }
} else {
  console.log("RouteLedger running in resilient local mock-db simulation.");
}

export { db, auth, isRealFirebase };
export default firebaseConfig;
