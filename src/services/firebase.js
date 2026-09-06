import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

// Web app's Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDaPQMEF9dM1OaC4_FjoKJbyPLUPUop6SA",
  authDomain: "reliai-eb98e.firebaseapp.com",
  projectId: "reliai-eb98e",
  storageBucket: "reliai-eb98e.firebasestorage.app",
  messagingSenderId: "211677291989",
  appId: "1:211677291989:web:2595672b9a72689802495c",
  measurementId: "G-XR74R880D4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function registerWithEmail(email, password, displayName = "") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export default app;
