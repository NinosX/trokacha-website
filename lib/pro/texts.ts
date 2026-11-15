// lib/pro/texts.ts
// =============================================================================
// TEXTES DU BUREAU PRO ET DE LA CONNEXION (fr, en, ar ; le kabyle reprend le
// français, comme les autres pages ouvertes depuis l'application, voir
// `components/LinkPage.tsx`). Les mots sont ceux de l'application (« Mon
// agence », « Caution », « Commandes »…) : les textes déjà dans l'application
// sont recopiés tels quels de `translations/*.json` (clés `v2.pro.*`).
// Aucune mention de prix ni de gratuité. Vouvoiement en français.
// =============================================================================

import { addDays } from '@/lib/pro-core';

import { agencyTexts } from './texts/agency';
import { sharedTexts } from './texts/shared';
import { shopTexts } from './texts/shop';

export type ProLocale = 'fr' | 'en' | 'ar';

export function proLocale(locale: string | null | undefined): ProLocale {
  return locale === 'ar' || locale === 'en' ? locale : 'fr';
}

export type Plural = { one: string; two?: string; few?: string; many?: string; other: string; zero?: string };
export type Entry = string | Plural;
export type Dict = Record<string, Entry>;

const fr: Dict = {
  'common.loading': 'Chargement…',
  'common.error': 'Le carnet ne s’est pas chargé.',
  'common.retry': 'Réessayer',
  'common.signOut': 'Se déconnecter',

  'signin.title': 'Connexion',
  'signin.subtitle': 'Entrez avec le même compte Trokacha que dans l’application.',
  'signin.email': 'Adresse e-mail',
  'signin.password': 'Mot de passe',
  'signin.show': 'Afficher',
  'signin.hide': 'Masquer',
  'signin.submit': 'Se connecter',
  'signin.or': 'ou',
  'signin.google': 'Continuer avec Google',
  'signin.forgot': 'Mot de passe oublié ?',
  'signin.resetSent': 'Un lien pour choisir un nouveau mot de passe a été envoyé à {{email}}.',
  'signin.resetNeedEmail': 'Écrivez d’abord votre adresse e-mail.',
  'signin.noAccount': 'Pas encore de compte ? Créez-le dans l’application Trokacha.',
  'signin.signedInAs': 'Connecté : {{name}}',
  'signin.goToDesk': 'Ouvrir mon espace pro',
  'signin.error.invalid': 'Adresse e-mail ou mot de passe incorrect.',
  'signin.error.tooMany': 'Trop d’essais. Réessayez dans quelques minutes.',
  'signin.error.network': 'Pas de connexion. Vérifiez le réseau puis réessayez.',
  'signin.error.popupClosed': 'La fenêtre Google a été fermée avant la fin.',
  'signin.error.disabled': 'Ce compte est suspendu.',
  'signin.error.generic': 'La connexion n’a pas abouti. Réessayez.',

  'desk.spacesTitle': 'Vos agences et boutiques',
  'desk.kindAgence': 'Agence',
  'desk.kindBoutique': 'Boutique',
  'desk.tabAgence': 'Mon agence',
  'desk.tabBoutique': 'Ma boutique',
  'desk.pending': 'En attente de validation',
  'desk.switch': 'Changer d’espace',
  'desk.noSpaceTitle': 'Aucune boutique sur ce compte',
  'desk.noSpaceBody': 'Ouvrez votre boutique ou votre agence depuis le Compte de l’application : cet espace devient votre outil de travail.',
  'desk.notYours': 'Cet espace n’est pas lié à votre compte.',
  'desk.backToList': 'Voir vos espaces',
  'desk.emailNotVerified': 'Votre adresse e-mail n’est pas encore confirmée. Ouvrez le lien reçu par e-mail, puis rechargez cette page.',

  'pane.aujourdhui': 'Aujourd’hui',
  'pane.planning': 'Planning',
  'pane.demandes': 'Demandes',
  'pane.catalogue': 'Catalogue',
  'pane.commandes': 'Commandes',
  'pane.clients': 'Clients',
  'pane.caisse': 'Caisse',
  'pane.reglages': 'Réglages',

  'day.today': 'aujourd’hui',
  'day.yesterday': 'hier',
  'day.tomorrow': 'demain',
  'day.at': '{{day}} à {{time}}',

  'today.lateLine': 'en retard depuis {{since}}',
  'today.call': 'Appeler',
  'today.depart': 'Départ',
  'today.retour': 'Retour',
  'today.noTime': 'Heure à fixer',
  'today.takeDeposit': 'Caution à prendre',
  'today.returnDeposit': 'Caution à rendre',
  'today.due': 'Reste {{amount}} à encaisser',
  'today.airport': 'Aéroport',
  'today.airportAt': 'Aéroport · {{place}}',
  'today.emptyTitle': 'Rien de prévu aujourd’hui',
  'today.emptyBody': 'Les réservations du jour, les retours et les retards s’affichent ici dès qu’ils sont notés, sur le téléphone ou ici.',
  'today.missedTitle': 'Pas encore partis',
  'today.missedLine': 'prévu {{day}}',
  'today.toSettleTitle': 'À régler',
  'today.tomorrow': { one: 'Demain : {{count}} départ', other: 'Demain : {{count}} départs' },
  'today.cash': 'Encaissé aujourd’hui',

  'shop.putAsideTitle': 'Mis de côté',
  'shop.toShipTitle': 'À expédier',
  'shop.shippedTitle': 'Colis en route',
  'shop.returningTitle': 'Colis qui reviennent',
  'shop.due': 'Reste dû par les clients : {{amount}}',
  'shop.emptyTitle': 'Rien à préparer aujourd’hui',
  'shop.emptyBody': 'Les ventes mises de côté, les colis à expédier et ceux en route s’affichent ici dès qu’ils sont notés.',
  'shop.line.toShip': 'À expédier · {{carrier}}',
  'shop.line.toShipBare': 'À expédier',
  'shop.line.shipped': 'Expédié · {{carrier}}',
  'shop.line.shippedBare': 'Expédié',
  'shop.line.shippedTracking': 'Expédié · {{carrier}} · suivi {{tracking}}',
  'shop.line.returning': 'Refusé à la livraison : le colis revient',
  'shop.line.putAside': 'Mis de côté',
  'shop.line.putAsideDue': 'Mis de côté · reste {{amount}} à encaisser',
};

