export const SHOW_TRANSPORT = false;

// Boutiques (vitrines pros) — chantier 2026-08, volet web.
// Même mécanique que SHOW_TRANSPORT : passer à `true` + commit/push → Vercel
// redéploie et ouvre l'annuaire /boutiques + les pages /boutique/[id].
//
// ⚠️ Flag OFF ne veut PAS dire 404 : /boutique (cible du bouton « Ma boutique »
// des emails transactionnels), /boutique/[id] et /boutiques répondent alors
// l'interstitiel « ouvrir dans l'app ». Seules la navbar et le sitemap sont
// réellement conditionnés — flag off, le site est identique à l'actuel.
export const SHOW_BOUTIQUES = false;
