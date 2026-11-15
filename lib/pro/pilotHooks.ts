'use client';

// lib/pro/pilotHooks.ts
// Liste des espaces pilotes (`config/features.proPilotBoutiques`), écoutée tant que le
// bureau est ouvert : un espace ajouté par l'équipe s'ouvre sans recharger la page.
// `config/features` se lit avec un compte connecté (règles, `match /config/{configId}`).

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { pilotesDepuisConfig } from './pilot';

export function useProPilotes(uid: string | null): { pilotes: ReadonlySet<string> | null; error: boolean } {
  const [state, setState] = useState<{ pilotes: ReadonlySet<string> | null; error: boolean }>({ pilotes: null, error: false });
  useEffect(() => {
    if (!uid) {
      setState({ pilotes: null, error: false });
      return undefined;
    }
    return onSnapshot(
      doc(db, 'config', 'features'),
      (snap) => setState({ pilotes: pilotesDepuisConfig(snap.data()?.proPilotBoutiques), error: false }),
      () => setState({ pilotes: null, error: true }),
    );
  }, [uid]);
  return state;
}
