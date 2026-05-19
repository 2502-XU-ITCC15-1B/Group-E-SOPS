import { db } from '../../firebase/config';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

export const logEvent = async (event) => {
  try {
    await addDoc(collection(db, 'systemLogs'), {
      ...event,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to log event', err);
  }
};

export const fetchUserRole = async (uid) => {
  if (!uid) return 'member';

  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { role: 'member' }, { merge: true });
      return 'member';
    }

    return snap.data()?.role || 'member';
  } catch (err) {
    console.error('fetchUserRole error:', err);
    return 'member';
  }
};

export const ensureUserDocument = async (user, extra = {}) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const safe = (v) => v ?? '';

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: safe(user.email),
      displayName: safe(user.displayName),
      photoURL: safe(user.photoURL),
      role: 'member',
      createdAt: new Date().toISOString(),
      provider: user.providerData?.[0]?.providerId || 'unknown',
      ...extra
    });
  } else {
    await updateDoc(ref, {
      email: safe(user.email),
      displayName: safe(user.displayName || snap.data()?.displayName),
      photoURL: safe(user.photoURL || snap.data()?.photoURL),
      lastLogin: serverTimestamp(),
      ...extra
    });
  }
};