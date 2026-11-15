// COPIE GÉNÉRÉE depuis functions/src/pro/core/export.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/export.ts
 *
 * TOUT LE CARNET D'UN ESPACE DANS UN CLASSEUR EXCEL, à tout moment, fait sur l'appareil
 * (téléphone ou bureau web) avec ce que l'appareil a lu : opérations, paiements, fiches
 * clients, catalogue et, pour qui voit les chiffres, les mouvements de caisse. Intitulés dans
 * la langue de l'appareil (français ou arabe ; en arabe, feuilles de droite à gauche).
 * Jamais une photo, ni de pièce d'identité ni d'état des lieux : le type et le numéro seulement.
 *
 * Aussi : les lecteurs PURS des documents bruts dont l'export a besoin (article du
 * catalogue, mouvement de caisse, agrégat du jour), communs au téléphone et au site, et les
 * bornes d'un mois (relevé du mois, `releveMois` dans `documents.ts`). Module PUR.
 */

import { jourAlgerDe } from './dates';
import { instantLisible, MOTS_ETATS_GARANTIE, MOTS_FORMES_GARANTIE, numeroDocument, telLisible } from './documents';
import { prixParJour, totalPaye, type PalierPrix } from './money';
import type {
  ClientFiche,
  Garantie,
  JourAgregat,
  MouvementCaisse,
  MoyenPaiement,
  NatureMouvement,
  Operation,
  Origine,
  RepereClient,
  StatutOperation,
  StockParVariante,
  Variante,
} from './types';
import { libelleVariante } from './variants';
import { classeurXlsx, type CelluleXlsx, type ColonneXlsx, type FeuilleXlsx } from './xlsx';

export type LangueExport = 'fr' | 'ar';

/* ------------------------------ Lecteurs purs ------------------------------ */

type Data = Record<string, unknown>;

const isRec = (v: unknown): v is Data => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const ent = (v: unknown): number => {
  const n = num(v);
  return n === null ? 0 : Math.round(n);
};

/** Instant en millisecondes : nombre, `Timestamp` (`toMillis`) ou `{ seconds }` ; 0 sinon. */
export function millisDe(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (isRec(v) && typeof v.toMillis === 'function') {
    try {
      const ms = (v.toMillis as () => unknown)();
      return typeof ms === 'number' && Number.isFinite(ms) ? ms : 0;
    } catch {
      return 0;
    }
  }
  if (isRec(v)) {
    const s = num(v.seconds) ?? num(v._seconds);
    if (s !== null) return s * 1000;
  }
  return 0;
}

/** Un article ou un bien du catalogue, tel que l'export le montre. */
export interface ArticleExport {
  id: string;
  titre: string;
  /** Article vendu, voiture ou logement loué. */
  sorte: 'article' | 'car' | 'immo';
  plaque: string | null;
  km: number | null;
  /** Prix de vente (article). */
  prix: number | null;
  /** Paliers d'une location (prix par jour selon la durée). */
  paliers: PalierPrix[];
  variantes: Variante[];
  stock: StockParVariante;
  /** Quantité restante d'un article sans tailles. */
  quantite: number | null;
  statut: string | null;
  creeLe: number;
}

