// lib/boutiques.ts
// -----------------------------------------------------------------------------
// BOUTIQUES — lecture publique côté site vitrine (chantier 2026-08, §7 SEO).
//
// Ce module tourne côté SERVEUR (composants serveur des routes /boutiques et
// /boutique/[id]) avec le même client Firebase que le reste du site
// (`lib/firebase`). Aucune dépendance nouvelle : le SDK web modulaire suffit,
// c'est déjà ce que fait `app/[locale]/ad/[id]/layout.tsx` pour ses metadata.
//
// ⚠️ CONTRAINTES firestore.rules (app mobile) — à respecter à la lettre, sinon
// la requête est REFUSÉE pour un visiteur non authentifié :
//   • boutiques `get`   : seules les boutiques `statut == 'active'` sont lisibles.
//   • boutiques `list`  : OBLIGATOIREMENT where('statut','==','active') + limit <= 50.
//   • ads      `read`   : seules les annonces `status == 'approved'` sont lisibles
//                         → la requête DOIT porter ce filtre.
// `hidden == true` (article masqué par le vendeur) n'est PAS filtrable côté
// requête sans index composite : on l'écarte côté serveur après lecture.
//
// Les champs du domaine boutique sont EN FRANÇAIS (nom, statut, horaires,
// modesVente…) : c'est la spec de l'app, ne pas angliciser.

import { collection, doc, getDoc, getDocs, limit as fsLimit, query, where, type Query } from 'firebase/firestore';
import { db } from './firebase';
import { formatAmount, toBoutiqueAd, visibleSorted, type BoutiqueAd, type SiteLocale } from './boutiquePublic';

export { espaceKindOf, formatAmount, type BoutiqueAd, type EspaceKind, type SiteLocale } from './boutiquePublic';

/* ============================== Types ==================================== */
// Tout est optionnel : ce sont des données distantes, saisies par des vendeurs,
// et une fiche incomplète doit rendre une page dégradée, jamais planter.

export interface BoutiqueHorairePlage {
  /** Minutes depuis minuit (0..1440). */
  debut: number;
  fin: number;
}

export interface BoutiqueHoraires {
  plages?: BoutiqueHorairePlage[];
  ramadanMode?: boolean;
  ramadan?: { plages?: BoutiqueHorairePlage[] };
  /** @deprecated ancien format texte libre (boutiques créées au lot 2b). */
  texte?: string;
  /** @deprecated ancien format texte libre Ramadan. */
  texteRamadan?: string;
}

export interface BoutiqueLocalisation {
  wilayaCode?: string;
  city?: string;
  quartier?: string;
  repere?: string;
  lat?: number;
  lng?: number;
}

export interface BoutiqueCanaux {
  phone?: string;
  whatsapp?: string;
  messenger?: string;
  tiktok?: string;
  instagram?: string;
}

export interface BoutiqueModesVente {
  /** ⚠️ Clé HISTORIQUE : le libellé affiché dit « 69 wilayas » (référentiel Trokacha). */
  livraison58?: boolean;
  codLivraison?: boolean;
  mainAMain?: boolean;
  stopDesk?: boolean;
  retraitBoutique?: boolean;
  livraisonGratuiteDes?: number | null;
}

export interface Boutique {
  id: string;
  nom?: string;
  slug?: string;
  logo?: string;
  banner?: string;
  bio?: { fr?: string; ar?: string };
  secteurs?: string[];
  localisation?: BoutiqueLocalisation;
  canaux?: BoutiqueCanaux;
  horaires?: BoutiqueHoraires;
  modesVente?: BoutiqueModesVente;
  pinnedInfo?: string;
  statut?: string;
  verified?: boolean;
}

// `BoutiqueAd` et `SiteLocale` : voir `lib/boutiquePublic.ts` (module pur, testé).

/** Locale de rendu — `kab` et tout inconnu retombent sur `fr`. */
export function toSiteLocale(locale: string | undefined): SiteLocale {
  return locale === 'ar' || locale === 'en' ? locale : 'fr';
}

/* ============================ Lecture Firestore ========================== */

/** Limite imposée par firestore.rules pour un `list` non authentifié. */
export const BOUTIQUES_LIST_LIMIT = 50;
/** Garde-fou d'affichage : une vitrine web V1 ne déroule pas 500 articles. */
export const BOUTIQUE_ADS_LIMIT = 48;

/**
 * Boutique publique. `null` couvre TOUS les cas non affichables — inexistante,
 * `pending`/`suspended`, permission-denied (réponse normale des rules), panne
 * réseau — parce que l'appelant rend le même interstitiel dans tous les cas.
 */
