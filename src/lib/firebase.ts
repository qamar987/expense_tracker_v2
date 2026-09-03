import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp({
    apiKey: firebaseConfigData.apiKey,
    authDomain: firebaseConfigData.authDomain,
    projectId: firebaseConfigData.projectId,
    storageBucket: firebaseConfigData.storageBucket,
    messagingSenderId: firebaseConfigData.messagingSenderId,
    appId: firebaseConfigData.appId,
  });
} else {
  app = getApp();
}

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore with specific databaseId and long-polling for reliable connection in iframe environments
const firestoreSettings = {
  experimentalForceLongPolling: true,
};

export const db: Firestore = firebaseConfigData.firestoreDatabaseId
  ? initializeFirestore(app, firestoreSettings, firebaseConfigData.firestoreDatabaseId)
  : initializeFirestore(app, firestoreSettings);

// Test Firestore connection on boot
async function testConnection(retries = 2) {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (retries > 0) {
      setTimeout(() => testConnection(retries - 1), 1200);
      return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export default app;
