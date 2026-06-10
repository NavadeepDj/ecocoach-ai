import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from "firebase/auth";

// Check if Vite environment variables are present
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isMockMode = !firebaseConfig.apiKey;

let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (!isMockMode) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase failed to initialize. Falling back to Mock Mode.", error);
  }
}

// Mock Auth State for developer convenience
interface MockState {
  user: UserProfile | null;
  listeners: ((user: UserProfile | null) => void)[];
}

const mockState: MockState = {
  user: JSON.parse(localStorage.getItem("ecocoach_mock_user") || "null"),
  listeners: [],
};

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export async function signInWithGoogle(): Promise<UserProfile> {
  if (isMockMode) {
    const mockUser: UserProfile = {
      uid: "mock-uid-123",
      email: "eco.challenger@example.com",
      displayName: "Eco Challenger",
    };
    mockState.user = mockUser;
    localStorage.setItem("ecocoach_mock_user", JSON.stringify(mockUser));
    mockState.listeners.forEach((listener) => listener(mockUser));
    return mockUser;
  }

  if (!auth || !googleProvider) {
    throw new Error("Firebase auth not initialized");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
  };
}

export async function logout(): Promise<void> {
  if (isMockMode) {
    mockState.user = null;
    localStorage.removeItem("ecocoach_mock_user");
    mockState.listeners.forEach((listener) => listener(null));
    return;
  }

  if (!auth) {
    throw new Error("Firebase auth not initialized");
  }
  await signOut(auth);
}

export function onAuthChanged(callback: (user: UserProfile | null) => void): () => void {
  if (isMockMode) {
    mockState.listeners.push(callback);
    // Call immediately with current mock user
    callback(mockState.user);
    // Return unsubscribe function
    return () => {
      mockState.listeners = mockState.listeners.filter((l) => l !== callback);
    };
  }

  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
    } else {
      callback(null);
    }
  });
}

export async function getAuthToken(): Promise<string> {
  if (isMockMode) {
    const user = mockState.user;
    return user ? `mock-token-${user.uid}` : "";
  }

  if (!auth || !auth.currentUser) return "";
  return auth.currentUser.getIdToken();
}
