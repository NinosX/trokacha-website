import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing, isLocale, LOCALE_COOKIE } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const DEFAULT_LOCALE = routing.defaultLocale;

/** Indice de langue des liens app/emails : `https://trokacha.com/match/x?lang=fr`. */
const LANG_PARAM = 'lang';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1];

  // 1. Anciennes URLs `/ar/x` (l'arabe était préfixé quand le français était
  //    la langue par défaut) → `/x`, en PERMANENT (308) pour que Google et les
  //    liens déjà partagés convergent vers la nouvelle URL.
  //    (next-intl ferait la même chose, mais en 307 temporaire.)
  if (firstSegment === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/';
    return NextResponse.redirect(url, 308);
  }

  // 2. URL sans préfixe = arabe. Deux exceptions, en TEMPORAIRE (307)
  //    puisque c'est par personne (les robots n'ont ni cookie ni ?lang= :
  //    ils voient toujours l'arabe sur `/x`) :
  //    a. le visiteur a choisi une autre langue avec le sélecteur (cookie) ;
  //    b. sinon, le lien porte `?lang=fr|en|kab` : liens des emails / de
  //       l'app, qui gardent ainsi un chemin SANS préfixe (`/match/x`), seul
  //       format reconnu par les Universal Links iOS (AASA), les App Links
  //       Android et le routeur de l'app. Le choix manuel (a) reste prioritaire.
  if (!isLocale(firstSegment)) {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const hinted = request.nextUrl.searchParams.get(LANG_PARAM)?.toLowerCase();
    const target = isLocale(chosen) ? chosen : isLocale(hinted) ? hinted : undefined;
    if (target && target !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = `/${target}${pathname === '/' ? '' : pathname}`;
      url.searchParams.delete(LANG_PARAM);
      return NextResponse.redirect(url, 307);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for API routes, static files, etc.
  matcher: ['/', '/(fr|en|ar|kab)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