export async function getActiveBoutique(id: string): Promise<Boutique | null> {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, 'boutiques', id));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<Boutique, 'id'>;
    if (data?.statut !== 'active') return null;
    return { id: snap.id, ...data };
  } catch (error) {
    console.error('[boutiques] getActiveBoutique failed:', error);
    return null;
  }
}

/** Annuaire : boutiques actives (requête conforme aux rules : statut + limit). */
export async function listActiveBoutiques(): Promise<Boutique[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'boutiques'),
        where('statut', '==', 'active'),
        fsLimit(BOUTIQUES_LIST_LIMIT),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Boutique, 'id'>) }));
  } catch (error) {
    console.error('[boutiques] listActiveBoutiques failed:', error);
    return [];
  }
}

/**
 * Requête des annonces publiques d'une boutique, conforme aux rules pour un
 * visiteur non connecté (`status == 'approved'` + limit <= 100). Deux filtres
 * d'ÉGALITÉ seulement (pas d'orderBy) : servie sans index composite. Le tri et
 * le retrait des articles masqués (`hidden`, dont la rupture de stock) se font
 * après lecture (`visibleSorted`). Partagée par le rendu serveur et l'écoute en
 * direct du navigateur (`BoutiqueAdsLive`).
 */
export function boutiqueAdsQuery(boutiqueId: string): Query {
  return query(
    collection(db, 'ads'),
    where('boutiqueId', '==', boutiqueId),
    where('status', '==', 'approved'),
    fsLimit(BOUTIQUE_ADS_LIMIT),
  );
}

/** Annonces publiques d'une boutique (rendu serveur). */
export async function listBoutiqueAds(boutiqueId: string): Promise<BoutiqueAd[]> {
  if (!boutiqueId) return [];
  try {
    const snap = await getDocs(boutiqueAdsQuery(boutiqueId));
    return visibleSorted(snap.docs.map((d) => toBoutiqueAd(d.id, d.data() as Record<string, unknown>)));
  } catch (error) {
    console.error('[boutiques] listBoutiqueAds failed:', error);
    return [];
  }
}

/* ============================== Horaires ================================= */
// Portage minimal de `utils/boutiqueHours.ts` (app mobile) : le stockage est en
// minutes depuis minuit, l'affichage en « 09:00-12:30 · 14:00-19:00 ».

/** Marque LTR : empêche l'algorithme bidi de retourner « 09:00-12:30 » en arabe (trait d'union simple, jamais de tiret long). */
const LRM = '\u200E';

export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatPlages(plages?: BoutiqueHorairePlage[] | null): string {
  if (!Array.isArray(plages) || plages.length === 0) return '';
  return plages
    .filter((p) => p && typeof p.debut === 'number' && typeof p.fin === 'number')
    .map((p) => `${LRM}${formatMinutes(p.debut)}-${formatMinutes(p.fin)}`)
    .join(' · ');
}

/**
 * Libellé d'horaires prêt à afficher, avec la bascule Ramadan.
 * Retombe sur l'ancien format texte libre (lot 2b) quand aucune plage n'existe :
 * ces docs ne sont PAS migrés.
 */
export function boutiqueHoursLabel(horaires?: BoutiqueHoraires | null): {
  label: string;
  ramadan: boolean;
} {
  const ramadanMode = horaires?.ramadanMode === true;
  const ramadanPlages = horaires?.ramadan?.plages;
  if (ramadanMode) {
    const label = formatPlages(ramadanPlages) || (horaires?.texteRamadan || '').trim();
    if (label) return { label, ramadan: true };
  }
  const label = formatPlages(horaires?.plages) || (horaires?.texte || '').trim();
  return { label, ramadan: false };
}

/* =========================== Canaux & itinéraire ========================= */

/** `tel:` et `wa.me` n'acceptent ni espaces ni tirets (saisie vendeur libre). */
export function normalizePhoneDigits(raw: string | null | undefined): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  const plus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  return digits ? (plus ? `+${digits}` : digits) : '';
}

