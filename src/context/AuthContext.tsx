import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  signOut, 
  updateProfile, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, PRIMARY_ADMIN_EMAIL, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile from Firestore or bootstrap it
  const syncProfile = async (firebaseUser: User) => {
    const isPrimaryAdmin = firebaseUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setIsAdmin(isPrimaryAdmin || data.role === 'admin');
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
          email: firebaseUser.email || '',
          role: isPrimaryAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, {
          ...newProfile,
          serverTimestamp: serverTimestamp()
        });
        setProfile(newProfile);
        setIsAdmin(isPrimaryAdmin);
      }

      if (isPrimaryAdmin) {
        try {
          await setDoc(doc(db, 'admins', firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'admin',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (adminErr) {
          console.warn('Could not bootstrap admins collection doc:', adminErr);
        }
      }
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore, falling back to Auth claims:', err);
      // Fallback
      setProfile({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
        email: firebaseUser.email || '',
        role: isPrimaryAdmin ? 'admin' : 'user'
      });
      setIsAdmin(isPrimaryAdmin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncProfile(cred.user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password login is not enabled in Firebase Authentication yet. Please click "Continue with Google" or enable Email/Password provider in the Firebase Console.');
      }
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid Gmail address or password. Please verify your credentials.');
      }
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      
      const isPrimaryAdmin = email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name: name.trim() || 'Vyro Member',
        email: email.trim(),
        role: isPrimaryAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...newProfile,
          serverTimestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn('Could not persist profile doc to Firestore:', err);
      }

      setProfile(newProfile);
      setIsAdmin(isPrimaryAdmin);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password provider is disabled in Firebase Console. Please click "Continue with Google" or enable Email/Password under Authentication > Sign-in method in Firebase Console.');
      }
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this Gmail address already exists. Please login instead.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      resetPassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
