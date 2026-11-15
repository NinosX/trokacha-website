'use client';

// components/pro/shared/ProImportPanel.tsx
// =============================================================================
// « IMPORTER UN TABLEUR » : coller des cellules d'Excel (ou déposer un .csv),
// vérifier les colonnes, voir l'aperçu ligne par ligne (même contrôle que le
// serveur), puis importer par paquets de 200 lignes (`proImport`). Chaque
// paquet a son identifiant fait ici : un envoi relancé après une panne ne crée
// rien deux fois. Tout naît en brouillon : rien n'est publié.
// =============================================================================

import { useMemo, useRef, useState } from 'react';
import type { ErreurLigne, SorteImport } from '@/lib/pro-core';
import { callPro, toProCallableError } from '@/lib/pro/callables';
import { useCatalogueKeys } from '@/lib/pro/shared/hooks';
import {
  apercu,
  COLONNES,
  COLONNES_REQUISES,
  compterCreations,
  detecterEntete,
  estMemeNom,
  importTropLong,
  importTropLourd,
  lignesBrutes,
  newImportId,
  paquets,
  parseTable,
  type Colonne,
  type Correspondance,
  type LigneApercu,
  type PaquetImport,
} from '@/lib/pro/shared/importTableur';
import type { ProTextKey, ProTexts } from '@/lib/pro/texts';
import { useProSession } from '../ProSession';

type Etape = 'coller' | 'colonnes' | 'envoi' | 'fini';

interface Fin {
  crees: number;
  /** Lignes non importées, index de l'aperçu → raison. */
  refus: Map<number, string>;
}

const KNOWN_REASONS = new Set([
  'TITRE_REQUIS',
  'PRIX_INVALIDE',
  'PRIX_SEMAINE_INVALIDE',
  'QUANTITE_INVALIDE',
  'KM_INVALIDE',
  'CAPACITE_INVALIDE',
  'SORTE_INVALIDE',
  'TEXTE_TROP_LONG',
  'TEXTE_INVALIDE',
  'PRIX_ACHAT_INVALIDE',
  'PRIX_DIFFERENT',
  'TAILLE_MANQUANTE',
  'ARTICLE_EN_DOUBLE',
  'VARIANTE_EN_DOUBLE',
  'TROP_DE_VARIANTES',
  'PLAQUE_EN_DOUBLE',
  'DEJA_AU_CATALOGUE',
  'MEME_NOM_FLOTTE',
  'MEME_NOM_LIGNE',
]);

const reasonText = (x: ProTexts, reason: string): string => x.t((KNOWN_REASONS.has(reason) ? `imp.reason.${reason}` : 'imp.reason.generic') as ProTextKey);
const colLabel = (x: ProTexts, c: Colonne): string => x.t(`imp.col.${c}` as ProTextKey);

/** Ce qu'on montre d'une ligne dans l'aperçu (les colonnes qui disent de quoi il s'agit). */
function resume(sorte: SorteImport, b: Record<string, unknown>, x: ProTexts): string {
  const parts: string[] = [];
  const money = (v: unknown) => (typeof v === 'number' ? x.money(v) : typeof v === 'string' ? v : '');
  if (sorte === 'flotte') {
    if (b.plaque) parts.push(String(b.plaque));
    if (b.prixJour != null) parts.push(money(b.prixJour));
    if (b.prixSemaine != null) parts.push(`${money(b.prixSemaine)} (7+)`);
  } else {
    if (b.taille) parts.push(String(b.taille));
    if (b.couleur) parts.push(String(b.couleur));
    if (b.prix != null) parts.push(money(b.prix));
    if (b.quantite != null) parts.push(`× ${String(b.quantite)}`);
  }
  return parts.join(' · ');
}

