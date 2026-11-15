// COPIE GÉNÉRÉE depuis functions/src/pro/core/input.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/input.ts
 *
 * Validation des saisies envoyées aux callables du carnet. Le serveur la rejoue
 * toujours ; l'application et le site l'utilisent pour signaler l'erreur avant
 * l'envoi. Copié dans l'application et le site : voir `types.ts`.
 *
 * Codes d'erreur : chaînes en MAJUSCULES, traduites par les écrans.
 */

import { isValidDay, isValidHeure } from './dates';
import { isMontant } from './money';
import { telInternational, isClientId } from './phone';
import { isCleVariante } from './variants';
import {
  MOYENS_PAIEMENT,
  ORIGINES_SAISIES,
  type FormeGarantie,
  type LieuRemise,
  type LigneMontant,
  type ModeExpedition,
  type MoyenPaiement,
  type OperationType,
  type Origine,
  type StatutVente,
} from './types';

export const OP_ID_RE = /^op_[A-Za-z0-9]{12,40}$/;
export const ITEM_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
export const LIGNES_MAX = 30;
export const GARANTIES_MAX = 5;
export const DUREE_LOCATION_MAX = 366;
export const TEXTE_COURT_MAX = 120;
export const NOTES_MAX = 1000;

export type Resultat<T> = { ok: true; value: T } | { ok: false; reason: string };

const FORMES_GARANTIE: readonly FormeGarantie[] = ['especes', 'cheque', 'document', 'virement', 'carte'];
const LIEUX: readonly LieuRemise[] = ['agence', 'aeroport', 'domicile'];
const MODES_EXPEDITION: readonly ModeExpedition[] = ['domicile', 'bureau'];
const STATUTS_VENTE_INITIAUX: readonly StatutVente[] = ['vendue', 'mise_de_cote', 'a_expedier'];

export interface GarantieSaisie {
  forme: FormeGarantie;
  montant: number | null;
  details?: { banque?: string | null; numero?: string | null; document?: string | null } | null;
}

export interface PaiementSaisi {
  moyen: MoyenPaiement;
  montant: number;
  ref?: string | null;
}

export interface ClientSaisi {
  id?: string | null;
  nom?: string | null;
  tel?: string | null;
}

export interface ExpeditionSaisie {
  transporteur: string;
  mode: ModeExpedition;
  wilaya: string;
  commune?: string | null;
  frais?: number | null;
}

/** Ce que l'écran envoie à `proSaveOperation` pour CRÉER une opération. */
export interface SaisieOperation {
  bid: string;
  opId: string;
  type: OperationType;
  origine: Exclude<Origine, 'trokacha'>;
  itemId: string;
  variante: string | null;
  quantite: number;
  debut: string | null;
  fin: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  remise: { lieu: LieuRemise; adresse: string | null } | null;
  client: ClientSaisi | null;
  /** Absent = le serveur calcule le prix (paliers de la location, prix de l'article). */
  lignes: LigneMontant[] | null;
  paiement: PaiementSaisi | null;
  garanties: GarantieSaisie[];
  expedition: ExpeditionSaisie | null;
  /** Vente : `vendue` (comptoir), `mise_de_cote` (acompte), `a_expedier` (à distance). */
  statutVente: StatutVente | null;
  notes: string | null;
}

