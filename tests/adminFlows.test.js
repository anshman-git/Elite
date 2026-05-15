const assert = require('assert');
const fs = require('fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'elitestudy-test';

let testEnv;

describe('Admin flows and Firestore rules', () => {
  before(async () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules },
    });
  });

  after(async () => {
    await testEnv.clearFirestore();
    await testEnv.cleanup();
  });

  it('admin can create, update, delete quizzes', async () => {
    const adminToken = { sub: 'admin-1', name: 'Admin' };
    const admin = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();

    // Pre-create user doc marking role admin so rules isAdmin() works
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminAuth.uid).set({ name: 'Admin', role: 'admin', createdAt: Date.now() });
    });

    const quizRef = admin.collection('quizzes').doc();
    await assertSucceeds(quizRef.set({ title: 'Test Quiz', subject: 'General', questions: [], createdAt: Date.now() }));
    await assertSucceeds(quizRef.update({ title: 'Updated Title' }));
    await assertSucceeds(quizRef.delete());
  });

  it('non-admin cannot create or delete quizzes', async () => {
    const userToken = { sub: 'user-1', name: 'User' };
    const user = testEnv.authenticatedContext(userToken.sub, userToken).firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(userAuth.uid).set({ name: 'User', role: 'student', createdAt: Date.now() });
    });

    const quizRef = user.collection('quizzes').doc();
    await assertFails(quizRef.set({ title: 'Bad Quiz', subject: 'General', questions: [], createdAt: Date.now() }));
  });

  it('subjects CRUD allowed for admin only', async () => {
    const adminToken = { sub: 'admin-2', name: 'Admin2' };
    const admin = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminAuth.uid).set({ name: 'Admin2', role: 'admin', createdAt: Date.now() });
    });

    const subRef = admin.collection('subjects').doc();
    await assertSucceeds(subRef.set({ name: 'CS', description: 'Comp Sci' }));
    await assertSucceeds(subRef.update({ description: 'Updated' }));
    await assertSucceeds(subRef.delete());

    const userToken = { sub: 'user-2', name: 'User2' };
    const user = testEnv.authenticatedContext(userToken.sub, userToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(userAuth.uid).set({ name: 'User2', role: 'student', createdAt: Date.now() });
    });

    const subRef2 = user.collection('subjects').doc();
    await assertFails(subRef2.set({ name: 'Hacker' }));
  });

  it('settings (examCountdown) writable by admin only and readable by signed-in users', async () => {
    const adminToken = { sub: 'admin-3', name: 'Admin3' };
    const admin = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminAuth.uid).set({ name: 'Admin3', role: 'admin', createdAt: Date.now() });
    });

    const settingsRef = admin.collection('settings').doc('examCountdown');
    await assertSucceeds(settingsRef.set({ title: 'Finals', examDate: Date.now() }));

    const userToken = { sub: 'user-3', name: 'User3' };
    const user = testEnv.authenticatedContext(userToken.sub, userToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(userAuth.uid).set({ name: 'User3', role: 'student', createdAt: Date.now() });
    });

    await assertSucceeds(user.collection('settings').doc('examCountdown').get());
    // user cannot write
    await assertFails(user.collection('settings').doc('examCountdown').set({ title: 'Hack' }));
  });

  it('users collection: users can update their profile but not change role; admin can change role', async () => {
    const userToken = { sub: 'owner-1', name: 'Owner' };
    const user = testEnv.authenticatedContext(userToken.sub, userToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(userAuth.uid).set({ name: 'Owner', role: 'student', createdAt: Date.now() });
    });

    // owner can update profile without role
    await assertSucceeds(user.collection('users').doc(userAuth.uid).update({ name: 'Owner Renamed' }));
    // owner cannot change role
    await assertFails(user.collection('users').doc(userAuth.uid).update({ role: 'admin' }));

    // admin can change role
    const adminToken = { sub: 'superadmin', name: 'Super Admin' };
    const admin = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminAuth.uid).set({ name: 'SA', role: 'admin', createdAt: Date.now() });
    });

    await assertSucceeds(admin.collection('users').doc(userAuth.uid).update({ role: 'admin' }));
  });
});
