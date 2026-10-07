import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Pixelify_Sans,
  Silkscreen,
  Geist_Mono,
  Be_Vietnam_Pro,
  VT323,
} from "next/font/google";
import { CursorProvider } from "@/components/bits/cursor-provider";
import { META } from "@/lib/dictionary";
import { HTML_LANG, LOCALES, isLocale, t, type Locale } from "@/lib/i18n";

/**
 * The real root layout — it owns `<html>` and `<body>`.
 *
 * It lives under `[locale]` rather than at `app/layout.tsx` because `lang` has to
 * follow the language being served; see the note in the pass-through above it.
 *
 * `generateStaticParams` prerenders both languages, and `dynamicParams = false`
 * makes any other first segment a 404 instead of an attempted render. In practice
 * `proxy.ts` never lets a bad locale through — an unknown path is rewritten under
 * `/vi/` — but this layout is also what would run if the proxy were ever removed,
 * so the guard stays.
 *
 * FONTS ARE LOADED ONCE FOR BOTH LANGUAGES. `next/font` hoists these to module
 * scope, so the same five families are shared across locales rather than
 * refetched per language. Both locales use the same faces deliberately — see the
 * FONTS note in `dictionary.ts`.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Vietnamese-first proportional face. The pixel display fonts ship no Vietnamese
// diacritic glyphs, so all full-diacritic copy renders in this (mapped to
// `--font-viet` / the `font-viet` utility in globals.css).
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Retro CRT/terminal pixel face — one of the few pixel fonts on Google Fonts
// that ships a `vietnamese` subset, so it can render full-diacritic copy.
const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "vi";

  return {
    title: t(META.homeTitle, l),
    description: t(META.homeDescription, l),
    /**
     * Tells search engines the two pages are the same content in two languages
     * rather than duplicates competing with each other. `x-default` points at
     * Vietnamese because that is what an unprefixed URL serves.
     */
    alternates: {
      languages: {
        vi: "/",
        en: "/en",
        "x-default": "/",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${pixelify.variable} ${silkscreen.variable} ${geistMono.variable} ${beVietnam.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-mono text-cream">
        {/* Site-wide, so the custom pointer survives navigation between routes.
            Mounting it per-page would drop and re-mount the follower on every
            route change. */}
        <CursorProvider>{children}</CursorProvider>
      </body>
    </html>
  );
}
