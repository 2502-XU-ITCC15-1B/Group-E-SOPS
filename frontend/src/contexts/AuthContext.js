import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
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

      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        firstName,
        lastName,
        role,
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

    // Get role from Firestore (simple approach)
    try {
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role || 'member');
      } else {
        // If user document doesn't exist, create it with default role
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          role: 'member',
          createdAt: new Date().toISOString()
        });
        setUserRole('member');
      }
    } catch (error) {
      console.warn('Unable to load user role:', error);
      setUserRole('member'); // Default to member
    }

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
          role: 'member',
          createdAt: new Date().toISOString(),
          provider: user.providerData[0]?.providerId || 'unknown',
          ...additionalData
        });
      } else {
        // Update existing document with latest info
        await updateDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || userDoc.data().displayName,
          photoURL: user.photoURL || userDoc.data().photoURL,
          lastLogin: new Date().toISOString(),
          ...additionalData
        });
      }

      // Get role from document
      const updatedDoc = await getDoc(doc(db, 'users', user.uid));
      if (updatedDoc.exists()) {
        setUserRole(updatedDoc.data().role || 'member');
      }
    } catch (error) {
      console.warn('Error ensuring user document:', error);
      setUserRole('member'); // Default to member
    }
  }

  // Google Sign In
  async function signInWithGoogle(accessToken) {
    // Validate access token
    const VALID_TOKEN = 'SOPS_Member2526';
    if (accessToken !== VALID_TOKEN) {
      throw new Error('Invalid access token. Please contact your administrator.');
    }
    
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
  async function signInWithFacebook(accessToken) {
    // Validate access token
    const VALID_TOKEN = 'SOPS_Member2526';
    if (accessToken !== VALID_TOKEN) {
      throw new Error('Invalid access token. Please contact your administrator.');
    }
    
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
  async function signInWithGithub(accessToken) {
    // Validate access token
    const VALID_TOKEN = 'SOPS_Member2526';
    if (accessToken !== VALID_TOKEN) {
      throw new Error('Invalid access token. Please contact your administrator.');
    }
    
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
    try {
      // Validate role
      const allowedRoles = ['member', 'executive', 'admin'];
      if (!allowedRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`);
      }

      // Update role in Firestore (Firestore rules will verify admin permission)
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // Log the change (optional - for audit trail)
      try {
        await setDoc(doc(db, 'roleAudit', `${uid}_${Date.now()}`), {
          targetUserId: uid,
          changedBy: currentUser?.uid,
          changedByEmail: currentUser?.email,
          newRole: newRole,
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        // Don't fail if audit logging fails
        console.warn('Could not log role change:', auditError);
      }

      // Update local state if updating own role
      if (uid === currentUser?.uid) {
        setUserRole(newRole);
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get role from Firestore (simple approach)
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'member');
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'member',
              createdAt: new Date().toISOString()
            });
            setUserRole('member');
          }
        } catch (error) {
          console.warn('Error fetching user role:', error);
          setUserRole('member'); // Default to member
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
