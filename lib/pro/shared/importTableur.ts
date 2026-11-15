// lib/pro/shared/importTableur.ts
// =============================================================================
// IMPORT D'UN TABLEUR (module PUR) : le pro copie des cellules d'Excel et les
// colle (tabulations), ou dépose un fichier .csv. On lit le tableau, on
// reconnaît les colonnes par leur titre (français, arabe, anglais), on lit les
// nombres comme un pro les écrit (« 5 000 DA », « 4.500 »), puis on contrôle
// chaque ligne avec LA règle du serveur (`lib/pro-core/import.ts`) avant
// l'envoi à `proImport`, par paquets de 200 lignes qui ne coupent jamais un
// article en deux.
// =============================================================================

import {
  cleTitre,
  IMPORT_LIGNES_MAX,
  lireLigneArticle,
  lireLigneFlotte,
  plaquesEnDouble,
  regrouperArticles,
  type ErreurLigne,
  type LigneArticle,
  type LigneFlotte,
  type SorteImport,
} from '@/lib/pro-core';
import { searchKey } from './format';

export type ColonneFlotte = 'titre' | 'kind' | 'plaque' | 'prixJour' | 'prixSemaine' | 'km' | 'capacite';
export type ColonneArticle = 'titre' | 'prix' | 'quantite' | 'taille' | 'couleur' | 'prixAchat' | 'fournisseur' | 'codeBarre';
export type Colonne = ColonneFlotte | ColonneArticle;

export const COLONNES: Record<SorteImport, readonly Colonne[]> = {
  flotte: ['titre', 'plaque', 'prixJour', 'prixSemaine', 'km', 'capacite', 'kind'],
  articles: ['titre', 'prix', 'quantite', 'taille', 'couleur', 'prixAchat', 'fournisseur', 'codeBarre'],
};

/** Colonnes sans lesquelles rien ne s'importe. */
export const COLONNES_REQUISES: Record<SorteImport, readonly Colonne[]> = {
  flotte: ['titre', 'prixJour'],
  articles: ['titre', 'prix'],
};

/* --------------------------------- Tableau --------------------------------- */

/** Lit un texte collé ou un .csv : tabulation, « ; » ou « , », guillemets compris. */
export function parseTable(text: string): string[][] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const firstLine = clean.split('\n').find((l) => l.trim()) ?? '';
  const sep = firstLine.includes('\t') ? '\t' : (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) && firstLine.includes(';') ? ';' : firstLine.includes(',') ? ',' : '\t';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

/* --------------------------- Colonnes par leur titre ------------------------ */

const SYNONYMES: Record<Colonne, readonly string[]> = {
  titre: ['titre', 'nom', 'article', 'modele', 'designation', 'produit', 'vehicule', 'voiture', 'logement', 'libelle', 'title', 'name', 'item', 'product', 'model', 'الاسم', 'المنتج', 'السلعة', 'العنوان', 'السيارة', 'الموديل', 'السكن'],
  plaque: ['plaque', 'immatriculation', 'matricule', 'plate', 'registration', 'الترقيم', 'رقم التسجيل', 'اللوحة', 'الماتريكول'],
  prixJour: ['prix jour', 'prix/jour', 'prix par jour', 'prix journalier', 'tarif jour', 'tarif', 'prix', 'price', 'daily price', 'price per day', 'السعر اليومي', 'سعر اليوم', 'السعر'],
  prixSemaine: ['prix semaine', 'prix 7 jours', 'tarif semaine', 'prix long', 'prix longue duree', 'weekly price', 'price 7 days', 'سعر الأسبوع', 'السعر الأسبوعي'],
  km: ['km', 'kilometrage', 'compteur', 'mileage', 'odometer', 'الكيلومتراج', 'العداد'],
  capacite: ['places', 'capacite', 'personnes', 'seats', 'capacity', 'المقاعد', 'السعة', 'عدد الأشخاص'],
  kind: ['type', 'sorte', 'genre', 'kind', 'النوع'],
  prix: ['prix', 'prix de vente', 'prix vente', 'tarif', 'price', 'sale price', 'السعر', 'سعر البيع', 'الثمن'],
  quantite: ['quantite', 'qte', 'stock', 'pieces', 'nombre', 'quantity', 'qty', 'الكمية', 'المخزون', 'العدد'],
  taille: ['taille', 'pointure', 'size', 'المقاس', 'الحجم'],
  couleur: ['couleur', 'coloris', 'color', 'colour', 'اللون'],
  prixAchat: ['prix achat', "prix d'achat", 'prix d achat', 'cout', 'cost', 'purchase price', 'سعر الشراء', 'التكلفة'],
  fournisseur: ['fournisseur', 'grossiste', 'supplier', 'vendor', 'المورد', 'الممون'],
  codeBarre: ['code barre', 'code-barre', 'code barres', 'code', 'reference', 'ref', 'sku', 'barcode', 'الباركود', 'الرمز', 'المرجع'],
};

