// lib/pro/agency/errors.ts
// Raison d'un refus de callable du carnet : le code métier du serveur
// (`DATES_PRISES`…), `offline` pour une panne de réseau, sinon `generic`.
// Module PUR (lit `ProCallableError` sans dépendre de Firebase).

const KNOWN = new Set([
  'DATES_PRISES',
  'STOCK_INSUFFISANT',
  'PAS_LE_DROIT',
  'PAS_MEMBRE',
  'ESPACE_SUSPENDU',
  'EMAIL_NON_VERIFIE',
  'COPIE_PERIMEE',
  'OPERATION_ANNULEE',
  'ETAPE_IMPOSSIBLE',
  'PASSER_PAR_LA_DEMANDE',
  'GARANTIE_DEJA_REGLEE',
  'MOTIF_REQUIS',
  'PRIX_REQUIS',
  'TEL_INVALIDE',
  'DATES_INVALIDES',
  'DUREE_TROP_LONGUE',
  'DEJA_ECRIT',
  'DATES_PASSEES',
  'BLOCAGES_MAX',
  'PAS_UNE_LOCATION',
]);

const NETWORK_CODES = new Set(['unavailable', 'deadline-exceeded']);

export function errorReason(error: unknown): string {
  const record = (typeof error === 'object' && error !== null ? error : {}) as { reason?: unknown; code?: unknown; message?: unknown };
  const reason = typeof record.reason === 'string' ? record.reason : typeof error === 'string' ? error : '';
  if (KNOWN.has(reason)) return reason;
  const code = typeof record.code === 'string' ? record.code.replace(/^functions\//, '') : '';
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || NETWORK_CODES.has(code)) return 'offline';
  return 'generic';
}
