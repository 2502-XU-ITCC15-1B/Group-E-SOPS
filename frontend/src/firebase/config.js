import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';


// Your Firebase configuration
// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyB5Q11T8LmAIvsqftxf89y-YggtyWgpqyM",
  authDomain: "strucsure-cscc21.firebaseapp.com",
  projectId: "strucsure-cscc21",
  storageBucket: "strucsure-cscc21.firebasestorage.app",
  messagingSenderId: "727664218511",
  appId: "1:727664218511:web:ba764b3531c5ee093fbbfa",
  measurementId: "G-4FZ10D1TYS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Check for environment variable to connect to emulators
if (process.env.REACT_APP_FIREBASE_USE_EMULATORS === 'true') {
  console.log("Connecting to Firebase Emulators");
  const host = 'localhost';

  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}


export default app;
