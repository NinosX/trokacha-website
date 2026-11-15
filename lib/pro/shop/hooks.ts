'use client';

// lib/pro/shop/hooks.ts
// =============================================================================
// Lectures EN DIRECT du volet boutique du bureau : le catalogue (même requête
// que l'application, `boutiqueCatalogueQuery`) et les offres Trokacha reçues
// par la boutique (même requête vivante que les Commandes de l'application,
// `useBoutiqueOrders` : `receiverId`, `receiverBoutiqueId`, `archived`, tri par
// `createdAt` ; index composite déjà en ligne).
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LiveRows, LiveStatus } from '../hooks';
import { catalogueOrder, readShopArticle, type ShopArticle } from './catalogue';
import { readShopOffer, sortOffers, type ShopOffer } from './orders';

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? code : 'unknown';
};

/** Catalogue entier d'une boutique (quelques centaines d'articles au plus), ordre stable. */
export function useShopCatalogue(bid: string | null): LiveRows<ShopArticle> {
  const [state, setState] = useState<LiveRows<ShopArticle>>({ rows: [], status: 'loading', errorCode: null });
  useEffect(() => {
    if (!bid) return undefined;
    setState({ rows: [], status: 'loading', errorCode: null });
    return onSnapshot(
      collection(db, 'boutiques', bid, 'catalogue'),
      (snap) => {
        const rows = snap.docs.flatMap((d) => {
          const article = readShopArticle(d.id, d.data());
          return article ? [article] : [];
        });
        setState({ rows: catalogueOrder(rows), status: 'ready', errorCode: null });
      },
      (error) => setState({ rows: [], status: 'error', errorCode: codeOf(error) }),
    );
  }, [bid]);
  return state;
}

/** Limite de la requête vivante (comme le départ des Commandes de l'application). */
export const SHOP_OFFERS_LIMIT = 50;

/** Offres Trokacha où c'est au pro de répondre (relues chaque minute pour l'expiration). */
export function useShopOffers(uid: string | null, bid: string | null): { offers: ShopOffer[]; status: LiveStatus } {
  const [docs, setDocs] = useState<Array<{ id: string; data: unknown }>>([]);
  const [status, setStatus] = useState<LiveStatus>('loading');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!uid || !bid) return undefined;
    setStatus('loading');
    const q = query(
      collection(db, 'proposals'),
      where('receiverId', '==', uid),
      where('receiverBoutiqueId', '==', bid),
      where('archived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(SHOP_OFFERS_LIMIT),
    );
    return onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, data: d.data() })));
        setStatus('ready');
      },
      () => {
        setDocs([]);
        setStatus('error');
      },
    );
  }, [uid, bid]);

  const offers = useMemo(() => {
    if (!uid) return [];
    return sortOffers(docs.flatMap((d) => {
      const offer = readShopOffer(d.id, d.data, uid, now);
      return offer ? [offer] : [];
    }));
  }, [docs, uid, now]);

  return { offers, status };
}