/** Un document `catalogue/{id}` lu sans jamais lever ; `null` s'il n'en est pas un. */
export function lireArticleExport(id: string, data: unknown): ArticleExport | null {
  if (!isRec(data)) return null;
  const rental = isRec(data.rental) ? data.rental : null;
  const bien = isRec(data.bien) ? data.bien : {};
  const paliers: PalierPrix[] = rental && Array.isArray(rental.pricingTiers)
    ? rental.pricingTiers.flatMap((p): PalierPrix[] => {
        if (!isRec(p)) return [];
        const prix = num(p.pricePerDay);
        if (prix === null || prix <= 0) return [];
        const jusqua = p.upToDays == null ? null : num(p.upToDays);
        return [{ upToDays: jusqua === null ? null : Math.round(jusqua), pricePerDay: Math.round(prix) }];
      })
    : [];
  const variantes: Variante[] = Array.isArray(data.variantes)
    ? data.variantes.flatMap((v): Variante[] => {
        if (!isRec(v)) return [];
        const cle = str(v.cle);
        return cle ? [{ cle, taille: str(v.taille), couleur: str(v.couleur) }] : [];
      })
    : [];
  const stock: StockParVariante = {};
  if (isRec(data.stock)) for (const [cle, n] of Object.entries(data.stock)) stock[cle] = Math.max(0, Math.floor(num(n) ?? 0));
  const prix = num(data.prix);
  const km = num(bien.kmActuel);
  const restante = num(data.quantiteRestante) ?? num(data.quantite);
  return {
    id,
    titre: str(data.titre) ?? '',
    sorte: rental ? (rental.kind === 'immo' ? 'immo' : 'car') : 'article',
    plaque: str(bien.plaque),
    km: km === null || km < 0 ? null : Math.round(km),
    prix: prix === null || prix < 0 ? null : Math.round(prix),
    paliers,
    variantes,
    stock,
    quantite: restante === null ? null : Math.max(0, Math.floor(restante)),
    statut: str(data.statut),
    creeLe: millisDe(data.creeLe ?? data.createdAt),
  };
}

const NATURES: readonly NatureMouvement[] = ['paiement', 'remboursement', 'retenue'];

/** Un document `caisse/{id}` lu sans jamais lever ; `null` s'il n'en est pas un. */
export function lireMouvementCaisse(id: string, data: unknown): MouvementCaisse | null {
  if (!isRec(data)) return null;
  const jour = str(data.jour);
  const nature = NATURES.find((n) => n === data.nature) ?? null;
  const opId = str(data.opId);
  if (!jour || !nature || !opId) return null;
  return {
    id,
    jour,
    at: millisDe(data.at),
    nature,
    moyen: (str(data.moyen) ?? 'especes') as MoyenPaiement,
    montant: ent(data.montant),
    opId,
    itemTitre: str(data.itemTitre) ?? '',
    clientNom: str(data.clientNom),
    par: str(data.par) ?? '',
  };
}

/** Un document `jours/{YYYY-MM-DD}` lu sans jamais lever (champs absents : 0). */
export function lireJourAgregat(jour: string, data: unknown): JourAgregat {
  const d = isRec(data) ? data : {};
  const encaissements: Partial<Record<MoyenPaiement, number>> = {};
  if (isRec(d.encaissements)) for (const [moyen, montant] of Object.entries(d.encaissements)) encaissements[moyen as MoyenPaiement] = ent(montant);
  const parMembre: Record<string, number> = {};
  if (isRec(d.parMembre)) for (const [uid, montant] of Object.entries(d.parMembre)) parMembre[uid] = ent(montant);
  return {
    jour,
    encaisse: ent(d.encaisse),
    encaissements,
    parMembre,
    rembourse: ent(d.rembourse),
    retenu: ent(d.retenu),
    operations: ent(d.operations),
    chiffre: ent(d.chiffre),
  };
}

/* ---------------------------------- Mois ---------------------------------- */

const MOIS_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMois(v: unknown): v is string {
  return typeof v === 'string' && MOIS_RE.test(v);
}

/** Premier et dernier jour d'un mois, et ses bornes en millisecondes (heure d'Alger, fin exclue). */
export function bornesMois(mois: string): { premier: string; dernier: string; debutMs: number; finMs: number } {
  const m = MOIS_RE.exec(mois);
  const an = m ? Number(m[1]) : 1970;
  const n = m ? Number(m[2]) : 1;
  const jours = new Date(Date.UTC(an, n, 0)).getUTCDate();
  const heure = 60 * 60 * 1000;
  return {
    premier: `${mois}-01`,
    dernier: `${mois}-${String(jours).padStart(2, '0')}`,
    debutMs: Date.UTC(an, n - 1, 1) - heure,
    finMs: Date.UTC(an, n, 1) - heure,
  };
}

