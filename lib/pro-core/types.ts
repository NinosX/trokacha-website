// COPIE GÉNÉRÉE depuis functions/src/pro/core/types.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/types.ts
 *
 * CARNET DU PRO : le modèle de données partagé par le serveur, l'application et le site.
 *
 * ⚠️ SOURCE UNIQUE. Ce dossier (`functions/src/pro/core/`) est copié tel quel dans
 * l'application (`src/pro-core/`) et sur le site (`lib/pro-core/`) par
 * `scripts/sync-pro-core.mjs`. Ne jamais modifier une copie : modifier ici, puis relancer
 * le script. Aucune dépendance (ni Firebase, ni React) : du TypeScript pur.
 *
 * Plan : admin/REFONTE_2026-10/PROS_2026-11/SOCLE_PROS_PLAN.md (§ 3).
 *
 * Conventions (celles de `utils/rental.ts`, verrouillées) :
 *  - jour = 'YYYY-MM-DD', plage [debut, fin) fin EXCLUSIVE, comparaison lexicographique ;
 *  - heure = 'HH:MM', heure d'Alger ;
 *  - instant = millisecondes depuis l'époque (`number`) dans ce module pur ; le serveur
 *    écrit des Timestamp Firestore et les convertit à la lecture ;
 *  - montant = dinars entiers.
 */

/* ------------------------------- Opérations -------------------------------- */

export type OperationType = 'location' | 'vente';

/** D'où vient l'opération. `trokacha` = recopiée d'un match par le serveur, jamais saisie. */
export type Origine =
  | 'trokacha'
  | 'telephone'
  | 'comptoir'
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'tiktok'
  | 'ouedkniss'
  | 'site'
  | 'autre';

export const ORIGINES_SAISIES: readonly Origine[] = [
  'telephone',
  'comptoir',
  'whatsapp',
  'messenger',
  'instagram',
  'tiktok',
  'ouedkniss',
  'site',
  'autre',
];

export type StatutLocation =
  | 'reservee'
  | 'en_cours'
  | 'rendue'
  | 'cloturee'
  | 'annulee'
  | 'non_presentee';

export type StatutVente =
  | 'mise_de_cote'
  | 'a_expedier'
  | 'expediee'
  | 'livree'
  | 'refusee'
  | 'retournee'
  | 'vendue'
  | 'annulee';

export type StatutOperation = StatutLocation | StatutVente;

export type MoyenPaiement =
  | 'especes'
  | 'cib'
  | 'edahabia'
  | 'ccp'
  | 'baridimob'
  | 'cheque'
  | 'virement'
  | 'transporteur';

export const MOYENS_PAIEMENT: readonly MoyenPaiement[] = [
  'especes',
  'cib',
  'edahabia',
  'ccp',
  'baridimob',
  'cheque',
  'virement',
  'transporteur',
];

export interface Paiement {
  id: string;
  moyen: MoyenPaiement;
  /** Dinars entiers. Négatif = remboursement. */
  montant: number;
  at: number;
  par: string;
  ref?: string | null;
}

export type FormeGarantie = 'especes' | 'cheque' | 'document' | 'virement' | 'carte';
export type EtatGarantie = 'recue' | 'rendue' | 'retenue_partielle' | 'retenue';

export interface Garantie {
  id: string;
  forme: FormeGarantie;
  /** Dinars entiers ; `null` pour un document gardé (passeport). */
  montant: number | null;
  details?: {
    banque?: string | null;
    numero?: string | null;
    /** Type de document gardé : passeport, carte d'identité, permis… */
    document?: string | null;
  } | null;
  etat: EtatGarantie;
  /** Montant retenu (retenue partielle ou totale). */
  retenue?: number | null;
  motif?: string | null;
  /** Chemins Storage des preuves (photos). */
  preuves?: string[];
  at: number;
  par: string;
  /** Instant où la garantie a été rendue ou retenue. */
  regleeLe?: number | null;
}

/** Niveau de carburant en huitièmes (0 = vide, 8 = plein). */
export type NiveauCarburant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface EtatDesLieux {
  at: number;
  km?: number | null;
  carburant?: NiveauCarburant | null;
  photos?: string[];
  notes?: string | null;
  par: string;
}

export type LieuRemise = 'agence' | 'aeroport' | 'domicile';

export interface LigneMontant {
  libelle: string;
  quantite: number;
  /** Prix unitaire en dinars entiers. */
  prix: number;
}

export type ModeExpedition = 'domicile' | 'bureau';
export type EtatExpedition = 'a_confirmer' | 'confirmee' | 'remise_transporteur' | 'livree' | 'refusee' | 'retournee';

