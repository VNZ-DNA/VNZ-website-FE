"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PixelMenu } from "@/components/pixel-menu";
import { NAV as NAV_UI, NAV_LABELS } from "@/lib/dictionary";
import {
  LOCALES,
  LOCALE_LABEL,
  LOCALE_NAME,
  localePath,
  stripLocale,
  t,
  type Locale,
} from "@/lib/i18n";

/**
 * Site navigation — burger-only, at every breakpoint.
 *
 * The bar carries three things and nothing else: the logo, the primary CTA and
 * the menu toggle. Every destination lives inside a full-screen overlay rather
 * than a link row, which keeps the first viewport of the homepage almost
 * entirely hero art.
 *
 * Three behaviours worth knowing before editing:
 *
 *  · TWO TONES. At the top of the page the hero is a bright cream sunset, so
 *    the bar runs in dark ink with the light-background logo. Once scrolled it
 *    runs cream on a dark block. Both logo files are used exactly as supplied —
 *    never recoloured or filtered, only resized.
 *  · DIRECTIONAL. Past the first screen the bar gets out of the way while you
 *    read downward and returns the moment you scroll up, so navigation is one
 *    gesture away without permanently occupying the viewport.
 *  · NO BAR. Once scrolled it resolves into two small floating blocks with the
 *    page showing through between them, instead of one full-width slab that
 *    spends most of its width being an empty rectangle over the artwork.
 */

/**
 * Menu destinations. The numbering and the open stagger both derive from this
 * array.
 *
 * EVERY ENTRY IS A REAL ROUTE, and none should come back as a `#` anchor. This
 * list used to be half homepage bookmarks — `/#story`, `/#products`,
 * `/#partners`, `#contact` — which behaved differently depending on where you
 * clicked them: on the homepage they scrolled, and from a subpage they navigated
 * home and dropped you into the middle of a chapter (or, for the bare
 * `#contact`, to the bottom of the page you were already on). A menu entry is a
 * destination, not a scroll position.
 *
 * SO THE MENU IS SHORT, and that is the intended shape rather than an omission.
 * Câu chuyện, Dấu ấn VNZ and Đối tác are NOT listed: they are homepage chapters
 * with no route of their own, and the homepage is what leads to them. (Routes for
 * all three were built and then cut — don't add the labels back pointing at
 * `/#story` & co., which is exactly the arrangement this replaced. They earn a
 * menu slot again when they earn a page.)
 *
 * Every href must resolve to a directory under `src/app/` — keep in step with
 * `FOOTER_NAV` in `src/lib/site.ts`.
 */
const NAV = [
  { path: "/", label: NAV_LABELS.home },
  { path: "/doi-ngu", label: NAV_LABELS.team },
  { path: "/tin-tuc", label: NAV_LABELS.news },
  { path: "/tuyen-dung", label: NAV_LABELS.careers },
  { path: "/lien-he", label: NAV_LABELS.contact },
];

const CTA_PATH = "/lien-he";

/**
 * `tone` describes what the bar sits ON at scroll-top, not the bar itself.
 * Unscrolled, the menu glyph inherits the page: `"light"` (the paper homepage
 * and `/tuyen-dung`) needs an ink glyph, `"dark"` (the `/doi-ngu` stage, which
 * opens on a full-bleed `bg-ink` backdrop) needs a cream one — an ink glyph
 * there is invisible until the first scroll paints the floating plate behind it.
 * Once scrolled or opened, both tones converge on cream, so this only governs
 * the top-of-page state.
 */
