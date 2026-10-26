# trokacha.com en arabe par défaut

**En bref (pour Lyes)**
1. `trokacha.com` s'ouvre en arabe pour tout le monde, même sur un PC ou un téléphone réglé en français.
2. Un bouton « Français » est visible en haut de chaque page : un seul geste pour changer, et le site s'en souvient (1 an).
3. Le français passe sous `/fr/…` ; les anciennes adresses `/ar/…` redirigent pour toujours vers l'adresse sans préfixe.
4. Google va réindexer le site en quelques semaines : les pages françaises déjà indexées sans préfixe deviennent les pages arabes.
5. Rien n'est en ligne : la branche `feat/arabic-default` a une preview Vercel à tester avant la fusion dans `main`.

---

## 1. Ce qui change pour un visiteur

| Situation | Avant | Après |
|---|---|---|
| Première visite sur `trokacha.com`, navigateur en français | Français | **Arabe** |
| Première visite, navigateur en arabe | Arabe (`/ar`) | Arabe (`/`) |
| Le visiteur touche « Français » | — | Page française `/fr/…`, choix mémorisé 1 an (cookie `NEXT_LOCALE`) |
| Il revient plus tard sur `trokacha.com/privacy` | Français | **Français** : redirigé vers `/fr/privacy`, puisqu'il a choisi |
| Il touche « العربية » sur une page française | — | Retour en arabe, le choix est remplacé |
| Ancien lien `trokacha.com/ar/…` | Arabe | Redirection permanente (308) vers `trokacha.com/…` |

- **Plus de détection automatique de la langue du navigateur.** Seul un choix fait avec le sélecteur l'emporte sur l'arabe. Visiter une page `/fr/…` (via un lien, Google…) ne compte PAS comme un choix.
- **Sélecteur visible dès le premier écran**, ordinateur et mobile :
  - bouton direct « Français » sur les pages arabes, « العربية » sur les autres ;
  - le menu à drapeaux (AR / FR / EN / KAB) reste à côté pour l'anglais et le kabyle ;
  - aussi présent sur les pages sans barre de navigation : fiche annonce partagée, pages « ouvrir dans l'app » des emails (match, proposition, conversation, profil, vérification, boutique), désinscription, préférences ;
  - le changement de langue garde les paramètres de l'adresse (`?token=`, `?sender=`).
- **Corrections d'affichage RTL** (captures à 390 et 1280 px) :
  - flèches orientées dans le sens de lecture ;
  - cartes de fonctionnalités et boutons des stores alignés à droite ;
  - numéros d'étapes et badges dans le bon coin ;
  - carrousel de captures : boutons, flèches clavier et glissé dans le bon sens ;
  - texte des annonces (souvent en français) affiché dans son propre sens.
- **Accueil, premier écran** :
  - « · Algérie » était écrit en dur en français dans le bandeau, il est maintenant traduit (الجزائر) ;
  - les pastilles « نقل الطرود » et « مشاركة السيارات » s'affichaient en arabe alors que le transport est masqué, elles sont retirées dans les 4 langues.

## 2. URLs et SEO

**Nouveau schéma**

| Langue | Accueil | Exemple |
|---|---|---|
| Arabe (par défaut) | `https://trokacha.com` | `https://trokacha.com/privacy` |
| Français | `https://trokacha.com/fr` | `https://trokacha.com/fr/privacy` |
| Anglais | `https://trokacha.com/en` | `https://trokacha.com/en/privacy` |
| Kabyle | `https://trokacha.com/kab` | `https://trokacha.com/kab/privacy` |

**Conséquences à accepter**
- Une adresse sans préfixe était française, elle est maintenant arabe. On ne peut pas distinguer une ancienne URL française d'une nouvelle URL arabe, donc pas de redirection possible pour elles.
- Google va réindexer pendant **quelques semaines**. Pendant ce temps, un résultat Google en français peut ouvrir la page arabe : le bouton « Français » est là pour ça.
- Les anciennes URLs `/ar/…` redirigent en **308 (permanent)** : leur référencement est transféré.

**Corrigé dans le code**
- **Canonical et hreflang page par page**, sur toutes les pages indexables : accueil, confidentialité, conditions, contact, troc/vente, chat, vérification, transport, annonces partagées, boutiques.
  - Avant, le layout racine donnait à **toutes** les pages le canonical de l'accueil : Google pouvait considérer `/privacy`, `/chat`… comme des doublons de l'accueil.
  - Chaque page déclare maintenant son canonical (sa propre URL) et les 4 langues + `x-default` → arabe.
