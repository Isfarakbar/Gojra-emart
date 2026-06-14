const { initializeApp, cert } = require('firebase-admin/app');

// Parse the private key correctly handling the newlines
// Handles both literal \n strings and JSON-escaped \\n formats
const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

let firebaseApp;

if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.warn('⚠️ Firebase environment variables are missing. Firebase Admin SDK will NOT be initialized.');
  console.warn('  FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
  console.warn('  FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
  console.warn('  FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
} else {
  try {
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error.message);
  }
}

module.exports = firebaseApp;