export interface Expedition {
  transporteur: string;
  mode: ModeExpedition;
  /** Code wilaya du référentiel (69). */
  wilaya: string;
  commune?: string | null;
  frais?: number | null;
  suivi?: string | null;
  etat: EtatExpedition;
  remiseId?: string | null;
}

export interface Operation {
  id: string;
  type: OperationType;
  origine: Origine;
  statut: StatutOperation;

  itemId: string;
  itemTitre: string;
  /** Clé de variante (mode), `null` = à préciser (commande Trokacha sans taille). */
  variante?: string | null;
  quantite: number;

  // Location
  debut?: string | null;
  fin?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
  remise?: { lieu: LieuRemise; adresse?: string | null } | null;
  conducteurs?: string[];
  depart?: EtatDesLieux | null;
  retour?: EtatDesLieux | null;
  /** Jours de tampon (ménage, préparation) projetés après `fin`. */
  tamponJours?: number;
  /** Location toujours dehors après `fin` (projection prolongée chaque nuit). */
  enRetard?: boolean;

  // Client
  clientId?: string | null;
  clientNom?: string | null;
  clientTel?: string | null;

  // Argent
  lignes: LigneMontant[];
  total: number;
  paiements: Paiement[];
  solde: number;
  garanties: Garantie[];
  garantieOuverte: boolean;

  expedition?: Expedition | null;

  // Lien marketplace (origine `trokacha`)
  proposalId?: string | null;
  matchId?: string | null;
  adId?: string | null;

  notes?: string | null;

  creePar: string;
  creeLe: number;
  modifieLe: number;
  version: number;
}

/* --------------------------------- Clients --------------------------------- */

export type RepereClient = 'bon' | 'normal' | 'ne_plus_servir';

export interface PieceClient {
  type: string;
  numero?: string | null;
  photoPath?: string | null;
  expire?: string | null;
}

export interface ClientFiche {
  id: string;
  nom: string;
  tel?: string | null;
  /** Membre Trokacha (opération venue de la marketplace). */
  uid?: string | null;
  pieces?: PieceClient[];
  notes?: string | null;
  repere: RepereClient;
  stats: { operations: number; incidents: number; refus: number; chiffre: number };
  /** Ce que le client doit au pro (positif) ou son avoir (négatif). */
  solde: number;
  derniereOperation?: number | null;
  creeLe: number;
  modifieLe: number;
}

/* --------------------------------- Membres --------------------------------- */

export type RoleMembre = 'gerant' | 'agent' | 'vendeur';

export type Droit = 'saisir' | 'encaisser' | 'rembourser' | 'modifier_prix' | 'voir_chiffres' | 'gerer_stock';

export interface Membre {
  uid: string;
  role: RoleMembre;
  droits: Droit[];
  actif: boolean;
}

/* -------------------------------- Variantes -------------------------------- */

export interface Variante {
  /** Clé STABLE (renommer change le libellé, jamais la clé). */
  cle: string;
  taille?: string | null;
  couleur?: string | null;
  code?: string | null;
  photo?: string | null;
}

/** Stock par clé de variante, écrit par le serveur seul. */
export type StockParVariante = Record<string, number>;

/* --------------------------------- Agrégats -------------------------------- */

export interface JourAgregat {
  jour: string;
  /** Net entré en caisse ce jour, tous moyens confondus (remboursements déduits, part retenue des cautions comprise). */
  encaisse: number;
  encaissements: Partial<Record<MoyenPaiement, number>>;
  parMembre: Record<string, number>;
  /** Rendu aux clients ce jour (remboursements), en positif ; déjà déduit de `encaisse`. */
  rembourse: number;
  /** Part gardée des cautions ce jour ; déjà comprise dans `encaisse`. */
  retenu: number;
  operations: number;
  chiffre: number;
}

/** Nature d'un mouvement de caisse : paiement reçu, argent rendu, part gardée d'une caution. */
export type NatureMouvement = 'paiement' | 'remboursement' | 'retenue';

/**
 * Un mouvement de caisse (`boutiques/{bid}/caisse/{id}`), écrit par le serveur dans la
 * transaction qui fait entrer ou sortir l'argent ; id = celui du paiement (`pa_…`) ou
 * `ret_<garantieId>` : un rejeu réécrit le même document, jamais un second.
 * `montant` est signé comme dans l'agrégat (négatif pour un remboursement).
 */
export interface MouvementCaisse {
  id: string;
  jour: string;
  at: number;
  nature: NatureMouvement;
  moyen: MoyenPaiement;
  montant: number;
  opId: string;
  itemTitre: string;
  clientNom: string | null;
  par: string;
}

export interface LigneArrivage {
  itemId: string;
  variante?: string | null;
  quantite: number;
  prixAchat?: number | null;
}