/** Format `wa.me` : chiffres seuls, indicatif compris. `05…` DZ → `2135…`. */
export function toWhatsAppNumber(raw: string | null | undefined): string {
  const normalized = normalizePhoneDigits(raw);
  if (!normalized) return '';
  const digits = normalized.replace(/^\+/, '');
  if (normalized.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `213${digits.slice(1)}`;
  return digits;
}

/** URL « Itinéraire » Google Maps. `null` si la boutique n'a pas de position. */
export function buildItineraireUrl(boutique: Boutique | null | undefined): string | null {
  const lat = boutique?.localisation?.lat;
  const lng = boutique?.localisation?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/* ============================== Affichage ================================ */

export function boutiqueBio(boutique: Boutique | null | undefined, locale: SiteLocale): string {
  const bio = boutique?.bio;
  if (!bio) return '';
  const value = locale === 'ar' ? bio.ar || bio.fr : bio.fr || bio.ar;
  return (value || '').trim();
}

/** « Bab Ezzouar, Alger » — le quartier d'abord, c'est le repère DZ. */
export function boutiquePlaceLabel(boutique: Boutique | null | undefined): string {
  const loc = boutique?.localisation;
  return [loc?.quartier, loc?.city].filter(Boolean).join(', ');
}

/** Ville seule (titre SEO). */
export function boutiqueCity(boutique: Boutique | null | undefined): string {
  return (boutique?.localisation?.city || '').trim();
}

// Libellés repris de l'app (translations `boutiques.sectors`), mêmes mots partout.
export const SECTEUR_LABELS: Record<SiteLocale, Record<string, string>> = {
  fr: {
    textile: 'Mode, chaussures',
    informatique: 'Téléphones, informatique',
    electromenager: 'Électroménager',
    jouets: 'Jouets',
    bazar: 'Bazar',
    mobilier: 'Mobilier',
    locations: 'Locations',
    location_voiture: 'Location de voitures',
    location_immobilier: 'Location immobilière',
    droguerie: 'Droguerie, quincaillerie',
    autre: 'Autre',
  },
  en: {
    textile: 'Fashion, shoes',
    informatique: 'Phones, computers',
    electromenager: 'Home appliances',
    jouets: 'Toys',
    bazar: 'Bazaar',
    mobilier: 'Furniture',
    locations: 'Rentals',
    location_voiture: 'Car rentals',
    location_immobilier: 'Property rentals',
    droguerie: 'Hardware, household',
    autre: 'Other',
  },
  ar: {
    textile: 'الملابس والأحذية',
    informatique: 'الهواتف والإعلام الآلي',
    electromenager: 'الأجهزة الكهرومنزلية',
    jouets: 'الألعاب',
    bazar: 'بازار',
    mobilier: 'الأثاث',
    locations: 'كراء',
    location_voiture: 'كراء السيارات',
    location_immobilier: 'كراء العقارات',
    droguerie: 'الدروڨري والأدوات',
    autre: 'أخرى',
  },
};

export function secteurLabel(secteur: string, locale: SiteLocale): string {
  return SECTEUR_LABELS[locale][secteur] || SECTEUR_LABELS.fr[secteur] || secteur;
}

/**
 * Badges de modes de vente.
 * ⚠️ `livraison58` est une clé de DONNÉES historique — le LIBELLÉ dit
 * « 69 wilayas » (référentiel Trokacha, tranché par Lyes le 06/08). Ne jamais
 * écrire 58 dans une chaîne visible.
 */
export function modesVenteBadges(
  modes: BoutiqueModesVente | null | undefined,
  locale: SiteLocale,
): string[] {
  if (!modes) return [];
  const L = {
    fr: {
      livraison: 'Livraison 69 wilayas',
      cod: 'Paiement à la livraison',
      mainAMain: 'Main à main',
      stopDesk: 'Stop desk',
      retrait: 'Retrait en boutique',
      gratuite: (n: string) => `Livraison gratuite dès ${n} DA`,
    },
    en: {
      livraison: 'Delivery to 69 wilayas',
      cod: 'Cash on delivery',
      mainAMain: 'Hand to hand',
      stopDesk: 'Stop desk',
      retrait: 'Pickup in store',
      gratuite: (n: string) => `Free delivery from ${n} DA`,
    },
    ar: {
      livraison: 'التوصيل لـ 69 ولاية',
      cod: 'الدفع عند الاستلام',
      mainAMain: 'يد بيد',
      stopDesk: 'ستوب ديسك',
      retrait: 'الاستلام من المحل',
      gratuite: (n: string) => `توصيل مجاني ابتداء من ${n} دج`,
    },
  }[locale];

  const badges: string[] = [];
  if (modes.livraison58) badges.push(L.livraison);
  if (modes.codLivraison) badges.push(L.cod);
  if (modes.mainAMain) badges.push(L.mainAMain);
  if (modes.stopDesk) badges.push(L.stopDesk);
  if (modes.retraitBoutique) badges.push(L.retrait);
  if (typeof modes.livraisonGratuiteDes === 'number' && modes.livraisonGratuiteDes > 0) {
    badges.push(L.gratuite(formatAmount(modes.livraisonGratuiteDes)));
  }
  return badges;
}
