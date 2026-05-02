/**
 * Setup Script: Create First Admin User
 * 
 * This script sets up the first admin user by:
 * 1. Setting a custom claim on the user
 * 2. Updating the Firestore user document
 * 
 * Usage:
 *   node docs/scripts/setup-admin.js <user-email> <role>
 *
 * Example:
 *   node docs/scripts/setup-admin.js admin@example.com admin
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function setupAdminUser(email, role = 'admin') {
  try {
    console.log(`\n🔍 Looking up user: ${email}...`);
    
    // Find user by email
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid} (${user.email})`);
    
    // Validate role
    const allowedRoles = ['member', 'executive', 'admin'];
    if (!allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`);
    }
    
    // Set custom claim
    console.log(`\n🔐 Setting custom claim: role = ${role}...`);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`✅ Custom claim set successfully!`);
    
    // Update Firestore
    console.log(`\n📝 Updating Firestore user document...`);
    await db.collection('users').doc(user.uid).set({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✅ Firestore updated successfully!`);
    
    // Log audit
    await db.collection('roleAudit').add({
      targetUserId: user.uid,
      changedBy: 'system',
      changedByEmail: 'setup-script',
      oldRole: 'unknown',
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      note: 'Initial admin setup'
    });
    
    console.log(`\n🎉 Success! User ${email} is now an ${role}.`);
    console.log(`\n⚠️  IMPORTANT: The user must sign out and sign back in for the changes to take effect.`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error(`\n💡 User with email ${email} does not exist. Please register first.`);
    }
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('\n❌ Usage: node docs/scripts/setup-admin.js <user-email> [role]');
  console.error('   Example: node docs/scripts/setup-admin.js admin@example.com admin\n');
  process.exit(1);
}

const email = args[0];
const role = args[1] || 'admin';

setupAdminUser(email, role);

