// COPIE GÉNÉRÉE depuis functions/src/pro/core/import.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/import.ts
 *
 * IMPORT D'UN TABLEUR dans le catalogue du pro (flotte d'une agence, articles d'une
 * boutique) : lecture et contrôle des lignes, puis regroupement des tailles et couleurs
 * d'un même article. Copié dans l'application et le site : voir `types.ts`.
 *
 * Une seule règle pour l'aperçu du site et pour le serveur (`proImport`) : le site montre
 * les erreurs ligne par ligne AVANT l'envoi, le serveur refait le même contrôle.
 * Les valeurs arrivent déjà en nombres (le site lit « 5 000 DA » avant d'appeler).
 * Ce qui est importé naît en brouillon : aucune annonce n'est publiée par un import.
 */

import type { Resultat } from './input';
import { TEXTE_COURT_MAX } from './input';
import { isMontant } from './money';
import type { StockParVariante, Variante } from './types';
import { nouvelleCle, STOCK_MAX_PAR_VARIANTE, VARIANTES_MAX } from './variants';

/** Lignes par appel (le site découpe un grand tableur en plusieurs envois). */
export const IMPORT_LIGNES_MAX = 200;
export const IMPORT_ID_RE = /^im_[A-Za-z0-9]{8,40}$/;
export type SorteImport = 'flotte' | 'articles';

export const PLAQUE_MAX = 20;
export const TAILLE_MAX = 20;
export const COULEUR_MAX = 40;
export const FOURNISSEUR_MAX = 80;
export const CODE_BARRE_MAX = 60;
export const KM_MAX = 2_000_000;
export const CAPACITE_MAX = 60;

/** Une voiture ou un logement de la flotte. */
export interface LigneFlotte {
  titre: string;
  kind: 'car' | 'immo';
  plaque: string | null;
  /** Prix par jour (1 à 6 jours). */
  prixJour: number;
  /** Prix par jour à partir de 7 jours (plus bas que `prixJour`), facultatif. */
  prixSemaine: number | null;
  km: number | null;
  capacite: number | null;
}

/** Une ligne d'article : une taille et une couleur au plus (une ligne par variante). */
export interface LigneArticle {
  titre: string;
  prix: number;
  quantite: number;
  taille: string | null;
  couleur: string | null;
  prixAchat: number | null;
  fournisseur: string | null;
  codeBarre: string | null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Refus d'un contrôle intermédiaire, rendu sous le type du résultat final. */
function refus<T>(r: Resultat<unknown>): Resultat<T> {
  return { ok: false, reason: (r as { reason: string }).reason };
}

function texteFacultatif(v: unknown, max: number): Resultat<string | null> {
  if (v == null) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, reason: 'TEXTE_INVALIDE' };
  const t = v.trim().replace(/\s+/g, ' ');
  if (!t) return { ok: true, value: null };
  if (t.length > max) return { ok: false, reason: 'TEXTE_TROP_LONG' };
  return { ok: true, value: t };
}

function titreDe(v: unknown): Resultat<string> {
  const t = texteFacultatif(v, TEXTE_COURT_MAX);
  if (!t.ok) return refus(t);
  if (!t.value || t.value.length < 2) return { ok: false, reason: 'TITRE_REQUIS' };
  return { ok: true, value: t.value };
}

function entierFacultatif(v: unknown, min: number, max: number, reason: string): Resultat<number | null> {
  if (v == null) return { ok: true, value: null };
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) return { ok: false, reason };
  return { ok: true, value: v };
}

function montantFacultatif(v: unknown, reason: string): Resultat<number | null> {
  if (v == null) return { ok: true, value: null };
  if (!isMontant(v) || v <= 0) return { ok: false, reason };
  return { ok: true, value: v };
}

