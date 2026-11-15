// lib/boutiquePublic.ts
// =============================================================================
// PAGES PUBLIQUES DES AGENCES ET BOUTIQUES : décisions PURES (aucun Firebase).
// Testé par `node scripts/test-public-boutiques.cjs`.
//
// • Sorte d'espace : miroir de `proSpaceKindOf` (app, src/v2/domain/proSpace.ts).
//   Une agence ne déclare QUE des secteurs de location ; sinon c'est une boutique.
// • Disponibilité d'une location, lue sur les données PUBLIQUES de l'annonce
//   (`rental.bookedRanges` et `rental.blockedRanges`). Conventions verrouillées de
//   l'app (utils/rental.ts) : plage `[start, end)` à fin EXCLUSIVE, dates
//   'YYYY-MM-DD' comparées comme des chaînes, aucun fuseau. Les jours de tampon
//   (ménage, préparation) sont déjà DANS la fin des plages posées par le carnet
//   du pro : rien à ajouter ici.
// • Lecture d'un document `ads` en carte publique (`toBoutiqueAd`), partagée
//   par le rendu serveur et l'écoute en direct du navigateur.
// =============================================================================

export type SiteLocale = 'fr' | 'en' | 'ar';
export type EspaceKind = 'agence' | 'boutique';
export type RentalKind = 'car' | 'immo';

export interface DateRange {
  start: string;
  end: string;
}

export interface PricingTier {
  upToDays: number | null;
  pricePerDay: number;
}

export interface BoutiqueAdRental {
  kind: RentalKind;
  pricingTiers: PricingTier[];
  /** Réservations et blocages, fusionnés : seules les plages valides sont gardées. */
  busy: DateRange[];
}

export interface BoutiqueAd {
  id: string;
  title?: string;
  price?: number | null;
  images?: string[];
  city?: string;
  wilayaName?: string;
  quantiteRestante?: number | null;
  /** Tailles encore en stock (`details.taillesDispo`, écrit par le serveur seul). */
  taillesDispo: string[];
  /** Présent seulement pour une annonce de location. */
  rental: BoutiqueAdRental | null;
  pinned?: boolean;
  hidden?: boolean;
  createdAtMs: number;
}

/* ================================ Sorte ===================================== */

const RENTAL_SECTEURS: ReadonlySet<string> = new Set(['locations', 'location_voiture', 'location_immobilier']);

export function espaceKindOf(secteurs: readonly string[] | null | undefined): EspaceKind {
  const list = Array.isArray(secteurs) ? secteurs : [];
  return list.length > 0 && list.every((s) => RENTAL_SECTEURS.has(s)) ? 'agence' : 'boutique';
}

