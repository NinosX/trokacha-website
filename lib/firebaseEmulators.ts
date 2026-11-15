// lib/firebaseEmulators.ts
// =============================================================================
// MODE « ÉMULATEURS LOCAUX » DU SITE (bureau des pros, 15/11).
// Miroir de `contexts/firebaseEmulators.ts` de l'application.
// =============================================================================
//
// Éteint par défaut. S'allume SEULEMENT quand les deux conditions sont réunies :
//   • serveur de développement (`NODE_ENV !== 'production'`) : un `next build`
//     remplace NODE_ENV par « production », le mode y est donc du code mort ;
//   • `NEXT_PUBLIC_FIREBASE_EMULATORS=1` au démarrage de `next dev`.
//
// Allumé, le site parle à un projet `demo-…` (identifiants factices, aucun
// service Google réel ne le connaît) et branche Firestore (serveur et
// navigateur), Auth, Functions et Storage (navigateur) sur les émulateurs de la
// machine. Un projet qui ne commence pas par `demo-` est refusé (repli sur le
// projet de démonstration) : jamais le projet de production.
//
// Lancement : voir `admin/REFONTE_2026-10/SIMULATEUR_PRO_LOCAL.md` (même
// émulateurs, même seed que l'application), puis dans ce dossier :
//   NEXT_PUBLIC_FIREBASE_EMULATORS=1 npx next dev -p 3100
// =============================================================================

export const DEMO_PROJECT_ID = 'demo-trokacha-pro';

export const EMULATOR_PORTS = Object.freeze({
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199,
});

export interface FirebaseEmulators {
  host: string;
  projectId: string;
  ports: typeof EMULATOR_PORTS;
}

export interface FirebaseEmulatorsInput {
  production: boolean;
  flag?: string | null;
  host?: string | null;
  projectId?: string | null;
}

const DEMO_PROJECT_RE = /^demo-[a-z0-9-]{1,40}$/;
const HOST_RE = /^[A-Za-z0-9.-]{1,253}$/;

/** Décision pure : `null` = production, comme toujours. */
export function readFirebaseEmulators(input: FirebaseEmulatorsInput): FirebaseEmulators | null {
  if (input.production !== false || input.flag !== '1') return null;
  const rawHost = String(input.host ?? '').trim();
  const host = HOST_RE.test(rawHost) ? rawHost : '127.0.0.1';
  const rawProject = String(input.projectId ?? '').trim();
  const projectId = DEMO_PROJECT_RE.test(rawProject) ? rawProject : DEMO_PROJECT_ID;
  return Object.freeze({ host, projectId, ports: EMULATOR_PORTS });
}

// ⚠️ Accès LITTÉRAUX à `process.env.…` : c'est la forme que Next.js remplace à
// la compilation (une déstructuration ne serait pas remplacée côté navigateur).
// En production, la branche entière disparaît du JavaScript servi.
export const FIREBASE_EMULATORS: FirebaseEmulators | null =
  process.env.NODE_ENV !== 'production'
    ? readFirebaseEmulators({
        production: false,
        flag: process.env.NEXT_PUBLIC_FIREBASE_EMULATORS,
        host: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PROJECT,
      })
    : null;

export function isFirebaseEmulatorMode(): boolean {
  return FIREBASE_EMULATORS !== null;
}

/** Configuration Firebase du projet de démonstration (aucune clé réelle). */
export function emulatorFirebaseConfig(emulators: FirebaseEmulators) {
  return {
    apiKey: 'demo-api-key',
    authDomain: `${emulators.projectId}.firebaseapp.com`,
    projectId: emulators.projectId,
    storageBucket: `${emulators.projectId}.appspot.com`,
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000',
  };
}
