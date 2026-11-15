// COPIE GÉNÉRÉE depuis functions/src/pro/core/documents.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/documents.ts
 *
 * LES DOCUMENTS DU PRO : contrat de location (voiture), confirmation de séjour (logement),
 * reçu de caution, bon de livraison (vente à distance). Une page HTML A4 BILINGUE : chaque
 * titre et chaque intitulé en français (à gauche) et en arabe (à droite), la valeur au milieu.
 *
 * Un seul générateur, copié dans l'application et le site (voir `types.ts`) : le document sort
 * à l'identique du téléphone (`expo-print`, même hors réseau, au comptoir) et du site
 * (impression du navigateur). Le plan prévoyait une fonction serveur ; abandonnée le 15/11 pour
 * que le contrat se fasse sans réseau.
 *
 * Pur : l'appelant passe les textes déjà résolus (nom de la wilaya, libellé de la taille).
 * Tout texte saisi (nom, adresse, conditions, motif) est ÉCHAPPÉ ; numéros, plaques, dates et
 * montants sont isolés de gauche à droite (`dir="ltr"`) pour ne jamais se retourner en arabe.
 * Aucune marque Trokacha dans le document : c'est le papier du pro.
 */
import { daysBetween, jourAlgerDe } from './dates';
import { totalPaye } from './money';
import { telInternational } from './phone';
import type { FormeGarantie, Garantie, LieuRemise, NiveauCarburant, Operation, PieceClient } from './types';

/* --------------------------- Réglages des documents --------------------------- */

/** En-tête et conditions du pro (`boutiques/{bid}/prive/reglages.documents`) : tailles maximales. */
export const DOCUMENTS_LIMITES = {
  raisonSociale: 80,
  adresse: 160,
  tel: 30,
  rc: 40,
  nif: 40,
  conditionsLocation: 2000,
  conditionsVente: 2000,
} as const;

export type CleReglageDocument = keyof typeof DOCUMENTS_LIMITES;
export const CLES_REGLAGES_DOCUMENTS = Object.keys(DOCUMENTS_LIMITES) as CleReglageDocument[];
export type ReglagesDocuments = Partial<Record<CleReglageDocument, string>>;

/** Lecture tolérante (document venu de Firestore) : champ par champ, coupé à sa taille, vide = absent. */
export function lireReglagesDocuments(raw: unknown): ReglagesDocuments {
  const out: ReglagesDocuments = {};
  if (!raw || typeof raw !== 'object') return out;
  const data = raw as Record<string, unknown>;
  for (const cle of CLES_REGLAGES_DOCUMENTS) {
    const v = data[cle];
    if (typeof v !== 'string') continue;
    const s = v.trim().slice(0, DOCUMENTS_LIMITES[cle]);
    if (s) out[cle] = s;
  }
  return out;
}

/**
 * Saisie à écrire (formulaire du téléphone ou du site) : tous les champs, nettoyés, `''` pour un
 * champ vide (l'écriture remplace l'ancien texte). Refus si un champ dépasse sa taille.
 */
export function saisieReglagesDocuments(
  raw: Partial<Record<CleReglageDocument, string | null | undefined>>,
): { ok: true; value: Record<CleReglageDocument, string> } | { ok: false; champ: CleReglageDocument } {
  const value = {} as Record<CleReglageDocument, string>;
  for (const cle of CLES_REGLAGES_DOCUMENTS) {
    const s = String(raw[cle] ?? '').replace(/\r\n?/g, '\n').trim();
    if (s.length > DOCUMENTS_LIMITES[cle]) return { ok: false, champ: cle };
    value[cle] = s;
  }
  return { ok: true, value };
}

/* --------------------------------- Entrées --------------------------------- */

export type SorteDocument = 'contrat' | 'sejour' | 'caution' | 'livraison';

export interface TexteBilingue {
  fr: string;
  ar: string;
}

export interface EspaceDocument {
  /** Nom de l'espace (repli de la raison sociale). */
  nom: string;
  /** Wilaya de l'espace, déjà résolue dans les deux langues. */
  wilaya?: TexteBilingue | null;
  /** Téléphone de l'espace (repli du téléphone des réglages). */
  tel?: string | null;
}

export interface BienDocument {
  titre: string;
  /** Voiture ou logement (intitulés du reçu de caution). */
  kind?: 'car' | 'immo' | null;
  plaque?: string | null;
  /** Adresse d'un logement. */
  adresse?: string | null;
}

