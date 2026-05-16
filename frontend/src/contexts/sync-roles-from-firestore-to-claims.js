/** (File moved and improved)
 * Migration & Repair Script: Sync Firestore Roles to Auth Custom Claims
 *
 * This script iterates through all documents in the 'users' collection in Firestore.
 * For each user, it reads the 'role' field and sets it as a custom claim on the
 * corresponding Firebase Authentication user.
 *
 * This is a one-time migration script to fix users created before the custom claims system
 * was in place, or to repair users with corrupted/desynced claims.
 *
 * USAGE:
 *   node docs/scripts/sync-roles-from-firestore-to-claims.js [BATCH_SIZE]
 *
 * PRE-REQUISITES:
 *   - You must have a `serviceAccountKey.json` file in the root directory.
 *   - Run `npm install firebase-admin` if you haven't already.
 */

const admin = require('firebase-admin');
// Make sure the path to your service account key is correct
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function syncAllUserRoles() {
  const BATCH_SIZE = parseInt(process.argv[2], 10) || 100;
  console.log('Starting user role synchronization...');
  console.log(`Processing in batches of ${BATCH_SIZE}.`);

  let successCount = 0;
  let errorCount = 0;
  let totalProcessed = 0;
  let lastVisible = null;

  while (true) {
    let query = db.collection('users').orderBy('__name__').limit(BATCH_SIZE);
    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    const promises = snapshot.docs.map(async (doc) => {
      const uid = doc.id;
      const firestoreRole = doc.data().role;

      if (!firestoreRole) {
        console.warn(`- SKIP: User ${uid} has no 'role' field in Firestore.`);
        return;
      }

      try {
        const userRecord = await auth.getUser(uid);
        if (userRecord.customClaims?.role === firestoreRole) {
          console.log(`- NO-OP: User ${uid} already has correct claim '${firestoreRole}'.`);
          return;
        }

        await auth.setCustomUserClaims(uid, { role: firestoreRole });

        // Verification step
        const updatedUser = await auth.getUser(uid);
        if (updatedUser.customClaims?.role === firestoreRole) {
          console.log(`  ✅ SUCCESS: Set and verified role '${firestoreRole}' for user ${uid}.`);
          successCount++;
        } else {
          throw new Error(`Verification failed! Claim is still ${updatedUser.customClaims?.role}`);
        }
      } catch (error) {
        console.error(`  ❌ ERROR for user ${uid}: ${error.message}`);
        errorCount++;
      }
    });

    await Promise.all(promises);

    totalProcessed += snapshot.size;
    console.log(`\nProcessed ${totalProcessed} users...\n`);
    lastVisible = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log('\n--- Synchronization Complete ---');
  console.log(`Successfully synced roles for ${successCount} users.`);
  console.log(`Failed to sync roles for ${errorCount} users.`);
  console.log('--------------------------------\n');
}

syncAllUserRoles().then(() => process.exit(0)).catch((error) => {
  console.error('\nFATAL ERROR:', error);
  process.exit(1);
});