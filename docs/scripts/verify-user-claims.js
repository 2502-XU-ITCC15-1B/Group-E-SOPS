/**
 * Verification Script: Get User Claims from Backend
 *
 * This script directly fetches a user's record from the Firebase Auth backend
 * and prints their custom claims. This is the absolute source of truth,
 * bypassing any client-side caching or configuration issues.
 *
 * USAGE:
 *   node docs/scripts/verify-user-claims.js <user-email-or-uid>
 *
 * Example:
 *   node docs/scripts/verify-user-claims.js admin@example.com
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function verifyClaims(identifier) {
  if (!identifier) {
    console.error('Usage: node docs/scripts/verify-user-claims.js <user-email-or-uid>');
    process.exit(1);
  }

  try {
    console.log(`Fetching user record for: ${identifier}...`);
    const userRecord = identifier.includes('@') ? await auth.getUserByEmail(identifier) : await auth.getUser(identifier);
    const uid = userRecord.uid;

    console.log('\n--- Firebase Auth Record ---');
    console.log(`UID: ${uid}`);
    console.log(`Email: ${userRecord.email}`);
    console.log('✅ Custom Claims on Backend:', userRecord.customClaims || 'No claims set.');
    console.log('----------------------------\n');

    console.log('--- Firestore Document ---');
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      console.log(`Document 'users/${uid}' found.`);
      console.log('📄 Firestore Role Field:', userDoc.data()?.role || 'Not set in document.');
    } else {
      console.warn(`⚠️ Document 'users/${uid}' does NOT exist in Firestore.`);
    }
    console.log('--------------------------\n');
  } catch (error) {
    console.error('❌ Error fetching user record:', error.message);
  }
}

verifyClaims(process.argv[2]).then(() => process.exit(0));