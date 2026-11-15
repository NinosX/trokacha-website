'use client';

// lib/pro/agency/hooks.ts
// =============================================================================
// Lectures EN DIRECT du volet agence (Firestore, navigateur) : mêmes requêtes
// que l'application. Lecture seule : le carnet s'écrit par les callables.
//   • biens loués : `boutiques/{bid}/catalogue` (articles avec un bloc `rental`) ;
//   • opérations du mois : `operations` où `fin >= 1er du mois` (champ simple,
//     index automatique ; même requête que `proWindowOpsSpec`) ;
//   • fiches clients récentes : `clients` triées par dernière opération (50) ;
//   • une opération (la fiche ouverte la suit jusqu'au bout) ;
//   • demandes reçues : `proposals` où `receiverId == moi`, `receiverBoutiqueId ==
//     espace`, `archived == false`, les plus récentes (50) : même requête que
//     `useBoutiqueOrders` (index composite déjà en production).
// =============================================================================

import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientFiche, Operation } from '@/lib/pro-core';
import { readClient, readOperation } from '../carnet';
import type { LiveRows, LiveStatus } from '../hooks';
import { readRentalProposal, type RentalProposal } from './requests';
import { readRentalUnit, sortUnits, type RentalUnit } from './units';

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'unknown';
};

const LOADING = { rows: [], status: 'loading' as LiveStatus, errorCode: null };

/** Biens loués de l'espace (voitures, logements), le plus ancien d'abord. */
export function useRentalUnits(bid: string | null): LiveRows<RentalUnit> {
  const [state, setState] = useState<LiveRows<RentalUnit>>(LOADING);
  useEffect(() => {
    if (!bid) return undefined;
    setState(LOADING);
    return onSnapshot(
      collection(db, 'boutiques', bid, 'catalogue'),
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const unit = readRentalUnit(d.id, d.data());
          return unit ? [unit] : [];
        });
        setState({ rows: sortUnits(rows), status: 'ready', errorCode: null });
      },
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid]);
  return state;
}

/** Opérations qui finissent à partir d'un jour (le mois affiché et la suite). */
export function useWindowOps(bid: string | null, fromDay: string): LiveRows<Operation> {
  const [state, setState] = useState<LiveRows<Operation>>(LOADING);
  useEffect(() => {
    if (!bid) return undefined;
    setState(LOADING);
    const q = query(collection(db, 'boutiques', bid, 'operations'), where('fin', '>=', fromDay), orderBy('fin'));
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
  }, [bid, fromDay]);
  return state;
}

/** Fiches clients récentes (50). */
export function useRecentClients(bid: string | null): LiveRows<ClientFiche> {
  const [state, setState] = useState<LiveRows<ClientFiche>>(LOADING);
  useEffect(() => {
    if (!bid) return undefined;
    setState(LOADING);
    const q = query(collection(db, 'boutiques', bid, 'clients'), orderBy('derniereOperation', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const fiche = readClient(d.id, d.data());
          return fiche ? [fiche] : [];
        });
        setState({ rows, status: 'ready', errorCode: null });
      },
      // Droit absent : la liste reste vide, la saisie d'un nouveau client marche toujours.
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid]);
  return state;
}

/** Une opération en direct ; `op: null` et `status: 'ready'` = elle n'existe pas (ou plus). */
export function useOperation(bid: string | null, opId: string | null): { op: Operation | null; status: LiveStatus } {
  const [state, setState] = useState<{ op: Operation | null; status: LiveStatus }>({ op: null, status: 'loading' });
  useEffect(() => {
    if (!bid || !opId) {
      setState({ op: null, status: 'ready' });
      return undefined;
    }
    setState({ op: null, status: 'loading' });
    return onSnapshot(
      doc(db, 'boutiques', bid, 'operations', opId),
      (snap) => setState({ op: snap.exists() ? readOperation(snap.id, snap.data()) : null, status: 'ready' }),
      () => setState({ op: null, status: 'error' }),
    );
  }, [bid, opId]);
  return state;
}

/** Demandes de location reçues par l'espace (à traiter, en attente du locataire, gelées). */
export function useRentalProposals(uid: string | null, bid: string | null, today: string): LiveRows<RentalProposal> {
  const [state, setState] = useState<LiveRows<RentalProposal>>(LOADING);
  useEffect(() => {
    if (!uid || !bid) return undefined;
    setState(LOADING);
    const q = query(
      collection(db, 'proposals'),
      where('receiverId', '==', uid),
      where('receiverBoutiqueId', '==', bid),
      where('archived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const p = readRentalProposal(d.id, d.data(), uid, today);
          return p ? [p] : [];
        });
        setState({ rows, status: 'ready', errorCode: null });
      },
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [uid, bid, today]);
  return state;
}
