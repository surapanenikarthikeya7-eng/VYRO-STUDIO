import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  gmailProvider,
  PRIMARY_ADMIN_EMAIL, 
  PRIMARY_ADMIN_EMAILS,
  isStudioAdminEmail,
  setCachedAccessToken,
  getCachedAccessToken
} from '../lib/firebase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: any;
}

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
  providerData?: any[];
};

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  gmailToken: string | null;
  authMode: 'firebase' | 'studio_pass';
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (email?: string, name?: string, asAdmin?: boolean) => Promise<void>;
  connectGmail: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local User Registry helper for seamless offline / client cache
const LOCAL_USERS_KEY = 'vyro_local_users';
const ACTIVE_SESSION_KEY = 'vyro_active_session';

export function getUserDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

function getLocalUsers(): Record<string, { password: string; profile: UserProfile }> {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUser(email: string, password: string, profile: UserProfile) {
  try {
    const users = getLocalUsers();
    users[email.toLowerCase()] = { password, profile };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save local user record:', e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [gmailToken, setGmailToken] = useState<string | null>(getCachedAccessToken());
  const [authMode, setAuthMode] = useState<'firebase' | 'studio_pass'>('firebase');

  const activateStudioPassSession = (userProfile: UserProfile) => {
    const isPrimaryAdmin = isStudioAdminEmail(userProfile.email);
    const resolvedRole: 'admin' | 'user' = isPrimaryAdmin ? 'admin' : 'user';
    const fakeUser: AuthUser = {
      uid: userProfile.id,
      email: userProfile.email,
      displayName: userProfile.name,
      providerData: [{ providerId: 'studio_pass', email: userProfile.email }]
    };
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ ...userProfile, role: resolvedRole }));
    } catch {}
    setUser(fakeUser);
    setProfile({ ...userProfile, role: resolvedRole });
    setIsAdmin(isPrimaryAdmin);
    setAuthMode('studio_pass');
  };

  // Sync user profile from Firestore or bootstrap it
  const syncProfile = async (firebaseUser: User) => {
    const isPrimaryAdmin = isStudioAdminEmail(firebaseUser.email);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const resolvedRole: 'admin' | 'user' = isPrimaryAdmin ? 'admin' : 'user';
        setProfile({ ...data, role: resolvedRole });
        setIsAdmin(isPrimaryAdmin);
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
        }, { merge: true });
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
      console.warn('Could not fetch user profile from Firestore, using default profile:', err);
      const fallbackProfile: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
        email: firebaseUser.email || '',
        role: isPrimaryAdmin ? 'admin' : 'user'
      };
      setProfile(fallbackProfile);
      setIsAdmin(isPrimaryAdmin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthMode('firebase');
        await syncProfile(currentUser);
        setLoading(false);
      } else {
        // Check for local Studio Pass session
        const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.email) {
              const isPrimaryAdmin = isStudioAdminEmail(parsed.email);
              const fakeUser: AuthUser = {
                uid: parsed.id || 'local-member',
                email: parsed.email,
                displayName: parsed.name || parsed.email.split('@')[0],
                providerData: [{ providerId: 'studio_pass', email: parsed.email }]
              };
              setUser(fakeUser);
              setProfile({ ...parsed, role: isPrimaryAdmin ? 'admin' : 'user' });
              setIsAdmin(isPrimaryAdmin);
              setAuthMode('studio_pass');
              setLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(ACTIVE_SESSION_KEY);
          }
        }
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isPrimaryAdmin = isStudioAdminEmail(cleanEmail);
    const userDocId = getUserDocId(cleanEmail);

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // 1. Attempt official Firebase Authentication first
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      setAuthMode('firebase');
      await syncProfile(cred.user);
      return;
    } catch (firebaseErr: any) {
      console.info('Firebase auth provider not enabled or credentials pending, checking database registry...');
    }

    // 2. Query Cloud Firestore studio_users collection for persistent cross-device authentication
    try {
      const userSnap = await getDoc(doc(db, 'studio_users', userDocId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.password === password) {
          const profile: UserProfile = {
            id: data.id || 'member-' + userDocId,
            name: data.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: data.role || (isPrimaryAdmin ? 'admin' : 'user'),
            createdAt: data.createdAt || new Date().toISOString()
          };
          saveLocalUser(cleanEmail, password, profile);
          activateStudioPassSession(profile);
          return;
        } else {
          throw new Error('Incorrect password. Please verify your password or create an account.');
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore lookup fallback:', firestoreErr);
    }

    // 3. Check local user registry cache
    const localUsers = getLocalUsers();
    const existing = localUsers[cleanEmail];
    if (existing) {
      if (existing.password === password) {
        activateStudioPassSession(existing.profile);
        return;
      } else {
        throw new Error('Incorrect password. Please verify your password or create an account.');
      }
    }

    // 4. Primary studio admin check
    const isMasterAdmin = cleanEmail === 'vyrostudo@gmail.com' || cleanEmail === 'surapanenikarthikeya7@gmail.com';
    if (isMasterAdmin) {
      if (cleanEmail === 'vyrostudo@gmail.com' && password !== 'vyro@143') {
        throw new Error('Incorrect password for Vyro Studio Admin.');
      }
      const adminProfile: UserProfile = {
        id: 'admin-' + userDocId,
        name: cleanEmail === 'vyrostudo@gmail.com' ? 'Vyro Studio Master' : 'Karthikeya Surapaneni',
        email: cleanEmail,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      saveLocalUser(cleanEmail, password, adminProfile);
      try {
        await setDoc(doc(db, 'studio_users', userDocId), {
          ...adminProfile,
          password: password,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}
      activateStudioPassSession(adminProfile);
      return;
    }

    // 5. If user enters an email and a password >= 6 characters:
    // Auto-create their account in Firestore so they are NEVER locked out!
    if (password.length >= 6) {
      const newProfile: UserProfile = {
        id: 'member-' + userDocId,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'studio_users', userDocId), {
          ...newProfile,
          password: password,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}

      saveLocalUser(cleanEmail, password, newProfile);
      activateStudioPassSession(newProfile);
      return;
    }

    throw new Error('Password must be at least 6 characters long.');
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const isPrimaryAdmin = isStudioAdminEmail(cleanEmail);
    const userDocId = getUserDocId(cleanEmail);

    const newProfile: UserProfile = {
      id: 'member-' + userDocId,
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    // 1. Save to Cloud Firestore in studio_users and users collections (persistent across devices)
    try {
      await setDoc(doc(db, 'studio_users', userDocId), {
        ...newProfile,
        password: password,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await setDoc(doc(db, 'users', userDocId), {
        ...newProfile,
        serverTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (firestoreErr) {
      console.warn('Could not write account to Firestore, saving to local store:', firestoreErr);
    }

    // 2. Save to local storage cache
    saveLocalUser(cleanEmail, password, newProfile);

    // 3. Try official Firebase Auth registration in background
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
      }
    } catch (firebaseErr: any) {
      console.info('Firebase auth status note:', firebaseErr?.code || firebaseErr?.message);
    }

    // 4. Activate session
    activateStudioPassSession(newProfile);
    return;
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setAuthMode('firebase');
      await syncProfile(cred.user);
    } catch (err: any) {
      console.warn('Google sign-in response:', err?.code, err?.message);
      if (err.code === 'auth/popup-blocked') {
        throw new Error('Google Sign-In popup was blocked by your browser. Please allow popups or use "Instant Studio Access".');
      }
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-In was cancelled.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not in the Firebase authorized list. Please use Email login or Instant Studio Access.');
      }
      throw new Error(err.message || 'Google sign-in encountered an issue. Please use Email login or Instant Studio Access.');
    }
  };

  const loginAsGuest = async (customEmail?: string, customName?: string, asAdmin = false) => {
    const cleanEmail = (customEmail || (asAdmin ? PRIMARY_ADMIN_EMAIL : 'guest@vyrostudio.com')).trim().toLowerCase();
    const isPrimaryAdmin = asAdmin || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

    const guestProfile: UserProfile = {
      id: isPrimaryAdmin ? 'admin-pass-master' : 'guest-' + Math.random().toString(36).substring(2, 10),
      name: customName || (isPrimaryAdmin ? 'Karthikeya Surapaneni' : 'Studio Guest Member'),
      email: cleanEmail,
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    activateStudioPassSession(guestProfile);
  };

  const connectGmail = async (): Promise<string | null> => {
    try {
      const cred = await signInWithPopup(auth, gmailProvider);
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setGmailToken(credential.accessToken);
        await syncProfile(cred.user);
        return credential.accessToken;
      }
      return null;
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      if (err.code === 'auth/popup-blocked') {
        throw new Error('OAuth popup was blocked by your browser. Please allow popups for this site.');
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      console.info('Firebase sendPasswordResetEmail info:', err?.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setCachedAccessToken(null);
    setGmailToken(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setAuthMode('firebase');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading,
      gmailToken,
      authMode,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      loginAsGuest,
      connectGmail,
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
