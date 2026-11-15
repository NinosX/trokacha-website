// lib/pro/safeNext.ts
// =============================================================================
// Chemin de retour après connexion (`/connexion?next=…`) : le bureau seulement,
// sur le même site, jamais une autre adresse (relecture de Main, 15/11, S2).
// L'analyseur d'URL retire tabulations et retours à la ligne (`/\t/evil.example`
// devenait `//evil.example`, une autre adresse) : tout caractère de contrôle,
// espace ou barre oblique inverse est refusé avant l'analyse, puis l'adresse est
// analysée pour de vrai et doit rester sur la même origine, sous `/pro`. Le
// préfixe de langue éventuel est retiré : le routeur du site le remet (sinon
// `/fr/fr/pro`). Module pur.
// =============================================================================

const DEFAUT = '/pro';
const INTERDITS = /[\u0000- \u007f-\u009f\\]/;
const BUREAU = /^(?:\/(?:ar|fr|en|kab))?(\/pro(?:\/.*)?)$/;

export function safeNext(raw: string | null | undefined, origin: string): string {
  if (!raw || INTERDITS.test(raw) || !raw.startsWith('/') || raw.startsWith('//')) return DEFAUT;
  let url: URL;
  let base: URL;
  try {
    base = new URL(origin);
    url = new URL(raw, base);
  } catch {
    return DEFAUT;
  }
  if (url.origin !== base.origin) return DEFAUT;
  const m = BUREAU.exec(url.pathname);
  if (!m) return DEFAUT;
  return m[1] + url.search;
}