export function ProImportPanel({ bid, sortes }: { bid: string; sortes: SorteImport[] }) {
  const { texts: x } = useProSession();
  const [sorte, setSorte] = useState<SorteImport>(sortes[0]);
  const [etape, setEtape] = useState<Etape>('coller');
  const [texte, setTexte] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [aUneEntete, setAUneEntete] = useState(false);
  const [correspondance, setCorrespondance] = useState<Correspondance>([]);
  const [lireErreur, setLireErreur] = useState<string | null>(null);
  const [seulementErreurs, setSeulementErreurs] = useState(false);
  // « Importer aussi les lignes au même nom » (flotte sans plaque) : envoyé tel quel au serveur.
  const [memesNoms, setMemesNoms] = useState(false);
  const [progres, setProgres] = useState({ done: 0, total: 0 });
  const [envoiErreur, setEnvoiErreur] = useState<string | null>(null);
  const [fin, setFin] = useState<Fin | null>(null);
  // Envoi figé au premier clic (paquets et identifiants) : une relance après une panne renvoie
  // exactement les mêmes paquets, le serveur rejoue ceux déjà faits sans rien recréer.
  const envoi = useRef<{ ids: string[]; envois: PaquetImport[]; lignes: LigneApercu[]; memesNoms: boolean } | null>(null);
  const { existants } = useCatalogueKeys(bid);

  const manquantes = useMemo(() => COLONNES_REQUISES[sorte].filter((c) => !correspondance.includes(c)), [sorte, correspondance]);
  const lignes: LigneApercu[] = useMemo(
    () => (etape === 'coller' || manquantes.length ? [] : apercu(sorte, lignesBrutes(rows, correspondance, aUneEntete), existants, { memesNoms: sorte === 'flotte' && memesNoms })),
    [etape, manquantes.length, sorte, rows, correspondance, aUneEntete, existants, memesNoms],
  );
  // La case n'apparaît que si des lignes portent le même nom (ou si le pro l'a cochée).
  const montrerMemesNoms = sorte === 'flotte' && (memesNoms || lignes.some((l) => estMemeNom(l.raison)));
  const basculerMemesNoms = (v: boolean) => {
    setMemesNoms(v);
    envoi.current = null;
  };
  const pretes = lignes.filter((l) => !l.raison).length;
  const envois = useMemo(() => paquets(sorte, lignes), [sorte, lignes]);
  const offset = aUneEntete ? 2 : 1;

  const lire = (source: string) => {
    if (importTropLourd(source.length)) {
      setLireErreur(x.t('imp.tooBig'));
      return;
    }
    const table = parseTable(source);
    if (!table.length) {
      setLireErreur(x.t('imp.noRows'));
      return;
    }
    if (importTropLong(table.length)) {
      setLireErreur(x.t('imp.tooManyRows'));
      return;
    }
    const d = detecterEntete(table, sorte);
    setRows(table);
    setAUneEntete(d.aUneEntete);
    setCorrespondance(d.correspondance);
    setLireErreur(null);
    setFin(null);
    envoi.current = null;
    setEtape('colonnes');
  };

  const lireFichier = (file: File) => {
    if (importTropLourd(file.size)) {
      setLireErreur(x.t('imp.tooBig'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      // Un .csv enregistré sans UTF-8 donne des caractères de remplacement : on le dit.
      if (!text || text.includes('�')) setLireErreur(x.t('imp.fileError'));
      else {
        setTexte(text);
        lire(text);
      }
    };
    reader.onerror = () => setLireErreur(x.t('imp.fileError'));
    reader.readAsText(file, 'utf-8');
  };

  const changerSorte = (s: SorteImport) => {
    setSorte(s);
    if (rows.length) setCorrespondance(detecterEntete(rows, s).correspondance);
    envoi.current = null;
  };

  const importer = async () => {
    if (!envoi.current) {
      if (!envois.length) return;
      envoi.current = { ids: envois.map(() => newImportId()), envois, lignes, memesNoms: sorte === 'flotte' && memesNoms };
    }
    const fige = envoi.current;
    setEtape('envoi');
    setEnvoiErreur(null);
    setProgres({ done: 0, total: fige.envois.length });
    const refus = new Map<number, string>();
    let crees = 0;
    try {
      for (let i = 0; i < fige.envois.length; i++) {
        const p = fige.envois[i];
        const res = await callPro<{ crees?: number; ignorees?: ErreurLigne[] }>('proImport', {
          bid,
          importId: fige.ids[i],
          sorte,
          lignes: p.lignes,
          ...(fige.memesNoms ? { memesNoms: true } : {}),
        });
        crees += res.crees ?? 0;
        for (const e of res.ignorees ?? []) {
          const index = p.index[e.index];
          if (index !== undefined) refus.set(index, e.reason);
        }
        setProgres({ done: i + 1, total: fige.envois.length });
      }
      for (const l of fige.lignes) if (l.raison) refus.set(l.index, l.raison);
      setFin({ crees, refus });
      setEtape('fini');
    } catch (e) {
      const reason = toProCallableError(e).reason;
      setEnvoiErreur(['PAS_LE_DROIT', 'PAS_DE_LOCATION', 'PAS_DE_VENTE'].includes(reason) ? x.t(`imp.error.${reason}` as ProTextKey) : x.t('imp.error.generic'));
      setEtape('colonnes');
    }
  };

  const recommencer = () => {
    setEtape('coller');
    setTexte('');
    setRows([]);
    setFin(null);
    setMemesNoms(false);
    envoi.current = null;
  };

  const chip = (active: boolean) => `rounded-full border px-4 py-2 text-[15px] font-semibold ${active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-paperSoft'}`;

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card md:p-6">
      {sortes.length > 1 && etape !== 'envoi' && etape !== 'fini' ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {sortes.map((s) => (
            <button key={s} type="button" aria-pressed={sorte === s} onClick={() => changerSorte(s)} className={chip(sorte === s)}>
              {x.t(`imp.sorte.${s}` as ProTextKey)}
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-[16px] leading-7 text-inkSoft">{x.t(sorte === 'flotte' ? 'reg.importBodyFleet' : 'reg.importBodyArticles')}</p>
      <p className="mt-2 text-[14px] leading-6 text-inkMuted">{x.t('imp.columns', { cols: COLONNES[sorte].map((c) => colLabel(x, c)).join(', ') })}</p>

      {etape === 'coller' ? (
        <div className="mt-5">
          <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-ink">{x.t('imp.pasteLabel')}</span>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (pasted) {
                  e.preventDefault();
                  setTexte(pasted);
                  lire(pasted);
                }
              }}
              rows={8}
              placeholder={x.t('imp.pastePlaceholder')}
              className="w-full rounded-[12px] border border-line bg-paperSoft px-4 py-3 font-mono text-[14px] text-ink outline-none focus:border-cash"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={!texte.trim()} onClick={() => lire(texte)} className="rounded-full bg-cash px-5 py-3 text-[15px] font-semibold text-white shadow-cash hover:bg-cashInk disabled:opacity-50">
              {x.t('imp.read')}
            </button>
            <label className="cursor-pointer text-[15px] font-semibold text-cash hover:underline">
              {x.t('imp.file')}
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) lireFichier(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {lireErreur ? <p className="mt-3 text-[15px] text-tradeInk">{lireErreur}</p> : null}
        </div>
      ) : null}

      {etape === 'colonnes' ? (
        <div className="mt-6">
          <h3 className="text-[18px] font-semibold text-ink">{x.t('imp.mapTitle')}</h3>
          <p className="mt-1 text-[14px] text-inkMuted">{x.t('imp.mapHint')}</p>
          <label className="mt-3 flex items-center gap-2 text-[15px] text-inkSoft">
            <input
              type="checkbox"
              checked={aUneEntete}
              onChange={(e) => {
                envoi.current = null;
                setAUneEntete(e.target.checked);
              }}
              className="h-4 w-4"
            />
            {x.t('imp.mapHeader')}
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {correspondance.map((col, i) => {
              const samples = rows
                .slice(aUneEntete ? 1 : 0, (aUneEntete ? 1 : 0) + 3)
                .map((r) => r[i] ?? '')
                .filter(Boolean);
              return (
                <label key={i} className="block rounded-[12px] border border-line bg-paperSoft p-3">
                  <span className="block text-[13px] font-semibold text-inkMuted">
                    {aUneEntete && rows[0]?.[i] ? <bdi>{rows[0][i]}</bdi> : x.t('imp.mapColumn', { n: i + 1 })}
                  </span>
                  <select
                    value={col ?? ''}
                    onChange={(e) => {
                      const v = (e.target.value || null) as Colonne | null;
                      envoi.current = null;
                      setCorrespondance((cur) => cur.map((c, j) => (j === i ? v : v && c === v ? null : c)));
                    }}
                    className="mt-1 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-[15px] text-ink"
                  >
                    <option value="">{x.t('imp.mapIgnore')}</option>
                    {COLONNES[sorte].map((c) => (
                      <option key={c} value={c}>
                        {colLabel(x, c)}
                      </option>
                    ))}
                  </select>
                  {samples.length ? (
                    <span className="mt-1 block truncate text-[13px] text-inkMuted">
                      <bdi>{samples.join(' · ')}</bdi>
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          {manquantes.length ? (
            <p className="mt-3 text-[15px] text-tradeInk">{manquantes.map((c) => x.t('imp.mapMissing', { col: colLabel(x, c) })).join(' ')}</p>
          ) : (
            <>
              <Apercu sorte={sorte} lignes={lignes} offset={offset} seulementErreurs={seulementErreurs} setSeulementErreurs={setSeulementErreurs} x={x} />
              {montrerMemesNoms ? (
                <div className="mt-3 rounded-[12px] bg-paperSoft px-4 py-3">
                  <label className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <input type="checkbox" checked={memesNoms} onChange={(e) => basculerMemesNoms(e.target.checked)} className="h-4 w-4" />
                    {x.t('imp.sameNames')}
                  </label>
                  <p className="mt-1 text-[14px] leading-6 text-inkMuted">{x.t('imp.sameNamesHint')}</p>
                </div>
              ) : null}
            </>
          )}
          {envoiErreur ? (
            <p role="alert" className="mt-4 rounded-[12px] bg-tradeBg px-4 py-3 text-[15px] text-tradeInk">
              {envoiErreur}
            </p>
          ) : null}
          <p className="mt-4 text-[14px] leading-6 text-inkMuted">{x.t('reg.draftNote')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={!pretes || !!manquantes.length} onClick={() => void importer()} className="rounded-full bg-cash px-5 py-3 text-[15px] font-semibold text-white shadow-cash hover:bg-cashInk disabled:opacity-50">
              {x.tp('imp.send', pretes)}
            </button>
            <button type="button" onClick={recommencer} className="rounded-full border border-line px-5 py-3 text-[15px] font-semibold text-ink hover:bg-paperHard">
              {x.t('imp.back')}
            </button>
            {envois.length > 1 ? <span className="text-[14px] text-inkMuted">{x.t('imp.manyBatches', { count: envois.length })}</span> : null}
          </div>
        </div>
      ) : null}

      {etape === 'envoi' ? <p className="mt-6 text-[16px] font-semibold text-ink">{x.t('imp.sending', { done: progres.done, total: progres.total })}</p> : null}

      {etape === 'fini' && fin ? (
        <div className="mt-6">
          <h3 className="text-[20px] font-semibold text-ink">{x.t('imp.doneTitle')}</h3>
          <p className="mt-2 text-[16px] text-inkSoft">{x.tp(sorte === 'flotte' ? 'imp.doneFleet' : 'imp.doneArticles', fin.crees)}</p>
          <p className="mt-1 text-[15px] text-inkMuted">{x.t('imp.doneNext')}</p>
          {fin.refus.size ? (
            <>
              <p className="mt-4 text-[15px] font-semibold text-[#B45309]">{x.tp('imp.doneSkipped', fin.refus.size)}</p>
              <ul className="mt-2 max-h-[360px] overflow-y-auto rounded-[12px] border border-line">
                {[...fin.refus.entries()]
                  .sort((a, b) => a[0] - b[0])
                  .map(([index, reason]) => (
                    <li key={index} className="flex flex-wrap justify-between gap-3 border-t border-line px-4 py-2 text-[14px] first:border-t-0">
                      <span className="text-ink">
                        {x.t('imp.lineN', { n: index + offset })} · <bdi>{String(envoi.current?.lignes[index]?.brute.titre ?? '')}</bdi>
                      </span>
                      <span className="text-[#B45309]">{reasonText(x, reason)}</span>
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
          <button type="button" onClick={recommencer} className="mt-5 rounded-full border border-line px-5 py-3 text-[15px] font-semibold text-ink hover:bg-paperHard">
            {x.t('imp.again')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Apercu({
  sorte,
  lignes,
  offset,
  seulementErreurs,
  setSeulementErreurs,
  x,
}: {
  sorte: SorteImport;
  lignes: LigneApercu[];
  offset: number;
  seulementErreurs: boolean;
  setSeulementErreurs: (v: boolean) => void;
  x: ProTexts;
}) {
  const mauvaises = lignes.filter((l) => l.raison).length;
  const shown = seulementErreurs ? lignes.filter((l) => l.raison) : lignes;
  return (
    <div className="mt-6">
      <h3 className="text-[18px] font-semibold text-ink">{x.t('imp.previewTitle')}</h3>
      <p className="mt-1 text-[15px] text-inkSoft">
        {x.tp('imp.ready', lignes.length - mauvaises)}
        {mauvaises ? <span className="text-[#B45309]"> · {x.tp('imp.bad', mauvaises)}</span> : null}
        {' · '}
        {x.tp(sorte === 'flotte' ? 'imp.createsFleet' : 'imp.createsArticles', compterCreations(sorte, lignes))}
      </p>
      {mauvaises ? (
        <>
          <p className="mt-1 text-[14px] text-inkMuted">{x.t('imp.fixHint')}</p>
          <label className="mt-2 flex items-center gap-2 text-[14px] text-inkSoft">
            <input type="checkbox" checked={seulementErreurs} onChange={(e) => setSeulementErreurs(e.target.checked)} className="h-4 w-4" />
            {x.t('imp.onlyBad')}
          </label>
        </>
      ) : null}
      <div className="mt-3 max-h-[420px] overflow-y-auto rounded-[12px] border border-line">
        <table className="w-full text-[14px]">
          <tbody>
            {shown.slice(0, 1000).map((l) => (
              <tr key={l.index} className="border-t border-line first:border-t-0">
                <td className="w-24 whitespace-nowrap px-3 py-2 text-inkMuted">{x.t('imp.lineN', { n: l.index + offset })}</td>
                <td className="px-3 py-2 font-semibold text-ink">
                  <bdi>{String(l.brute.titre ?? '')}</bdi>
                </td>
                <td className="px-3 py-2 text-inkSoft">
                  <bdi>{resume(sorte, l.brute, x)}</bdi>
                </td>
                <td className={`px-3 py-2 text-end ${l.raison ? 'text-[#B45309]' : 'text-matchInk'}`}>{l.raison ? reasonText(x, l.raison) : x.t('imp.lineOk')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