/** Les `n` derniers mois, le mois en cours d'abord (« 2026-11 », « 2026-10 »…). */
export function derniersMois(maintenant: number, n = 12): string[] {
  const jour = jourAlgerDe(maintenant);
  let an = Number(jour.slice(0, 4));
  let mois = Number(jour.slice(5, 7));
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    out.push(`${an}-${String(mois).padStart(2, '0')}`);
    mois -= 1;
    if (mois === 0) {
      mois = 12;
      an -= 1;
    }
  }
  return out;
}

const NOMS_MOIS: Record<LangueExport, readonly string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  // Noms des mois en usage en Algérie.
  ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** « Novembre 2026 » / « نوفمبر 2026 ». */
export function libelleMois(mois: string, langue: LangueExport): string {
  if (!isMois(mois)) return mois;
  const nom = NOMS_MOIS[langue][Number(mois.slice(5, 7)) - 1];
  return `${langue === 'fr' ? nom.charAt(0).toUpperCase() + nom.slice(1) : nom} ${mois.slice(0, 4)}`;
}

/**
 * L'opération compte-t-elle dans le mois ? Une location par son jour de début, une vente (ou
 * une location sans date) par le jour où elle a été notée.
 */
export function operationDuMois(op: Pick<Operation, 'type' | 'debut' | 'creeLe'>, mois: string): boolean {
  if (op.type === 'location' && op.debut && /^\d{4}-\d{2}-\d{2}$/.test(op.debut)) return op.debut.slice(0, 7) === mois;
  return Number.isFinite(op.creeLe) && op.creeLe > 0 && jourAlgerDe(op.creeLe).slice(0, 7) === mois;
}

/* ---------------------------------- Mots ---------------------------------- */

type Mot = Record<LangueExport, string>;
const m = (fr: string, ar: string): Mot => ({ fr, ar });

const FEUILLES = {
  operations: m('Opérations', 'العمليات'),
  paiements: m('Paiements', 'المدفوعات'),
  clients: m('Clients', 'الزبائن'),
  catalogue: m('Catalogue', 'الكتالوڨ'),
  caisse: m('Caisse', 'الصندوق'),
};

const C = {
  numero: m('N°', 'الرقم'),
  type: m('Type', 'النوع'),
  statut: m('Statut', 'الحالة'),
  origine: m('Origine', 'المصدر'),
  article: m('Article ou bien', 'السلعة أو الملك'),
  variante: m('Taille et couleur', 'المقاس واللون'),
  quantite: m('Quantité', 'الكمية'),
  client: m('Client', 'الزبون'),
  tel: m('Téléphone', 'الهاتف'),
  debut: m('Début', 'البداية'),
  fin: m('Fin', 'النهاية'),
  total: m('Total (DA)', 'المجموع (دج)'),
  paye: m('Payé (DA)', 'المدفوع (دج)'),
  reste: m('Reste à payer (DA)', 'الباقي للدفع (دج)'),
  caution: m('Caution', 'الضمان'),
  transporteur: m('Transporteur', 'شركة التوصيل'),
  suivi: m('N° de suivi', 'رقم التتبّع'),
  wilaya: m('Wilaya de livraison', 'ولاية التوصيل'),
  notePar: m('Noté par', 'سجّلها'),
  creeLe: m('Notée le', 'تاريخ التسجيل'),
  date: m('Date', 'التاريخ'),
  numeroOp: m('N° opération', 'رقم العملية'),
  mouvement: m('Mouvement', 'الحركة'),
  moyen: m('Moyen', 'الوسيلة'),
  montant: m('Montant (DA)', 'المبلغ (دج)'),
  reference: m('Référence', 'المرجع'),
  nom: m('Nom et prénom', 'الاسم واللقب'),
  repere: m('Repère', 'تصنيف'),
  piece: m("Pièce d'identité", 'وثيقة الهوية'),
  operations: m('Opérations', 'العمليات'),
  incidents: m('Incidents', 'المشاكل'),
  chiffre: m('Chiffre (DA)', 'رقم الأعمال (دج)'),
  derniere: m('Dernière opération', 'آخر عملية'),
  notes: m('Notes', 'ملاحظات'),
  titre: m('Titre', 'الاسم'),
  sorte: m('Sorte', 'الصنف'),
  plaque: m('Immatriculation', 'رقم التسجيل'),
  km: m('Kilométrage', 'العدّاد (كم)'),
  prix: m('Prix (DA)', 'السعر (دج)'),
  prix7: m('Prix par jour dès 7 jours (DA)', 'سعر اليوم ابتداءً من 7 أيام (دج)'),
  tailles: m('Tailles et stock', 'المقاسات والمخزون'),
  stock: m('Stock', 'المخزون'),
  etat: m('État', 'الحالة'),
};