/* ================================ Dates ===================================== */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateStr(value: unknown): value is string {
  return typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** « Aujourd'hui » au sens du marché (Africa/Algiers), comme l'app. */
export function todayInAlgiers(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Union triée des plages (celles qui se touchent fusionnent : [a,b)+[b,c) = [a,c)). */
export function mergeRanges(ranges: readonly DateRange[]): DateRange[] {
  const sorted = ranges
    .filter((r) => r && isDateStr(r.start) && isDateStr(r.end) && r.start < r.end)
    .map((r) => ({ start: r.start, end: r.end }))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const out: DateRange[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      out.push(r);
    }
  }
  return out;
}

/**
 * Premier jour libre à partir d'aujourd'hui : `null` = libre aujourd'hui.
 * Les plages passées (fin <= aujourd'hui) ne comptent pas.
 */
export function rentalFreeFrom(busy: readonly DateRange[], today: string): string | null {
  for (const r of mergeRanges(busy)) {
    if (r.end <= today) continue;
    if (r.start <= today) return r.end;
    // Plages triées : la suivante commence après aujourd'hui, donc aujourd'hui est libre.
    return null;
  }
  return null;
}

/** '2026-11-18' → '18/11' ; une autre année que celle d'aujourd'hui → '18/11/2027'. */
export function shortDate(date: string, today: string): string {
  const [y, m, d] = date.split('-');
  return y === today.slice(0, 4) ? `${d}/${m}` : `${d}/${m}/${y}`;
}

/* =============================== Libellés =================================== */

/** Marque gauche-à-droite : garde « 18/11 » et « 4 500 DA » dans le bon ordre en arabe. */
const LRI = '⁦';
const PDI = '⁩';
const ltr = (s: string) => `${LRI}${s}${PDI}`;

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

export interface AvailabilityLabel {
  free: boolean;
  text: string;
}

const AVAILABILITY: Record<SiteLocale, Record<RentalKind, { today: string; from: (d: string) => string }>> = {
  fr: {
    car: { today: 'Libre aujourd’hui', from: (d) => `Libre à partir du ${d}` },
    immo: { today: 'Libre aujourd’hui', from: (d) => `Libre à partir du ${d}` },
  },
  en: {
    car: { today: 'Available today', from: (d) => `Available from ${d}` },
    immo: { today: 'Available today', from: (d) => `Available from ${d}` },
  },
  ar: {
    car: { today: 'متاحة اليوم', from: (d) => `متاحة ابتداءً من ${d}` },
    immo: { today: 'متاح اليوم', from: (d) => `متاح ابتداءً من ${d}` },
  },
};

export function availabilityLabel(rental: BoutiqueAdRental, today: string, locale: SiteLocale): AvailabilityLabel {
  const words = AVAILABILITY[locale][rental.kind];
  const from = rentalFreeFrom(rental.busy, today);
  if (!from) return { free: true, text: words.today };
  return { free: false, text: words.from(ltr(shortDate(from, today))) };
}

const PRICE: Record<SiteLocale, Record<RentalKind, { fixed: (p: string) => string; from: (p: string) => string }>> = {
  fr: {
    car: { fixed: (p) => `${p} DA par jour`, from: (p) => `à partir de ${p} DA par jour` },
    immo: { fixed: (p) => `${p} DA par nuit`, from: (p) => `à partir de ${p} DA par nuit` },
  },
  en: {
    car: { fixed: (p) => `${p} DA per day`, from: (p) => `from ${p} DA per day` },
    immo: { fixed: (p) => `${p} DA per night`, from: (p) => `from ${p} DA per night` },
  },
  ar: {
    car: { fixed: (p) => `${p} دج لليوم`, from: (p) => `ابتداءً من ${p} دج لليوم` },
    immo: { fixed: (p) => `${p} دج لليلة`, from: (p) => `ابتداءً من ${p} دج لليلة` },
  },
};

/** Prix d'une location : « 4 500 DA par jour », ou « à partir de … » si le prix baisse avec la durée. */
export function rentalPriceLabel(rental: BoutiqueAdRental, price: number | null | undefined, locale: SiteLocale): string | null {
  const prices = rental.pricingTiers.map((t) => t.pricePerDay).filter((p) => typeof p === 'number' && p > 0);
  const words = PRICE[locale][rental.kind];
  if (prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min < max ? words.from(ltr(formatAmount(min))) : words.fixed(ltr(formatAmount(min)));
  }
  return typeof price === 'number' && price > 0 ? words.fixed(ltr(formatAmount(price))) : null;
}

const SIZES: Record<SiteLocale, string> = { fr: 'Tailles : ', en: 'Sizes: ', ar: 'المقاسات: ' };

/** « Tailles : S · M · L » ; vide si l'article n'a pas de tailles. */
export function sizesLabel(tailles: readonly string[], locale: SiteLocale): string {
  if (tailles.length === 0) return '';
  return `${SIZES[locale]}${tailles.map(ltr).join(' · ')}`;
}

/* ============================ Lecture d'une annonce ========================= */

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
  if (typeof value === 'number') return value;
  return 0;
}

function rangesOf(raw: unknown): DateRange[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is { start: unknown; end: unknown } => !!r && typeof r === 'object')
    .map((r) => ({ start: r.start, end: r.end }))
    .filter((r): r is DateRange => isDateStr(r.start) && isDateStr(r.end) && r.start < r.end);
}

function rentalOf(data: Record<string, unknown>): BoutiqueAdRental | null {
  const raw = data.rental;
  if (data.category !== 'Locations' || !raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind: RentalKind = r.kind === 'immo' ? 'immo' : 'car';
  const pricingTiers = Array.isArray(r.pricingTiers)
    ? (r.pricingTiers as unknown[])
        .filter((t): t is PricingTier => !!t && typeof t === 'object' && typeof (t as PricingTier).pricePerDay === 'number')
        .map((t) => ({ upToDays: typeof t.upToDays === 'number' ? t.upToDays : null, pricePerDay: t.pricePerDay }))
    : [];
  // Seules les dates partent dans le navigateur : ni `matchId`, ni `opId`, ni `id` de note.
  const busy = mergeRanges([...rangesOf(r.bookedRanges), ...rangesOf(r.blockedRanges)]);
  return { kind, pricingTiers, busy };
}

/** Un document `ads` en carte publique. Données distantes : tout est vérifié. */
export function toBoutiqueAd(id: string, data: Record<string, unknown>): BoutiqueAd {
  const details = data.details && typeof data.details === 'object' ? (data.details as Record<string, unknown>) : {};
  const tailles = Array.isArray(details.taillesDispo)
    ? (details.taillesDispo as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : [];
  return {
    id,
    title: typeof data.title === 'string' ? data.title : undefined,
    price: typeof data.price === 'number' ? data.price : null,
    images: Array.isArray(data.images) ? (data.images as unknown[]).filter((u): u is string => typeof u === 'string') : [],
    city: typeof data.city === 'string' ? data.city : undefined,
    wilayaName: typeof data.wilayaName === 'string' ? data.wilayaName : undefined,
    quantiteRestante: typeof data.quantiteRestante === 'number' ? data.quantiteRestante : null,
    taillesDispo: tailles,
    rental: rentalOf(data),
    pinned: data.pinned === true,
    hidden: data.hidden === true,
    createdAtMs: millisOf(data.createdAt),
  };
}

/** Vitrine : jamais un article masqué ; épinglés d'abord, puis les plus récents. */
export function visibleSorted(ads: readonly BoutiqueAd[]): BoutiqueAd[] {
  return ads
    .filter((ad) => !ad.hidden)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAtMs - a.createdAtMs;
    });
}
