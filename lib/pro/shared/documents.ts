// lib/pro/shared/documents.ts
// =============================================================================
// LES DOCUMENTS DU BUREAU (contrat de location, confirmation de séjour, reçu de
// caution, bon de livraison) : le MÊME générateur que le téléphone
// (`documentPro`, cœur partagé `lib/pro-core`), avec ce que le bureau a déjà
// lu (l'opération, le bien, la fiche client, l'espace, l'en-tête du pro).
// La page bilingue s'imprime ou s'enregistre en PDF depuis le navigateur
// (`printDocument.ts`). Module PUR.
// =============================================================================

import {
  documentPro,
  documentsPossibles,
  type ClientFiche,
  type DocumentPro,
  type Operation,
  type ReglagesDocuments,
  type SorteDocument,
  type TexteBilingue,
} from '@/lib/pro-core';
import type { ProSpace } from '../space';
import { wilayaName } from './wilayas';

/** « 16 » → { Alger, الجزائر } ; `null` si le code n'est pas une wilaya connue. */
export function wilayaBilingue(code: string | null | undefined): TexteBilingue | null {
  const raw = (code ?? '').trim();
  if (!raw) return null;
  const fr = wilayaName(raw, 'fr');
  if (!fr || fr === raw) return null;
  return { fr, ar: wilayaName(raw, 'ar') };
}

/** Les documents d'une opération, dans l'ordre des boutons. */
export function deskDocuments(op: Operation, kind: 'car' | 'immo'): SorteDocument[] {
  return documentsPossibles(op, op.type === 'location' ? kind : null);
}

export interface DeskDocumentInput {
  sorte: SorteDocument;
  op: Operation;
  space: Pick<ProSpace, 'nom' | 'wilayaCode' | 'tel'>;
  bien: { titre: string; plaque: string | null; adresse: string | null; kind: 'car' | 'immo' | null } | null;
  client: Pick<ClientFiche, 'pieces'> | null;
  reglages: ReglagesDocuments | null;
  /** Taille et couleur de la pièce vendue (« M · Noir »). */
  variante: string | null;
  now: number;
}

export function buildDeskDocument(input: DeskDocumentInput): DocumentPro {
  const { op } = input;
  return documentPro({
    sorte: input.sorte,
    op,
    espace: { nom: input.space.nom, wilaya: wilayaBilingue(input.space.wilayaCode), tel: input.space.tel },
    reglages: input.reglages,
    bien: input.bien ? { ...input.bien, titre: input.bien.titre || op.itemTitre } : { titre: op.itemTitre },
    pieces: (input.client?.pieces ?? []).map((p) => ({ type: p.type, numero: p.numero ?? null })),
    wilayaLivraison: wilayaBilingue(op.expedition?.wilaya),
    communeLivraison: op.expedition?.commune ?? null,
    variante: input.variante,
    maintenant: input.now,
  });
}
