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

export type PorteBureau = 'attente' | 'ouvert' | 'ferme' | 'erreur';

/**
 * Ce que montre le bureau : en attente tant que les espaces ou la liste ne sont pas lus ;
 * fermé si aucun espace du compte n'est pilote (ou si la liste est illisible).
 * Pendant le pilote, un compte SANS boutique voit aussi « pas encore ouvert » : l'invitation
 * à ouvrir sa boutique (`desk.noSpaceBody`) promettait un outil qu'il n'aurait pas
 * (relecture de Main, 15/11, S4). À l'ouverture à tous les pros, rendre une valeur
 * « aucun espace » ici et laisser la page `/pro` montrer l'invitation.
 * Lecture des espaces du compte en échec : « erreur » (message et « Réessayer »), jamais
 * « pas encore ouvert », qui mentirait à un pilote (relecture 2 de Main, SM2). Le bureau
 * reste fermé dans les deux cas.
 */
export function porteDuBureau(input: {
  spaces: readonly ProSpace[];
  spacesReady: boolean;
  /** La lecture des espaces du compte a échoué. */
  spacesError?: boolean;
  pilotes: ReadonlySet<string> | null;
  pilotesError: boolean;
}): PorteBureau {
  if (!input.spacesReady) return 'attente';
  if (input.spacesError) return 'erreur';
  if (input.spaces.length === 0) return 'ferme';
  if (input.pilotesError) return 'ferme';
  if (!input.pilotes) return 'attente';
  return espacesOuverts(input.spaces, input.pilotes).length > 0 ? 'ouvert' : 'ferme';
}