function texte(v: unknown, max: number): string | null {
  if (v == null) return null;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function lireLignes(v: unknown): Resultat<LigneMontant[] | null> {
  if (v == null) return { ok: true, value: null };
  if (!Array.isArray(v) || v.length === 0 || v.length > LIGNES_MAX) return { ok: false, reason: 'LIGNES_INVALIDES' };
  const out: LigneMontant[] = [];
  for (const l of v) {
    if (!isObj(l)) return { ok: false, reason: 'LIGNES_INVALIDES' };
    const libelle = texte(l.libelle, TEXTE_COURT_MAX);
    const quantite = l.quantite;
    if (!libelle || typeof quantite !== 'number' || !Number.isInteger(quantite) || quantite < 1 || quantite > 10_000) {
      return { ok: false, reason: 'LIGNES_INVALIDES' };
    }
    if (!isMontant(l.prix, { negatifPermis: true })) return { ok: false, reason: 'MONTANT_INVALIDE' };
    out.push({ libelle, quantite, prix: l.prix as number });
  }
  return { ok: true, value: out };
}

export function lirePaiement(v: unknown): Resultat<PaiementSaisi | null> {
  if (v == null) return { ok: true, value: null };
  if (!isObj(v) || !(MOYENS_PAIEMENT as readonly unknown[]).includes(v.moyen)) return { ok: false, reason: 'PAIEMENT_INVALIDE' };
  if (!isMontant(v.montant, { negatifPermis: true }) || v.montant === 0) return { ok: false, reason: 'MONTANT_INVALIDE' };
  return { ok: true, value: { moyen: v.moyen as MoyenPaiement, montant: v.montant as number, ref: texte(v.ref, 60) } };
}

export function lireGaranties(v: unknown): Resultat<GarantieSaisie[]> {
  if (v == null) return { ok: true, value: [] };
  if (!Array.isArray(v) || v.length > GARANTIES_MAX) return { ok: false, reason: 'GARANTIES_INVALIDES' };
  const out: GarantieSaisie[] = [];
  for (const g of v) {
    if (!isObj(g) || !(FORMES_GARANTIE as readonly unknown[]).includes(g.forme)) return { ok: false, reason: 'GARANTIES_INVALIDES' };
    const forme = g.forme as FormeGarantie;
    const montant = g.montant == null ? null : g.montant;
    if (forme === 'document') {
      if (montant !== null) return { ok: false, reason: 'GARANTIES_INVALIDES' };
    } else if (!isMontant(montant) || (montant as number) <= 0) {
      return { ok: false, reason: 'MONTANT_INVALIDE' };
    }
    const d = isObj(g.details) ? g.details : {};
    out.push({
      forme,
      montant: montant as number | null,
      details: { banque: texte(d.banque, 60), numero: texte(d.numero, 60), document: texte(d.document, 60) },
    });
  }
  return { ok: true, value: out };
}

export function lireClient(v: unknown): Resultat<ClientSaisi | null> {
  if (v == null) return { ok: true, value: null };
  if (!isObj(v)) return { ok: false, reason: 'CLIENT_INVALIDE' };
  const id = v.id == null ? null : v.id;
  if (id !== null && !isClientId(id)) return { ok: false, reason: 'CLIENT_INVALIDE' };
  const nom = texte(v.nom, TEXTE_COURT_MAX);
  let tel: string | null = null;
  if (v.tel != null && v.tel !== '') {
    tel = telInternational(v.tel);
    if (!tel) return { ok: false, reason: 'TEL_INVALIDE' };
  }
  if (!id && !nom && !tel) return { ok: true, value: null };
  return { ok: true, value: { id: id as string | null, nom, tel } };
}

/** Lit et valide la saisie d'une nouvelle opération. */
export function lireSaisieOperation(raw: unknown): Resultat<SaisieOperation> {
  if (!isObj(raw)) return { ok: false, reason: 'SAISIE_INVALIDE' };
  const { bid, opId, type, origine, itemId } = raw;
  if (typeof bid !== 'string' || !ITEM_ID_RE.test(bid)) return { ok: false, reason: 'ESPACE_INVALIDE' };
  if (typeof opId !== 'string' || !OP_ID_RE.test(opId)) return { ok: false, reason: 'OP_ID_INVALIDE' };
  if (type !== 'location' && type !== 'vente') return { ok: false, reason: 'TYPE_INVALIDE' };
  if (!(ORIGINES_SAISIES as readonly unknown[]).includes(origine)) return { ok: false, reason: 'ORIGINE_INVALIDE' };
  if (typeof itemId !== 'string' || !ITEM_ID_RE.test(itemId)) return { ok: false, reason: 'BIEN_INVALIDE' };

  const quantite = raw.quantite == null ? 1 : raw.quantite;
  if (typeof quantite !== 'number' || !Number.isInteger(quantite) || quantite < 1 || quantite > 10_000) {
    return { ok: false, reason: 'QUANTITE_INVALIDE' };
  }

  let debut: string | null = null;
  let fin: string | null = null;
  let heureDebut: string | null = null;
  let heureFin: string | null = null;
  let remise: SaisieOperation['remise'] = null;
  let variante: string | null = null;
  let statutVente: StatutVente | null = null;
  let expedition: ExpeditionSaisie | null = null;

  if (type === 'location') {
    if (!isValidDay(raw.debut) || !isValidDay(raw.fin) || !(raw.debut < raw.fin)) return { ok: false, reason: 'DATES_INVALIDES' };
    debut = raw.debut;
    fin = raw.fin;
    const jours = Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86_400_000);
    if (jours > DUREE_LOCATION_MAX) return { ok: false, reason: 'DUREE_TROP_LONGUE' };
    if (raw.heureDebut != null && !isValidHeure(raw.heureDebut)) return { ok: false, reason: 'HEURE_INVALIDE' };
    if (raw.heureFin != null && !isValidHeure(raw.heureFin)) return { ok: false, reason: 'HEURE_INVALIDE' };
    heureDebut = (raw.heureDebut as string | undefined) ?? null;
    heureFin = (raw.heureFin as string | undefined) ?? null;
    if (raw.remise != null) {
      if (!isObj(raw.remise) || !(LIEUX as readonly unknown[]).includes(raw.remise.lieu)) return { ok: false, reason: 'REMISE_INVALIDE' };
      remise = { lieu: raw.remise.lieu as LieuRemise, adresse: texte(raw.remise.adresse, 200) };
    }
    if (quantite !== 1) return { ok: false, reason: 'QUANTITE_INVALIDE' };
  } else {
    if (raw.variante != null) {
      if (!isCleVariante(raw.variante)) return { ok: false, reason: 'VARIANTE_INVALIDE' };
      variante = raw.variante;
    }
    const s = raw.statutVente == null ? 'vendue' : raw.statutVente;
    if (!(STATUTS_VENTE_INITIAUX as readonly unknown[]).includes(s)) return { ok: false, reason: 'STATUT_INVALIDE' };
    statutVente = s as StatutVente;
    if (raw.expedition != null) {
      const e = raw.expedition;
      if (!isObj(e) || !(MODES_EXPEDITION as readonly unknown[]).includes(e.mode)) return { ok: false, reason: 'EXPEDITION_INVALIDE' };
      const transporteur = texte(e.transporteur, 60);
      const wilaya = texte(e.wilaya, 10);
      if (!transporteur || !wilaya) return { ok: false, reason: 'EXPEDITION_INVALIDE' };
      if (e.frais != null && !isMontant(e.frais)) return { ok: false, reason: 'MONTANT_INVALIDE' };
      expedition = { transporteur, mode: e.mode as ModeExpedition, wilaya, commune: texte(e.commune, 80), frais: (e.frais as number | null | undefined) ?? null };
    }
    if (statutVente === 'a_expedier' && !expedition) return { ok: false, reason: 'EXPEDITION_INVALIDE' };
  }

  const lignes = lireLignes(raw.lignes);
  if (!lignes.ok) return lignes;
  const paiement = lirePaiement(raw.paiement);
  if (!paiement.ok) return paiement;
  const garanties = lireGaranties(raw.garanties);
  if (!garanties.ok) return garanties;
  const client = lireClient(raw.client);
  if (!client.ok) return client;

  return {
    ok: true,
    value: {
      bid,
      opId,
      type,
      origine: origine as Exclude<Origine, 'trokacha'>,
      itemId,
      variante,
      quantite,
      debut,
      fin,
      heureDebut,
      heureFin,
      remise,
      client: client.value,
      lignes: lignes.value,
      paiement: paiement.value,
      garanties: garanties.value,
      expedition,
      statutVente,
      notes: texte(raw.notes, NOTES_MAX),
    },
  };
}

/**
 * Empreinte d'une saisie, pour le rejeu sans doublon : le même `opId` avec la même
 * empreinte renvoie l'opération déjà écrite ; avec une autre, `DEJA_ECRIT`.
 */
export function empreinteSaisie(s: SaisieOperation): string {
  const { bid, opId, type, origine, itemId, variante, quantite, debut, fin, heureDebut, heureFin, client, lignes, paiement, garanties, statutVente } = s;
  return JSON.stringify([bid, opId, type, origine, itemId, variante, quantite, debut, fin, heureDebut, heureFin, client, lignes, paiement, garanties, statutVente]);
}
