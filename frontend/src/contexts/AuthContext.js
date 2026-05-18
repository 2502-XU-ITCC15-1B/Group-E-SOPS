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

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // helper to log events to Firestore systemLogs
  const logEvent = useCallback(async (event) => {
    try {
      await addDoc(collection(db, 'systemLogs'), {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to log event', err);
    }
  }, []);

  const signup = useCallback(async (email, password, firstName, lastName, role = 'member') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`
      });

      // ARCHITECTURAL FIX: The client should NOT set the role in Firestore.
      // The role is a privileged piece of data. A Cloud Function (e.g., an onCreate
      // trigger) should create the user document and set the initial custom claim.
      // For now, we remove the role from the client-side write.
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        firstName,
        lastName,
        // role, // DO NOT set role from client. This creates a source of truth conflict.
        isActive: true,
        createdAt: new Date().toISOString(),
        profileComplete: false
      });

      await logEvent({ type: 'signup', userId: result.user.uid, email });

      return result;
    } catch (error) {
      throw error;
    }
  }, [logEvent]);

  const login = useCallback(async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    try {
      // Force a refresh of the ID token to get the latest custom claims.
      const idTokenResult = await result.user.getIdTokenResult(true);
      const role = idTokenResult.claims.role || 'member';
      setUserRole(role);
    } catch (tokenError) {
      console.error('Failed to get fresh ID token after login:', tokenError);
      // If token refresh fails, assume session is invalid and log out.
      await signOut(auth);
    }

    // Update last login time in Firestore.
    await updateDoc(doc(db, 'users', result.user.uid), {
      lastLogin: serverTimestamp()
    }).catch(err => console.warn("Failed to update last login time", err));

    await logEvent({ type: 'login', userId: result.user.uid, email: result.user.email });

    return result;
  }, [logEvent]);

  // Helper function to create/update user document in Firestore
  const ensureUserDocument = useCallback(async (user, additionalData = {}) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Extract name from displayName or split email
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          // role: 'member', // DO NOT set role from client.
          createdAt: new Date().toISOString(),
          provider: user.providerData[0]?.providerId || 'unknown',
          ...additionalData
        });
      } else {
        // Update existing document with latest info
        await updateDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || userDoc.data()?.displayName,
          photoURL: user.photoURL || userDoc.data()?.photoURL,
          lastLogin: serverTimestamp(),
          ...additionalData
        });
      }
      // CRITICAL: This function's purpose is to manage display data (profile),
      // NOT authorization data (role). We explicitly do not read or set the role here
      // to prevent overwriting the authoritative role from the JWT claim.
    } catch (error) {
      console.warn('Error ensuring user document:', error);
    }
  }, []);

  // Google Sign In
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      
      // Log login
      await logEvent({
        type: 'user_login',
        userId: result.user.uid,
        email: result.user.email,
        method: 'google',
        action: 'User logged in with Google'
      });
      
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, [ensureUserDocument, logEvent]);

  const logout = useCallback(async () => {
    const uid = currentUser?.uid;
    const email = currentUser?.email;
    
    setUserRole(null);
    await signOut(auth);
    
    // Log logout
    if (uid) {
      await logEvent({
        type: 'user_logout',
        userId: uid,
        email: email,
        action: 'User logged out'
      });
    }
  }, [currentUser, logEvent]);

  const updateUserRole = useCallback(async (uid, newRole) => {
    try {
      const allowedRoles = ['member', 'executive', 'admin'];
      if (!allowedRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`);
      }

      // Write directly to Firestore — rules will verify the caller is admin
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // Log the change
      await logEvent({
        type: 'role_change',
        action: `Changed role to ${newRole}`,
        performedBy: currentUser.uid,
        performedByEmail: currentUser.email,
        targetUserId: uid,
        details: `User role for UID ${uid} was updated to ${newRole}.`
      });

      // Update local state immediately if changing own role
      if (uid === currentUser?.uid) {
        setUserRole(newRole);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }, [currentUser, logEvent]);

  const resetPassword = useCallback(async (email) => {
    if (!email) throw new Error('Email is required to reset password');
    await sendPasswordResetEmail(auth, email);
  }, []);

  const requestPasswordAssistance = useCallback(async ({ email, reason }) => {
    // Find user UID to associate with the request
    const usersQuery = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const userSnapshot = await getDocs(usersQuery);
    const userDoc = userSnapshot.docs[0];
    const uid = userDoc ? userDoc.id : null;

    // Check for existing pending request to prevent spam
    const existingQuery = query(
      collection(db, 'passwordResetRequests'),
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const existing = await getDocs(existingQuery);
    if (!existing.empty) {
      throw new Error('You already have a pending assistance request. Please wait for an admin to respond.');
    }

    await addDoc(collection(db, 'passwordResetRequests'), {
      uid: uid,
      email,
      reason: reason || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      resolvedAt: null,
      adminNote: '',
      resolvedBy: null
    });

    await logEvent({
      type: 'password_assistance_requested',
      userId: uid,
      email
    });
  }, [logEvent]);

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
  }, [currentUser, logEvent]);

  const deleteSelf = useCallback(async () => {
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await currentUser.delete();
  }, [currentUser]);

  const adminDeleteUser = useCallback(async (uid) => {
    // Can only delete Firestore doc from client — Auth account deletion requires Admin SDK
    await deleteDoc(doc(db, 'users', uid));
  }, []);

  const adminCreateUser = useCallback(async ({ email, password, firstName, lastName, role, department }) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, {
      displayName: `${firstName} ${lastName}`
    });
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email,
      firstName,
      lastName,
      role,
      department,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    return { success: true, uid: result.user.uid };
  }, []);

  useEffect(() => {
    // Use onIdTokenChanged to listen for auth changes AND token refreshes.
    // This automatically keeps the user's role in sync without forced refreshes.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Priority 1: Get role from custom claims for security.
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role || 'member';
          setUserRole(role);
          ensureUserDocument(user);
        } catch (error) {
          console.error('Error reading user role:', error);
          setUserRole('member');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup the subscription when the component unmounts.
    return unsubscribe;
  }, [ensureUserDocument]);

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const firestoreRole = snapshot.data()?.role;
      if (!firestoreRole) return;

      if (firestoreRole !== userRole) {
        // The role in Firestore is different from our current state.
        // Force a token refresh. This will trigger onIdTokenChanged, which
        // will then update the state from the new claims.
        currentUser.getIdTokenResult(true).catch(err => console.error('Forced token refresh failed:', err));
      }
    });

    return unsubscribe;
  }, [currentUser, userRole]);

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
    logEvent,
    requestPasswordAssistance,
    resolvePasswordRequest
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
    logEvent,
    requestPasswordAssistance,
    resolvePasswordRequest]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