export function SiteNav({
  locale,
  tone = "light",
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const lastY = useRef(0);

  /**
   * The language switcher stays on the SAME PAGE across a swap — `/en/tin-tuc`
   * ⇄ `/tin-tuc` — instead of dumping the reader on the homepage, which is what
   * a switcher hard-coded to `/` or `/en` does and is the fastest way to make
   * someone stop using it.
   *
   * `usePathname()` reports the BROWSER's path, not the rewritten internal one,
   * so a Vietnamese page reads back as `/tin-tuc` (unprefixed) exactly as
   * `stripLocale` expects. Don't swap this for the `locale` prop plus a manual
   * concat — the prop knows the language but not where in the site you are.
   */
  const pathname = usePathname();
  const { path: barePath } = stripLocale(pathname ?? "/");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      // The 5px threshold stops trackpad jitter from flickering the bar.
      if (y < 140) setHidden(false);
      else if (y > lastY.current + 5) setHidden(true);
      else if (y < lastY.current - 5) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on Escape, and lock the page behind the overlay.
  useEffect(() => {
    if (!menuActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuActive]);

  const solid = scrolled || open || menuActive;
  const onLightHero = !solid && tone === "light";
  const floating = scrolled && !open && !menuActive;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.18,1)] ${
          hidden && !open && !menuActive ? "-translate-y-[130%]" : "translate-y-0"
        }`}
      >
        <nav className="mx-auto flex max-w-[92rem] items-center justify-between px-4 py-3 sm:px-7 sm:py-4">
          {/* No backing plate at any scroll position — the logo sits directly
              on the page. */}
          <Link
            href={localePath("/", locale)}
            aria-label={t(NAV_UI.homeAria, locale)}
            className="shrink-0"
          >
            <Image
              src={
                onLightHero
                  ? "/general/logo-light.png"
                  : "/general/logo-dark.png"
              }
              alt="VNZ — Vietnam Z-DNA Technology"
              width={1094}
              height={560}
              priority
              unoptimized
              className={`pixelated h-auto transition-[width] duration-300 ${
                floating ? "w-20 sm:w-[5.5rem]" : "w-24 sm:w-28"
              }`}
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            {/* `Link`, not `<a>` — now that this is a route rather than a
                `#contact` anchor, an `<a>` would do a full document reload on
                every click and drop the whole app shell. Same for the overlay
                entries below. */}
            <Link
              href={localePath(CTA_PATH, locale)}
              className="hidden shrink-0 whitespace-nowrap bg-ember px-5 py-3 font-pixel text-base uppercase leading-none tracking-[0.1em] text-cream shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-sunset active:translate-x-1 active:translate-y-1 active:shadow-none sm:block sm:text-lg"
            >
              {t(NAV_UI.cta, locale)}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={t(open ? NAV_UI.closeMenu : NAV_UI.openMenu, locale)}
              aria-expanded={open}
              aria-controls="site-menu"
              className={`relative z-[70] flex h-[3.25rem] w-[3.25rem] shrink-0 flex-col items-center justify-center gap-[7px] transition-[background-color,box-shadow,border-color,color] duration-300 ${
                open
                  ? "text-cream"
                  : onLightHero
                    ? "text-ink hover:text-ember"
                    : "text-cream hover:text-ember"
              } ${
                floating
                  ? "border border-cream/12 bg-ink/90 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] backdrop-blur-md"
                  : "border border-transparent"
              }`}
            >
              <span
                className={`block h-[3px] w-7 bg-current transition-transform duration-300 ${
                  open ? "translate-y-[10px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[3px] w-7 bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-[3px] w-7 bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[10px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Full-screen menu ── */}
      <PixelMenu open={open} onActiveChange={setMenuActive}>
        <div className="relative flex h-full flex-col justify-between overflow-y-auto px-5 pb-10 pt-28 sm:px-8 sm:pt-32">
          <nav
            aria-label={t(NAV_UI.primaryNav, locale)}
            className="mx-auto w-full max-w-[92rem]"
          >
            <ul className="flex flex-col">
              {NAV.map((item, i) => (
                <li
                  key={item.path}
                  data-menu-item
                  className="border-b border-cream/10"
                >
                  <Link
                    href={localePath(item.path, locale)}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-5 py-3 text-cream sm:gap-8 sm:py-4"
                  >
                    <span className="font-mono text-xs text-cream/45 sm:text-sm">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {/* Type is capped well below the hero's scale on purpose —
                        the full chapter list has to fit a laptop viewport without
                        the overlay turning into a scroll of its own. */}
                    <span className="font-pixel text-[clamp(1.6rem,5.5vw,3.25rem)] uppercase leading-none tracking-[0.02em] transition-[transform,color] duration-300 group-hover:translate-x-3 group-hover:text-ember">
                      {t(item.label, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div
              data-menu-item
              className="mt-10"
            >
              <Link
                href={localePath(CTA_PATH, locale)}
                onClick={() => setOpen(false)}
                className="inline-block bg-ember px-6 py-4 font-pixel text-xl uppercase leading-none tracking-[0.1em] text-cream shadow-[5px_5px_0_0_#000] transition-colors hover:bg-sunset"
              >
                {t(NAV_UI.cta, locale)} <span aria-hidden>▸</span>
              </Link>
            </div>
          </nav>

          <div
            data-menu-item
            className="mx-auto mt-14 flex w-full max-w-[92rem] flex-col gap-4 border-t border-cream/10 pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-ui text-[9px] uppercase tracking-[0.3em] text-gold">
              Vietnamese Minds · Global Solutions
            </p>
            {/* ── Language switcher ──
                It used to be a dead "EN" with a `cursor-not-allowed` and a
                tooltip saying the English build was on its way. It is real now.

                EACH ENTRY IS A `Link` TO THE SAME PAGE in the other language, not
                a button that re-renders in place: a locale swap changes the URL,
                so it has to be navigable, shareable and openable in a new tab.
                `hrefLang` tells crawlers what sits on the other end.

                The active locale renders as plain text rather than a link to
                itself — a link that does nothing is worse than no link. */}
            <nav
              aria-label={t(NAV_UI.switchLanguage, locale)}
              className="flex items-center gap-2 font-pixel text-base uppercase tracking-[0.12em]"
            >
              {LOCALES.map((l, i) => (
                <span key={l} className="flex items-center gap-2">
                  {i > 0 ? (
                    <span aria-hidden className="text-cream/25">
                      |
                    </span>
                  ) : null}
                  {l === locale ? (
                    <span aria-current="true" className="text-ember">
                      {LOCALE_LABEL[l]}
                    </span>
                  ) : (
                    <Link
                      href={localePath(barePath, l)}
                      hrefLang={l}
                      title={LOCALE_NAME[l]}
                      onClick={() => setOpen(false)}
                      className="text-cream/60 transition-colors duration-200 hover:text-ember"
                    >
                      {LOCALE_LABEL[l]}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </PixelMenu>
    </>
  );
}