const en: Dict = {
  'common.loading': 'Loading…',
  'common.error': 'The notebook did not load.',
  'common.retry': 'Try again',
  'common.signOut': 'Sign out',

  'signin.title': 'Sign in',
  'signin.subtitle': 'Use the same Trokacha account as in the app.',
  'signin.email': 'Email address',
  'signin.password': 'Password',
  'signin.show': 'Show',
  'signin.hide': 'Hide',
  'signin.submit': 'Sign in',
  'signin.or': 'or',
  'signin.google': 'Continue with Google',
  'signin.forgot': 'Forgot your password?',
  'signin.resetSent': 'A link to choose a new password was sent to {{email}}.',
  'signin.resetNeedEmail': 'Type your email address first.',
  'signin.noAccount': 'No account yet? Create it in the Trokacha app.',
  'signin.signedInAs': 'Signed in: {{name}}',
  'signin.goToDesk': 'Open my pro space',
  'signin.error.invalid': 'Wrong email address or password.',
  'signin.error.tooMany': 'Too many attempts. Try again in a few minutes.',
  'signin.error.network': 'No connection. Check the network and try again.',
  'signin.error.popupClosed': 'The Google window was closed before the end.',
  'signin.error.disabled': 'This account is suspended.',
  'signin.error.generic': 'Sign in did not go through. Try again.',

  'desk.spacesTitle': 'Your agencies and shops',
  'desk.kindAgence': 'Agency',
  'desk.kindBoutique': 'Shop',
  'desk.tabAgence': 'My agency',
  'desk.tabBoutique': 'My shop',
  'desk.pending': 'Awaiting approval',
  'desk.switch': 'Switch space',
  'desk.noSpaceTitle': 'No shop on this account',
  'desk.noSpaceBody': 'Open your shop or agency from the Account tab of the app: this space becomes your work tool.',
  'desk.notYours': 'This space is not linked to your account.',
  'desk.backToList': 'See your spaces',
  'desk.emailNotVerified': 'Your email address is not confirmed yet. Open the link you received by email, then reload this page.',

  'pane.aujourdhui': 'Today',
  'pane.planning': 'Planning',
  'pane.demandes': 'Requests',
  'pane.catalogue': 'Catalogue',
  'pane.commandes': 'Orders',
  'pane.clients': 'Clients',
  'pane.caisse': 'Cash desk',
  'pane.reglages': 'Settings',

  'day.today': 'today',
  'day.yesterday': 'yesterday',
  'day.tomorrow': 'tomorrow',
  'day.at': '{{day}} at {{time}}',

  'today.lateLine': 'late since {{since}}',
  'today.call': 'Call',
  'today.depart': 'Departure',
  'today.retour': 'Return',
  'today.noTime': 'Time to set',
  'today.takeDeposit': 'Deposit to take',
  'today.returnDeposit': 'Deposit to return',
  'today.due': '{{amount}} left to collect',
  'today.airport': 'Airport',
  'today.airportAt': 'Airport · {{place}}',
  'today.emptyTitle': 'Nothing planned today',
  'today.emptyBody': 'Today’s bookings, returns and late cars show up here as soon as they are noted, on the phone or here.',
  'today.missedTitle': 'Not picked up yet',
  'today.missedLine': 'planned {{day}}',
  'today.toSettleTitle': 'To settle',
  'today.tomorrow': { one: 'Tomorrow: {{count}} departure', other: 'Tomorrow: {{count}} departures' },
  'today.cash': 'Collected today',

  'shop.putAsideTitle': 'Put aside',
  'shop.toShipTitle': 'To ship',
  'shop.shippedTitle': 'Parcels on the way',
  'shop.returningTitle': 'Parcels coming back',
  'shop.due': 'Still owed by customers: {{amount}}',
  'shop.emptyTitle': 'Nothing to prepare today',
  'shop.emptyBody': 'Sales put aside, parcels to ship and parcels on the way show up here as soon as they are noted.',
  'shop.line.toShip': 'To ship · {{carrier}}',
  'shop.line.toShipBare': 'To ship',
  'shop.line.shipped': 'Shipped · {{carrier}}',
  'shop.line.shippedBare': 'Shipped',
  'shop.line.shippedTracking': 'Shipped · {{carrier}} · tracking {{tracking}}',
  'shop.line.returning': 'Refused at delivery: the parcel is coming back',
  'shop.line.putAside': 'Put aside',
  'shop.line.putAsideDue': 'Put aside · {{amount}} left to collect',
};