export interface DonneesDocument {
  sorte: SorteDocument;
  op: Operation;
  espace: EspaceDocument;
  reglages?: ReglagesDocuments | null;
  bien?: BienDocument | null;
  /** Pièces de la fiche client : type et numéro seulement (jamais la photo). */
  pieces?: readonly Pick<PieceClient, 'type' | 'numero'>[] | null;
  /**
   * Autres conducteurs, NOMS déjà résolus par l'appelant. `op.conducteurs` contient des
   * identifiants de fiches client (le locataire lui-même compris) : jamais imprimé tel quel.
   * Absent ou vide : ligne laissée à remplir à la main.
   */
  autresConducteurs?: readonly string[] | null;
  /** Livraison : wilaya en deux langues et commune, déjà résolues. */
  wilayaLivraison?: TexteBilingue | null;
  communeLivraison?: string | null;
  /** Taille et couleur de la pièce vendue (« M · Noir »). */
  variante?: string | null;
  /** Instant où le document est fait (date imprimée). */
  maintenant: number;
}

export interface DocumentPro {
  sorte: SorteDocument;
  /** « Contrat de location N° 7K2Q9A » (titre de la page, nom proposé à l'impression). */
  titre: string;
  /** Nom de fichier sûr, sans extension : « Contrat-location-7K2Q9A ». */
  nomFichier: string;
  html: string;
}

/** Les documents qu'une opération peut produire (dans l'ordre des boutons). */
export function documentsPossibles(
  op: Pick<Operation, 'type' | 'statut' | 'garanties' | 'expedition'>,
  kind: 'car' | 'immo' | null | undefined,
): SorteDocument[] {
  if (op.statut === 'annulee' || op.statut === 'non_presentee') return [];
  if (op.type === 'location') {
    const out: SorteDocument[] = [kind === 'immo' ? 'sejour' : 'contrat'];
    if (op.garanties.length) out.push('caution');
    return out;
  }
  return op.expedition ? ['livraison'] : [];
}

/** Numéro court d'une opération (« op_lq3x…7k2q9a » → « 7K2Q9A »). */
export function numeroDocument(opId: string): string {
  const tail = opId.replace(/^[a-z]+_/i, '').replace(/[^a-z0-9]/gi, '');
  return (tail.slice(-6) || opId.slice(-6)).toUpperCase();
}

/* --------------------------------- Mots --------------------------------- */

type Mot = TexteBilingue;
const m = (fr: string, ar: string): Mot => ({ fr, ar });

const TITRES: Record<SorteDocument, Mot> = {
  contrat: m('Contrat de location', 'عقد كراء سيارة'),
  sejour: m('Confirmation de séjour', 'تأكيد الإقامة'),
  caution: m('Reçu de caution', 'وصل الضمان'),
  livraison: m('Bon de livraison', 'وصل التسليم'),
};

const FICHIERS: Record<SorteDocument, string> = {
  contrat: 'Contrat-location',
  sejour: 'Confirmation-sejour',
  caution: 'Recu-caution',
  livraison: 'Bon-livraison',
};

