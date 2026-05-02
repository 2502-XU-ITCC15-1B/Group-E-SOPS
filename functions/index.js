const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Helper: log system events
async function logSystemEvent(event) {
  try {
    await admin.firestore().collection('systemLogs').add({
      ...event,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to log system event', err);
  }
}

/**
 * Cloud Function to set user role (admin only)
 * This function sets both the custom claim and updates Firestore
 * 
 * @param {string} data.uid - User ID to update
 * @param {string} data.role - Role to assign ('member', 'executive', or 'admin')
 * @returns {Object} Success status
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to call this function.'
    );
  }

  // Check if user is admin
  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerRole = callerToken.customClaims?.role || 'member';
  
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can change user roles.'
    );
  }

  // Validate input
  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Both uid and role are required.'
    );
  }

  const allowedRoles = ['member', 'executive', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role must be one of: ${allowedRoles.join(', ')}`
    );
  }

  try {
    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { role });

    // Update Firestore user document
    await admin.firestore().collection('users').doc(uid).set(
      { role, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    // Log the role change for audit
    await admin.firestore().collection('roleAudit').add({
      targetUserId: uid,
      changedBy: context.auth.uid,
      changedByEmail: context.auth.token.email,
      oldRole: (await admin.firestore().collection('users').doc(uid).get()).data()?.role || 'unknown',
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: `User role updated to ${role}` 
    };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update user role.',
      error.message
    );
  }
});

/**
 * Cloud Function to create a user with a role (admin only)
 */
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerRole = callerToken.customClaims?.role || 'member';
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users.');
  }

  const { email, password, firstName = '', lastName = '', role = 'member', department = '' } = data || {};
  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and password are required.');
  }

  const allowedRoles = ['member', 'executive', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `Role must be one of: ${allowedRoles.join(', ')}`);
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim() || email
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      role,
      department,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await logSystemEvent({
      type: 'user_created',
      targetUserId: userRecord.uid,
      performedBy: context.auth.uid,
      performedByEmail: callerToken.email,
      roleAssigned: role
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user.', error.message);
  }
});

/**
 * Cloud Function to delete a user (admin only)
 * Deletes both Firestore doc and Firebase Auth account
 */
exports.deleteUserCompletely = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerRole = callerToken.customClaims?.role || 'member';
  const { uid } = data || {};
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
  }

  const isSelf = uid === context.auth.uid;
  if (!isSelf && callerRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete other users.');
  }

  try {
    await admin.firestore().collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);

    await logSystemEvent({
      type: 'user_deleted',
      targetUserId: uid,
      performedBy: context.auth.uid,
      performedByEmail: callerToken.email
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user.', error.message);
  }
});

/**
 * User self-delete (wrapper for deleteUserCompletely)
 */
exports.deleteSelf = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  return exports.deleteUserCompletely({ uid: context.auth.uid }, context);
});

/**
 * Cloud Function to get all users (admin only)
 * This is a helper function for admin panel
 */
exports.getUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerToken = await admin.auth().getUser(context.auth.uid);
  const callerRole = callerToken.customClaims?.role || 'member';
  
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can view all users.');
  }

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });

    return { users };
  } catch (error) {
    console.error('Error getting users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve users.');
  }
});

