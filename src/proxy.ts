import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n";

/**
 * Locale routing.
 *
 * Every page lives under `src/app/[locale]/`, but Vietnamese is served WITHOUT a
 * prefix because it is the default and every existing link points at a bare path.
 * Two rules do that:
 *
 *   1. REWRITE  `/tuyen-dung` → `/vi/tuyen-dung` internally. The visitor's URL
 *      does not change; only the route Next resolves does.
 *   2. REDIRECT `/vi/tuyen-dung` → `/tuyen-dung`, permanently. The rewrite above
 *      means the prefixed path also renders, and the same page answering two
 *      addresses splits its own search ranking and makes "copy the URL" produce
 *      an inconsistent link. One page, one address.
 *
 * English needs neither rule — `/en/...` already matches the route tree.
 *
 * THIS FILE IS `proxy.ts`, NOT `middleware.ts`. Next 16 accepts both names;
 * `proxy` is the current one and `middleware` is the legacy alias. Renaming it
 * back would still work but is a step backwards.
 *
 * NO LOCALE AUTO-DETECTION, and that is a decision rather than an omission.
 * Redirecting on `Accept-Language` means a Vietnamese visitor on an
 * English-configured laptop lands on a page they did not ask for, and a shared
 * link resolves differently for each person who opens it. The switcher in the
 * nav is explicit and it is one click.
 */

export const config = {
  /**
   * Everything except Next's own assets and files with an extension.
   *
   * `favicon|icon|apple-icon` ARE LISTED even though they have extensions,
   * because they are generated routes rather than files on disk — without them
   * `/icon.png` gets rewritten to `/vi/icon.png`, which does not exist, and the
   * tab loses its icon in a way that looks like a caching problem.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.[^/]+$).*)",
  ],
};

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  // `/vi/...` — collapse to the bare path. Permanent: the prefixed form is never
  // the canonical one, so caches and search engines should stop asking for it.
  if (first === DEFAULT_LOCALE) {
    const rest = pathname.slice(`/${DEFAULT_LOCALE}`.length) || "/";
    return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 308);
  }

  // Any other real locale prefix (today: `/en`) already matches the route tree.
  if (LOCALES.some((l) => l === first)) return NextResponse.next();

  // Everything else is Vietnamese — rewrite onto the locale tree. An unknown
  // path lands on `/vi/<junk>`, matches no route, and renders the localized
  // not-found page, which is what should happen.
  return NextResponse.rewrite(
    new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url),
  );
}