const W = {
  numero: m('N°', 'رقم'),
  faitLe: m('Fait le', 'حُرّر في'),
  tel: m('Tél.', 'الهاتف'),
  rc: m('RC', 'السجل التجاري'),
  nif: m('NIF', 'رقم التعريف الجبائي'),
  locataire: m('Locataire', 'المستأجر'),
  client: m('Client', 'الزبون'),
  destinataire: m('Destinataire', 'المستلم'),
  nom: m('Nom et prénom', 'الاسم واللقب'),
  telephone: m('Téléphone', 'الهاتف'),
  piece: m("Pièce d'identité", 'وثيقة الهوية'),
  permis: m('Permis de conduire', 'رخصة السياقة'),
  conducteurs: m('Autres conducteurs', 'سائقون آخرون'),
  vehicule: m('Véhicule', 'المركبة'),
  modele: m('Modèle', 'الطراز'),
  plaque: m('Immatriculation', 'رقم التسجيل'),
  kmDepart: m('Compteur au départ', 'العدّاد عند الخروج'),
  carburantDepart: m('Carburant au départ', 'الوقود عند الخروج'),
  notesDepart: m('Remarques au départ', 'ملاحظات عند الخروج'),
  logement: m('Logement', 'المسكن'),
  adresse: m('Adresse', 'العنوان'),
  periode: m('Période', 'مدة الكراء'),
  sejour: m('Séjour', 'الإقامة'),
  depart: m('Départ', 'الخروج'),
  retourPrevu: m('Retour prévu', 'الإرجاع المتوقع'),
  arrivee: m('Arrivée', 'الوصول'),
  departSejour: m('Départ', 'المغادرة'),
  duree: m('Durée', 'المدة'),
  remise: m('Remise des clés', 'تسليم المفاتيح'),
  montants: m('Montants', 'المبالغ'),
  designation: m('Désignation', 'البيان'),
  qte: m('Qté', 'الكمية'),
  pu: m('P.U.', 'سعر الوحدة'),
  montant: m('Montant', 'المبلغ'),
  total: m('Total', 'المجموع'),
  paye: m('Payé', 'المدفوع'),
  reste: m('Reste à payer', 'الباقي للدفع'),
  caution: m('Caution', 'الضمان'),
  forme: m('Forme', 'النوع'),
  details: m('Détails', 'التفاصيل'),
  etat: m('État', 'الحالة'),
  banque: m('Banque', 'البنك'),
  objet: m('Objet', 'الموضوع'),
  recuLe: m('Reçue le', 'استُلم في'),
  regleeLe: m('Réglée le', 'سُوّي في'),
  montantRecu: m('Montant reçu', 'المبلغ المستلم'),
  rendu: m('Rendu au client', 'أُرجع للزبون'),
  retenu: m('Retenu', 'محتجز من الضمان'),
  motif: m('Motif', 'السبب'),
  retour: m('Retour du véhicule', 'إرجاع المركبة'),
  dateHeure: m('Date et heure', 'التاريخ والساعة'),
  compteur: m('Compteur', 'العدّاد'),
  carburant: m('Carburant', 'الوقود'),
  remarques: m('Remarques', 'ملاحظات'),
  conditionsLocation: m('Conditions de location', 'شروط الكراء'),
  conditionsVente: m('Conditions de vente', 'شروط البيع'),
  livraison: m('Livraison', 'التوصيل'),
  wilaya: m('Wilaya', 'الولاية'),
  commune: m('Commune', 'البلدية'),
  mode: m('Mode', 'طريقة التوصيل'),
  transporteur: m('Transporteur', 'شركة التوصيل'),
  suivi: m('N° de suivi', 'رقم التتبّع'),
  frais: m('Frais de livraison', 'مصاريف التوصيل'),
  articles: m('Articles', 'السلع'),
  tailleCouleur: m('Taille et couleur', 'المقاس واللون'),
  aPayerLivraison: m('À payer à la livraison', 'يُدفع عند الاستلام'),
  loueur: m('Le loueur', 'المؤجر'),
  leLocataire: m('Le locataire', 'المستأجر'),
  leClient: m('Le client', 'الزبون'),
  vendeur: m('Le vendeur', 'البائع'),
  luApprouve: m('Lu et approuvé', 'قرأت ووافقت'),
  cachet: m('Cachet', 'الختم'),
  signature: m('Signature', 'الإمضاء'),
  recuParClient: m('Reçu par le client, le', 'استلمه الزبون في'),
  plein: m('Plein', 'ممتلئ'),
};

const LIEUX: Record<LieuRemise, Mot> = {
  agence: m('Agence', 'الوكالة'),
  aeroport: m('Aéroport', 'المطار'),
  domicile: m('Domicile', 'المنزل'),
};

const FORMES: Record<FormeGarantie, Mot> = {
  especes: m('Espèces', 'نقدًا'),
  cheque: m('Chèque', 'صك'),
  document: m('Document gardé', 'وثيقة محفوظة'),
  virement: m('Virement', 'تحويل'),
  carte: m('Carte', 'بطاقة'),
};

const ETATS: Record<Garantie['etat'], Mot> = {
  recue: m('Reçue', 'مستلم'),
  rendue: m('Rendue', 'أُرجع للزبون'),
  retenue_partielle: m('Retenue en partie', 'احتُفظ بجزء منه'),
  retenue: m('Retenue', 'احتُفظ به'),
};

const MODES: Record<'domicile' | 'bureau', Mot> = {
  domicile: m('À domicile', 'إلى المنزل'),
  bureau: m('Au bureau du transporteur', 'إلى مكتب شركة التوصيل'),
};

function joursMot(n: number): Mot {
  const fr = `${n} ${n > 1 ? 'jours' : 'jour'}`;
  const ar = n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يومًا`;
  return m(fr, ar);
}

function nuitsMot(n: number): Mot {
  const fr = `${n} ${n > 1 ? 'nuits' : 'nuit'}`;
  const ar = n === 1 ? 'ليلة واحدة' : n === 2 ? 'ليلتان' : n <= 10 ? `${n} ليالٍ` : `${n} ليلة`;
  return m(fr, ar);
}

/* --------------------------------- Formes --------------------------------- */

export function echapperHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const esc = echapperHtml;
const NBSP = ' ';

/** « 12 000 DA » (espaces insécables). */
export function montantDocument(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  const digits = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${v < 0 ? '-' : ''}${digits}${NBSP}DA`;
}

