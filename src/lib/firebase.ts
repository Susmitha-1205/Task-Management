import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Test Connection on boot
async function testConnection() {
  try {
    // Attempt a light read to verify network config
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Connection verified successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Firebase is offline. Please check your network connection.", error);
    } else {
      console.warn("Firebase test connection result (this is normal for empty/new databases):", error.message);
    }
  }
}

testConnection();

export { app, auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
