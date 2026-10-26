import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing, isLocale, LOCALE_COOKIE } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const DEFAULT_LOCALE = routing.defaultLocale;

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

  // 2. URL sans préfixe = arabe. Seule exception : le visiteur a choisi une
  //    autre langue avec le sélecteur (cookie posé par la Navbar) → on le
  //    renvoie vers sa langue, en TEMPORAIRE (307) puisque c'est par personne.
  //    Les robots n'ont pas de cookie : ils voient toujours l'arabe sur `/x`.
  if (!isLocale(firstSegment)) {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    if (isLocale(chosen) && chosen !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = `/${chosen}${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url, 307);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for API routes, static files, etc.
  matcher: ['/', '/(fr|en|ar|kab)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