const ar: Dict = {
  'common.loading': 'جارٍ التحميل…',
  'common.error': 'تعذّر تحميل الدفتر.',
  'common.retry': 'إعادة المحاولة',
  'common.signOut': 'تسجيل الخروج',

  'signin.title': 'تسجيل الدخول',
  'signin.subtitle': 'ادخل بنفس حساب تروكاشا الذي تستعمله في التطبيق.',
  'signin.email': 'البريد الإلكتروني',
  'signin.password': 'كلمة السر',
  'signin.show': 'إظهار',
  'signin.hide': 'إخفاء',
  'signin.submit': 'تسجيل الدخول',
  'signin.or': 'أو',
  'signin.google': 'المتابعة مع Google',
  'signin.forgot': 'نسيت كلمة السر؟',
  'signin.resetSent': 'أرسلنا رابطًا لاختيار كلمة سر جديدة إلى ⁨{{email}}⁩.',
  'signin.resetNeedEmail': 'اكتب بريدك الإلكتروني أولًا.',
  'signin.noAccount': 'ليس لديك حساب بعد؟ أنشئه في تطبيق تروكاشا.',
  'signin.signedInAs': 'متصل: ⁨{{name}}⁩',
  'signin.goToDesk': 'فتح مساحتي المهنية',
  'signin.error.invalid': 'البريد الإلكتروني أو كلمة السر غير صحيحة.',
  'signin.error.tooMany': 'محاولات كثيرة. أعد المحاولة بعد بضع دقائق.',
  'signin.error.network': 'لا يوجد اتصال. تحقّق من الشبكة ثم أعد المحاولة.',
  'signin.error.popupClosed': 'أُغلقت نافذة Google قبل إنهاء الدخول.',
  'signin.error.disabled': 'هذا الحساب موقوف.',
  'signin.error.generic': 'تعذّر تسجيل الدخول. أعد المحاولة.',

  'desk.spacesTitle': 'وكالاتك ومحلاتك',
  'desk.kindAgence': 'وكالة',
  'desk.kindBoutique': 'محل',
  'desk.tabAgence': 'وكالتي',
  'desk.tabBoutique': 'محلي',
  'desk.pending': 'في انتظار الموافقة',
  'desk.switch': 'تغيير المساحة',
  'desk.noSpaceTitle': 'لا يوجد محل في هذا الحساب',
  'desk.noSpaceBody': 'افتح محلك أو وكالتك من الحساب في التطبيق: تصبح هذه المساحة أداة عملك.',
  'desk.notYours': 'هذه المساحة غير مرتبطة بحسابك.',
  'desk.backToList': 'عرض مساحاتك',
  'desk.emailNotVerified': 'بريدك الإلكتروني لم يُؤكَّد بعد. افتح الرابط الذي وصلك عبر البريد، ثم أعد تحميل هذه الصفحة.',

  'pane.aujourdhui': 'اليوم',
  'pane.planning': 'الجدول',
  'pane.demandes': 'الطلبات',
  'pane.catalogue': 'الكتالوڨ',
  'pane.commandes': 'الطلبات',
  'pane.clients': 'الزبائن',
  'pane.caisse': 'الصندوق',
  'pane.reglages': 'الإعدادات',

  'day.today': 'اليوم',
  'day.yesterday': 'أمس',
  'day.tomorrow': 'غدًا',
  'day.at': '{{day}} على الساعة {{time}}',

  'today.lateLine': 'متأخر منذ {{since}}',
  'today.call': 'اتصال',
  'today.depart': 'الخروج',
  'today.retour': 'الإرجاع',
  'today.noTime': 'الساعة لم تُحدَّد',
  'today.takeDeposit': 'الضمان لم يُستلم بعد',
  'today.returnDeposit': 'ضمان يجب إرجاعه',
  'today.due': 'يبقى {{amount}} للتحصيل',
  'today.airport': 'المطار',
  'today.airportAt': 'المطار · ⁨{{place}}⁩',
  'today.emptyTitle': 'لا شيء مبرمج اليوم',
  'today.emptyBody': 'حجوزات اليوم والإرجاعات والتأخيرات تظهر هنا بمجرد تسجيلها، في الهاتف أو هنا.',
  'today.missedTitle': 'لم يخرجوا بعد',
  'today.missedLine': 'مبرمج {{day}}',
  'today.toSettleTitle': 'للتسوية',
  'today.tomorrow': {
    one: 'غدًا: خروج واحد',
    two: 'غدًا: خروجان',
    few: 'غدًا: ‏{{count}} خروجات',
    many: 'غدًا: ‏{{count}} خروجًا',
    other: 'غدًا: ‏{{count}} خروج',
  },
  'today.cash': 'المُحصَّل اليوم',

  'shop.putAsideTitle': 'محجوز للزبون',
  'shop.toShipTitle': 'للإرسال',
  'shop.shippedTitle': 'طرود في الطريق',
  'shop.returningTitle': 'طرود راجعة',
  'shop.due': 'ما بقي على الزبائن: {{amount}}',
  'shop.emptyTitle': 'لا شيء للتحضير اليوم',
  'shop.emptyBody': 'المبيعات المحجوزة للزبائن والطرود التي يجب إرسالها والتي في الطريق تظهر هنا بمجرد تسجيلها.',
  'shop.line.toShip': 'للإرسال · ⁨{{carrier}}⁩',
  'shop.line.toShipBare': 'للإرسال',
  'shop.line.shipped': 'أُرسل · ⁨{{carrier}}⁩',
  'shop.line.shippedBare': 'أُرسل',
  'shop.line.shippedTracking': 'أُرسل · ⁨{{carrier}}⁩ · رقم التتبع ⁨{{tracking}}⁩',
  'shop.line.returning': 'رُفض عند التسليم: الطرد راجع',
  'shop.line.putAside': 'محجوز للزبون',
  'shop.line.putAsideDue': 'محجوز للزبون · يبقى {{amount}} للتحصيل',
};

