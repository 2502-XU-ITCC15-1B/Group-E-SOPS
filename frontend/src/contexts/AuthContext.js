import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  // Switch to onIdTokenChanged for better RBAC handling
  onIdTokenChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, deleteDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  logEvent,
  ensureUserDocument,
  fetchUserRole,
} from '../components/auth/authService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}
const setCachedRole = (uid, role) => {
  localStorage.setItem(`role_${uid}`, role);
};

const getCachedRole = (uid) => {
  return localStorage.getItem(`role_${uid}`);
};

const clearCachedRole = (uid) => {
  localStorage.removeItem(`role_${uid}`);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const XU_DOMAIN = '@my.xu.edu.ph';

  const validateXUEmail = (email) => {
    if (!email?.toLowerCase().endsWith(XU_DOMAIN)) {
      throw new Error(`Only ${XU_DOMAIN} email addresses are allowed. Please use your Xavier University student account.`);
    }
  };

  // 2. auth actions next
  const signup = useCallback(async (email, password, firstName, lastName) => {
    validateXUEmail(email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: `${firstName} ${lastName}` });
    await ensureUserDocument(result.user, { firstName, lastName, role: 'member', isActive: true, profileComplete: false });
    await logEvent({ type: 'signup', userId: result.user.uid, email });
    return result;  }, [ensureUserDocument]);

  const requestPasswordAssistance = useCallback(async ({ email, reason }) => {
    // Duplicate request check
    const existingQuery = query(
      collection(db, 'passwordResetRequests'),
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const existing = await getDocs(existingQuery);
    if (!existing.empty) {
      throw new Error('You already have a pending request. Please wait for an admin to respond.');
    }

    await addDoc(collection(db, 'passwordResetRequests'), {
      uid: null,
      email,
      reason: reason || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      resolvedAt: null,
      adminNote: '',
      resolvedBy: null
    });

    // logEvent may fail when unauthenticated — swallow silently
    try {
      await logEvent({
        type: 'password_assistance_requested',
        userId: null,
        email
      });
    } catch (_) {}
  }, []);

  const resolvePasswordRequest = useCallback(async ({ requestId, action, adminNote, email }) => {
    // action is 'resolved' or 'rejected'
    const ref = doc(db, 'passwordResetRequests', requestId);

    if (action === 'resolved') {
      // Send Firebase password reset email — Firebase handles this securely
      // Admin never sees or sets the password
      await sendPasswordResetEmail(auth, email);
    }

    await updateDoc(ref, {
      status: action,
      adminNote: adminNote || '',
      resolvedBy: currentUser.uid,
      resolvedAt: serverTimestamp()
    });

    await logEvent({
      type: `password_request_${action}`,
      requestId,
      performedBy: currentUser.uid,
      email: currentUser.email,
      targetEmail: email
    });
  }, [currentUser]);

  const deleteSelf = useCallback(async () => {
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await currentUser.delete();
  }, [currentUser]);

  const updateUserRole = useCallback(async (uid, newRole) => {
    const allowedRoles = ['member', 'executive', 'admin'];

    if (!allowedRoles.includes(newRole)) {
      throw new Error("Invalid role");
    }

    const ref = doc(db, 'users', uid);

    await updateDoc(ref, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    // 🔥 FORCE CACHE UPDATE
    setCachedRole(uid, newRole);

    // if current user → sync UI instantly
    if (uid === currentUser?.uid) {
      setUserRole(newRole);
    }

    await logEvent({
      type: 'role_change',
      targetUserId: uid,
      newRole,
      performedBy: currentUser.uid
    });
  }, [currentUser]);

  const adminDeleteUser = useCallback(async (uid) => {
    // Can only delete Firestore doc from client — Auth account deletion requires Admin SDK
    await deleteDoc(doc(db, 'users', uid));
  }, []);

  const login = useCallback(async (email, password) => {
    validateXUEmail(email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    const cached = getCachedRole(result.user.uid);
    if (cached) {
      setUserRole(cached); // instant UI
    }
    
    const role = await fetchUserRole(result.user.uid);
    
    setUserRole(role);
    setCachedRole(result.user.uid, role);

    await updateDoc(doc(db, 'users', result.user.uid), { lastLogin: serverTimestamp() });

    await logEvent({ type: 'login', userId: result.user.uid, email: result.user.email });

    return result;  }, [fetchUserRole]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: 'my.xu.edu.ph' });
    const result = await signInWithPopup(auth, provider);

    if (!result.user.email?.toLowerCase().endsWith('@my.xu.edu.ph')) {
      await signOut(auth);
      throw new Error('Only @my.xu.edu.ph email addresses are allowed. Please use your Xavier University student account.');
    }

    const cached = getCachedRole(result.user.uid);
    if (cached) {
      setUserRole(cached); // instant UI
    }

    await ensureUserDocument(result.user);
    const role = await fetchUserRole(result.user.uid);
    setUserRole(role);
    setCachedRole(result.user.uid, role);

    await logEvent({
      type: 'user_login',
      userId: result.user.uid,
      email: result.user.email,
      method: 'google',
      action: 'User logged in with Google'
    });

    return result;
  }, [ensureUserDocument, fetchUserRole]);

  useEffect(() => {
    // Use onIdTokenChanged to listen for auth changes AND token refreshes.
    // This automatically keeps the user's role in sync without forced refreshes.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setCurrentUser(user);

        // STEP 1: ensure document exists
        await ensureUserDocument(user);

        // STEP 2: fetch role AFTER doc exists
        const role = await fetchUserRole(user.uid);

        setUserRole(role);

        setLoading(false);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    // Cleanup the subscription when the component unmounts.
    return unsubscribe;
  }, [fetchUserRole, ensureUserDocument]);

  const adminCreateUser = useCallback(async ({ email, password, firstName, lastName, department }) => {
    // This function is not used in the provided UI but kept for potential future use.
    // It should ideally be a Cloud Function for better security.
    // For now, it correctly defaults the role to 'member'.
  }, []);

  const logout = useCallback(async () => {
    const uid = currentUser?.uid;
    const email = currentUser?.email;
    
    setUserRole(null);
    clearCachedRole(uid);
    await signOut(auth);
    
    if (uid) {
      await logEvent({
        type: 'user_logout',
        userId: uid,
        email: email,
        action: 'User logged out'
      });
    }
  }, [currentUser]);

  const resetPassword = useCallback(async (email) => {
    if (!email) throw new Error('Email is required to reset password');
    await sendPasswordResetEmail(auth, email);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const ref = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const role = snap.data()?.role || "member";

      setUserRole(role);
      setCachedRole(currentUser.uid, role);
    });
    return unsubscribe;
  }, [currentUser]);
  // Memoize the context value to prevent unnecessary re-renders of child components
  const value = useMemo(() => ({
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    updateUserRole,
    signInWithGoogle,
    resetPassword,
    deleteSelf,
    adminDeleteUser,
    adminCreateUser,
    requestPasswordAssistance,
    resolvePasswordRequest,
    fetchUserRole
  }), [
    currentUser, 
    userRole, 
    loading, 
    signup, 
    login, 
    logout, 
    updateUserRole, 
    signInWithGoogle,
    resetPassword, 
    deleteSelf, 
    adminDeleteUser, 
    adminCreateUser,
    requestPasswordAssistance,
    resolvePasswordRequest,    fetchUserRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
