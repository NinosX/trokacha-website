'use client';

// lib/firebaseClient.ts
// =============================================================================
// Firebase côté NAVIGATEUR : Auth (session gardée par le navigateur, IndexedDB),
// Functions (us-central1, comme l'application) et Storage. Créés à la première
// demande, jamais pendant le rendu serveur : à n'appeler que dans un effet ou
// un gestionnaire d'événement d'un composant client.
// =============================================================================

import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { FIREBASE_EMULATORS } from '@/lib/firebaseEmulators';

export const FUNCTIONS_REGION = 'us-central1';

let auth: Auth | null = null;
let functions: Functions | null = null;
let storage: FirebaseStorage | null = null;

function assertBrowser(what: string): void {
  if (typeof window === 'undefined') throw new Error(`${what} : navigateur seulement`);
}

export function clientAuth(): Auth {
  assertBrowser('Auth');
  if (!auth) {
    auth = getAuth(app);
    if (FIREBASE_EMULATORS) {
      try {
        connectAuthEmulator(auth, `http://${FIREBASE_EMULATORS.host}:${FIREBASE_EMULATORS.ports.auth}`, { disableWarnings: true });
      } catch {
        // Rechargement à chaud : déjà branché.
      }
    }
  }
  return auth;
}

export function clientFunctions(): Functions {
  assertBrowser('Functions');
  if (!functions) {
    functions = getFunctions(app, FUNCTIONS_REGION);
    if (FIREBASE_EMULATORS) {
      try {
        connectFunctionsEmulator(functions, FIREBASE_EMULATORS.host, FIREBASE_EMULATORS.ports.functions);
      } catch {
        // Rechargement à chaud : déjà branché.
      }
    }
  }
  return functions;
}

export function clientStorage(): FirebaseStorage {
  assertBrowser('Storage');
  if (!storage) {
    storage = getStorage(app);
    if (FIREBASE_EMULATORS) {
      try {
        connectStorageEmulator(storage, FIREBASE_EMULATORS.host, FIREBASE_EMULATORS.ports.storage);
      } catch {
        // Rechargement à chaud : déjà branché.
      }
    }
  }
  return storage;
}
