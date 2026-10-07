/**
 * Pass-through root layout.
 *
 * IT RENDERS NO `<html>` OR `<body>` ON PURPOSE, and that is not an oversight.
 * Next requires a file at `app/layout.tsx`, but the `lang` attribute has to
 * change per locale and this layout sits ABOVE the `[locale]` segment — it never
 * sees which language is being served. So the real root layout, with the
 * document shell and the fonts, is `app/[locale]/layout.tsx`, and this one only
 * forwards its children.
 *
 * This is the arrangement Next's own i18n guidance uses. Do not "fix" it by
 * moving `<html>` back up here: the page would go out as `lang="en"` for
 * Vietnamese readers, which mis-hyphenates the text, mis-selects fonts, and tells
 * every screen reader to pronounce Vietnamese with English phonetics.
 *
 * `globals.css` is imported HERE rather than in the locale layout so the
 * stylesheet is a single shared chunk instead of one per language.
 */
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
