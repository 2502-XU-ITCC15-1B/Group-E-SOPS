import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  // Switch to onIdTokenChanged for better RBAC handling
  onIdTokenChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // helper to log events to Firestore systemLogs
  const logEvent = async (event) => {
    try {
      await addDoc(collection(db, 'systemLogs'), {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to log event', err);
    }
  };

  async function signup(email, password, firstName, lastName, role = 'member') {
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
  }

  async function login(email, password) {
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
  }

  // Helper function to create/update user document in Firestore
  async function ensureUserDocument(user, additionalData = {}) {
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
  }

  // Google Sign In
  async function signInWithGoogle() {
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
  }

  // Facebook Sign In
  async function signInWithFacebook() {
    try {
      const provider = new FacebookAuthProvider();
      // Request email permission
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      
      // Log login
      await logEvent({
        type: 'user_login',
        userId: result.user.uid,
        email: result.user.email,
        method: 'facebook',
        action: 'User logged in with Facebook'
      });
      
      return result;
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  }

  // GitHub Sign In
  async function signInWithGithub() {
    try {
      const provider = new GithubAuthProvider();
      // Request email permission
      provider.addScope('user:email');
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      
      // Log login
      await logEvent({
        type: 'user_login',
        userId: result.user.uid,
        email: result.user.email,
        method: 'github',
        action: 'User logged in with GitHub'
      });
      
      return result;
    } catch (error) {
      console.error('GitHub sign in error:', error);
      throw error;
    }
  }

  async function logout() {
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
  }

  async function updateUserRole(uid, newRole) {
    // refactor(security): Call the secure Cloud Function to manage roles.
    // This ensures the user's JWT custom claim is updated along with Firestore,
    // preventing state inconsistencies.
    try {
      const allowedRoles = ['member', 'executive', 'admin'];
      if (!allowedRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`);
      }

      // Use the trusted Cloud Function to manage roles
      const setUserRoleCallable = httpsCallable(functions, 'setUserRole');
      await setUserRoleCallable({ uid, role: newRole });

      // Update local state if updating own role
      if (uid === currentUser?.uid) {
        try {
          // fix(auth): Force a token refresh and read the role back from the claims.
          // This ensures the local state is perfectly in sync with the source of truth (the JWT).
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const updatedRole = idTokenResult.claims.role || 'member';
          setUserRole(updatedRole);
        } catch (tokenError) {
          console.error('Failed to get fresh ID token after role update:', tokenError);
          // If token refresh fails, assume session is invalid and log out.
          await signOut(auth);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }


  async function resetPassword(email) {
    if (!email) throw new Error('Email is required to reset password');
    await sendPasswordResetEmail(auth, email);
  }

  async function deleteSelf() {
    const callable = httpsCallable(functions, 'deleteSelf');
    await callable();
  }

  async function adminDeleteUser(uid) {
    const callable = httpsCallable(functions, 'deleteUserCompletely');
    await callable({ uid });
  }

  async function adminCreateUser({ email, password, firstName, lastName, role, department }) {
    const callable = httpsCallable(functions, 'createUserWithRole');
    const res = await callable({ email, password, firstName, lastName, role, department });
    return res.data;
  }

  useEffect(() => {
    // Use onIdTokenChanged to listen for auth changes AND token refreshes.
    // This automatically keeps the user's role in sync without forced refreshes.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Production Debugging: Log details on every token change.
        console.log(`onIdTokenChanged triggered for UID: ${user.uid}`);
        try {
          // Get claims without forcing a refresh, as this listener fires on token changes.
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role || 'member';

          // Production Debugging: Compare state with claims.
          if (userRole !== role) {
            console.log(`Role state updated: from '${userRole}' to '${role}' based on JWT.`);
          }

          setUserRole(role);

          // Ensure user document exists for profile data. This can run in the background.
          // This function has been hardened to NOT touch the role.
          ensureUserDocument(user);
        } catch (tokenError) {
          console.error('Error getting token result on auth change:', tokenError);
          // If getting the token fails (e.g., user disabled, deleted),
          // signing out is the safest recovery path.
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup the subscription when the component unmounts.
    return unsubscribe;
  }, [userRole]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of child components
  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    updateUserRole,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGithub,
    resetPassword,
    deleteSelf,
    adminDeleteUser,
    adminCreateUser,
    logEvent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
