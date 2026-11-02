// Configuration Firebase du site, lue une seule fois ici.
//
// Les variables d'environnement de Vercel contiennent un retour à la ligne
// final (« trokacha-4ff78\n », constaté dans le JavaScript servi le 02/11) :
// Firestore cherchait alors un projet inexistant, la page d'annonce partagée
// restait sur « Chargement… » et son aperçu affichait « Annonce Trokacha ».
// D'où le trim, qui protège aussi d'une prochaine saisie avec espaces.
const clean = (value: string | undefined) => value?.trim() || undefined;

export const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};
