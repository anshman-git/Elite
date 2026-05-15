const fs = require('fs');
const assert = require('assert');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'elitestudy-subject-flow-test';

async function run() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });

  try {
    console.log('Initializing admin and student contexts...');

    const adminToken = { sub: 'admin-subject-user', name: 'Admin User' };
    const userToken = { sub: 'student-subject-user', name: 'Student User' };

    const adminDb = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();
    const userDb = testEnv.authenticatedContext(userToken.sub, userToken).firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminToken.sub).set({
        name: 'Admin User',
        role: 'admin',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      await context.firestore().collection('users').doc(userToken.sub).set({
        name: 'Student User',
        role: 'student',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    });

    console.log('Testing admin subject create...');
    const subjectRef = adminDb.collection('subjects').doc('subject-test-1');
    await assertSucceeds(subjectRef.set({
      name: 'Mathematics',
      description: 'Numbers and logic',
      createdBy: adminToken.sub,
      createdAt: Date.now(),
    }));
    console.log('✓ Admin can create subject');

    console.log('Testing admin subject update...');
    await assertSucceeds(subjectRef.update({ description: 'Advanced mathematics' }));
    const updatedDoc = await subjectRef.get();
    assert.strictEqual(updatedDoc.data().description, 'Advanced mathematics');
    console.log('✓ Admin can update subject');

    console.log('Testing non-admin subject create rejection...');
    const otherSubjectRef = userDb.collection('subjects').doc('subject-test-2');
    await assertFails(otherSubjectRef.set({
      name: 'Science',
      description: 'Physics and chemistry',
      createdBy: userToken.sub,
      createdAt: Date.now(),
    }));
    console.log('✓ Non-admin cannot create subject');

    console.log('Testing signed-in user subject read...');
    await assertSucceeds(userDb.collection('subjects').doc('subject-test-1').get());
    console.log('✓ Signed-in user can read subjects');

    console.log('Testing admin subject delete...');
    await assertSucceeds(subjectRef.delete());
    console.log('✓ Admin can delete subject');

    console.log('Subject CRUD emulation test passed.');
  } catch (error) {
    console.error('Subject flow test failed:', error);
    process.exitCode = 1;
  } finally {
    await testEnv.clearFirestore();
    await testEnv.cleanup();
  }
}

async function assertFails(promise) {
  try {
    await promise;
  } catch (error) {
    return;
  }
  throw new Error('Expected operation to fail but it succeeded');
}

async function assertSucceeds(promise) {
  try {
    await promise;
  } catch (error) {
    throw new Error(`Expected operation to succeed but it failed: ${error.message}`);
  }
}

run();