const cleEntete = (s: string): string => searchKey(s).replace(/[._:()*]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * La colonne que désigne un titre de colonne : exact d'abord, puis le plus long synonyme
 * par lequel il commence (« Prix semaine (DA) » est le prix à la semaine, pas le prix).
 */
export function colonneDeEntete(entete: string, sorte: SorteImport): Colonne | null {
  const e = cleEntete(entete);
  if (!e) return null;
  const candidates = COLONNES[sorte];
  for (const c of candidates) if (SYNONYMES[c].some((s) => cleEntete(s) === e)) return c;
  let best: { c: Colonne; len: number } | null = null;
  for (const c of candidates) {
    for (const s of SYNONYMES[c]) {
      const k = cleEntete(s);
      if (k && e.startsWith(k) && (!best || k.length > best.len)) best = { c, len: k.length };
    }
  }
  return best?.c ?? null;
}

/** Colonne choisie pour chaque colonne du tableau (`null` : ignorée). */
export type Correspondance = (Colonne | null)[];

/**
 * Première ligne : des titres de colonnes ? Oui si au moins deux sont reconnus, dont le
 * titre de l'article. Sinon, les colonnes sont prises dans l'ordre du modèle.
 */
export function detecterEntete(rows: readonly string[][], sorte: SorteImport): { aUneEntete: boolean; correspondance: Correspondance } {
  const largeur = Math.max(0, ...rows.slice(0, 20).map((r) => r.length));
  const premiere = rows[0] ?? [];
  const vues = new Set<Colonne>();
  const parEntete: Correspondance = premiere.map((h) => {
    const c = colonneDeEntete(h, sorte);
    if (!c || vues.has(c)) return null;
    vues.add(c);
    return c;
  });
  while (parEntete.length < largeur) parEntete.push(null);
  if (vues.size >= 2 && vues.has('titre')) return { aUneEntete: true, correspondance: parEntete };
  const ordre = COLONNES[sorte];
  return { aUneEntete: false, correspondance: Array.from({ length: largeur }, (_, i) => ordre[i] ?? null) };
}

/* ---------------------------------- Valeurs --------------------------------- */

/**
 * Nombre écrit par un pro : « 5 000 DA », « 5.000 », « 4,500 », « 12000,00 ». Rend le
 * texte tel quel s'il n'est pas un nombre (le contrôle le refusera avec sa raison),
 * `null` si la cellule est vide.
 */
export function lireNombre(raw: string | undefined): number | string | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  let t = text
    .replace(/[  \s]/g, '')
    .replace(/(dzd|da|dinars?|دج|دينار|km|kms)$/i, '')
    .replace(/^(dzd|da)/i, '');
  // Chiffres arabes orientaux.
  t = t.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '');
  else t = t.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return text;
  return Math.round(Number(t));
}

const VOITURE = ['voiture', 'vehicule', 'auto', 'car', 'سيارة', 'سيارات'];
const LOGEMENT = ['logement', 'appartement', 'appart', 'maison', 'studio', 'villa', 'f2', 'f3', 'f4', 'immo', 'apartment', 'house', 'flat', 'شقة', 'سكن', 'منزل', 'فيلا'];

function lireSorteBien(raw: string | undefined): string | undefined {
  const k = searchKey(raw);
  if (!k) return undefined;
  if (VOITURE.some((v) => k.startsWith(searchKey(v)))) return 'car';
  if (LOGEMENT.some((v) => k.startsWith(searchKey(v)))) return 'immo';
  return k;
}

const NOMBRES: ReadonlySet<Colonne> = new Set(['prixJour', 'prixSemaine', 'km', 'capacite', 'prix', 'quantite', 'prixAchat']);

/** Lignes brutes à contrôler et à envoyer (une par ligne du tableau, entête exclue). */
export function lignesBrutes(rows: readonly string[][], correspondance: Correspondance, aUneEntete: boolean): Record<string, unknown>[] {
  return rows.slice(aUneEntete ? 1 : 0).map((row) => {
    const out: Record<string, unknown> = {};
    correspondance.forEach((col, i) => {
      if (!col) return;
      const cell = row[i];
      if (col === 'kind') {
        const k = lireSorteBien(cell);
        if (k !== undefined) out.kind = k;
      } else if (NOMBRES.has(col)) {
        const n = lireNombre(cell);
        if (n !== null) out[col] = n;
      } else if (cell && cell.trim()) out[col] = cell.trim();
    });
    return out;
  });
}

