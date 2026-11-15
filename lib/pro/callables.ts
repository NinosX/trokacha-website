'use client';

// lib/pro/callables.ts
// =============================================================================
// CALLABLES DU CARNET DU PRO, côté site (même contrat que l'application,
// `src/v2/data/proCallables.ts`) : enveloppe fine, sans logique.
// =============================================================================
//
// Le carnet n'est JAMAIS écrit directement depuis le site (règles Firestore :
// `write: false`) ; ces appels sont sa seule voie, l'écoute du carnet apporte
// le résultat. Chaque création porte un identifiant fait par l'appelant
// (`op_…`, `pa_…`) : un appel rejoué ne crée jamais de doublon.
// Refus : `HttpsError` dont `details.reason` porte le code métier en MAJUSCULES
// (`DATES_PRISES`, `STOCK_INSUFFISANT`…), gardé par `ProCallableError`.
// =============================================================================

import { httpsCallable } from 'firebase/functions';
import { clientFunctions } from '@/lib/firebaseClient';

export type ProCallableName =
  | 'proSaveOperation'
  | 'proOperationStep'
  | 'proRecordPayment'
  | 'proSettleGuarantee'
  | 'proAddGuarantee'
  | 'proSaveClient'
  | 'proFileUrl'
  | 'proSaveVariants'
  | 'proReceiveArrival'
  | 'proAdjustStock'
  | 'proAssignVariant'
  | 'proImport'
  | 'proBlockDates'
  | 'proUnblockDates';

/** Refus d'une callable du carnet : code Firebase et raison métier. */
export class ProCallableError extends Error {
  code: string;
  reason: string;
  details: Record<string, unknown> | null;
  constructor(code: string, reason: string, details: Record<string, unknown> | null = null) {
    super(reason || code);
    this.name = 'ProCallableError';
    this.code = code;
    this.reason = reason;
    this.details = details;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function toProCallableError(error: unknown): ProCallableError {
  if (error instanceof ProCallableError) return error;
  const record = isRecord(error) ? error : {};
  const code = typeof record.code === 'string' ? record.code.replace(/^functions\//, '') : '';
  const details = isRecord(record.details) ? record.details : null;
  const fromDetails = details && typeof details.reason === 'string' ? details.reason : '';
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  return new ProCallableError(code, fromDetails || message, details);
}

/** Une raison métier en MAJUSCULES prouve que le serveur a répondu et décidé (ne pas rejouer). */
export function isBusinessRefusal(error: unknown): boolean {
  return error instanceof ProCallableError && /^[A-Z][A-Z_]+$/.test(error.reason);
}

/** Appelle une callable du carnet ; lève `ProCallableError` en cas de refus ou de panne. */
export async function callPro<T extends Record<string, unknown> = Record<string, unknown>>(
  name: ProCallableName,
  data: Record<string, unknown>,
): Promise<T> {
  try {
    const result = await httpsCallable(clientFunctions(), name)(data);
    const payload = (result as { data?: unknown } | null | undefined)?.data;
    return (isRecord(payload) ? payload : {}) as T;
  } catch (error) {
    throw toProCallableError(error);
  }
}

/** Identifiant fait par l'appelant (`op_…`, `pa_…`, `ar_…`, `ga_…`, `bl_…`) : même forme que l'application. */
export function newProId(prefix: 'op' | 'pa' | 'ar' | 'ga' | 'bl'): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  let rand = '';
  for (const b of Array.from(bytes)) rand += alphabet[b % alphabet.length];
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}