/** 'YYYY-MM-DD' → 'dd/mm/yyyy'. */
export function dateDocument(day: string | null | undefined): string {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  return `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
}

/** Heure d'Alger d'un instant (UTC+1 toute l'année). */
function heureAlger(ms: number): string {
  return new Date(ms + 60 * 60 * 1000).toISOString().slice(11, 16);
}

function instantDocument(ms: number | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '';
  return `${dateDocument(jourAlgerDe(ms))} ${heureAlger(ms)}`;
}

function telDocument(tel: string | null | undefined): string {
  const raw = (tel ?? '').trim();
  if (!raw) return '';
  const intl = telInternational(raw);
  if (!intl) return raw;
  if (!intl.startsWith('+213')) return intl;
  const local = `0${intl.slice(4)}`;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}` : local;
}

function kmDocument(km: number | null | undefined): string {
  if (typeof km !== 'number' || !Number.isFinite(km)) return '';
  return `${String(Math.round(km)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}km`;
}

/* ------------------------------- Morceaux HTML ------------------------------- */

/** Texte arabe isolé (sens de droite à gauche). */
const ar = (s: string) => `<span class="ar" dir="rtl" lang="ar">${esc(s)}</span>`;
/** Numéro, plaque, date, montant : toujours de gauche à droite. */
const ltr = (s: string) => `<span class="iso" dir="ltr">${esc(s)}</span>`;
/** Texte saisi (nom, adresse) : son propre sens. */
const auto = (s: string) => `<bdi>${esc(s)}</bdi>`;
/** Mot dans les deux langues, dans une valeur (« Plein · ممتلئ »). */
const duo = (w: Mot) => `${esc(w.fr)} <span class="sep">·</span> ${ar(w.ar)}`;

function lib(w: Mot): string {
  return `<div class="lib"><span>${esc(w.fr)}</span>${ar(w.ar)}</div>`;
}

/** Un champ : intitulé bilingue et valeur (HTML déjà sûr) ; vide = ligne à remplir à la main. */
function champ(w: Mot, valeurHtml: string, classe = ''): string {
  const vide = !valeurHtml;
  return `<div class="champ ${classe}">${lib(w)}<div class="val${vide ? ' vide' : ''}">${vide ? '&nbsp;' : valeurHtml}</div></div>`;
}

function section(w: Mot, corps: string, classe = ''): string {
  return `<section class="${classe}"><h2><span>${esc(w.fr)}</span>${ar(w.ar)}</h2>${corps}</section>`;
}

const grille = (n: 1 | 2 | 3 | 4, champs: string[]) => `<div class="grille g${n}">${champs.join('')}</div>`;

/* ---------------------------------- Blocs ---------------------------------- */

function entete(d: DonneesDocument): string {
  const r = d.reglages ?? {};
  const nom = r.raisonSociale || d.espace.nom || '';
  const tel = telDocument(r.tel || d.espace.tel || '');
  const lieu: string[] = [];
  if (r.adresse) lieu.push(auto(r.adresse));
  if (d.espace.wilaya?.fr) lieu.push(`${esc(d.espace.wilaya.fr)}${d.espace.wilaya.ar ? ` <span class="sep">·</span> ${ar(d.espace.wilaya.ar)}` : ''}`);
  const ids: string[] = [];
  if (tel) ids.push(`<span class="id">${esc(W.tel.fr)} ${ar(W.tel.ar)} ${ltr(tel)}</span>`);
  if (r.rc) ids.push(`<span class="id">${esc(W.rc.fr)} ${ar(W.rc.ar)} ${ltr(r.rc)}</span>`);
  if (r.nif) ids.push(`<span class="id">${esc(W.nif.fr)} ${ar(W.nif.ar)} ${ltr(r.nif)}</span>`);
  return `<header class="pro">
  <div class="pro-nom">${auto(nom)}</div>
  ${lieu.length ? `<div class="pro-ligne">${lieu.join(' <span class="sep">·</span> ')}</div>` : ''}
  ${ids.length ? `<div class="pro-ligne ids">${ids.join('')}</div>` : ''}
</header>`;
}

function bandeauTitre(d: DonneesDocument): string {
  const t = TITRES[d.sorte];
  const num = numeroDocument(d.op.id);
  const date = dateDocument(jourAlgerDe(d.maintenant));
  return `<div class="titre">
  <span class="t-fr">${esc(t.fr)}</span>
  <span class="t-num">${esc(W.numero.fr)} ${ltr(num)} ${ar(W.numero.ar)}<br/>${esc(W.faitLe.fr)} ${ltr(date)} ${ar(W.faitLe.ar)}</span>
  <span class="t-ar" dir="rtl" lang="ar">${esc(t.ar)}</span>
</div>`;
}

function pieceDe(pieces: DonneesDocument['pieces'], permis: boolean): string {
  const liste = (pieces ?? []).filter((p) => p && typeof p.type === 'string');
  const estPermis = (p: { type: string }) => /permis|رخصة|licen[cs]e/i.test(p.type);
  const p = liste.find((x) => (permis ? estPermis(x) : !estPermis(x)));
  if (!p) return '';
  return [auto(p.type.trim()), p.numero ? ltr(p.numero.trim()) : ''].filter(Boolean).join(' ');
}