- `testDZ` n'est pas traduit : une seule URL canonique `trokacha.com/testDZ`, sans hreflang.
- Les pages « ouvrir dans l'app » (noindex) n'ont plus de canonical trompeur.
- Le serveur envoie aussi les hreflang dans l'en-tête HTTP `Link` (géré par next-intl).
- **Sitemap** : les 4 langues, avec les alternatives hreflang. `/transport` n'y figure que si le flag transport est actif (sinon la page redirige).
- **robots.txt** : `/_next/` n'est plus bloqué, Google peut charger le JS/CSS pour rendre les pages.
- `og:url` n'est plus forcé sur l'accueil pour toutes les pages ; l'aperçu WhatsApp/Facebook prend l'URL partagée.

**À faire après la mise en ligne (Lyes ou le responsable SEO)**
- Search Console : soumettre à nouveau `https://trokacha.com/sitemap.xml`.
- Search Console : surveiller « Pages » pendant 2 à 4 semaines.
- Le code Google de vérification du layout est toujours `GOOGLE_VERIFICATION_CODE` (placeholder, déjà le cas avant).
- `kab` n'est pas un code ISO 639-1 : Google risque d'ignorer ce hreflang (sans gravité).
- `www.trokacha.com` et `trokacha.com` répondent tous les deux en 200 sans redirection (déjà le cas avant).
  - Les canonicals pointent vers `trokacha.com`, ce qui limite le doublon.
  - Une redirection www → apex dans Vercel serait plus propre. Ne pas la faire sans vérifier les Universal Links : AASA et `applinks:` déclarent les deux hôtes.

## 3. Liens de l'app et des emails (pour le responsable serveur)

**Rien n'a été modifié dans le dépôt de l'app.** Ces liens s'ouvrent maintenant en arabe sur le web, sauf choix manuel déjà fait par la personne.

### La règle à appliquer : `?lang=`, pas `/fr`
- **Ne pas préfixer** les liens qui ouvrent l'app (`/match/…`, `/ad/…`…) par `/fr` ou `/en`. Les Universal Links iOS (AASA), les App Links Android et le routeur de l'app (`utils/deepLinks.ts`, `parseTrokachaUrl`) ne reconnaissent que les chemins sans préfixe : `/fr/match/x` ouvrirait le site au lieu de l'app.
- **Ajouter plutôt `lang=<langue>`** à la query quand la langue de l'utilisateur est `fr` ou `en`, par exemple `https://www.trokacha.com/match/abc?lang=fr`.
  - App installée : l'app s'ouvre comme avant (la query est ignorée par AASA, par Android et par `parseTrokachaUrl`, qui ne lit que `sender`).
  - Sinon (ordinateur, app absente) : le site redirige vers `/fr/match/abc`, en français, et retire `lang` de l'adresse.
  - Un choix manuel fait sur le site reste prioritaire sur `lang`.