const TYPES = { location: m('Location', 'كراء'), vente: m('Vente', 'بيع') };

const STATUTS: Record<StatutOperation, Mot> = {
  reservee: m('Réservée', 'محجوزة'),
  en_cours: m('En cours', 'جارية'),
  rendue: m('Rendue', 'أُرجعت'),
  cloturee: m('Clôturée', 'مُغلقة'),
  annulee: m('Annulée', 'ملغاة'),
  non_presentee: m('Pas venu', 'لم يحضر'),
  mise_de_cote: m('Mise de côté', 'محجوزة جانبًا'),
  a_expedier: m('À expédier', 'للإرسال'),
  expediee: m('Expédiée', 'أُرسلت'),
  livree: m('Livrée', 'سُلّمت'),
  refusee: m('Refusée à la livraison', 'رُفضت عند التسليم'),
  retournee: m('Revenue en boutique', 'عادت إلى المحل'),
  vendue: m('Vendue', 'بيعت'),
};

const ORIGINES: Record<Origine, Mot> = {
  trokacha: m('Trokacha', 'تروكاشا'),
  telephone: m('Téléphone', 'الهاتف'),
  comptoir: m('Sur place', 'في المحل'),
  whatsapp: m('WhatsApp', 'واتساب'),
  messenger: m('Messenger', 'ماسنجر'),
  instagram: m('Instagram', 'إنستغرام'),
  tiktok: m('TikTok', 'تيك توك'),
  ouedkniss: m('Ouedkniss', 'واد كنيس'),
  site: m('Site', 'الموقع'),
  autre: m('Autre', 'أخرى'),
};

export const MOTS_MOYENS: Record<MoyenPaiement, Mot> = {
  especes: m('Espèces', 'نقدًا'),
  cib: m('CIB', 'بطاقة CIB'),
  edahabia: m('Edahabia', 'الذهبية'),
  ccp: m('CCP', 'الحساب البريدي CCP'),
  baridimob: m('BaridiMob', 'بريدي موب'),
  cheque: m('Chèque', 'صك'),
  virement: m('Virement', 'تحويل'),
  transporteur: m('Transporteur', 'الناقل'),
};

export const MOTS_NATURES: Record<NatureMouvement, Mot> = {
  paiement: m('Paiement', 'دفع'),
  remboursement: m('Rendu au client', 'أُرجع للزبون'),
  retenue: m('Retenu sur la caution', 'محتجز من الضمان'),
};

const REPERES: Record<RepereClient, Mot> = {
  bon: m('Bon client', 'زبون جيد'),
  normal: m('Client', 'زبون'),
  ne_plus_servir: m('À ne plus servir', 'لا نتعامل معه مجددًا'),
};

const SORTES = { article: m('Article', 'سلعة'), car: m('Voiture', 'سيارة'), immo: m('Logement', 'مسكن') };

const ETATS_ARTICLE: Record<string, Mot> = {
  draft: m('Brouillon', 'مسودة'),
  publie: m('En ligne', 'منشور'),
  masque: m('Masqué', 'مخفي'),
  rupture: m('Épuisé', 'نفد'),
  programme: m('Programmé', 'مبرمج'),
};

const VOUS = m('Vous', 'أنت');
const MEMBRE = m("Membre de l'équipe", 'عضو في الفريق');

/* --------------------------------- Formes --------------------------------- */

