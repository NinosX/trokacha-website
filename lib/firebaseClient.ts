'use client';

// lib/firebaseClient.ts
// =============================================================================
// Firebase côté NAVIGATEUR : Auth et Functions (us-central1, comme
// l'application). Créés à la première demande, jamais pendant le rendu serveur :
// à n'appeler que dans un effet ou un gestionnaire d'événement d'un composant
// client.
//
// Session du bureau = celle de l'ONGLET (`browserSessionPersistence`, relecture
// de Main, 15/11, S6) : le bureau montre des fiches clients et des pièces
// d'identité, souvent sur l'ordinateur partagé d'une agence ou d'une boutique.
// Fermer l'onglet ou le navigateur déconnecte ; recharger la page, la connexion
// Google par fenêtre ou par page entière (même onglet) gardent la session. Un
// nouvel onglet demande de se reconnecter, ce qui est voulu sur un poste partagé.
// =============================================================================

import {
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { FIREBASE_EMULATORS } from '@/lib/firebaseEmulators';

export const FUNCTIONS_REGION = 'us-central1';

let auth: Auth | null = null;
let functions: Functions | null = null;

function assertBrowser(what: string): void {
  if (typeof window === 'undefined') throw new Error(`${what} : navigateur seulement`);
}

export function clientAuth(): Auth {
  assertBrowser('Auth');
  if (!auth) {
    try {
      auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
    } catch {
      // Rechargement à chaud : Auth déjà créé pour cette app, avec la même persistance.
      auth = getAuth(app);
    }
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
