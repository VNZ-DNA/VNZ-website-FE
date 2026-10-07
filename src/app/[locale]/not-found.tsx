import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Meteors, Motes } from "@/components/story-kit";
import { NOT_FOUND } from "@/lib/dictionary";
import { DEFAULT_LOCALE, localePath, t } from "@/lib/i18n";

/**
 * 404 — not found.
 *
 * App Router picks this up for every unmatched path, so it is the page anyone
 * lands on after a stale link. Three routes were built and then cut
 * (`/cau-chuyen`, `/dau-an`, `/doi-tac`), which is exactly the kind of link that
 * outlives its page — this screen is what catches them.
 *
 * THE COPY IS PLAIN, DELIBERATELY. It was written in the arcade voice the rest of
 * the site uses ("Màn chơi này không tồn tại", "Insert coin to continue") and
 * that was wrong here: someone hitting a 404 has already failed at something and
 * wants to know what happened and where to go, not a joke about it. The pixel
 * ART stays — it is the site — but the words say what is true. Keep it that way.
 *
 * IT STILL HAS TO OFFER AN EXIT. A dead end that only says "not found" makes the
 * visitor press Back, and Back is where they came from — the same broken link.
 * The two buttons are that exit; the header menu and the footer carry the rest.
 * (A numbered route list rendered here too, derived from `FOOTER_NAV`. It was
 * cut for putting the same menu on screen three times.)
 *
 * DARK PAGE, so `SiteNav` gets `tone="dark"` — same reason as `/doi-ngu`: the
 * default light tone paints an ink menu glyph that is invisible on this backdrop
 * until the first scroll.
 *
 * NO `metadata` EXPORT. `not-found.tsx` is a special file that renders inside the
 * root layout, and the title comes from there; adding one here is not a supported
 * hook and silently does nothing.
 *
 * Server component. `Motes` / `Meteors` are the same ambient CSS fields the Câu
 * chuyện act uses, and both go quiet under `prefers-reduced-motion`.
 */
export default function NotFound() {
  /**
   * NOT-FOUND CANNOT READ `params`. Next renders this outside the matched route,
   * so the `[locale]` segment is not available to it — there is no way to know
   * from here whether the visitor was reading `/en/...` or a bare path. It falls
   * back to Vietnamese, the site default.
   *
   * The consequence is honest and small: an English reader who hits a dead link
   * sees a Vietnamese 404 whose buttons lead back into the Vietnamese site. If
   * that becomes worth fixing, the route to it is a catch-all page under
   * `[locale]` rather than this file, since that one DOES get params.
   */
  const locale = DEFAULT_LOCALE;

  return (
    <div className="relative bg-ink">
      <SiteNav locale={locale} tone="dark" />
      <main>
        <section className="relative isolate flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-ink px-5 pb-24 pt-32 text-center sm:px-8">
          {/* Ember wash behind the number, so the stage is not a flat black
              rectangle with type on it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(70%_55%_at_50%_38%,rgba(232,84,31,0.18),transparent_72%)]"
          />
          {/* CRT lines. Heavier than the `.scanlines` utility on purpose: that
              one multiplies black over a LIGHT chapter ground and all but
              vanishes on ink. This is the footer's overlay, which was tuned for
              exactly this backdrop. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] opacity-40 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.35)_0_1px,transparent_1px_3px)]"
          />
          <Meteors />
          <Motes />

          <span className="relative z-[2] font-ui text-[10px] uppercase tracking-[0.35em] text-gold sm:text-xs">
            {t(NOT_FOUND.eyebrow, locale)}
          </span>

          {/* The number carries the brand's gradient-clip treatment, the same one
              "Vietnam Z-DNA" uses in the story act.
              NO `filter:` ON THIS ELEMENT — see the long note in
              `story-truth.tsx`: Chrome feeds the whole background box to a filter
              when the background is `background-clip: text`, so a drop-shadow
              glow renders as a blurred rectangle instead of hugging the glyphs.
              `text-shadow` follows the glyphs even when the text is transparent,
              which is why the glow below is one. */}
          <h1
            className="relative z-[2] mt-6 bg-gradient-to-br from-gold via-ember to-lantern bg-clip-text font-pixel text-[clamp(6rem,26vw,18rem)] uppercase leading-[0.78] text-transparent [text-shadow:0_0_60px_rgba(232,84,31,0.35)]"
            aria-label="404"
          >
            404
          </h1>

          <p className="relative z-[2] mt-2 font-pixel text-[clamp(1.4rem,4.5vw,2.75rem)] uppercase leading-tight text-cream">
            {t(NOT_FOUND.titleA, locale)}{" "}
            <span className="text-sunset">{t(NOT_FOUND.titleAccent, locale)}</span>
          </p>

          <p className="relative z-[2] mx-auto mt-6 max-w-xl font-viet text-base font-light leading-relaxed text-cream/70 sm:text-lg">
            {t(NOT_FOUND.body, locale)}
          </p>

          <div className="relative z-[2] mt-10 flex flex-col items-center gap-4 sm:flex-row">
            {/* `btn-pixel` fills with ink, which would disappear on this ground
                if the class did not also draw a cream ring in its box-shadow. It
                does — so it reads here as well as on the paper chapters. */}
            <Link
              href={localePath("/", locale)}
              className="btn-pixel font-pixel inline-flex items-center gap-2 px-7 py-3 text-lg uppercase tracking-wider"
            >
              {t(NOT_FOUND.ctaHome, locale)} <span aria-hidden>▸</span>
            </Link>
            <Link
              href={localePath("/lien-he", locale)}
              className="font-pixel inline-flex items-center gap-2 border-2 border-cream/40 px-7 py-3 text-lg uppercase tracking-wider text-cream transition-colors duration-200 hover:border-ember hover:text-ember"
            >
              {t(NOT_FOUND.ctaReport, locale)}
            </Link>
          </div>

          {/* NO ROUTE LIST HERE. There was a numbered "Các trang khác" grid of
              every entry in `FOOTER_NAV`; it was cut for repeating the menu
              twice over on the same screen — the header's menu and the footer's
              two columns are both already on this page, so a third copy in the
              middle was noise, not wayfinding. The two buttons above are the
              exit. */}
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
