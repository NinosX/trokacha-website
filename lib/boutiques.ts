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

import { collection, doc, getDoc, getDocs, limit as fsLimit, query, where } from 'firebase/firestore';
import { db } from './firebase';

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

export interface BoutiqueAd {
  id: string;
  title?: string;
  price?: number | null;
  images?: string[];
  city?: string;
  wilayaName?: string;
  quantiteRestante?: number | null;
  pinned?: boolean;
  hidden?: boolean;
  createdAtMs: number;
}

export type SiteLocale = 'fr' | 'en' | 'ar';

/** Locale de rendu — `kab` et tout inconnu retombent sur `fr`. */
export function toSiteLocale(locale: string | undefined): SiteLocale {
  return locale === 'ar' || locale === 'en' ? locale : 'fr';
}

/* ============================ Lecture Firestore ========================== */

/** Limite imposée par firestore.rules pour un `list` non authentifié. */
export const BOUTIQUES_LIST_LIMIT = 50;
/** Garde-fou d'affichage : une vitrine web V1 ne déroule pas 500 articles. */
export const BOUTIQUE_ADS_LIMIT = 48;

function millisOf(value: unknown): number {
  if (!value) return 0;
  const v = value as { seconds?: number; toMillis?: () => number };
  if (typeof v.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  return 0;
}

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
 * Annonces publiques d'une boutique.
 * Deux filtres d'ÉGALITÉ seulement (pas d'orderBy) : Firestore les sert sans
 * index composite à déployer. Le tri (épinglés d'abord, puis récents) et le
 * retrait des articles masqués (`hidden`) se font ici.
 */
export async function listBoutiqueAds(boutiqueId: string): Promise<BoutiqueAd[]> {
  if (!boutiqueId) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'ads'),
        where('boutiqueId', '==', boutiqueId),
        where('status', '==', 'approved'),
        fsLimit(BOUTIQUE_ADS_LIMIT),
      ),
    );
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          title: typeof data.title === 'string' ? data.title : undefined,
          price: typeof data.price === 'number' ? data.price : null,
          images: Array.isArray(data.images) ? (data.images as string[]) : [],
          city: typeof data.city === 'string' ? data.city : undefined,
          wilayaName: typeof data.wilayaName === 'string' ? data.wilayaName : undefined,
          quantiteRestante:
            typeof data.quantiteRestante === 'number' ? data.quantiteRestante : null,
          pinned: data.pinned === true,
          hidden: data.hidden === true,
          createdAtMs: millisOf(data.createdAt),
        } as BoutiqueAd;
      })
      .filter((ad) => !ad.hidden)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAtMs - a.createdAtMs;
      });
  } catch (error) {
    console.error('[boutiques] listBoutiqueAds failed:', error);
    return [];
  }
}

/* ============================== Horaires ================================= */
// Portage minimal de `utils/boutiqueHours.ts` (app mobile) : le stockage est en
// minutes depuis minuit, l'affichage en « 09:00–12:30 · 14:00–19:00 ».

/** Marque LTR : empêche l'algorithme bidi de retourner « 09:00–12:30 » en arabe. */
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
    .map((p) => `${LRM}${formatMinutes(p.debut)}–${formatMinutes(p.fin)}`)
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

export const SECTEUR_LABELS: Record<SiteLocale, Record<string, string>> = {
  fr: {
    textile: 'Textile',
    informatique: 'Informatique',
    jouets: 'Jouets',
    bazar: 'Bazar',
    mobilier: 'Mobilier',
    droguerie: 'Droguerie',
    autre: 'Autre',
  },
  en: {
    textile: 'Clothing',
    informatique: 'Electronics',
    jouets: 'Toys',
    bazar: 'General store',
    mobilier: 'Furniture',
    droguerie: 'Household',
    autre: 'Other',
  },
  ar: {
    textile: 'ملابس',
    informatique: 'إعلام آلي',
    jouets: 'ألعاب',
    bazar: 'بازار',
    mobilier: 'أثاث',
    droguerie: 'دروڨري',
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

/** Montant en DA, séparateur de milliers insécable (« 12 500 »). */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}