// Textes par volet (`./texts/*.ts`, un fichier par chantier : agence, boutique,
// commun) ajoutés à la base ; une clé de volet ne doit pas reprendre une clé de base.
const AREAS = [agencyTexts, shopTexts, sharedTexts] as const;
const withAreas = (locale: ProLocale, base: Dict): Dict => Object.assign({}, base, ...AREAS.map((a) => a[locale]));

const DICTS: Record<ProLocale, Dict> = { fr: withAreas('fr', fr), en: withAreas('en', en), ar: withAreas('ar', ar) };

export type ProTextKey = keyof typeof fr;

function fill(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => (params[name] === undefined ? '' : String(params[name])));
}

export interface ProTexts {
  locale: ProLocale;
  dir: 'rtl' | 'ltr';
  t: (key: ProTextKey, params?: Record<string, string | number>) => string;
  tp: (key: ProTextKey, count: number, params?: Record<string, string | number>) => string;
  money: (amount: number) => string;
  dayHeading: (day: string) => string;
  relativeDay: (day: string, today: string) => string;
  dayAndTime: (day: string, heure: string | null | undefined, today: string) => string;
}

const INTL: Record<ProLocale, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-DZ-u-nu-latn' };

function dateOfDay(day: string): Date {
  const [y, m, d] = day.split('-').map((n) => Number(n));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
}

