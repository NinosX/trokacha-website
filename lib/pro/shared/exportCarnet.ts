'use client';

// lib/pro/shared/exportCarnet.ts
// =============================================================================
// EXPORT DU CARNET depuis le bureau : tout le carnet de l'espace lu par pages
// (opérations, fiches clients, catalogue, mouvements de caisse), puis le
// classeur Excel fait dans le navigateur par le cœur partagé (`exportCarnet`,
// le même que le téléphone). Et le RELEVÉ DU MOIS : agrégats des jours du
// mois, mouvements de caisse du mois et opérations du mois, mis en page par
// le cœur (`releveMois`) et imprimés par le navigateur (`printDocument.ts`).
// Lectures ponctuelles AU SERVEUR (`getDocsFromServer` : jamais un export à moitié
// sorti d'un cache), dans les règles actuelles : opérations,
// clients et catalogue pour l'équipe, jours et caisse pour qui voit les
// chiffres. Index : champs simples seulement (automatiques).
// =============================================================================

import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  bornesMois,
  exportCarnet,
  lireArticleExport,
  lireJourAgregat,
  lireMouvementCaisse,
  lireReglagesDocuments,
  releveMois,
  XLSX_MIME,
  type LangueExport,
  type Operation,
  type ReleveMois,
} from '@/lib/pro-core';
import { readClient, readOperation } from '../carnet';
import type { ProSpace } from '../space';
import { wilayaBilingue } from './documents';
import { wilayaName } from './wilayas';

const PAGE = 500;

/** Toutes les pages d'une requête (curseur sur le dernier document lu). */
async function toutesLesPages<T>(
  base: Query<DocumentData>,
  tri: QueryConstraint,
  read: (id: string, data: unknown) => T | null,
  onRows?: (n: number) => void,
): Promise<T[]> {
  const out: T[] = [];
  let dernier: QueryDocumentSnapshot<DocumentData> | null = null;
  for (;;) {
    const q: Query<DocumentData> = dernier ? query(base, tri, startAfter(dernier), limit(PAGE)) : query(base, tri, limit(PAGE));
    const snap = await getDocsFromServer(q);
    for (const d of snap.docs) {
      const v = read(d.id, d.data());
      if (v) out.push(v);
    }
    onRows?.(snap.size);
    if (snap.size < PAGE) return out;
    dernier = snap.docs[snap.docs.length - 1];
  }
}

const espace = (bid: string, sous: string) => collection(db, 'boutiques', bid, sous);

export interface CarnetFile {
  blob: Blob;
  name: string;
  rows: number;
}

/** Le carnet complet en classeur Excel (`onRows` : lignes lues jusqu'ici, pour la progression). */
export async function buildCarnetFile(input: {
  bid: string;
  spaceName: string;
  uid: string;
  langue: LangueExport;
  /** Feuille Caisse : seulement pour qui voit les chiffres. */
  voirChiffres: boolean;
  names: ReadonlyMap<string, string>;
  onRows?: (rows: number) => void;
}): Promise<CarnetFile> {
  let lues = 0;
  const compte = (n: number) => {
    lues += n;
    input.onRows?.(lues);
  };
  const parId = orderBy(documentId());
  const operations = await toutesLesPages(espace(input.bid, 'operations'), parId, readOperation, compte);
  const clients = await toutesLesPages(espace(input.bid, 'clients'), parId, readClient, compte);
  const catalogue = await toutesLesPages(espace(input.bid, 'catalogue'), parId, lireArticleExport, compte);
  const caisse = input.voirChiffres ? await toutesLesPages(espace(input.bid, 'caisse'), parId, lireMouvementCaisse, compte) : null;
  const fichier = exportCarnet({
    langue: input.langue,
    espaceNom: input.spaceName,
    operations,
    clients,
    catalogue,
    caisse,
    moi: input.uid,
    noms: Object.fromEntries(input.names),
    nomWilaya: (code) => wilayaName(code, input.langue) || null,
    maintenant: Date.now(),
  });
  return { blob: new Blob([fichier.octets as BlobPart], { type: XLSX_MIME }), name: fichier.nomFichier, rows: fichier.lignes };
}

/** Le relevé d'un mois (« 2026-11 »), prêt à imprimer. */
export async function buildReleve(input: { bid: string; mois: string; space: Pick<ProSpace, 'nom' | 'wilayaCode' | 'tel'> }): Promise<ReleveMois> {
  const { premier, dernier, debutMs, finMs } = bornesMois(input.mois);
  const jours = await getDocsFromServer(query(espace(input.bid, 'jours'), where(documentId(), '>=', premier), where(documentId(), '<=', dernier)));
  const mouvements = await toutesLesPages(
    query(espace(input.bid, 'caisse'), where('jour', '>=', premier), where('jour', '<=', dernier)),
    orderBy('jour'),
    lireMouvementCaisse,
  );
  // Locations par leur début, ventes par le jour où elles ont été notées : deux lectures, fusionnées.
  const parDebut = await toutesLesPages(
    query(espace(input.bid, 'operations'), where('debut', '>=', premier), where('debut', '<=', dernier)),
    orderBy('debut'),
    readOperation,
  );
  const parCreation = await toutesLesPages(
    query(espace(input.bid, 'operations'), where('creeLe', '>=', debutMs), where('creeLe', '<', finMs)),
    orderBy('creeLe'),
    readOperation,
  );
  const operations = new Map<string, Operation>();
  for (const op of [...parDebut, ...parCreation]) operations.set(op.id, op);
  const reglages = await getDoc(doc(db, 'boutiques', input.bid, 'prive', 'reglages'));
  return releveMois({
    mois: input.mois,
    espace: { nom: input.space.nom, wilaya: wilayaBilingue(input.space.wilayaCode), tel: input.space.tel },
    reglages: lireReglagesDocuments(reglages.exists() ? reglages.data()?.documents : null),
    jours: jours.docs.map((d) => lireJourAgregat(d.id, d.data())),
    mouvements,
    operations: [...operations.values()],
    maintenant: Date.now(),
  });
}

/** Télécharge un fichier fait dans le navigateur (lien temporaire). */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
