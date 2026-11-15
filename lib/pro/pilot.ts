// lib/pro/pilot.ts
// =============================================================================
// ESPACES PILOTES (mise en ligne anticipée, décision de Lyes du 15/11 : « visible
// seulement de l'équipe »). Le bureau ne s'ouvre que pour les espaces listés dans
// `config/features.proPilotBoutiques` (absent ou vide : personne), la même liste que
// le serveur vérifie dans chaque callable (`functions/src/pro/pilot.ts`). Module pur.
// =============================================================================

import type { ProSpace } from './space';

const ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Identifiants valides de la config, sans doublon (même lecture que le serveur). */
export function pilotesDepuisConfig(raw: unknown): ReadonlySet<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((x): x is string => typeof x === 'string' && ID.test(x)).slice(0, 500));
}

/** Les espaces du compte ouverts au bureau. */
export function espacesOuverts(spaces: readonly ProSpace[], pilotes: ReadonlySet<string>): ProSpace[] {
  return spaces.filter((s) => pilotes.has(s.id));
}

export type PorteBureau = 'attente' | 'ouvert' | 'ferme' | 'aucun_espace';

/**
 * Ce que montre le bureau : en attente tant que les espaces ou la liste ne sont pas lus ;
 * « aucun espace » (la page existante qui invite à ouvrir sa boutique dans l'application) ;
 * fermé si le compte a des espaces mais aucun n'est pilote (ou si la liste est illisible).
 */
export function porteDuBureau(input: {
  spaces: readonly ProSpace[];
  spacesReady: boolean;
  pilotes: ReadonlySet<string> | null;
  pilotesError: boolean;
}): PorteBureau {
  if (!input.spacesReady) return 'attente';
  if (input.spaces.length === 0) return 'aucun_espace';
  if (input.pilotesError) return 'ferme';
  if (!input.pilotes) return 'attente';
  return espacesOuverts(input.spaces, input.pilotes).length > 0 ? 'ouvert' : 'ferme';
}