function blocPersonne(d: DonneesDocument, titre: Mot, avecPieces: boolean, avecPermis: boolean): string {
  const op = d.op;
  const champs = [champ(W.nom, op.clientNom ? auto(op.clientNom) : ''), champ(W.telephone, op.clientTel ? ltr(telDocument(op.clientTel)) : '')];
  if (avecPieces) champs.push(champ(W.piece, pieceDe(d.pieces, false)));
  if (avecPermis) champs.push(champ(W.permis, pieceDe(d.pieces, true)));
  let corps = grille(champs.length as 2 | 3 | 4, champs);
  const autres = (d.autresConducteurs ?? []).filter((c) => typeof c === 'string' && c.trim());
  if (avecPermis) corps += grille(1, [champ(W.conducteurs, autres.map((c) => auto(c.trim())).join(' <span class="sep">·</span> '))]);
  return section(titre, corps);
}

function carburantDocument(c: NiveauCarburant | null | undefined): string {
  if (c == null) return '';
  return c >= 8 ? duo(W.plein) : ltr(`${c}/8`);
}

function blocVehicule(d: DonneesDocument): string {
  const op = d.op;
  const titre = d.bien?.titre || op.itemTitre;
  const champs = [
    champ(W.modele, titre ? auto(titre) : ''),
    champ(W.plaque, d.bien?.plaque ? ltr(d.bien.plaque) : ''),
    champ(W.kmDepart, op.depart?.km != null ? ltr(kmDocument(op.depart.km)) : ''),
    champ(W.carburantDepart, carburantDocument(op.depart?.carburant)),
  ];
  let corps = grille(4, champs);
  if (op.depart?.notes) corps += grille(1, [champ(W.notesDepart, auto(op.depart.notes))]);
  return section(W.vehicule, corps);
}

function blocLogement(d: DonneesDocument): string {
  const titre = d.bien?.titre || d.op.itemTitre;
  return section(W.logement, grille(2, [champ(W.logement, titre ? auto(titre) : ''), champ(W.adresse, d.bien?.adresse ? auto(d.bien.adresse) : '')]));
}

function jourHeure(day: string | null | undefined, heure: string | null | undefined): string {
  const date = dateDocument(day);
  if (!date) return '';
  return ltr(heure ? `${date} ${heure}` : date);
}

function remiseDocument(op: Operation): string {
  if (!op.remise) return '';
  const lieu = duo(LIEUX[op.remise.lieu] ?? LIEUX.agence);
  return op.remise.adresse ? `${lieu}<div class="sous">${auto(op.remise.adresse)}</div>` : lieu;
}

function blocPeriode(d: DonneesDocument, immo: boolean): string {
  const op = d.op;
  const n = op.debut && op.fin && op.debut < op.fin ? daysBetween(op.debut, op.fin) : 0;
  const champs = [
    champ(immo ? W.arrivee : W.depart, jourHeure(op.debut, op.heureDebut)),
    champ(immo ? W.departSejour : W.retourPrevu, jourHeure(op.fin, op.heureFin)),
    champ(W.duree, n > 0 ? duo(immo ? nuitsMot(n) : joursMot(n)) : ''),
    champ(W.remise, remiseDocument(op)),
  ];
  return section(immo ? W.sejour : W.periode, grille(4, champs));
}

function tableLignes(op: Operation): string {
  const th = (w: Mot, cls = '') => `<th class="${cls}"><div class="th"><span>${esc(w.fr)}</span>${ar(w.ar)}</div></th>`;
  const lignes = op.lignes.length
    ? op.lignes
        .map(
          (l) =>
            `<tr><td>${auto(l.libelle)}</td><td class="n">${ltr(String(l.quantite))}</td><td class="n">${ltr(montantDocument(l.prix))}</td><td class="n">${ltr(montantDocument(l.prix * l.quantite))}</td></tr>`,
        )
        .join('')
    : `<tr><td class="vide">&nbsp;</td><td></td><td></td><td></td></tr>`;
  return `<table class="lignes"><thead><tr>${th(W.designation)}${th(W.qte, 'n')}${th(W.pu, 'n')}${th(W.montant, 'n')}</tr></thead><tbody>${lignes}</tbody></table>`;
}

function blocMontants(d: DonneesDocument, titre: Mot = W.montants): string {
  const op = d.op;
  const paye = totalPaye(op.paiements);
  const reste = Math.max(0, op.total - paye);
  const totaux = grille(3, [
    champ(W.total, ltr(montantDocument(op.total)), 'fort'),
    champ(W.paye, ltr(montantDocument(paye))),
    champ(W.reste, ltr(montantDocument(reste)), 'fort'),
  ]);
  return section(titre, tableLignes(op) + totaux);
}

