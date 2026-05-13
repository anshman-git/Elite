# EliteStudy Firebase Schema

EliteStudy uses Firebase Authentication, Cloud Firestore, and Firebase Storage.

## Collections

### `users/{uid}`

```js
{
  name: string,
  email: string,
  role: "student" | "admin",
  streak: number,
  points: number,
  createdAt: timestamp,
  lastActiveAt: timestamp
}
```

### `quizzes/{quizId}`

```js
{
  title: string,
  subject: "CSA" | "C Language" | "Mathematics" | "Statistics" | "Cybersecurity" | "All",
  duration: number,
  isDaily: boolean,
  questions: [
    {
      question: string,
      options: string[],
      answer: string,
      explanation: string
    }
  ],
  createdBy: uid,
  createdAt: timestamp
}
```

### `attempts/{attemptId}`

```js
{
  userId: uid,
  quizId: string,
  subject: string,
  score: number,
  total: number,
  accuracy: number,
  timeTaken: number,
  answers: object,
  completedAt: timestamp
}
```

### `resources/{resourceId}`

```js
{
  title: string,
  subject: string,
  type: "PYQ" | "Notes" | "Sample Paper",
  fileType: "application/pdf" | "image/png" | "image/jpeg" | "image/webp",
  url: string,
  createdBy: uid,
  createdAt: timestamp
}
```

### `announcements/{announcementId}`

```js
{
  title: string,
  body: string,
  target: "all" | "students" | "admins",
  createdAt: timestamp,
  createdBy: uid
}
```

## Recommended Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    match /users/{userId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isAdmin();
    }

    match /quizzes/{quizId} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }

    match /attempts/{attemptId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    match /resources/{resourceId} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }

    match /announcements/{announcementId} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }
  }
}
```