/** « 12 000 DA » / « 12 000 دج » (dans un texte ; les colonnes de montants restent des nombres). */
function montantTexte(n: number, langue: LangueExport): string {
  const v = Math.round(n);
  const chiffres = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${v < 0 ? '-' : ''}${chiffres} ${langue === 'fr' ? 'DA' : 'دج'}`;
}

const dateCourte = (day: string | null | undefined): string =>
  day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : '';

const jourHeure = (day: string | null | undefined, heure: string | null | undefined): string => {
  const d = dateCourte(day);
  return d && heure ? `${d} ${heure}` : d;
};

const instant = (ms: number): string => (ms > 0 ? instantLisible(ms) : '');

function resumeGaranties(garanties: readonly Garantie[], langue: LangueExport): string {
  return garanties
    .map((g) => {
      const parts = [MOTS_FORMES_GARANTIE[g.forme]?.[langue] ?? g.forme];
      if (typeof g.montant === 'number' && g.montant > 0) parts.push(montantTexte(g.montant, langue));
      const detail = g.details?.document || g.details?.banque || null;
      if (detail) parts.push(`(${detail})`);
      let etat = MOTS_ETATS_GARANTIE[g.etat]?.[langue] ?? g.etat;
      if ((g.etat === 'retenue' || g.etat === 'retenue_partielle') && typeof g.retenue === 'number' && g.retenue > 0) {
        etat = `${etat} ${montantTexte(g.retenue, langue)}`;
      }
      return `${parts.join(' ')} : ${etat}`;
    })
    .join(' ; ');
}

/** Nom de fichier sûr : lettres sans accents, chiffres et tirets. */
export function nomDeFichierSur(texte: string, repli: string): string {
  const sans = texte
    .replace(/[àâäáãå]/g, 'a')
    .replace(/[ÀÂÄÁÃÅ]/g, 'A')
    .replace(/[ç]/g, 'c')
    .replace(/[Ç]/g, 'C')
    .replace(/[éèêë]/g, 'e')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[îïíì]/g, 'i')
    .replace(/[ÎÏÍÌ]/g, 'I')
    .replace(/[ôöóòõ]/g, 'o')
    .replace(/[ÔÖÓÒÕ]/g, 'O')
    .replace(/[ùûüú]/g, 'u')
    .replace(/[ÙÛÜÚ]/g, 'U')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return sans || repli;
}

/* --------------------------------- Feuilles --------------------------------- */

export interface DonneesExport {
  langue: LangueExport;
  /** Nom de l'espace (nom du fichier). */
  espaceNom: string;
  operations: readonly Operation[];
  clients: readonly ClientFiche[];
  catalogue: readonly ArticleExport[];
  /** Mouvements de caisse ; `null` : pas le droit de voir les chiffres (feuille absente). */
  caisse: readonly MouvementCaisse[] | null;
  /** Compte qui exporte (« Vous » dans « Noté par »). */
  moi?: string | null;
  /** Noms connus des membres de l'équipe (sinon « Membre de l'équipe »). */
  noms?: Readonly<Record<string, string>> | null;
  /** Code de wilaya → nom, dans la langue de l'export. */
  nomWilaya?: ((code: string) => string | null) | null;
  maintenant: number;
}

const col = (w: Mot, langue: LangueExport, largeur: number, montant = false): ColonneXlsx => ({ titre: w[langue], largeur, montant });

function chronologique<T>(list: readonly T[], at: (x: T) => number, id: (x: T) => string): T[] {
  return [...list].sort((a, b) => at(a) - at(b) || id(a).localeCompare(id(b)));
}

export function feuillesCarnet(d: DonneesExport): FeuilleXlsx[] {
  const L = d.langue;
  const rtl = L === 'ar';
  const par = (uid: string | null | undefined): string => {
    if (!uid) return '';
    const nom = d.noms?.[uid];
    if (nom) return nom;
    return uid === d.moi ? VOUS[L] : MEMBRE[L];
  };
  const articles = new Map(d.catalogue.map((a) => [a.id, a]));
  const varianteDe = (op: Operation): string => {
    if (!op.variante) return '';
    const v = articles.get(op.itemId)?.variantes.find((x) => x.cle === op.variante);
    return v ? libelleVariante(v) : '';
  };
  const ops = chronologique(d.operations, (o) => o.creeLe, (o) => o.id);

  const operations: FeuilleXlsx = {
    nom: FEUILLES.operations[L],
    rtl,
    colonnes: [
      col(C.numero, L, 10),
      col(C.type, L, 10),
      col(C.statut, L, 18),
      col(C.origine, L, 12),
      col(C.article, L, 28),
      col(C.variante, L, 14),
      col(C.quantite, L, 9),
      col(C.client, L, 22),
      col(C.tel, L, 15),
      col(C.debut, L, 16),
      col(C.fin, L, 16),
      col(C.total, L, 12, true),
      col(C.paye, L, 12, true),
      col(C.reste, L, 17, true),
      col(C.caution, L, 34),
      col(C.transporteur, L, 14),
      col(C.suivi, L, 16),
      col(C.wilaya, L, 16),
      col(C.notePar, L, 16),
      col(C.creeLe, L, 16),
    ],
    lignes: ops.map((op): CelluleXlsx[] => {
      const paye = totalPaye(op.paiements ?? []);
      // Annulée ou client pas venu : plus rien à payer.
      const reste = op.statut === 'annulee' || op.statut === 'non_presentee' ? 0 : Math.max(0, op.total - paye);
      const exp = op.expedition ?? null;
      return [
        numeroDocument(op.id),
        TYPES[op.type]?.[L] ?? op.type,
        STATUTS[op.statut]?.[L] ?? op.statut,
        ORIGINES[op.origine]?.[L] ?? op.origine,
        op.itemTitre,
        varianteDe(op),
        op.quantite,
        op.clientNom ?? '',
        telLisible(op.clientTel ?? ''),
        jourHeure(op.debut, op.heureDebut),
        jourHeure(op.fin, op.heureFin),
        op.total,
        paye,
        reste,
        resumeGaranties(op.garanties ?? [], L),
        exp?.transporteur ?? '',
        exp?.suivi ?? '',
        exp?.wilaya ? d.nomWilaya?.(exp.wilaya) ?? exp.wilaya : '',
        op.origine === 'trokacha' ? ORIGINES.trokacha[L] : par(op.creePar),
        instant(op.creeLe),
      ];
    }),
  };

  const lignesPaiements = ops.flatMap((op) => (op.paiements ?? []).map((p) => ({ op, p })));
  const paiements: FeuilleXlsx = {
    nom: FEUILLES.paiements[L],
    rtl,
    colonnes: [
      col(C.date, L, 16),
      col(C.numeroOp, L, 12),
      col(C.article, L, 28),
      col(C.client, L, 22),
      col(C.mouvement, L, 16),
      col(C.moyen, L, 16),
      col(C.montant, L, 12, true),
      col(C.reference, L, 14),
      col(C.notePar, L, 16),
    ],
    lignes: chronologique(lignesPaiements, (x) => x.p.at, (x) => x.p.id).map(({ op, p }): CelluleXlsx[] => [
      instant(p.at),
      numeroDocument(op.id),
      op.itemTitre,
      op.clientNom ?? '',
      (p.montant < 0 ? MOTS_NATURES.remboursement : MOTS_NATURES.paiement)[L],
      MOTS_MOYENS[p.moyen]?.[L] ?? p.moyen,
      p.montant,
      p.ref ?? '',
      par(p.par),
    ]),
  };

  const clients: FeuilleXlsx = {
    nom: FEUILLES.clients[L],
    rtl,
    colonnes: [
      col(C.nom, L, 24),
      col(C.tel, L, 15),
      col(C.repere, L, 16),
      col(C.piece, L, 30),
      col(C.operations, L, 11),
      col(C.incidents, L, 10),
      col(C.chiffre, L, 14, true),
      col(C.reste, L, 17, true),
      col(C.derniere, L, 16),
      col(C.notes, L, 40),
    ],
    lignes: [...d.clients]
      .sort((a, b) => a.nom.localeCompare(b.nom) || a.id.localeCompare(b.id))
      .map((c): CelluleXlsx[] => [
        c.nom,
        telLisible(c.tel ?? ''),
        REPERES[c.repere]?.[L] ?? '',
        (c.pieces ?? []).map((p) => [p.type, p.numero].filter(Boolean).join(' ')).filter(Boolean).join(' ; '),
        c.stats?.operations ?? 0,
        c.stats?.incidents ?? 0,
        c.stats?.chiffre ?? 0,
        c.solde ?? 0,
        typeof c.derniereOperation === 'number' && c.derniereOperation > 0 ? dateCourte(jourAlgerDe(c.derniereOperation)) : '',
        c.notes ?? '',
      ]),
  };

  const catalogue: FeuilleXlsx = {
    nom: FEUILLES.catalogue[L],
    rtl,
    colonnes: [
      col(C.titre, L, 30),
      col(C.sorte, L, 10),
      col(C.plaque, L, 14),
      col(C.km, L, 12),
      col(C.prix, L, 12, true),
      col(C.prix7, L, 16, true),
      col(C.tailles, L, 34),
      col(C.stock, L, 9),
      col(C.etat, L, 12),
    ],
    lignes: chronologique(d.catalogue, (a) => a.creeLe, (a) => a.id).map((a): CelluleXlsx[] => {
      const loue = a.sorte !== 'article';
      const tailles = a.variantes.map((v) => `${libelleVariante(v) || v.cle} : ${a.stock[v.cle] ?? 0}`).join(' ; ');
      const stock = a.variantes.length ? a.variantes.reduce((s, v) => s + (a.stock[v.cle] ?? 0), 0) : a.quantite;
      const prix7 = loue ? prixParJour(a.paliers, 7) : null;
      const prix1 = loue ? prixParJour(a.paliers, 1) : a.prix;
      return [
        a.titre,
        SORTES[a.sorte][L],
        a.plaque ?? '',
        a.km,
        prix1,
        prix7 !== null && prix7 !== prix1 ? prix7 : null,
        tailles,
        loue ? null : stock,
        a.statut ? ETATS_ARTICLE[a.statut]?.[L] ?? a.statut : '',
      ];
    }),
  };

  const feuilles = [operations, paiements, clients, catalogue];
  if (d.caisse) {
    feuilles.push({
      nom: FEUILLES.caisse[L],
      rtl,
      colonnes: [
        col(C.date, L, 16),
        col(C.mouvement, L, 20),
        col(C.moyen, L, 16),
        col(C.montant, L, 12, true),
        col(C.numeroOp, L, 12),
        col(C.article, L, 28),
        col(C.client, L, 22),
        col(C.notePar, L, 16),
      ],
      lignes: chronologique(d.caisse, (x) => x.at, (x) => x.id).map((x): CelluleXlsx[] => [
        x.at > 0 ? instant(x.at) : dateCourte(x.jour),
        MOTS_NATURES[x.nature]?.[L] ?? x.nature,
        MOTS_MOYENS[x.moyen]?.[L] ?? x.moyen,
        x.montant,
        numeroDocument(x.opId),
        x.itemTitre,
        x.clientNom ?? '',
        par(x.par),
      ]),
    });
  }
  return feuilles;
}

export interface ExportCarnet {
  /** « Carnet-Tipaza-Auto-Location-15-11-2026.xlsx ». */
  nomFichier: string;
  octets: Uint8Array;
  /** Lignes écrites (toutes feuilles, en-têtes non comptés). */
  lignes: number;
}

/** Le classeur du carnet, prêt à enregistrer ou partager. */
export function exportCarnet(d: DonneesExport): ExportCarnet {
  const feuilles = feuillesCarnet(d);
  const jour = jourAlgerDe(d.maintenant);
  const date = `${jour.slice(8, 10)}-${jour.slice(5, 7)}-${jour.slice(0, 4)}`;
  return {
    nomFichier: `Carnet-${nomDeFichierSur(d.espaceNom, 'Espace')}-${date}.xlsx`,
    octets: classeurXlsx(feuilles, d.maintenant),
    lignes: feuilles.reduce((s, f) => s + f.lignes.length, 0),
  };
}
