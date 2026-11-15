'use client';

// lib/pro/shared/hooks.ts
// =============================================================================
// Lectures EN DIRECT des volets Clients, Caisse et Import (Firestore,
// navigateur). Lecture seule : les fiches et le catalogue importé s'écrivent par
// les callables (`proSaveClient`, `proImport`). Index : champs simples seulement
// (automatiques), aucun index composite.
// =============================================================================

import { useEffect, useState } from 'react';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cleTitre, type ClientFiche, type Operation } from '@/lib/pro-core';
import { isRecord, readClient, readOperation, readString } from '../carnet';
import type { LiveStatus } from '../hooks';
import { readCaisseJour, readMouvement, type CaisseJour, type CaisseMouvement, type DayRange } from './caisse';
import { clePlaque, type Existants } from './importTableur';

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'unknown';
};

export interface Live<T> {
  data: T;
  status: LiveStatus;
  errorCode: string | null;
}

/** Fiches clients, les plus récentes d'abord, `max` au plus (le volet en demande plus au besoin). */
export function useClientsList(bid: string, max: number): Live<ClientFiche[]> & { full: boolean } {
  const [state, setState] = useState<Live<ClientFiche[]> & { full: boolean }>({ data: [], status: 'loading', errorCode: null, full: false });
  useEffect(() => {
    setState((s) => ({ ...s, status: s.data.length ? s.status : 'loading', errorCode: null }));
    const q = query(collection(db, 'boutiques', bid, 'clients'), orderBy('derniereOperation', 'desc'), limit(max));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.flatMap((d) => {
          const c = readClient(d.id, d.data());
          return c ? [c] : [];
        });
        setState({ data, status: 'ready', errorCode: null, full: snap.size >= max });
      },
      (error) => setState({ data: [], status: 'error', errorCode: codeOf(error), full: false }),
    );
  }, [bid, max]);
  return state;
}

/** Une fiche client. */
export function useClient(bid: string, clientId: string | null): Live<ClientFiche | null> {
  const [state, setState] = useState<Live<ClientFiche | null>>({ data: null, status: 'loading', errorCode: null });
  useEffect(() => {
    if (!clientId) return undefined;
    setState({ data: null, status: 'loading', errorCode: null });
    return onSnapshot(
      doc(db, 'boutiques', bid, 'clients', clientId),
      (snap) => setState({ data: snap.exists() ? readClient(snap.id, snap.data()) : null, status: 'ready', errorCode: null }),
      (error) => setState({ data: null, status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid, clientId]);
  return state;
}

/** Opérations d'un client (200 au plus ; triées à l'écran). */
export function useClientOps(bid: string, clientId: string | null): Live<Operation[]> {
  const [state, setState] = useState<Live<Operation[]>>({ data: [], status: 'loading', errorCode: null });
  useEffect(() => {
    if (!clientId) return undefined;
    setState({ data: [], status: 'loading', errorCode: null });
    const q = query(collection(db, 'boutiques', bid, 'operations'), where('clientId', '==', clientId), limit(200));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.flatMap((d) => {
          const op = readOperation(d.id, d.data());
          return op ? [op] : [];
        });
        setState({ data, status: 'ready', errorCode: null });
      },
      (error) => setState({ data: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid, clientId]);
  return state;
}

/** Agrégats des jours de la période (un jour sans document n'a rien eu). */
export function useCaisseJours(bid: string, range: DayRange): Live<CaisseJour[]> {
  const [state, setState] = useState<Live<CaisseJour[]>>({ data: [], status: 'loading', errorCode: null });
  useEffect(() => {
    setState({ data: [], status: 'loading', errorCode: null });
    const q = query(collection(db, 'boutiques', bid, 'jours'), where('jour', '>=', range.start), where('jour', '<=', range.end));
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => readCaisseJour(d.id, d.data())), status: 'ready', errorCode: null }),
      (error) => setState({ data: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid, range.start, range.end]);
  return state;
}

/** Mouvements d'un jour (détail), en direct. */
export function useMouvementsDuJour(bid: string, day: string | null): Live<CaisseMouvement[]> {
  const [state, setState] = useState<Live<CaisseMouvement[]>>({ data: [], status: 'loading', errorCode: null });
  useEffect(() => {
    if (!day) return undefined;
    setState({ data: [], status: 'loading', errorCode: null });
    const q = query(collection(db, 'boutiques', bid, 'caisse'), where('jour', '==', day), limit(1000));
    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.flatMap((d) => {
          const m = readMouvement(d.id, d.data());
          return m ? [m] : [];
        });
        setState({ data, status: 'ready', errorCode: null });
      },
      (error) => setState({ data: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid, day]);
  return state;
}

export const EXPORT_MAX = 5000;

/** Mouvements de la période, lus une fois pour l'export (5 000 au plus). */
export async function fetchMouvements(bid: string, range: DayRange): Promise<{ list: CaisseMouvement[]; truncated: boolean }> {
  const q = query(collection(db, 'boutiques', bid, 'caisse'), where('jour', '>=', range.start), where('jour', '<=', range.end), limit(EXPORT_MAX));
  const snap = await getDocs(q);
  const list = snap.docs.flatMap((d) => {
    const m = readMouvement(d.id, d.data());
    return m ? [m] : [];
  });
  return { list, truncated: snap.size >= EXPORT_MAX };
}

/** Noms de l'équipe (`membres/{uid}.nom` s'il existe), pour la caisse par membre. */
export function useTeamNames(bid: string): ReadonlyMap<string, string> {
  const [names, setNames] = useState<ReadonlyMap<string, string>>(new Map());
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'boutiques', bid, 'membres'),
        (snap) => {
          const out = new Map<string, string>();
          for (const d of snap.docs) {
            const nom = readString(d.data().nom);
            if (nom) out.set(d.id, nom);
          }
          setNames(out);
        },
        () => setNames(new Map()),
      ),
    [bid],
  );
  return names;
}

/** Titres et plaques déjà au catalogue (aperçu de l'import : « déjà au catalogue »). */
export function useCatalogueKeys(bid: string): { existants: Existants; status: LiveStatus } {
  const [state, setState] = useState<{ existants: Existants; status: LiveStatus }>({ existants: { titres: new Set(), plaques: new Set() }, status: 'loading' });
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'boutiques', bid, 'catalogue'),
        (snap) => {
          const titres = new Set<string>();
          const plaques = new Set<string>();
          for (const d of snap.docs) {
            const data = d.data();
            const titre = readString(data.titre);
            if (titre) titres.add(cleTitre(titre));
            const plaque = isRecord(data.bien) ? readString(data.bien.plaque) : null;
            if (plaque) plaques.add(clePlaque(plaque));
          }
          setState({ existants: { titres, plaques }, status: 'ready' });
        },
        () => setState((s) => ({ ...s, status: 'error' })),
      ),
    [bid],
  );
  return state;
}
