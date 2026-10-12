import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged 
} from '../lib/firebase';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ems_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch JWT token and authenticate user with backend
  const authenticateWithBackend = async (userEmail, firebaseUid, fullName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, firebaseUid, fullName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('ems_jwt_token', data.token);
        }
        return data; // { token, user: PostgreSQL user record }
      }
    } catch (e) {
      console.warn("Backend auth token fetch notice:", e);
    }
    return null;
  };

  // 1. Fetch Users directly from Express Backend PostgreSQL database (Admin Only)
  const fetchUsersFromPostgres = async () => {
    let role = currentUser?.role;
    if (!role) {
      try {
        const saved = localStorage.getItem('ems_current_user');
        if (saved) role = JSON.parse(saved)?.role;
      } catch (e) {}
    }

    // STRICT ROLE GUARD: DO NOT FETCH USERS FOR COORDINATORS OR UNIDENTIFIED ROLES
    if (role !== 'admin') {
      setUsersList([]);
      return [];
    }

    try {
      const token = localStorage.getItem('ems_jwt_token');
      if (!token) return [];

      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        setUsersList([]);
        return [];
      }

      if (res.ok) {
        const data = await res.json();
        const users = Array.isArray(data) ? data : (data.users || []);
        setUsersList(users);
        return users;
      }
    } catch (err) {
      console.warn("PostgreSQL Users API Notice:", err.message);
    }
    return [];
  };

  useEffect(() => {
    try {
      localStorage.removeItem('ems_users_list');
    } catch (e) {
      console.warn("Storage clear notice:", e);
    }
    if (currentUser?.role === 'admin') {
      fetchUsersFromPostgres();
    }
  }, [currentUser?.role]);

  // Sync currentUser session
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('ems_current_user', JSON.stringify(currentUser));
      } catch (e) {
        console.warn("Storage quota warning for currentUser:", e);
      }
    } else {
      localStorage.removeItem('ems_current_user');
      localStorage.removeItem('ems_jwt_token');
    }
  }, [currentUser]);

  // Firebase Auth State Listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const authData = await authenticateWithBackend(
          firebaseUser.email, 
          firebaseUser.uid, 
          firebaseUser.displayName || firebaseUser.email?.split('@')[0]
        );

        const dbUser = authData?.user;
        if (dbUser) {
          const userFullName = dbUser.fullName || dbUser.full_name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
          const activeUser = {
            ...dbUser,
            fullName: userFullName,
            full_name: userFullName,
            firebaseUid: firebaseUser.uid
          };
          setCurrentUser(activeUser);
          if (activeUser.role === 'admin') {
            fetchUsersFromPostgres();
          }
        } else {
          // Fallback if DB insert/fetch is pending
          let matched = (usersList || []).find(
            u => u.email?.toLowerCase() === firebaseUser.email?.toLowerCase()
          );
          if (matched) {
            setCurrentUser({ ...matched, firebaseUid: firebaseUser.uid });
          }
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('ems_jwt_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Authenticate with Firebase Auth Email & Password
  const loginWithEmailPassword = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();

    try {
      if (!auth) {
        throw new Error('Firebase Auth is not configured. Please check your .env keys.');
      }

      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = res.user;

      // Ensure Email is verified before granting access or saving to DB
      if (!fbUser.emailVerified) {
        await signOut(auth);
        setCurrentUser(null);
        setLoading(false);
        const unverifiedErr = new Error(`Email not verified! A verification link was sent to ${cleanEmail}. Please verify your email before logging in.`);
        unverifiedErr.code = 'auth/email-not-verified';
        throw unverifiedErr;
      }

      const authData = await authenticateWithBackend(
        cleanEmail, 
        fbUser.uid, 
        fbUser.displayName || cleanEmail.split('@')[0]
      );

      const dbUser = authData?.user;
      if (!dbUser) {
        throw new Error('Failed to sync user session with database.');
      }

      if (dbUser.status === 'inactive') {
        await signOut(auth);
        throw new Error('Your account is inactive. Please contact Administrator.');
      }

      const userFullName = dbUser.fullName || dbUser.full_name || fbUser.displayName || cleanEmail.split('@')[0] || 'User';
      const activeUser = {
        ...dbUser,
        fullName: userFullName,
        full_name: userFullName,
        firebaseUid: fbUser.uid
      };

      setCurrentUser(activeUser);
      setLoading(false);
      return activeUser;
    } catch (err) {
      let message = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later.';
      }
      setAuthError(message);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.warn("Firebase logout notice:", e);
    }
    setCurrentUser(null);
    setLoading(false);
  };

  const checkUserExistsInFirebase = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { exists: false, message: 'Please enter an email address.' };
    }

    // 1. Check via Backend API (which uses Firebase Admin SDK getUserByEmail)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          return { exists: true, details: data };
        }
      }
    } catch (e) {
      console.warn("Backend check-user notice:", e.message);
    }

    // 2. Client-side Firebase check via fetchSignInMethodsForEmail
    if (auth) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        if (methods && methods.length > 0) {
          return { exists: true, methods };
        }
      } catch (err) {
        console.warn("fetchSignInMethodsForEmail notice:", err.code, err.message);
        if (err.code === 'auth/user-not-found') {
          return { exists: false, message: `User "${cleanEmail}" does not exist in Firebase Auth.` };
        }
      }
    }

    // 3. Fallback: check against usersList
    const match = (usersList || []).find(u => u.email?.toLowerCase() === cleanEmail);
    if (match) {
      return { exists: true, user: match };
    }

    return { exists: false, message: `User "${cleanEmail}" is not a registered Email.` };
  };

  const resetPassword = async (email) => {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.');
    }

    // First check where/if the user exists in Firebase or database
    const userCheck = await checkUserExistsInFirebase(cleanEmail);
    if (!userCheck.exists) {
      throw new Error(userCheck.message || `Account not found: "${cleanEmail}" is not in Firebase Auth.`);
    }

    if (!auth) {
      throw new Error('Firebase Auth is not initialized.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: `Password reset link has been dispatched to ${cleanEmail}.` };
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        throw new Error(`The account "${cleanEmail}" does not exist in Firebase Auth.`);
      }
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  };

  const registerUser = async ({ fullName, email, password, phone, role }) => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not configured. Check your .env setup.');
      }

      let fbUser;
      try {
        const createRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = createRes.user;
        if (fullName) {
          await updateProfile(fbUser, { displayName: fullName.trim() });
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already registered.');
        }
        throw new Error(fbErr.message || 'Firebase Registration failed.');
      }

      // Dispatch Firebase Email Verification link
      try {
        await sendEmailVerification(fbUser);
      } catch (vErr) {
        console.warn("Firebase sendEmailVerification notice:", vErr.message);
      }

      // Do NOT store in PostgreSQL database until email is verified.
      // Sign out immediately so user must verify email first.
      await signOut(auth);
      setCurrentUser(null);
      setLoading(false);

      return {
        emailVerified: false,
        email: cleanEmail,
        message: `Registration successful! A verification link has been sent to ${cleanEmail}. Please click the link in your email before logging in.`
      };
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const resendVerificationEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    const cleanEmail = email.trim();
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await sendEmailVerification(res.user);
      await signOut(auth);
      return `Verification email has been resent to ${cleanEmail}.`;
    } catch (err) {
      throw new Error(err.message || 'Failed to resend verification email.');
    }
  };

  const value = {
    currentUser,
    userRole: currentUser?.role || null,
    isAdmin: currentUser?.role === 'admin',
    isCoordinator: currentUser?.role === 'coordinator',
    loading,
    authError,
    loginWithEmailPassword,
    registerUser,
    resendVerificationEmail,
    logout,
    resetPassword,
    checkUserExistsInFirebase,
    usersList,
    setUsersList,
    fetchUsersFromPostgres
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
