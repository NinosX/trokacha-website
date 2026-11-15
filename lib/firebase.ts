import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebaseConfig';
import { FIREBASE_EMULATORS } from '@/lib/firebaseEmulators';

// Firestore : lu côté serveur (pages publiques) ET dans le navigateur (bureau
// des pros). Auth, Functions et Storage sont dans `lib/firebaseClient.ts`,
// chargés seulement dans le navigateur.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

if (FIREBASE_EMULATORS) {
  // Une seule fois par instance (rechargement à chaud : déjà branché).
  const flagged = db as unknown as { __trokachaEmulator?: boolean };
  if (!flagged.__trokachaEmulator) {
    try {
      connectFirestoreEmulator(db, FIREBASE_EMULATORS.host, FIREBASE_EMULATORS.ports.firestore);
    } catch {
      // Déjà branché par un module chargé avant.
    }
    flagged.__trokachaEmulator = true;
  }
}

export { app, db };
