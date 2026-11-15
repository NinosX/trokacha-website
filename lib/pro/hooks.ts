'use client';

// lib/pro/hooks.ts
// =============================================================================
// Lectures EN DIRECT du bureau pro (Firestore, navigateur) : mêmes requêtes que
// l'application (`useLiveMyBoutiques`, `proCarnetSource.ts`). Lecture seule :
// le carnet s'écrit par les callables (`lib/pro/callables.ts`).
// Index : champs simples seulement (automatiques), aucun index composite.
// =============================================================================

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { clientAuth } from '@/lib/firebaseClient';
import { aujourdhuiAlger, libelleVariante, type Operation } from '@/lib/pro-core';
import { isRecord, readJour, readOperation, readString, STATUTS_OUVERTS, type ProJour } from './carnet';
import { readProSpace, type ProSpace } from './space';

export type LiveStatus = 'loading' | 'ready' | 'error';

export interface LiveRows<T> {
  rows: T[];
  status: LiveStatus;
  errorCode: string | null;
}

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'unknown';
};

/** Compte connecté ; `ready` passe à vrai quand Firebase a répondu (connecté ou non). */
export function useAuthUser(): { user: User | null; ready: boolean } {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({ user: null, ready: false });
  useEffect(() => {
    const auth = clientAuth();
    return onAuthStateChanged(auth, (user) => setState({ user, ready: true }));
  }, []);
  return state;
}

/** Boutiques et agences dont le compte est propriétaire (même requête que l'application). */
export function useMySpaces(uid: string | null): LiveRows<ProSpace> {
  const [state, setState] = useState<LiveRows<ProSpace>>({ rows: [], status: 'loading', errorCode: null });
  useEffect(() => {
    if (!uid) {
      setState({ rows: [], status: 'loading', errorCode: null });
      return undefined;
    }
    setState((s) => ({ ...s, status: 'loading', errorCode: null }));
    const q = query(collection(db, 'boutiques'), where('ownerUid', '==', uid));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const space = readProSpace(d.id, d.data());
          return space ? [space] : [];
        });
        setState({ rows, status: 'ready', errorCode: null });
      },
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [uid]);
  return state;
}

/** Opérations OUVERTES d'un espace (Aujourd'hui, Commandes, barres à venir du Planning). */
export function useOpenOps(bid: string | null): LiveRows<Operation> {
  const [state, setState] = useState<LiveRows<Operation>>({ rows: [], status: 'loading', errorCode: null });
  useEffect(() => {
    if (!bid) return undefined;
    setState({ rows: [], status: 'loading', errorCode: null });
    const q = query(collection(db, 'boutiques', bid, 'operations'), where('statut', 'in', [...STATUTS_OUVERTS]));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const op = readOperation(d.id, d.data());
          return op ? [op] : [];
        });
        setState({ rows, status: 'ready', errorCode: null });
      },
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid]);
  return state;
}

/** Agrégat d'un jour (`jours/{YYYY-MM-DD}`) ; un document absent est un jour vide. */
export function useJour(bid: string | null, day: string): { jour: ProJour | null; status: LiveStatus } {
  const [state, setState] = useState<{ jour: ProJour | null; status: LiveStatus }>({ jour: null, status: 'loading' });
  useEffect(() => {
    if (!bid) return undefined;
    setState({ jour: null, status: 'loading' });
    return onSnapshot(
      doc(db, 'boutiques', bid, 'jours', day),
      (snap) => setState({ jour: readJour(day, snap.exists() ? snap.data() : null), status: 'ready' }),
      // Droit « voir les chiffres » absent, ou autre refus : le montant ne s'affiche pas.
      () => setState({ jour: null, status: 'error' }),
    );
  }, [bid, day]);
  return state;
}

/** Jour d'Alger (`YYYY-MM-DD`), relu chaque minute (passage de minuit). */
export function useAlgiersToday(): string {
  const [today, setToday] = useState(() => aujourdhuiAlger());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(aujourdhuiAlger()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
}

/** Libellés des variantes du catalogue (« M · Noir ») : article → clé → libellé. */
export type VariantLabels = ReadonlyMap<string, ReadonlyMap<string, string>>;

/** Catalogue d'une boutique, lu pour nommer les variantes du carnet (le carnet ne garde que la clé). */
export function useVariantLabels(bid: string | null): VariantLabels {
  const [labels, setLabels] = useState<VariantLabels>(new Map());
  useEffect(() => {
    if (!bid) return undefined;
    return onSnapshot(
      collection(db, 'boutiques', bid, 'catalogue'),
      (snap) => {
        const out = new Map<string, Map<string, string>>();
        for (const d of snap.docs) {
          const data = d.data();
          const list = Array.isArray(data.variantes) ? data.variantes : [];
          const byKey = new Map<string, string>();
          for (const v of list) {
            if (!isRecord(v)) continue;
            const cle = readString(v.cle);
            if (!cle) continue;
            const label = libelleVariante({ taille: readString(v.taille)?.trim() || null, couleur: readString(v.couleur)?.trim() || null });
            if (label) byKey.set(cle, label);
          }
          if (byKey.size) out.set(d.id, byKey);
        }
        setLabels(out);
      },
      () => setLabels(new Map()),
    );
  }, [bid]);
  return labels;
}
