// lib/pro/carnet.ts
// =============================================================================
// CARNET DU PRO : lecture défensive des documents (module PUR, aucun import
// Firebase). PORT de `src/v2/domain/proCarnet.ts` (application Trokacha) : à
// garder aligné avec lui tant que ces lecteurs ne vivent pas dans pro-core.
// Un document partiel ou d'une version ancienne rend une valeur neutre,
// jamais une exception.
// =============================================================================

import type {
  ClientFiche,
  EtatDesLieux,
  Expedition,
  Garantie,
  LigneMontant,
  Operation,
  OperationType,
  Origine,
  Paiement,
  RepereClient,
  StatutOperation,
} from '@/lib/pro-core';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Chaîne non vide, sinon `null`. */
export function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** Nombre fini (accepte une chaîne numérique), sinon `null`. */
export function readNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Statuts encore « ouverts » : ce que l'écran Aujourd'hui, les Commandes et le Planning suivent. */
export const STATUTS_OUVERTS: readonly StatutOperation[] = ['reservee', 'en_cours', 'rendue', 'mise_de_cote', 'a_expedier', 'expediee', 'refusee'];

const ORIGINES: ReadonlySet<string> = new Set(['trokacha', 'telephone', 'comptoir', 'whatsapp', 'messenger', 'instagram', 'tiktok', 'ouedkniss', 'site', 'autre']);
const STATUTS: ReadonlySet<string> = new Set([
  'reservee',
  'en_cours',
  'rendue',
  'cloturee',
  'annulee',
  'non_presentee',
  'mise_de_cote',
  'a_expedier',
  'expediee',
  'livree',
  'refusee',
  'retournee',
  'vendue',
]);

function int(value: unknown, fallback = 0): number {
  const n = readNumber(value);
  return n === null ? fallback : Math.round(n);
}

/** Instant en millisecondes : nombre, `Timestamp` Firestore (`toMillis`) ou `{ seconds }`. */
export function readMillis(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isRecord(value)) {
    if (typeof value.toMillis === 'function') {
      try {
        const ms = (value.toMillis as () => number)();
        return Number.isFinite(ms) ? ms : null;
      } catch {
        return null;
      }
    }
    const seconds = readNumber(value.seconds);
    if (seconds !== null) return seconds * 1000;
  }
  return null;
}

function readLignes(value: unknown): LigneMontant[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): LigneMontant[] => {
    if (!isRecord(raw)) return [];
    const libelle = readString(raw.libelle) ?? '';
    return [{ libelle, quantite: int(raw.quantite, 1), prix: int(raw.prix) }];
  });
}

function readPaiements(value: unknown): Paiement[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): Paiement[] => {
    if (!isRecord(raw)) return [];
    const id = readString(raw.id);
    if (!id) return [];
    return [{ id, moyen: (readString(raw.moyen) ?? 'especes') as Paiement['moyen'], montant: int(raw.montant), at: readMillis(raw.at) ?? 0, par: readString(raw.par) ?? '', ref: readString(raw.ref) }];
  });
}

function readGaranties(value: unknown): Garantie[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): Garantie[] => {
    if (!isRecord(raw)) return [];
    const id = readString(raw.id);
    if (!id) return [];
    return [
      {
        id,
        forme: (readString(raw.forme) ?? 'especes') as Garantie['forme'],
        montant: raw.montant == null ? null : int(raw.montant),
        details: isRecord(raw.details) ? (raw.details as Garantie['details']) : null,
        etat: (readString(raw.etat) ?? 'recue') as Garantie['etat'],
        retenue: raw.retenue == null ? null : int(raw.retenue),
        motif: readString(raw.motif),
        preuves: Array.isArray(raw.preuves) ? raw.preuves.filter((p): p is string => typeof p === 'string') : [],
        at: readMillis(raw.at) ?? 0,
        par: readString(raw.par) ?? '',
        regleeLe: readMillis(raw.regleeLe),
      },
    ];
  });
}

function readEtat(value: unknown): EtatDesLieux | null {
  if (!isRecord(value)) return null;
  const carburant = readNumber(value.carburant);
  return {
    at: readMillis(value.at) ?? 0,
    km: readNumber(value.km),
    carburant: carburant === null ? null : (Math.max(0, Math.min(8, Math.round(carburant))) as EtatDesLieux['carburant']),
    photos: Array.isArray(value.photos) ? value.photos.filter((p): p is string => typeof p === 'string') : [],
    notes: readString(value.notes),
    par: readString(value.par) ?? '',
  };
}

