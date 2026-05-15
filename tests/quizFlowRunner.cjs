const fs = require('fs');
const assert = require('assert');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'elitestudy-admin-flow-test';

async function run() {
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });

  try {
    console.log('Initializing admin and user contexts...');

    const adminToken = { sub: 'admin-quiz-user', name: 'Admin User' };
    const userToken = { sub: 'student-quiz-user', name: 'Student User' };

    const adminDb = testEnv.authenticatedContext(adminToken.sub, adminToken).firestore();
    const userDb = testEnv.authenticatedContext(userToken.sub, userToken).firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(adminToken.sub).set({ name: 'Admin User', role: 'admin', createdAt: Date.now(), lastActiveAt: Date.now() });
      await context.firestore().collection('users').doc(userToken.sub).set({ name: 'Student User', role: 'student', createdAt: Date.now(), lastActiveAt: Date.now() });
    });

    console.log('Testing admin quiz create...');
    const quizRef = adminDb.collection('quizzes').doc('quiz-test-1');
    await assertSucceeds(quizRef.set({
      title: 'Admin Quiz Test',
      subject: 'Math',
      questions: [{ question: '2+2?', options: ['3','4','5','6'], answer: '4' }],
      timerMinutes: 20,
      dailyQuiz: false,
      published: true,
      createdBy: adminToken.sub,
      createdAt: Date.now(),
    }));
    console.log('✓ Admin can create quiz');

    console.log('Testing admin quiz update...');
    await assertSucceeds(quizRef.update({ title: 'Updated Admin Quiz Test' }));
    const updatedDoc = await quizRef.get();
    assert.strictEqual(updatedDoc.data().title, 'Updated Admin Quiz Test');
    console.log('✓ Admin can update quiz');

    console.log('Testing non-admin quiz create rejection...');
    const otherQuizRef = userDb.collection('quizzes').doc('quiz-test-2');
    await assertFails(otherQuizRef.set({
      title: 'Student Quiz',
      subject: 'Science',
      questions: [],
      createdAt: Date.now(),
    }));
    console.log('✓ Non-admin cannot create quiz');

    console.log('Testing admin quiz delete...');
    await assertSucceeds(quizRef.delete());
    console.log('✓ Admin can delete quiz');

    console.log('Quiz CRUD emulation test passed.');
  } catch (error) {
    console.error('Quiz flow test failed:', error);
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