function detailsGarantie(g: Garantie): string {
  const parts: string[] = [];
  const det = g.details ?? {};
  if (g.forme === 'document' && det.document) parts.push(auto(det.document));
  if (det.banque) parts.push(`${esc(W.banque.fr)} ${ar(W.banque.ar)} ${auto(det.banque)}`);
  if (det.numero) parts.push(`${esc(W.numero.fr)} ${ltr(det.numero)}`);
  return parts.join(' <span class="sep">·</span> ');
}

function tableGaranties(garanties: readonly Garantie[], avecEtat: boolean): string {
  const th = (w: Mot, cls = '') => `<th class="${cls}"><div class="th"><span>${esc(w.fr)}</span>${ar(w.ar)}</div></th>`;
  const cols = avecEtat ? 4 : 3;
  const rows = garanties.length
    ? garanties
        .map((g) => {
          const etat = avecEtat ? `<td>${duo(ETATS[g.etat] ?? ETATS.recue)}</td>` : '';
          return `<tr><td>${duo(FORMES[g.forme] ?? FORMES.especes)}</td><td class="n">${g.montant != null ? ltr(montantDocument(g.montant)) : ''}</td><td>${detailsGarantie(g)}</td>${etat}</tr>`;
        })
        .join('')
    : `<tr>${'<td class="vide">&nbsp;</td>'.repeat(cols)}</tr>`;
  return `<table class="lignes"><thead><tr>${th(W.forme)}${th(W.montant, 'n')}${th(W.details)}${avecEtat ? th(W.etat) : ''}</tr></thead><tbody>${rows}</tbody></table>`;
}

function blocRetour(d: DonneesDocument): string {
  const r = d.op.retour;
  const champs = [
    champ(W.dateHeure, r ? ltr(instantDocument(r.at)) : ''),
    champ(W.compteur, r?.km != null ? ltr(kmDocument(r.km)) : ''),
    champ(W.carburant, carburantDocument(r?.carburant)),
    champ(W.remarques, r?.notes ? auto(r.notes) : '', 'span4'),
  ];
  return section(W.retour, grille(4, champs));
}

function blocConditions(texte: string | null | undefined, titre: Mot): string {
  const t = (texte ?? '').trim();
  if (!t) return '';
  const lignes = t.split('\n').map((l) => (l.trim() ? `<div dir="auto">${esc(l)}</div>` : '<div>&nbsp;</div>'));
  return section(titre, `<div class="conditions">${lignes.join('')}</div>`, 'cond');
}

/** Deux cases : le pro (cachet) à gauche, le client à droite (« Lu et approuvé », ou la mention donnée). */
function signatures(pro: Mot, client: Mot, mentionClient: Mot = W.luApprouve): string {
  const box = (w: Mot, mention: Mot) =>
    `<div class="sign"><div class="lib fort"><span>${esc(w.fr)}</span>${ar(w.ar)}</div><div class="lib"><span>${esc(mention.fr)}</span>${ar(mention.ar)}</div><div class="lib bas"><span>${esc(W.signature.fr)}</span>${ar(W.signature.ar)}</div></div>`;
  return `<div class="signatures">${box(pro, W.cachet)}${box(client, mentionClient)}</div>`;
}

/* -------------------------------- Documents -------------------------------- */

function corpsContrat(d: DonneesDocument): string {
  return [
    blocPersonne(d, W.locataire, true, true),
    blocVehicule(d),
    blocPeriode(d, false),
    blocMontants(d),
    section(W.caution, tableGaranties(d.op.garanties, false)),
    blocRetour(d),
    blocConditions(d.reglages?.conditionsLocation, W.conditionsLocation),
    signatures(W.loueur, W.leLocataire),
  ].join('\n');
}

function corpsSejour(d: DonneesDocument): string {
  return [
    blocPersonne(d, W.locataire, true, false),
    blocLogement(d),
    blocPeriode(d, true),
    blocMontants(d),
    section(W.caution, tableGaranties(d.op.garanties, false)),
    blocConditions(d.reglages?.conditionsLocation, W.conditionsLocation),
    signatures(W.loueur, W.leLocataire),
  ].join('\n');
}