function readExpedition(value: unknown): Expedition | null {
  if (!isRecord(value)) return null;
  return {
    transporteur: readString(value.transporteur) ?? '',
    mode: value.mode === 'bureau' ? 'bureau' : 'domicile',
    wilaya: readString(value.wilaya) ?? '',
    commune: readString(value.commune),
    frais: value.frais == null ? null : int(value.frais),
    suivi: readString(value.suivi),
    etat: (readString(value.etat) ?? 'a_confirmer') as Expedition['etat'],
    remiseId: readString(value.remiseId),
  };
}

/** Une opération du carnet, lue sans jamais lever. `null` si le document n'en est pas une. */
export function readOperation(id: string, data: unknown): Operation | null {
  if (!isRecord(data)) return null;
  const type = data.type === 'location' || data.type === 'vente' ? (data.type as OperationType) : null;
  const statut = typeof data.statut === 'string' && STATUTS.has(data.statut) ? (data.statut as StatutOperation) : null;
  const itemId = readString(data.itemId);
  if (!type || !statut || !itemId) return null;
  const origine = typeof data.origine === 'string' && ORIGINES.has(data.origine) ? (data.origine as Origine) : 'autre';
  const garanties = readGaranties(data.garanties);
  return {
    id,
    type,
    origine,
    statut,
    itemId,
    itemTitre: readString(data.itemTitre) ?? '',
    variante: readString(data.variante),
    quantite: int(data.quantite, 1),
    debut: readString(data.debut),
    fin: readString(data.fin),
    heureDebut: readString(data.heureDebut),
    heureFin: readString(data.heureFin),
    remise: isRecord(data.remise) ? { lieu: (readString(data.remise.lieu) ?? 'agence') as 'agence', adresse: readString(data.remise.adresse) } : null,
    conducteurs: Array.isArray(data.conducteurs) ? data.conducteurs.filter((c): c is string => typeof c === 'string') : [],
    depart: readEtat(data.depart),
    retour: readEtat(data.retour),
    tamponJours: int(data.tamponJours),
    enRetard: data.enRetard === true,
    clientId: readString(data.clientId),
    clientNom: readString(data.clientNom),
    clientTel: readString(data.clientTel),
    lignes: readLignes(data.lignes),
    total: int(data.total),
    paiements: readPaiements(data.paiements),
    solde: int(data.solde),
    garanties,
    garantieOuverte: data.garantieOuverte === true || garanties.some((g) => g.etat === 'recue'),
    expedition: readExpedition(data.expedition),
    proposalId: readString(data.proposalId),
    matchId: readString(data.matchId),
    adId: readString(data.adId),
    notes: readString(data.notes),
    creePar: readString(data.creePar) ?? '',
    creeLe: readMillis(data.creeLe) ?? 0,
    modifieLe: readMillis(data.modifieLe) ?? 0,
    version: int(data.version, 1),
  };
}

const REPERES: ReadonlySet<string> = new Set(['bon', 'normal', 'ne_plus_servir']);

/** Une fiche client du pro. */
export function readClient(id: string, data: unknown): ClientFiche | null {
  if (!isRecord(data)) return null;
  const stats = isRecord(data.stats) ? data.stats : {};
  return {
    id,
    nom: readString(data.nom) ?? '',
    tel: readString(data.tel),
    uid: readString(data.uid),
    pieces: Array.isArray(data.pieces) ? (data.pieces.filter(isRecord) as unknown as ClientFiche['pieces']) : [],
    notes: readString(data.notes),
    repere: typeof data.repere === 'string' && REPERES.has(data.repere) ? (data.repere as RepereClient) : 'normal',
    stats: { operations: int(stats.operations), incidents: int(stats.incidents), refus: int(stats.refus), chiffre: int(stats.chiffre) },
    solde: int(data.solde),
    derniereOperation: readMillis(data.derniereOperation),
    creeLe: readMillis(data.creeLe) ?? 0,
    modifieLe: readMillis(data.modifieLe) ?? 0,
  };
}

/** Agrégat d'un jour (`jours/{YYYY-MM-DD}`) : ce qui est entré en caisse, par moyen. */
export interface ProJour {
  jour: string;
  /** Net entré en caisse ce jour (remboursements déduits). */
  encaisse: number;
  encaissements: Record<string, number>;
  /** Opérations créées ce jour, et leur chiffre (total des opérations). */
  operations: number;
  chiffre: number;
}

export function readJour(jour: string, data: unknown): ProJour {
  const d = isRecord(data) ? data : {};
  const encaissements: Record<string, number> = {};
  if (isRecord(d.encaissements)) for (const [moyen, montant] of Object.entries(d.encaissements)) encaissements[moyen] = int(montant);
  return { jour, encaisse: int(d.encaisse), encaissements, operations: int(d.operations), chiffre: int(d.chiffre) };
}