/** Clé de comparaison d'un titre (casse, accents et espaces ignorés). */
export function cleTitre(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function lireLigneFlotte(raw: unknown): Resultat<LigneFlotte> {
  const d = isRecord(raw) ? raw : {};
  const titre = titreDe(d.titre);
  if (!titre.ok) return refus(titre);
  const kind = d.kind == null ? 'car' : d.kind;
  if (kind !== 'car' && kind !== 'immo') return { ok: false, reason: 'SORTE_INVALIDE' };
  const plaque = texteFacultatif(d.plaque, PLAQUE_MAX);
  if (!plaque.ok) return refus(plaque);
  if (!isMontant(d.prixJour) || (d.prixJour as number) <= 0) return { ok: false, reason: 'PRIX_INVALIDE' };
  const prixJour = d.prixJour as number;
  const prixSemaine = montantFacultatif(d.prixSemaine, 'PRIX_SEMAINE_INVALIDE');
  if (!prixSemaine.ok) return refus(prixSemaine);
  // Les paliers d'une location baissent avec la durée (même règle que l'application).
  if (prixSemaine.value !== null && prixSemaine.value >= prixJour) return { ok: false, reason: 'PRIX_SEMAINE_INVALIDE' };
  const km = entierFacultatif(d.km, 0, KM_MAX, 'KM_INVALIDE');
  if (!km.ok) return refus(km);
  const capacite = entierFacultatif(d.capacite, 1, CAPACITE_MAX, 'CAPACITE_INVALIDE');
  if (!capacite.ok) return refus(capacite);
  return { ok: true, value: { titre: titre.value, kind, plaque: plaque.value, prixJour, prixSemaine: prixSemaine.value, km: km.value, capacite: capacite.value } };
}

export function lireLigneArticle(raw: unknown): Resultat<LigneArticle> {
  const d = isRecord(raw) ? raw : {};
  const titre = titreDe(d.titre);
  if (!titre.ok) return refus(titre);
  if (!isMontant(d.prix) || (d.prix as number) <= 0) return { ok: false, reason: 'PRIX_INVALIDE' };
  const quantite = d.quantite == null ? 1 : d.quantite;
  if (typeof quantite !== 'number' || !Number.isInteger(quantite) || quantite < 0 || quantite > STOCK_MAX_PAR_VARIANTE) return { ok: false, reason: 'QUANTITE_INVALIDE' };
  const taille = texteFacultatif(d.taille, TAILLE_MAX);
  if (!taille.ok) return refus(taille);
  const couleur = texteFacultatif(d.couleur, COULEUR_MAX);
  if (!couleur.ok) return refus(couleur);
  const prixAchat = montantFacultatif(d.prixAchat, 'PRIX_ACHAT_INVALIDE');
  if (!prixAchat.ok) return refus(prixAchat);
  const fournisseur = texteFacultatif(d.fournisseur, FOURNISSEUR_MAX);
  if (!fournisseur.ok) return refus(fournisseur);
  const codeBarre = texteFacultatif(d.codeBarre, CODE_BARRE_MAX);
  if (!codeBarre.ok) return refus(codeBarre);
  return {
    ok: true,
    value: {
      titre: titre.value,
      prix: d.prix as number,
      quantite,
      taille: taille.value,
      couleur: couleur.value,
      prixAchat: prixAchat.value,
      fournisseur: fournisseur.value,
      codeBarre: codeBarre.value,
    },
  };
}

/** Erreur d'une ligne (index dans la liste envoyée). */
export interface ErreurLigne {
  index: number;
  reason: string;
}

/** Un article à créer : une ligne (compteur de pièces) ou plusieurs (tailles et couleurs). */
export interface ArticleImporte {
  titre: string;
  prix: number;
  prixAchat: number | null;
  fournisseur: string | null;
  codeBarre: string | null;
  /** Index des lignes qui le composent. */
  lignes: number[];
  /** `null` : article sans tailles ni couleurs (compteur `quantite`). */
  variantes: Variante[] | null;
  stock: StockParVariante | null;
  quantite: number;
}

const coupleDe = (l: Pick<LigneArticle, 'taille' | 'couleur'>): string => `${(l.taille ?? '').toLowerCase()}|${(l.couleur ?? '').toLowerCase()}`;

interface Groupe {
  article: ArticleImporte;
  couples: Set<string>;
  avecVariantes: boolean;
}

/** Pourquoi une ligne ne peut pas rejoindre l'article déjà commencé sous le même titre. */
function raisonDeRefus(groupe: Groupe, ligne: LigneArticle, aUneVariante: boolean): string | null {
  if (ligne.prix !== groupe.article.prix) return 'PRIX_DIFFERENT';
  if (!groupe.avecVariantes && !aUneVariante) return 'ARTICLE_EN_DOUBLE';
  if (groupe.avecVariantes !== aUneVariante) return 'TAILLE_MANQUANTE';
  if (groupe.couples.has(coupleDe(ligne))) return 'VARIANTE_EN_DOUBLE';
  if ((groupe.article.variantes?.length ?? 0) >= VARIANTES_MAX) return 'TROP_DE_VARIANTES';
  return null;
}

/**
 * Regroupe les lignes d'articles par titre : les lignes d'un même titre deviennent les
 * tailles et couleurs d'un seul article. Une ligne qui contredit les précédentes du même
 * titre (prix différent, taille et couleur répétées, ligne sans taille mêlée à des lignes
 * avec taille) est rendue en erreur, l'article garde les autres.
 */
export function regrouperArticles(lignes: readonly (LigneArticle | null)[]): { articles: ArticleImporte[]; erreurs: ErreurLigne[] } {
  const erreurs: ErreurLigne[] = [];
  const parTitre = new Map<string, Groupe>();
  lignes.forEach((ligne, index) => {
    if (!ligne) return;
    const cle = cleTitre(ligne.titre);
    const aUneVariante = !!(ligne.taille || ligne.couleur);
    const deja = parTitre.get(cle);
    if (!deja) {
      const variantes: Variante[] | null = aUneVariante ? [{ cle: nouvelleCle(ligne.taille, ligne.couleur, []), taille: ligne.taille, couleur: ligne.couleur }] : null;
      parTitre.set(cle, {
        avecVariantes: aUneVariante,
        couples: new Set([coupleDe(ligne)]),
        article: {
          titre: ligne.titre,
          prix: ligne.prix,
          prixAchat: ligne.prixAchat,
          fournisseur: ligne.fournisseur,
          codeBarre: aUneVariante ? null : ligne.codeBarre,
          lignes: [index],
          variantes,
          stock: variantes ? { [variantes[0].cle]: ligne.quantite } : null,
          quantite: ligne.quantite,
        },
      });
      if (variantes) variantes[0].code = ligne.codeBarre;
      return;
    }
    const { article } = deja;
    const refus = raisonDeRefus(deja, ligne, aUneVariante);
    if (refus) {
      erreurs.push({ index, reason: refus });
      return;
    }
    const variantes = article.variantes as Variante[];
    const v: Variante = { cle: nouvelleCle(ligne.taille, ligne.couleur, variantes.map((x) => x.cle)), taille: ligne.taille, couleur: ligne.couleur, code: ligne.codeBarre };
    variantes.push(v);
    (article.stock as StockParVariante)[v.cle] = ligne.quantite;
    article.quantite += ligne.quantite;
    article.lignes.push(index);
    deja.couples.add(coupleDe(ligne));
    if (article.prixAchat == null && ligne.prixAchat != null) article.prixAchat = ligne.prixAchat;
    if (article.fournisseur == null && ligne.fournisseur != null) article.fournisseur = ligne.fournisseur;
  });
  return { articles: [...parTitre.values()].map((x) => x.article), erreurs };
}

/** Lignes de flotte en double (même plaque) : la seconde est rendue en erreur. */
export function plaquesEnDouble(lignes: readonly (LigneFlotte | null)[]): ErreurLigne[] {
  const vues = new Set<string>();
  const erreurs: ErreurLigne[] = [];
  lignes.forEach((ligne, index) => {
    if (!ligne?.plaque) return;
    const cle = ligne.plaque.replace(/[\s-]/g, '').toUpperCase();
    if (vues.has(cle)) erreurs.push({ index, reason: 'PLAQUE_EN_DOUBLE' });
    vues.add(cle);
  });
  return erreurs;
}

/** Raisons « même nom » d'une ligne de flotte sans plaque (laissée de côté sauf demande du pro). */
export const MEME_NOM_FLOTTE = 'MEME_NOM_FLOTTE';
export const MEME_NOM_LIGNE = 'MEME_NOM_LIGNE';

/**
 * Véhicules ou logements SANS plaque qui portent le nom d'un bien déjà au catalogue
 * (`MEME_NOM_FLOTTE`) ou d'une ligne plus haut dans le tableau (`MEME_NOM_LIGNE`).
 * Une agence a souvent plusieurs voitures du même modèle : ces lignes ne sont pas des
 * erreurs, mais recoller le même tableau ne doit pas doubler la flotte en silence. Elles
 * sont donc laissées de côté, sauf si le pro coche « Importer aussi les lignes au même
 * nom » (le site envoie alors `memesNoms: true` et cette règle ne s'applique pas).
 * Une ligne AVEC plaque n'est jamais visée (la plaque distingue les voitures), mais son
 * nom compte pour les lignes sans plaque qui la suivent. `ignorer` : lignes déjà refusées.
 */
export function nomsEnDouble(
  lignes: readonly (LigneFlotte | null)[],
  titresExistants: ReadonlySet<string>,
  ignorer: ReadonlySet<number> = new Set(),
): ErreurLigne[] {
  const vus = new Set<string>();
  const erreurs: ErreurLigne[] = [];
  lignes.forEach((ligne, index) => {
    if (!ligne || ignorer.has(index)) return;
    const cle = cleTitre(ligne.titre);
    if (!ligne.plaque) {
      if (titresExistants.has(cle)) erreurs.push({ index, reason: MEME_NOM_FLOTTE });
      else if (vus.has(cle)) erreurs.push({ index, reason: MEME_NOM_LIGNE });
    }
    vus.add(cle);
  });
  return erreurs;
}

/** Paliers de prix d'une ligne de flotte (forme de l'application : le dernier est ouvert). */
export function paliersDeFlotte(ligne: Pick<LigneFlotte, 'prixJour' | 'prixSemaine'>): { upToDays: number | null; pricePerDay: number }[] {
  return ligne.prixSemaine !== null
    ? [
        { upToDays: 6, pricePerDay: ligne.prixJour },
        { upToDays: null, pricePerDay: ligne.prixSemaine },
      ]
    : [{ upToDays: null, pricePerDay: ligne.prixJour }];
}