function corpsCaution(d: DonneesDocument): string {
  const op = d.op;
  const titre = d.bien?.titre || op.itemTitre;
  const objet = [titre ? auto(titre) : '', d.bien?.plaque ? ltr(d.bien.plaque) : ''].filter(Boolean).join(' <span class="sep">·</span> ');
  const periode = [dateDocument(op.debut), dateDocument(op.fin)].filter(Boolean).join(' \u2192 ');
  const enArgent = op.garanties.filter((g) => g.montant != null);
  const recu = enArgent.reduce((s, g) => s + (g.montant ?? 0), 0);
  const retenu = enArgent.reduce((s, g) => s + (g.etat === 'retenue' ? (g.retenue ?? g.montant ?? 0) : g.etat === 'retenue_partielle' ? (g.retenue ?? 0) : 0), 0);
  const rendu = enArgent.reduce((s, g) => s + (g.etat === 'rendue' ? (g.montant ?? 0) : g.etat === 'retenue_partielle' ? Math.max(0, (g.montant ?? 0) - (g.retenue ?? 0)) : 0), 0);
  const reglees = op.garanties.filter((g) => g.etat !== 'recue');
  const motifs = reglees.map((g) => (g.motif ?? '').trim()).filter(Boolean);
  const derniere = reglees.reduce<number | null>((max, g) => (typeof g.regleeLe === 'number' && (max == null || g.regleeLe > max) ? g.regleeLe : max), null);
  const premiere = op.garanties.reduce<number | null>((min, g) => (typeof g.at === 'number' && (min == null || g.at < min) ? g.at : min), null);

  // Montants seulement s'il y a de l'argent : un document gardé seul (permis, passeport) n'imprime pas « 0 DA ».
  const resume = [champ(W.recuLe, premiere != null ? ltr(instantDocument(premiere)) : '')];
  if (enArgent.length) resume.push(champ(W.montantRecu, ltr(montantDocument(recu)), 'fort'));
  if (enArgent.length && reglees.length) {
    resume.push(champ(W.rendu, ltr(montantDocument(rendu)), 'fort'));
    resume.push(champ(W.retenu, ltr(montantDocument(retenu)), 'fort'));
  }
  let corps = grille(resume.length === 4 ? 4 : 2, resume);
  if (reglees.length) {
    const suite = [champ(W.regleeLe, derniere != null ? ltr(instantDocument(derniere)) : '')];
    if (motifs.length) suite.push(champ(W.motif, motifs.map(auto).join(' <span class="sep">·</span> '), 'span3'));
    corps += grille(4, suite);
  }
  return [
    blocPersonne(d, W.client, false, false),
    section(W.objet, grille(2, [champ(d.bien?.kind === 'immo' ? W.logement : W.vehicule, objet), champ(W.periode, periode ? ltr(periode) : '')])),
    section(W.caution, tableGaranties(op.garanties, true) + corps),
    signatures(W.loueur, W.leClient),
  ].join('\n');
}

function corpsLivraison(d: DonneesDocument): string {
  const op = d.op;
  const e = op.expedition;
  const wilaya = d.wilayaLivraison ? `${esc(d.wilayaLivraison.fr)}${d.wilayaLivraison.ar ? ` <span class="sep">·</span> ${ar(d.wilayaLivraison.ar)}` : ''}` : e?.wilaya ? ltr(e.wilaya) : '';
  const commune = d.communeLivraison || e?.commune || '';
  const dest = grille(4, [
    champ(W.nom, op.clientNom ? auto(op.clientNom) : ''),
    champ(W.telephone, op.clientTel ? ltr(telDocument(op.clientTel)) : ''),
    champ(W.wilaya, wilaya),
    champ(W.commune, commune ? auto(commune) : ''),
  ]);
  const envoi = [
    champ(W.mode, e ? duo(MODES[e.mode] ?? MODES.domicile) : ''),
    champ(W.transporteur, e?.transporteur ? auto(e.transporteur) : ''),
    champ(W.suivi, e?.suivi ? ltr(e.suivi) : ''),
    champ(W.frais, e?.frais != null ? ltr(montantDocument(e.frais)) : ''),
  ];
  const variante = (d.variante ?? '').trim();
  const dejaDansLigne = !variante || op.lignes.some((l) => l.libelle.includes(variante));
  const paye = totalPaye(op.paiements);
  const aPayer = Math.max(0, op.total - paye);
  const totaux = grille(3, [
    champ(W.total, ltr(montantDocument(op.total))),
    champ(W.paye, ltr(montantDocument(paye))),
    champ(W.aPayerLivraison, ltr(montantDocument(aPayer)), 'fort'),
  ]);
  return [
    section(W.destinataire, dest),
    section(W.livraison, grille(4, envoi)),
    section(W.articles, (dejaDansLigne ? '' : grille(1, [champ(W.tailleCouleur, auto(variante))])) + tableLignes(op) + totaux),
    blocConditions(d.reglages?.conditionsVente, W.conditionsVente),
    signatures(W.vendeur, W.leClient, W.recuParClient),
  ].join('\n');
}

