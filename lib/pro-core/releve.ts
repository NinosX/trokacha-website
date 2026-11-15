// COPIE GÉNÉRÉE depuis functions/src/pro/core/releve.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/releve.ts
 *
 * RELEVÉ DU MOIS : une page bilingue à imprimer ou garder en PDF (téléphone : `expo-print` ;
 * site : impression du navigateur), faite avec le même en-tête et la même feuille de style que
 * les documents. Ce qui est entré en caisse (agrégats `jours` du mois), le détail par moyen de
 * paiement, l'argent rendu aux clients et la part gardée des cautions (mouvements de caisse du
 * mois), puis les opérations du mois. Réservé à qui voit les chiffres (l'appelant le vérifie).
 * Module PUR.
 */

import { jourAlgerDe } from './dates';
import { dateDocument, montantDocument, numeroDocument, PIECES_DOCUMENT, type EspaceDocument, type ReglagesDocuments, type TexteBilingue } from './documents';
import { libelleMois, MOTS_MOYENS, MOTS_NATURES, operationDuMois } from './export';
import { totalPaye } from './money';
import type { JourAgregat, MouvementCaisse, MoyenPaiement, Operation, StatutOperation } from './types';
import { MOYENS_PAIEMENT } from './types';

const { entete, section, champ, grille, lib, ar, ltr, auto, esc, STYLE } = PIECES_DOCUMENT;

type Mot = TexteBilingue;
const m = (fr: string, ar: string): Mot => ({ fr, ar });

const W = {
  titre: m('Relevé du mois', 'كشف الشهر'),
  faitLe: m('Fait le', 'حُرّر في'),
  resume: m('Résumé', 'الخلاصة'),
  encaisse: m('Encaissé net', 'المحصَّل الصافي'),
  rendu: m('Rendu aux clients', 'أُرجع للزبائن'),
  retenu: m('Retenu sur les cautions', 'محتجز من الضمانات'),
  nbOperations: m('Opérations notées', 'العمليات المسجّلة'),
  chiffre: m('Chiffre des opérations', 'رقم أعمال العمليات'),
  parMoyen: m('Par moyen de paiement', 'حسب وسيلة الدفع'),
  moyen: m('Moyen', 'الوسيلة'),
  montant: m('Montant', 'المبلغ'),
  rendusRetenus: m('Rendus et cautions retenues', 'المبالغ المُرجعة والضمانات المحتجزة'),
  date: m('Date', 'التاريخ'),
  numero: m('N°', 'رقم'),
  article: m('Article ou bien', 'السلعة أو الملك'),
  client: m('Client', 'الزبون'),
  mouvement: m('Mouvement', 'الحركة'),
  operationsMois: m('Opérations du mois', 'عمليات الشهر'),
  statut: m('Statut', 'الحالة'),
  total: m('Total', 'المجموع'),
  paye: m('Payé', 'المدفوع'),
  reste: m('Reste', 'الباقي'),
  aucun: m('Aucun', 'لا شيء'),
  aucune: m('Aucune opération ce mois.', 'لا عملية في هذا الشهر.'),
  totaux: m('Totaux (hors annulées)', 'المجاميع (دون الملغاة)'),
  note: m(
    'Locations comptées au jour de leur début, ventes au jour où elles ont été notées.',
    'الكراء يُحسب بيوم بدايته، والبيع بيوم تسجيله.',
  ),
};

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

const ECARTEES: ReadonlySet<StatutOperation> = new Set(['annulee', 'non_presentee']);

export interface DonneesReleve {
  /** « 2026-11 ». */
  mois: string;
  espace: EspaceDocument;
  reglages?: ReglagesDocuments | null;
  /** Agrégats des jours du mois (les jours sans rien peuvent manquer). */
  jours: readonly JourAgregat[];
  /** Mouvements de caisse du mois (seuls les rendus et les parts gardées sont détaillés). */
  mouvements: readonly MouvementCaisse[];
  /** Opérations lues autour du mois ; le relevé garde celles du mois (`operationDuMois`). */
  operations: readonly Operation[];
  maintenant: number;
}

export interface ReleveMois {
  /** « Relevé du mois Novembre 2026 ». */
  titre: string;
  /** « Releve-2026-11 ». */
  nomFichier: string;
  html: string;
  /** Rien dans le mois : ni argent, ni opération. */
  vide: boolean;
}

const th = (w: Mot, cls = '') => `<th class="${cls}"><div class="th"><span>${esc(w.fr)}</span>${ar(w.ar)}</div></th>`;
const duoCourt = (w: Mot) => `<span class="pile">${esc(w.fr)}<br/>${ar(w.ar)}</span>`;
const moyenMot = (moyen: string): Mot => MOTS_MOYENS[moyen as MoyenPaiement] ?? m(moyen, moyen);

export function releveMois(d: DonneesReleve): ReleveMois {
  const mois = d.mois;
  const jours = d.jours.filter((j) => j.jour.slice(0, 7) === mois);
  const somme = (f: (j: JourAgregat) => number) => jours.reduce((s, j) => s + (Number.isFinite(f(j)) ? f(j) : 0), 0);
  const encaisse = somme((j) => j.encaisse);
  const rendu = somme((j) => j.rembourse ?? 0);
  const retenu = somme((j) => j.retenu ?? 0);
  const nbOps = somme((j) => j.operations);
  const chiffre = somme((j) => j.chiffre);

  const parMoyen = new Map<string, number>();
  for (const j of jours) for (const [moyen, montant] of Object.entries(j.encaissements ?? {})) parMoyen.set(moyen, (parMoyen.get(moyen) ?? 0) + (montant ?? 0));
  const ordre = [...MOYENS_PAIEMENT, ...[...parMoyen.keys()].filter((k) => !(MOYENS_PAIEMENT as readonly string[]).includes(k)).sort()];
  const lignesMoyens = ordre
    .filter((k) => (parMoyen.get(k) ?? 0) !== 0)
    .map((k) => `<tr><td>${esc(moyenMot(k).fr)} <span class="sep">·</span> ${ar(moyenMot(k).ar)}</td><td class="n">${ltr(montantDocument(parMoyen.get(k) ?? 0))}</td></tr>`)
    .join('');

  const speciaux = d.mouvements
    .filter((x) => x.jour.slice(0, 7) === mois && (x.nature === 'remboursement' || x.nature === 'retenue'))
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const lignesSpeciales = speciaux
    .map(
      (x) =>
        `<tr><td class="n0">${ltr(dateDocument(x.jour))}</td><td class="n0">${ltr(numeroDocument(x.opId))}</td><td>${auto(x.itemTitre)}</td><td>${auto(x.clientNom ?? '')}</td><td>${duoCourt(MOTS_NATURES[x.nature] ?? m(x.nature, x.nature))}</td><td class="n">${ltr(montantDocument(x.montant))}</td></tr>`,
    )
    .join('');

  const ops = d.operations
    .filter((op) => operationDuMois(op, mois))
    .sort((a, b) => (a.debut ?? jourAlgerDe(a.creeLe)).localeCompare(b.debut ?? jourAlgerDe(b.creeLe)) || a.creeLe - b.creeLe || a.id.localeCompare(b.id));
  let tTotal = 0;
  let tPaye = 0;
  let tReste = 0;
  const lignesOps = ops
    .map((op) => {
      const paye = totalPaye(op.paiements ?? []);
      const reste = ECARTEES.has(op.statut) ? 0 : Math.max(0, op.total - paye);
      if (!ECARTEES.has(op.statut)) {
        tTotal += op.total;
        tPaye += paye;
        tReste += reste;
      }
      const jour = op.type === 'location' && op.debut ? op.debut : jourAlgerDe(op.creeLe);
      return `<tr class="${ECARTEES.has(op.statut) ? 'barre' : ''}"><td class="n0">${ltr(dateDocument(jour))}</td><td class="n0">${ltr(numeroDocument(op.id))}</td><td>${auto(op.itemTitre)}</td><td>${auto(op.clientNom ?? '')}</td><td>${duoCourt(STATUTS[op.statut] ?? m(op.statut, op.statut))}</td><td class="n">${ltr(montantDocument(op.total))}</td><td class="n">${ltr(montantDocument(paye))}</td><td class="n">${ltr(montantDocument(reste))}</td></tr>`;
    })
    .join('');

  const moisFr = libelleMois(mois, 'fr');
  const moisAr = libelleMois(mois, 'ar');
  const date = dateDocument(jourAlgerDe(d.maintenant));
  const bandeau = `<div class="titre">
  <span class="t-fr">${esc(W.titre.fr)}</span>
  <span class="t-num"><b>${esc(moisFr)}</b> <span class="sep">·</span> ${ar(moisAr)}<br/>${esc(W.faitLe.fr)} ${ltr(date)} ${ar(W.faitLe.ar)}</span>
  <span class="t-ar" dir="rtl" lang="ar">${esc(W.titre.ar)}</span>
</div>`;

  const resume = section(
    W.resume,
    grille(3, [
      champ(W.encaisse, ltr(montantDocument(encaisse)), 'fort'),
      champ(W.rendu, ltr(montantDocument(rendu))),
      champ(W.retenu, ltr(montantDocument(retenu))),
    ]) + grille(2, [champ(W.nbOperations, ltr(String(nbOps))), champ(W.chiffre, ltr(montantDocument(chiffre)))]),
  );
  const moyens = section(
    W.parMoyen,
    `<table class="lignes"><thead><tr>${th(W.moyen)}${th(W.montant, 'n')}</tr></thead><tbody>${lignesMoyens || `<tr><td>${esc(W.aucun.fr)} <span class="sep">·</span> ${ar(W.aucun.ar)}</td><td></td></tr>`}</tbody></table>`,
  );
  const rendus = section(
    W.rendusRetenus,
    `<table class="lignes"><thead><tr>${th(W.date)}${th(W.numero)}${th(W.article)}${th(W.client)}${th(W.mouvement)}${th(W.montant, 'n')}</tr></thead><tbody>${
      lignesSpeciales || `<tr><td colspan="6">${esc(W.aucun.fr)} <span class="sep">·</span> ${ar(W.aucun.ar)}</td></tr>`
    }</tbody></table>`,
    'cond',
  );
  const operations = section(
    W.operationsMois,
    `<table class="lignes ops"><thead><tr>${th(W.date)}${th(W.numero)}${th(W.article)}${th(W.client)}${th(W.statut)}${th(W.total, 'n')}${th(W.paye, 'n')}${th(W.reste, 'n')}</tr></thead><tbody>${
      lignesOps || `<tr><td colspan="8">${esc(W.aucune.fr)} <span class="sep">·</span> ${ar(W.aucune.ar)}</td></tr>`
    }</tbody>${
      ops.length
        ? `<tfoot><tr><td colspan="5">${lib(W.totaux)}</td><td class="n">${ltr(montantDocument(tTotal))}</td><td class="n">${ltr(montantDocument(tPaye))}</td><td class="n">${ltr(montantDocument(tReste))}</td></tr></tfoot>`
        : ''
    }</table><div class="note">${esc(W.note.fr)}<br/>${ar(W.note.ar)}</div>`,
    'cond',
  );

  const titre = `${W.titre.fr} ${moisFr}`;
  const html = `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(titre)}</title>
<style>${STYLE}
thead { display: table-header-group; }
tfoot { display: table-footer-group; }
tr { break-inside: avoid; page-break-inside: avoid; }
table.lignes td.n0 { white-space: nowrap; }
table.lignes tfoot td { border-top: 1.5px solid #111; border-bottom: 0; font-weight: 800; }
table.lignes tfoot .lib { font-size: 10px; color: #111; }
table.ops { font-size: 9.5px; }
tr.barre td { color: #888; }
.pile { display: inline-block; line-height: 1.15; font-size: 9px; }
.note { margin-top: 1.2mm; font-size: 8.5px; color: #555; }
</style>
</head>
<body>
${entete({ espace: d.espace, reglages: d.reglages ?? null })}
${bandeau}
${resume}
${moyens}
${rendus}
${operations}
</body>
</html>`;
  return {
    titre,
    nomFichier: `Releve-${mois}`,
    html,
    vide: encaisse === 0 && rendu === 0 && retenu === 0 && nbOps === 0 && ops.length === 0 && speciaux.length === 0,
  };
}