export function proTexts(rawLocale: string | null | undefined): ProTexts {
  const locale = proLocale(rawLocale);
  const dict = DICTS[locale];
  const rules = new Intl.PluralRules(locale === 'ar' ? 'ar' : locale);
  const group = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

  const t = (key: ProTextKey, params?: Record<string, string | number>): string => {
    const entry = dict[key] ?? fr[key];
    const text = typeof entry === 'string' ? entry : entry?.other ?? '';
    return fill(text, params);
  };
  const tp = (key: ProTextKey, count: number, params: Record<string, string | number> = {}): string => {
    const entry = dict[key] ?? fr[key];
    if (typeof entry === 'string') return fill(entry, { count, ...params });
    const form = rules.select(count) as keyof Plural;
    return fill(entry[form] ?? entry.other, { count, ...params });
  };
  const money = (amount: number): string => {
    const n = group.format(Math.round(amount));
    if (locale === 'ar') return `‏${n} دج`;
    if (locale === 'en') return `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(amount))} DA`;
    return `${n} DA`;
  };
  const dayHeading = (day: string): string => {
    const text = new Intl.DateTimeFormat(INTL[locale], { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dateOfDay(day));
    return locale === 'ar' ? text : text.charAt(0).toUpperCase() + text.slice(1);
  };
  const longDay = (day: string): string =>
    new Intl.DateTimeFormat(INTL[locale], { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dateOfDay(day));
  const relativeDay = (day: string, today: string): string => {
    if (day === today) return t('day.today');
    if (day === addDays(today, -1)) return t('day.yesterday');
    if (day === addDays(today, 1)) return t('day.tomorrow');
    return longDay(day);
  };
  const dayAndTime = (day: string, heure: string | null | undefined, today: string): string => {
    const d = relativeDay(day, today);
    return heure ? t('day.at', { day: d, time: heure }) : d;
  };

  return { locale, dir: locale === 'ar' ? 'rtl' : 'ltr', t, tp, money, dayHeading, relativeDay, dayAndTime };
}
