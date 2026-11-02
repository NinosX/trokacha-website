// Captures de l'app affichées sur le site (iPhone Pro Max, 1320×2868, 9:41).
// Deux jeux : l'arabe pour /ar (langue par défaut), le français pour /fr,
// /en et /kab (l'app n'existe pas en anglais ni en kabyle).
// Fichiers : public/screenshots/<ar|fr>/<nom>.png

export type AppScreenshot =
  | "app-accueil"
  | "app-annonce"
  | "app-offre"
  | "app-rendez-vous"
  | "app-chat"
  | "verif";

export function screenshotSrc(locale: string, name: AppScreenshot): string {
  const set = locale === "ar" ? "ar" : "fr";
  return `/screenshots/${set}/${name}.png`;
}
