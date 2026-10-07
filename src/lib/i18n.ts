/**
 * Bilingual core — Vietnamese and English, no i18n library.
 *
 * WHY NO LIBRARY. `next-intl` and friends bring a message catalogue, ICU plural
 * syntax, a provider, and a namespace loader. This site has two locales, no
 * pluralisation and no runtime message loading — every string is known at build
 * time. What it does need is the one thing a JSON catalogue cannot give: a
 * MISSING TRANSLATION MUST FAIL THE BUILD. `L<T>` is a plain object with both
 * locales required, so TypeScript refuses to compile a half-translated field.
 * With a catalogue, a missing key is a runtime fallback nobody notices until a
 * visitor reads it. Reach for a library when there is a third locale AND a
 * non-developer editing copy; until then this is smaller and stricter.
 *
 * ── URL SHAPE ───────────────────────────────────────────────────────────────
 *
 *   Vietnamese  /tuyen-dung        (no prefix — it is the default)
 *   English     /en/tuyen-dung
 *
 * Vietnamese has no prefix because this is a Vietnamese company and every link
 * that already exists points at an unprefixed path. `proxy.ts` rewrites those
 * onto the `[locale]` tree internally, so the routing is uniform while the URLs
 * stay clean; it also redirects an explicit `/vi/...` back to the bare path so
 * the same page never has two addresses.
 *
 * NEVER HAND-WRITE AN INTERNAL HREF. Use `localePath()` — a literal `/tuyen-dung`
 * in an English page drops the reader back into Vietnamese, and that is the
 * single most common i18n bug in a site shaped like this one.
 */

export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Vietnamese is the default and lives at the URL root. */
export const DEFAULT_LOCALE: Locale = "vi";

/**
 * A value that exists in both languages.
 *
 * Generic over `T` so it can carry more than strings — `L<string[]>` is a
 * translated bullet list, and both sides are still required. THAT REQUIREMENT IS
 * THE POINT: adding a field to any data module without an English value is a
 * type error, not a page that silently renders Vietnamese to an English reader.
 */
export type L<T = string> = { readonly vi: T; readonly en: T };

/** Read the active language out of a translated value. */
export function t<T>(value: L<T>, locale: Locale): T {
  return value[locale];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Build an internal href for a locale.
 *
 *   localePath("/tuyen-dung", "vi")  →  "/tuyen-dung"
 *   localePath("/tuyen-dung", "en")  →  "/en/tuyen-dung"
 *   localePath("/", "en")            →  "/en"
 *
 * Hash and query survive: `localePath("/lien-he?x=1", "en")` → `/en/lien-he?x=1`.
 */
export function localePath(path: string, locale: Locale) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Split a pathname into its locale and the rest — the inverse of `localePath`.
 * Used by the language switcher to stay on the same page across a swap.
 *
 *   "/en/tin-tuc"  →  { locale: "en", path: "/tin-tuc" }
 *   "/tin-tuc"     →  { locale: "vi", path: "/tin-tuc" }
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) {
    return { locale: first, path: `/${segments.slice(1).join("/")}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * `<html lang>` value. Not the same string as the locale key: `vi` happens to be
 * a valid BCP-47 tag, `en` is widened to `en-US` for the region-specific number
 * and date formats the site actually renders.
 */
export const HTML_LANG: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

/** What each language calls itself, for the switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
};

export const LOCALE_NAME: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};
