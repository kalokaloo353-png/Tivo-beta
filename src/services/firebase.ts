import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection,
  query,
  where,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Get user profile directly by ID from Firestore
export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.warn('Firestore getUser lookup error:', err);
  }
  return null;
}

// Save or sync user profile in Firestore
export async function syncUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore sync notice:', error);
  }
}

// Find user in Firestore by username, handle, or ID
export async function findUserInFirestore(usernameOrHandle: string): Promise<User | null> {
  try {
    const clean = usernameOrHandle.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return null;

    const usersRef = collection(db, 'users');
    
    // 1. Try querying where username matches clean handle
    const q = query(usersRef, where('username', '==', clean));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as User;
    }

    // 2. Try direct document ID lookup
    const docSnap = await getDoc(doc(db, 'users', clean));
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }

    // 3. Try query by email prefix or ID prefix
    const allSnap = await getDocs(usersRef);
    const found = allSnap.docs.find(d => {
      const u = d.data() as User;
      return (
        u.username?.toLowerCase() === clean ||
        u.id?.toLowerCase() === clean ||
        u.email?.toLowerCase().startsWith(clean)
      );
    });
    if (found) {
      return found.data() as User;
    }
  } catch (err) {
    console.warn('Firestore findUser lookup warning:', err);
  }
  return null;
}

// Update specific fields on a user in Firestore
export async function updateUserInFirestore(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore updateUser warning:', err);
  }
}

// Check whether a username is globally unique (available) across Firestore and local records
export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<{ available: boolean; message: string }> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  
  if (!clean || clean.length < 3) {
    return { available: false, message: 'Username must be at least 3 characters' };
  }
  
  if (clean.length > 24) {
    return { available: false, message: 'Username cannot exceed 24 characters' };
  }
  
  if (!/^[a-z0-9_.]+$/.test(clean)) {
    return { available: false, message: 'Username can only contain lowercase letters, numbers, dot (.), and underscore (_)' };
  }

  if (clean.startsWith('.') || clean.endsWith('.')) {
    return { available: false, message: 'Username cannot start or end with a dot' };
  }

  // Check Firestore
  try {
    const existing = await findUserInFirestore(clean);
    if (existing && existing.id !== excludeUserId && existing.username.toLowerCase() === clean) {
      return { available: false, message: `@${clean} is already taken. Only one user can have this username.` };
    }
  } catch (err) {
    console.warn('Firestore uniqueness check notice:', err);
  }

  return { available: true, message: `@${clean} is available! Only you will have this username.` };
}

// Safe Connection Test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode.');
    }
  }
}
testFirestoreConnection().catch(() => {});

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  OAuthProvider
};
export type { FirebaseUser };