- `ar` peut être omis (c'est le défaut) ; l'envoyer est sans effet.
- Proposition de helper dans `functions/src/email/templates/baseTemplate.ts` :
  ```ts
  export function webUrl(path: string, language: SupportedLanguage): string {
    const url = `https://www.trokacha.com${path}`;
    if (language === 'ar') return url;
    return `${url}${path.includes('?') ? '&' : '?'}lang=${language}`;
  }
  ```

### Emails (`functions/src/email/templates/`), langue connue (`language`) : ajouter `lang`

| Fichier:ligne | Lien | Chemin dans l'AASA iOS ? | À faire |
|---|---|---|---|
| `baseTemplate.ts:15` | `/unsubscribe?token=…` | non (page web) | `&lang=` (ou `/fr/unsubscribe`, pas de Universal Link ici) |
| `baseTemplate.ts:213` | `/preferences` | non (page web) | `?lang=` (ou `/fr/preferences`) |
| `newMatchTemplate.ts:333` | `/match/{id}` | oui | `?lang=` |
| `matchReminderTemplate.ts:297` | `/match/{id}` | oui | `?lang=` |
| `proposalAcceptedTemplate.ts:235` | `/match/{id}` | oui | `?lang=` |
| `transactionTemplate.ts:315, 385` | `/match/{id}/review` | oui | `?lang=` |
| `transactionTemplate.ts:417` | `/match/{id}` | oui | `?lang=` |
| `shippingTemplate.ts:118, 166` | `/match/{id}` (transport, flag off) | oui | `?lang=` |
| `newProposalTemplate.ts:245` | `/proposal/{id}` | oui | `?lang=` |
| `counterProposalTemplate.ts:113` | `/proposal/{id}` | oui | `?lang=` |
| `newMessageTemplate.ts:86` | `/conversation/{id}?sender=…` | oui | `&lang=` |
| `adModerationTemplate.ts:252, 297, 353` | `/ad/{id}` | oui | `?lang=` |
| `newReviewTemplate.ts:104` | `/profile` | oui | `?lang=` |
| `newFollowerTemplate.ts:71` | `/profile/{followerId}` | oui | `?lang=` |
| `verificationTemplate.ts:183` | `/profile` | oui | `?lang=` |
| `verificationTemplate.ts:236` | `/verify` | oui | `?lang=` |
| `welcomeTemplate.ts:114` | `/create-ad` | oui | `?lang=` (voir le problème plus bas) |
| `boutiqueBatchTemplate.ts:59` | `/boutique` | non | `?lang=` |
| `rentalDocsTemplate.ts:176` | `/rental-docs/{id}` | non | `?lang=` (voir le problème plus bas) |

Côté Android, le manifeste natif suivi dans git ne déclare que `/ad/` en App Link : les autres liens passent par la page web, qui tente d'ouvrir l'app.

### App (dépôt `Trokacha`)

| Fichier:ligne | Lien | À faire |
|---|---|---|
| `screens/AboutScreen.tsx:28` | `https://trokacha.com` (lien « site web ») | Langue connue, pas un Universal Link : `https://trokacha.com/fr` ou `/en` selon la langue de l'app (OTA) |
| `app.json:259` | `privacyPolicyUrl: https://trokacha-website.vercel.app/privacy` | S'ouvre maintenant en arabe. Pour les stores, mettre `https://trokacha.com/fr/privacy`. Vérifier aussi les URLs saisies dans App Store Connect et Play Console (confidentialité, suppression de compte). |
| `utils/shareAd.ts:22`, `src/v2/domain/adCardModel.ts:381`, `components/AdCard.tsx:159`, `src/v2/screens/trips/TripPageScreen.tsx:215`, `src/v2/screens/trips/ParcelPageScreen.tsx:157` | `https://trokacha.com/ad/{id}` (partage d'annonce) | **Ne rien changer** : on partage à quelqu'un d'autre, dont la langue est inconnue ; l'arabe par défaut est le bon choix et le destinataire a le bouton « Français ». |
| `src/v2/domain/profileModel.ts:124` | `https://trokacha.com/profile/{id}` (partage de profil) | Ne rien changer (même raison) |
| `utils/boutiqueLinks.ts:30` | `https://trokacha.com/boutique/{slug}` (partage boutique) | Ne rien changer (même raison) |
| `hooks/useDzShareImage.ts:21`, `components/dzTest/DzResultCard.tsx:230` | `trokacha.com/testDZ` | Ne rien changer (page non traduite) |
| `components/cabas/CabasLabel.tsx:316`, `src/v2/data/tripCalendar.ts:40` | texte / UID d'agenda | Pas des liens |

### Universal Links / App Links : vérification
- `public/.well-known/apple-app-site-association` et `assetlinks.json` sont inchangés et toujours servis en 200 `application/json`, sans passer par le middleware : tout chemin contenant un point est exclu.
- Les chemins de l'AASA (`/ad/*`, `/match/*`, `/proposal/*`, `/conversation/*`, `/profile`, `/profile/*`, `/verify`, `/create-ad`, `/testDZ`) correspondent aux **URLs sans préfixe**, qui restent valides (arabe) :
  - un lien sans préfixe, avec ou sans `?lang=`, ouvre l'app comme avant ;
  - un lien préfixé (`/fr/ad/x`) ne correspond **pas** : il ouvre le site, puis la page tente d'ouvrir l'app (bouton + tentative automatique sur mobile). Ça fonctionne, avec un détour.
- Ajouter `/fr/*`, `/en/*`… à l'AASA est **déconseillé** tant que `parseTrokachaUrl` ne sait pas retirer le préfixe : l'app s'ouvrirait sur un lien qu'elle ne comprend pas.

### Problèmes trouvés en passant (déjà présents avant cette branche)
- `/create-ad` (email de bienvenue) et `/rental-docs/{id}` (email documents de location) **n'ont pas de page sur le site** : 404 sur ordinateur, et partout où l'app ne prend pas le lien.
  - `/rental-docs/` n'est pas dans l'AASA.
  - Côté Android, le manifeste natif suivi dans git (`android/app/src/main/AndroidManifest.xml`) ne déclare que `/ad/`. Les `intentFilters` de `app.json` ne s'appliquent pas en workflow bare tant que le manifeste n'est pas régénéré.
- Textes français écrits en dur, visibles sur les pages arabes. **Non modifiés**, la consigne étant de ne pas toucher aux textes :
  - « Email / Support / Localisation / Algérie / Vente » (page contact) ;
  - « Algérie » (pied de page) ;
  - « TROC · VENTE · ACHAT » et « Troc · Cash » (page troc/vente) ;
  - « Trokacha, le troc nouvelle génération » (pages « ouvrir dans l'app ») ;
  - textes alternatifs des captures du carrousel.
- `components/BoutiqueInterstitial.tsx` (lignes 40, 41, 60, 61, 80, 81) utilise encore الحانوت / الحوانت alors que le lexique validé dit محل / المحلات. Le commit du 16/08 les a manqués. **Non modifié**, à valider par Lyes.
- Les captures d'écran de l'app (carrousel) sont en français, y compris sur la page arabe.
- La barre de navigation n'est pas collante sur l'accueil (`overflow-x-hidden` sur `<main>`). Même chose en français.

## 4. Tester la preview

La branche `feat/arabic-default` est poussée ; Vercel construit une preview à chaque push (déploiement « Preview », jamais la production).
- **Où trouver l'URL** : onglet *Deployments* du projet Vercel, filtre branche `feat/arabic-default`. Ou bien : `gh api repos/NinosX/trokacha-website/deployments?ref=feat/arabic-default` puis `…/deployments/<id>/statuses` (champ `environment_url`).
- Les previews Vercel peuvent être protégées (connexion Vercel requise) : ouvrir le lien depuis un navigateur connecté au compte Vercel.

**Parcours à jouer (navigateur en français, fenêtre privée)**
1. Ouvrir la racine de la preview → la page est **en arabe**, mise en page de droite à gauche.
2. Sur ordinateur, un bouton **« Français »** est visible en haut ; sur mobile, à côté du drapeau. Le toucher → page française, adresse en `/fr`.
3. Ouvrir à nouveau la racine (taper l'adresse) → on arrive directement sur `/fr` : le choix est retenu.
4. Sur une page française, toucher **« العربية »** → retour à l'arabe ; rouvrir la racine → reste en arabe.
5. Ouvrir `<preview>/ar/privacy` → redirigé vers `<preview>/privacy` (arabe).
6. Nouvelle fenêtre privée : ouvrir `<preview>/match/test?lang=fr` → page « ouvrir dans l'app » **en français**, adresse `/fr/match/test`.
7. Ouvrir `<preview>/ad/<id d'une annonce approuvée>` → fiche annonce en arabe, texte de l'annonce lisible, bouton « Français » en haut.
8. Ouvrir `<preview>/sitemap.xml` → les URLs ne sont pas préfixées pour l'arabe et sont en `/fr`, `/en`, `/kab` pour les autres.
9. Sur iPhone avec l'app installée, ouvrir depuis Notes un lien `https://trokacha.com/ad/<id>?lang=fr`.
   - Ce test ne vaut **qu'après la mise en ligne** : l'AASA de la preview n'est pas sur le domaine `trokacha.com`.
   - Résultat attendu : l'app s'ouvre sur l'annonce.

**Vérifié en local** (build de production `next build` + `next start`, Chrome headless, navigateur réglé en français) :
- les parcours 1 à 7 ;
- les balises canonical/hreflang de chaque page ;
- `robots.txt` et `sitemap.xml` ;
- l'AASA servie en `application/json` ;
- aucune barre de défilement horizontale à 390 et 1280 px sur l'accueil, `/boutiques`, une annonce, la FAQ, une page « ouvrir dans l'app » et la confidentialité.

**Mise en production** : fusionner `feat/arabic-default` dans `main` (Vercel redéploie). Aucun build natif, aucun OTA et aucun déploiement Firebase n'est nécessaire.