/* --------------------------------- Aperçu ---------------------------------- */

export interface LigneApercu {
  index: number;
  brute: Record<string, unknown>;
  /** Raison du refus, `null` si la ligne s'importe. */
  raison: string | null;
}

export interface Existants {
  /** Titres du catalogue (clé `cleTitre`). */
  titres: ReadonlySet<string>;
  /** Plaques du catalogue (sans espaces ni tirets, en majuscules). */
  plaques: ReadonlySet<string>;
}

export const clePlaque = (plaque: string | null | undefined): string => (plaque ?? '').replace(/[\s-]/g, '').toUpperCase();

/** Même contrôle que le serveur, ligne par ligne, avant l'envoi. */
export function apercu(sorte: SorteImport, brutes: readonly Record<string, unknown>[], existants: Existants): LigneApercu[] {
  const raisons = new Map<number, string>();
  const lues = brutes.map((b, index) => {
    const r = sorte === 'flotte' ? lireLigneFlotte(b) : lireLigneArticle(b);
    if (!r.ok) {
      raisons.set(index, (r as { reason: string }).reason);
      return null;
    }
    return r.value;
  });
  const ajouter = (erreurs: readonly ErreurLigne[]) => {
    for (const e of erreurs) if (!raisons.has(e.index)) raisons.set(e.index, e.reason);
  };
  if (sorte === 'flotte') {
    ajouter(plaquesEnDouble(lues as (LigneFlotte | null)[]));
    (lues as (LigneFlotte | null)[]).forEach((l, index) => {
      if (l?.plaque && existants.plaques.has(clePlaque(l.plaque)) && !raisons.has(index)) raisons.set(index, 'DEJA_AU_CATALOGUE');
    });
  } else {
    const groupes = regrouperArticles(lues as (LigneArticle | null)[]);
    ajouter(groupes.erreurs);
    for (const a of groupes.articles) {
      if (!existants.titres.has(cleTitre(a.titre))) continue;
      for (const index of a.lignes) if (!raisons.has(index)) raisons.set(index, 'DEJA_AU_CATALOGUE');
    }
  }
  return brutes.map((brute, index) => ({ index, brute, raison: raisons.get(index) ?? null }));
}

/** Nombre d'articles (ou de véhicules) que les lignes valides donneront. */
export function compterCreations(sorte: SorteImport, lignes: readonly LigneApercu[]): number {
  const valides = lignes.filter((l) => !l.raison);
  if (sorte === 'flotte') return valides.length;
  return new Set(valides.map((l) => cleTitre(String(l.brute.titre ?? '')))).size;
}

/* --------------------------------- Envois ---------------------------------- */

export interface PaquetImport {
  lignes: Record<string, unknown>[];
  /** Index dans l'aperçu de chaque ligne envoyée (pour relire les refus du serveur). */
  index: number[];
}

/** Paquets de 200 lignes au plus ; les lignes d'un même article restent ensemble. */
export function paquets(sorte: SorteImport, lignes: readonly LigneApercu[], max = IMPORT_LIGNES_MAX): PaquetImport[] {
  const valides = lignes.filter((l) => !l.raison);
  const groupes: LigneApercu[][] = [];
  if (sorte === 'flotte') for (const l of valides) groupes.push([l]);
  else {
    const parTitre = new Map<string, LigneApercu[]>();
    for (const l of valides) {
      const k = cleTitre(String(l.brute.titre ?? ''));
      const g = parTitre.get(k);
      if (g) g.push(l);
      else {
        const neu = [l];
        parTitre.set(k, neu);
        groupes.push(neu);
      }
    }
  }
  const out: PaquetImport[] = [];
  let courant: PaquetImport = { lignes: [], index: [] };
  for (const g of groupes) {
    if (courant.lignes.length && courant.lignes.length + g.length > max) {
      out.push(courant);
      courant = { lignes: [], index: [] };
    }
    for (const l of g) {
      courant.lignes.push(l.brute);
      courant.index.push(l.index);
    }
  }
  if (courant.lignes.length) out.push(courant);
  return out;
}

/** Identifiant d'un envoi (`im_…`), fait sur l'appareil : un envoi rejoué ne crée rien deux fois. */
export function newImportId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rand = '';
  for (const b of Array.from(bytes)) rand += alphabet[b % alphabet.length];
  return `im_${Date.now().toString(36)}${rand}`;
}
