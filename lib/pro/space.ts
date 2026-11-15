// lib/pro/space.ts
// =============================================================================
// QUEL ESPACE PRO, ET DE QUELLE SORTE (module PUR). PORT de
// `src/v2/domain/proSpace.ts` (application Trokacha) : mêmes règles.
// =============================================================================
//
// Agence : la boutique ne déclare QUE des secteurs de location ; sinon (vente,
// ou les deux) : boutique. L'espace existe dès l'ouverture de la boutique (en
// attente des papiers comprise) ; une boutique suspendue n'en donne pas.
// =============================================================================

import { isRecord, readString } from './carnet';

export type ProSpaceKind = 'agence' | 'boutique';
export type ProBoutiqueStatut = 'pending' | 'active' | 'suspended';

/** Le strict nécessaire d'une boutique du compte, pour le bureau. */
export interface ProSpace {
  id: string;
  nom: string;
  statut: ProBoutiqueStatut;
  secteurs: string[];
  kind: ProSpaceKind;
  hasRentals: boolean;
  /** Code de la wilaya de l'espace (« 16 »), pour l'en-tête des documents. */
  wilayaCode: string | null;
  /** Téléphone public de l'espace (canal téléphone, sinon WhatsApp). */
  tel: string | null;
}

/** Volets du bureau (adresse `/pro/[bid]/<volet>`). */
export type ProPaneId = 'aujourdhui' | 'planning' | 'demandes' | 'catalogue' | 'commandes' | 'clients' | 'caisse' | 'reglages';

const RENTAL: ReadonlySet<string> = new Set(['locations', 'location_voiture', 'location_immobilier']);

export function proSpaceKindOf(secteurs: readonly string[] | null | undefined): ProSpaceKind {
  const list = secteurs ?? [];
  return list.length > 0 && list.every((s) => RENTAL.has(s)) ? 'agence' : 'boutique';
}

export function proSpaceHasRentals(secteurs: readonly string[] | null | undefined): boolean {
  return (secteurs ?? []).some((s) => RENTAL.has(s));
}

/** Une boutique lue sans jamais lever ; `null` si le document n'en est pas une. */
export function readProSpace(id: string, data: unknown): ProSpace | null {
  if (!isRecord(data)) return null;
  const statut = data.statut === 'active' || data.statut === 'pending' || data.statut === 'suspended' ? data.statut : null;
  if (!statut) return null;
  const secteurs = Array.isArray(data.secteurs) ? data.secteurs.filter((s): s is string => typeof s === 'string') : [];
  const localisation = isRecord(data.localisation) ? data.localisation : {};
  const canaux = isRecord(data.canaux) ? data.canaux : {};
  return {
    id,
    nom: readString(data.nom) ?? '',
    statut,
    secteurs,
    kind: proSpaceKindOf(secteurs),
    hasRentals: proSpaceHasRentals(secteurs),
    wilayaCode: readString(localisation.wilayaCode)?.trim() || null,
    tel: readString(canaux.phone)?.trim() || readString(canaux.whatsapp)?.trim() || null,
  };
}

/** Les espaces utilisables (suspendues exclues), triés par nom. */
export function usableProSpaces(spaces: readonly ProSpace[]): ProSpace[] {
  return spaces.filter((s) => s.statut !== 'suspended').sort((a, b) => a.nom.localeCompare(b.nom) || a.id.localeCompare(b.id));
}

/** Volets du bureau, dans l'ordre de la barre latérale. */
export function proPanesOf(space: Pick<ProSpace, 'kind' | 'hasRentals'>): ProPaneId[] {
  if (space.kind === 'agence') return ['aujourdhui', 'planning', 'demandes', 'clients', 'caisse', 'reglages'];
  // Boutique mixte (vente et location) : le planning sert aussi.
  return space.hasRentals
    ? ['aujourdhui', 'catalogue', 'planning', 'commandes', 'clients', 'caisse', 'reglages']
    : ['aujourdhui', 'catalogue', 'commandes', 'clients', 'caisse', 'reglages'];
}

export const PRO_PANE_IDS: readonly ProPaneId[] = ['aujourdhui', 'planning', 'demandes', 'catalogue', 'commandes', 'clients', 'caisse', 'reglages'];

export function isProPaneId(value: string | null | undefined): value is ProPaneId {
  return value != null && (PRO_PANE_IDS as readonly string[]).includes(value);
}
