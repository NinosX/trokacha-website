// lib/pro/agency/units.ts
// =============================================================================
// BIENS LOUÉS DU CATALOGUE (voitures, logements) : lecture défensive (module PUR).
// Le strict nécessaire du `CatalogueArticle` de l'application (`types/boutique.ts`)
// pour le planning et la nouvelle réservation : titre, photo, annonce, bloc
// `rental` (paliers de prix, blocages), tampon de ménage (`bien.tamponJours`) et
// caution annoncée (`details.caution`, même lecture que `unitDeposit`).
// =============================================================================

import { prixParJour, type PalierPrix } from '@/lib/pro-core';
import { isRecord, readNumber, readString } from '../carnet';

export type RentalKind = 'car' | 'immo';

export interface BlockedRange {
  start: string;
  end: string;
  id: string | null;
}

export interface RentalUnit {
  id: string;
  titre: string;
  photo: string | null;
  adId: string | null;
  /** Article publié sur Trokacha (annonce en ligne). */
  published: boolean;
  kind: RentalKind;
  pricingTiers: PalierPrix[];
  blockedRanges: BlockedRange[];
  /** Jours de ménage après chaque retour (0 à 30). */
  tamponJours: number;
  /** Caution annoncée du bien, en DA ; `null` si aucune. */
  caution: number | null;
  /** Plaque d'une voiture, adresse d'un logement (documents). */
  plaque: string | null;
  adresse: string | null;
  creeLe: number;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function readTiers(value: unknown): PalierPrix[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): PalierPrix[] => {
    if (!isRecord(raw)) return [];
    const price = readNumber(raw.pricePerDay);
    if (price === null || price <= 0) return [];
    const upTo = raw.upToDays == null ? null : readNumber(raw.upToDays);
    return [{ upToDays: upTo === null ? null : Math.round(upTo), pricePerDay: Math.round(price) }];
  });
}

function readBlocked(value: unknown): BlockedRange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): BlockedRange[] => {
    if (!isRecord(raw)) return [];
    const start = readString(raw.start);
    const end = readString(raw.end);
    if (!start || !end || !DAY_RE.test(start) || !DAY_RE.test(end) || !(start < end)) return [];
    return [{ start, end, id: readString(raw.id) }];
  });
}

function millis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isRecord(value) && typeof value.toMillis === 'function') {
    try {
      return (value.toMillis as () => number)();
    } catch {
      return 0;
    }
  }
  if (isRecord(value)) {
    const seconds = readNumber(value.seconds);
    if (seconds !== null) return seconds * 1000;
  }
  return 0;
}

/** Un article du catalogue, s'il est un bien loué (bloc `rental`) ; sinon `null`. */
export function readRentalUnit(id: string, data: unknown): RentalUnit | null {
  if (!isRecord(data) || !isRecord(data.rental)) return null;
  const rental = data.rental;
  const photos = Array.isArray(data.photos) ? data.photos.filter((p): p is string => typeof p === 'string' && p.trim() !== '') : [];
  const bien = isRecord(data.bien) ? data.bien : {};
  const details = isRecord(data.details) ? data.details : {};
  const tampon = readNumber(bien.tamponJours);
  const caution = readNumber(details.caution);
  const adId = readString(data.adId);
  return {
    id,
    titre: (readString(data.titre) ?? '').trim(),
    photo: photos[0] ?? null,
    adId,
    published: data.statut === 'publie' && !!adId,
    kind: rental.kind === 'immo' ? 'immo' : 'car',
    pricingTiers: readTiers(rental.pricingTiers),
    blockedRanges: readBlocked(rental.blockedRanges),
    tamponJours: tampon === null ? 0 : Math.max(0, Math.min(30, Math.floor(tampon))),
    caution: caution !== null && caution > 0 ? Math.round(caution) : null,
    plaque: readString(bien.plaque)?.trim() || null,
    adresse: readString(bien.adresse)?.trim() || null,
    creeLe: millis(data.creeLe ?? data.createdAt),
  };
}

/** Les biens loués, le plus ancien d'abord (ordre du catalogue de l'application). */
export function sortUnits(units: readonly RentalUnit[]): RentalUnit[] {
  return [...units].sort((a, b) => a.creeLe - b.creeLe || a.titre.localeCompare(b.titre) || a.id.localeCompare(b.id));
}

/** Prix par jour le plus court (palier d'un jour) : le prix annoncé au téléphone. */
export function oneDayPrice(unit: Pick<RentalUnit, 'pricingTiers'>): number | null {
  return prixParJour(unit.pricingTiers, 1);
}

/** Sorte de biens d'un espace : logement seulement si tous les biens sont des logements. */
export function unitsKind(units: readonly RentalUnit[]): RentalKind {
  return units.length > 0 && units.every((u) => u.kind === 'immo') ? 'immo' : 'car';
}