const STYLE = `
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; }
/* Pas de -apple-system : à l'impression iOS (expo-print), sa liste de secours s'arrête sur LastResort et un texte saisi en arabe sortait en carrés ; les polices arabes nommées suivent les latines. */
body { font-family: 'Helvetica Neue', 'Segoe UI', Roboto, Arial, 'Geeza Pro', 'SF Arabic', 'Noto Sans Arabic', Tahoma, sans-serif; color: #111; font-size: 11px; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ar { font-family: 'Geeza Pro', 'SF Arabic', 'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, 'Segoe UI', sans-serif; unicode-bidi: isolate; }
.iso { unicode-bidi: isolate; }
bdi { unicode-bidi: isolate; }
.sep { color: #999; }
header.pro { border-bottom: 2px solid #111; padding-bottom: 2.5mm; }
.pro-nom { font-size: 19px; font-weight: 800; }
.pro-ligne { font-size: 10px; color: #333; margin-top: 0.8mm; }
.pro-ligne.ids { display: flex; flex-wrap: wrap; gap: 1mm 5mm; }
.titre { display: flex; align-items: center; justify-content: space-between; gap: 4mm; margin: 3.5mm 0 1mm; padding: 2.5mm 3.5mm; background: #f0f0f0; border-radius: 2mm; }
.t-fr, .t-ar { font-size: 16px; font-weight: 800; flex: 1; }
.t-ar { text-align: right; font-family: 'Geeza Pro', 'SF Arabic', 'Noto Naskh Arabic', 'Noto Sans Arabic', Tahoma, sans-serif; }
.t-num { font-size: 10px; color: #333; text-align: center; white-space: nowrap; }
section { margin-top: 2mm; break-inside: avoid; page-break-inside: avoid; }
section.cond { break-inside: auto; page-break-inside: auto; }
h2 { display: flex; justify-content: space-between; font-size: 11.5px; margin: 0 0 1mm; padding-bottom: 0.6mm; border-bottom: 1px solid #bbb; }
.grille { display: grid; gap: 1.2mm 2.5mm; }
.grille + .grille, .grille + table, table + .grille { margin-top: 1.2mm; }
.g1 { grid-template-columns: 1fr; }
.g2 { grid-template-columns: repeat(2, 1fr); }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g4 { grid-template-columns: repeat(4, 1fr); }
.span3 { grid-column: span 3; }
.span4 { grid-column: 1 / -1; }
.champ { border: 1px solid #d6d6d6; border-radius: 1.5mm; padding: 0.7mm 2mm 0.8mm; min-width: 0; }
.lib { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.5px; color: #555; }
.val { font-size: 11px; font-weight: 600; margin-top: 0.3mm; min-height: 4.4mm; text-align: center; overflow-wrap: anywhere; }
.val.vide { border-bottom: 1px dotted #888; margin: 1.4mm 1mm 0.4mm; min-height: 3.2mm; }
.champ.fort .val { font-size: 13px; font-weight: 800; }
.sous { font-size: 9.5px; font-weight: 400; color: #333; }
table.lignes { width: 100%; border-collapse: collapse; font-size: 10.5px; }
table.lignes th { font-size: 8.5px; color: #555; font-weight: 600; border-bottom: 1px solid #bbb; padding: 0.5mm 1.5mm; text-align: left; }
table.lignes th .th { display: flex; justify-content: space-between; gap: 2mm; white-space: nowrap; }
table.lignes th.n { width: 1%; }
table.lignes td.n { text-align: right; white-space: nowrap; }
table.lignes td { padding: 0.9mm 1.5mm; border-bottom: 1px solid #e6e6e6; vertical-align: top; }
table.lignes td.vide { height: 6mm; }
.conditions div { text-align: start; }
.conditions { font-size: 9px; line-height: 1.38; border: 1px solid #d6d6d6; border-radius: 1.5mm; padding: 1.6mm 2.2mm; overflow-wrap: anywhere; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 3mm; break-inside: avoid; page-break-inside: avoid; }
.sign { border: 1px solid #999; border-radius: 1.5mm; padding: 1.4mm 2.2mm; height: 25mm; display: flex; flex-direction: column; gap: 0.6mm; }
.sign .lib.fort { font-size: 11px; font-weight: 700; color: #111; }
.sign .lib.bas { margin-top: auto; }
`;

/** Le document HTML complet (A4, une page dans le cas courant). */
export function documentPro(d: DonneesDocument): DocumentPro {
  const corps =
    d.sorte === 'contrat' ? corpsContrat(d) : d.sorte === 'sejour' ? corpsSejour(d) : d.sorte === 'caution' ? corpsCaution(d) : corpsLivraison(d);
  const num = numeroDocument(d.op.id);
  const titre = `${TITRES[d.sorte].fr} ${W.numero.fr} ${num}`;
  const html = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(titre)}</title>
<style>${STYLE}</style>
</head>
<body>
${entete(d)}
${bandeauTitre(d)}
${corps}
</body>
</html>`;
  return { sorte: d.sorte, titre, nomFichier: `${FICHIERS[d.sorte]}-${num}`, html };
}
