export const SHOW_TRANSPORT = false;

// Boutiques (vitrines pros) — chantier 2026-08, volet web.
// Même mécanique que SHOW_TRANSPORT : passer à `true` + commit/push → Vercel
// redéploie et ouvre l'annuaire /boutiques + les pages /boutique/[id].
//
// ⚠️ Flag OFF ne veut PAS dire 404 : /boutique (cible du bouton « Ma boutique »
// des emails transactionnels), /boutique/[id] et /boutiques répondent alors
// l'interstitiel « ouvrir dans l'app ». Seules la navbar et le sitemap sont
// réellement conditionnés — flag off, le site est identique à l'actuel.
//
// Essai local (15/11, socle pros) : `NEXT_PUBLIC_SHOW_BOUTIQUES=1 npx next dev`
// allume les pages sur la machine. Accès LITTÉRAUX à `process.env` (remplacés à la
// compilation) : dans un `next build`, NODE_ENV vaut « production » et la seconde
// moitié disparaît, la production ne lit que `SHOW_BOUTIQUES_PROD`.
// Pour ouvrir les pages au public : `SHOW_BOUTIQUES_PROD = true` (livraison par Main).
const SHOW_BOUTIQUES_PROD = false;
export const SHOW_BOUTIQUES: boolean =
  SHOW_BOUTIQUES_PROD ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_SHOW_BOUTIQUES === '1');

// Locations (voitures, logements) : ouverture de la V2 à tous (Objets +
// Locations, décision Lyes 02/11). À `true`, le site dit « troc, vente, achat
// et location » partout (titres, menus, accueil, FAQ, SEO) et la page /echange
// montre le bloc location ; à `false`, il revient à « troc, vente et achat ».
// Les textes vivent dans messages/*.json sous deux clés : `cle` (sans location)
// et `cleWithRentals` (avec) ; `withRentals('cle')` choisit la bonne.
export const SHOW_LOCATIONS = true;

export function withRentals(key: string): string {
  return SHOW_LOCATIONS ? `${key}WithRentals` : key;
}
