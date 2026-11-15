// lib/pro/texts/gate.ts
// Textes de la porte du bureau pro pendant la mise en ligne anticipée (15/11 : ouvert
// seulement aux espaces pilotes) et du refus d'un compte Google inconnu à la connexion.
// Mêmes règles que `../texts.ts` : vouvoiement, aucune mention de prix ni de gratuité.

import type { Dict, ProLocale } from '../texts';

const fr: Dict = {
  'gate.closedTitle': 'L’espace pro n’est pas encore ouvert pour votre compte',
  'gate.closedBody': 'Vous pouvez continuer à gérer votre boutique ou votre agence dans l’application Trokacha.',
  'gate.openApp': 'Ouvrir l’application',
  'gate.checking': 'Vérification de votre compte…',
  'signin.error.noAccount': 'Créez d’abord votre compte dans l’application Trokacha.',
};

const en: Dict = {
  'gate.closedTitle': 'The pro space is not open for your account yet',
  'gate.closedBody': 'You can keep managing your shop or agency in the Trokacha app.',
  'gate.openApp': 'Open the app',
  'gate.checking': 'Checking your account…',
  'signin.error.noAccount': 'Create your account in the Trokacha app first.',
};

const ar: Dict = {
  'gate.closedTitle': 'لم تُفتح هذه المساحة لحسابك بعد',
  'gate.closedBody': 'يمكنك مواصلة تسيير محلك أو وكالتك من تطبيق تروكاشا.',
  'gate.openApp': 'افتح التطبيق',
  'gate.checking': 'جارٍ التحقق من حسابك…',
  'signin.error.noAccount': 'أنشئ حسابك أولا في تطبيق تروكاشا.',
};

export const gateTexts: Record<ProLocale, Dict> = { fr, en, ar };
