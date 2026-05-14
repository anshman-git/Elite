const admin = require('firebase-admin');

// replace with YOUR downloaded key filename
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get UID from command line argument or use default
const targetUid = process.argv[2] || '2JTEfToa6HYQdPoNcyDWMFT4Okc2';

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