const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load service account key from local file (NOT committed to git)
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your Firebase Admin key and save it as serviceAccountKey.json in this directory.');
  console.error('Make sure serviceAccountKey.json is in .gitignore (it should be - do not commit it!)');
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get UID from command line argument
const targetUid = process.argv[2];

if (!targetUid) {
  console.error('❌ Error: Please provide a user UID as an argument');
  console.log('Usage: node makeAdmin.cjs <user-uid>');
  console.log('\nFind the UID in Firebase Console > Authentication > Users');
  process.exit(1);
}

console.log(`Making user with UID: ${targetUid} an admin...`);

async function makeUserAdmin() {
  try {
    await admin.auth().setCustomUserClaims(targetUid, {
      admin: true,
    });

    console.log('✅ Admin claim added successfully');

    const user = await admin.auth().getUser(targetUid);

    console.log('User details:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nUsage: node makeAdmin.cjs <user-uid>');
    console.log('Find the UID in Firebase Console > Authentication > Users');
  }
}

makeUserAdmin();