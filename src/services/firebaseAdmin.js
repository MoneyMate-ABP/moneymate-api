const admin = require("firebase-admin");
const env = require("../config/env");

let firebaseApp;

function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (
    env.firebaseProjectId &&
    env.firebaseClientEmail &&
    env.firebasePrivateKey
  ) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n"),
      }),
    });

    return firebaseApp;
  }

  firebaseApp = admin.initializeApp();
  return firebaseApp;
}

async function verifyFirebaseIdToken(idToken) {
  const app = getFirebaseApp();
  return admin.auth(app).verifyIdToken(idToken);
}

module.exports = {
  verifyFirebaseIdToken,
};
