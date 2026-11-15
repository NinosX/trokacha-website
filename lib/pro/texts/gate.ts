// lib/pro/texts/gate.ts
// Textes de la porte du bureau pro pendant la mise en ligne anticipée (15/11 : ouvert
// seulement aux espaces pilotes) et du refus d'un compte Google inconnu à la connexion.
// La page fermée sert aussi aux comptes sans boutique pendant le pilote (S4) : phrase neutre.
// Mêmes règles que `../texts.ts` : vouvoiement, aucune mention de prix ni de gratuité.

import type { Dict, ProLocale } from '../texts';

const fr: Dict = {
  'gate.closedTitle': 'L’espace pro n’est pas encore ouvert pour votre compte',
  'gate.closedBody': 'En attendant, tout se fait dans l’application Trokacha.',
  'gate.openApp': 'Ouvrir l’application',
  'gate.checking': 'Vérification de votre compte…',
  'gate.errorTitle': 'Impossible de lire votre compte pour le moment',
  'gate.errorBody': 'Vérifiez votre connexion, puis réessayez.',
  'signin.error.noAccount': 'Créez d’abord votre compte dans l’application Trokacha.',
};

const en: Dict = {
  'gate.closedTitle': 'The pro space is not open for your account yet',
  'gate.closedBody': 'In the meantime, everything is done in the Trokacha app.',
  'gate.openApp': 'Open the app',
  'gate.checking': 'Checking your account…',
  'gate.errorTitle': 'Your account cannot be read right now',
  'gate.errorBody': 'Check your connection, then try again.',
  'signin.error.noAccount': 'Create your account in the Trokacha app first.',
};

const ar: Dict = {
  'gate.closedTitle': 'لم تُفتح هذه المساحة لحسابك بعد',
  'gate.closedBody': 'في الأثناء، كل شيء يتم من تطبيق تروكاشا.',
  'gate.openApp': 'افتح التطبيق',
  'gate.checking': 'جارٍ التحقق من حسابك…',
  'gate.errorTitle': 'تعذّرت قراءة حسابك حاليًا',
  'gate.errorBody': 'تحقّق من الاتصال ثم أعد المحاولة.',
  'signin.error.noAccount': 'أنشئ حسابك أولا في تطبيق تروكاشا.',
};

export const gateTexts: Record<ProLocale, Dict> = { fr, en, ar };
