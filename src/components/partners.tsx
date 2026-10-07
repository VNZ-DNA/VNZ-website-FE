"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DitherButton from "@/components/bits/dither-button";
import { Chapter } from "@/components/story-kit";
import { PARTNERS_UI } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import type { PublicPartnerListItem } from "@/server/api/partners";

/**
 * Chương cuối · Đối tác — the first people who said yes, and the page's last word
 * before the footer.
 *
 * ONE MARK AT A TIME. Public Partner data can grow without changing this layout:
 * a single logo occupies the showcase window, then slides out while the next one
 * slides in. After the last Partner, the sequence wraps back to the first.
 *
 * NO PLATE, NO CUTOUT. The partner marks shipped as smooth raster logos on a
 * SOLID WHITE background (not pixel art, no alpha). Flood-filling them would
 * either leave a halo or punch holes in the highlights, so `mix-blend-multiply`
 * melts the white into the ground instead. Resting state is greyscale so three
 * different brand palettes don't fight each other; hover restores one brand's
 * real colour at a time, which is also what makes the row feel touchable.
 *
 * ONLY VALID ON A LIGHT GROUND. On ink, multiply does the opposite — the white
 * plate survives as a bright slab and the mark is crushed away. The mirrored
 * version is `invert` + `mix-blend-screen` over a dark plate, and it costs the
 * hover-to-colour, since brand colour cannot survive an invert. This chapter was
 * briefly on ink and came back. Swap ground, plate and blend together or not at
 * all.
 *
 * TDD-044 deliberately exposes only `logoUrl` and `websiteUrl`. Keep this chapter
 * logo-first; richer Partner copy belongs to a future public contract rather than
 * being inferred from the old static placeholders.
 *
 * A `standalone` variant of this component briefly existed for a `/doi-tac`
 * route — `<h1>` header plus that placeholder copy. Both are gone: the chapter
 * lives on the homepage only. Don't re-add the prop without the route.
 */
export function Partners({
  locale,
  partners,
}: {
  locale: Locale;
  partners: PublicPartnerListItem[] | null;
}) {
  // TDD-044 keeps logoUrl nullable. A Partner without a logo has no visible
  // identity in this logo-only chapter, so skip it defensively instead of
  // rendering a broken/empty mark. Keep backend ordering unchanged.
  const visiblePartners = (partners ?? []).filter(
    (partner): partner is PublicPartnerListItem & { logoUrl: string } =>
      Boolean(partner.logoUrl?.trim()),
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (visiblePartners.length <= 1 || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visiblePartners.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [paused, visiblePartners.length]);

  const currentIndex =
    visiblePartners.length > 0 ? activeIndex % visiblePartners.length : 0;

  return (
    <section
      id="partners"
      className="relative isolate w-full overflow-x-clip paper pb-24 pt-24 sm:pb-28 sm:pt-28"
    >
      {/* ── Grid field ──
          The same blueprint grid the Dấu ấn act stands on, so the two paper
          chapters read as one surface rather than as a textured stage followed by
          a blank one. Two `repeating-linear-gradient`s crossed at 56px in ink at
          5%: paper tooth, not a table.

          The radial mask is what stops it looking like a spreadsheet — the lines
          are strongest at centre and dissolve before any edge, so the grid has no
          border of its own and nothing to line up with the section boundary.
          KEEP THE 56px AND THE 5% IN STEP with `products-act.tsx`; a grid that is
          nearly-but-not-quite the same across a seam is worse than none. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
      />

      {visiblePartners.length > 0 ? (
        <>
          <header className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Chapter label={t(PARTNERS_UI.chapter, locale)} />
            <h2 className="s-rise mt-5 font-pixel text-[clamp(1.4rem,3.4vw,2.4rem)] uppercase leading-tight text-ink">
              {visiblePartners.length} {t(PARTNERS_UI.headingA, locale)}{" "}
              <span className="text-clay">{t(PARTNERS_UI.headingAccent, locale)}</span>{" "}
              {t(PARTNERS_UI.headingB, locale)}
            </h2>
          </header>

          {/* TDD-044 already returns public Partners in display order. Keep that
              order exactly and advance one Partner at a time in a circular loop. */}
          <div
            className="partner-carousel mx-auto mt-14 h-40 w-full max-w-3xl overflow-hidden sm:h-44"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <ul className="relative h-full w-full list-none">
              {visiblePartners.map((partner, index) => {
                const previousIndex =
                  (currentIndex - 1 + visiblePartners.length) % visiblePartners.length;
                const isActive = index === currentIndex;
                const isPrevious = index === previousIndex && !isActive;
                const mark = (
                  <div className="relative isolate flex h-full w-full items-center justify-center paper px-8 sm:px-12">
                    {/* Public logo URLs can come from any configured storage/CDN.
                        Using a plain img keeps the public contract independent of
                        Next Image remotePatterns while preserving the existing look. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={partner.logoUrl}
                      alt={`${t(PARTNERS_UI.chapter, locale)} ${index + 1}`}
                      className="relative max-h-28 w-auto max-w-[80%] object-contain opacity-90 mix-blend-multiply grayscale transition-[opacity,filter,transform] duration-500 group-hover:scale-[1.04] group-hover:opacity-100 group-hover:grayscale-0 sm:max-h-32"
                    />
                  </div>
                );

                return (
                  <li
                    key={`${partner.logoUrl}-${partner.websiteUrl ?? "no-url"}-${index}`}
                    aria-hidden={!isActive}
                    className={`group absolute inset-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,0.8,0.18,1)] motion-reduce:transition-none ${
                      isActive
                        ? "translate-x-0 opacity-100"
                        : isPrevious
                          ? "-translate-x-full opacity-0"
                          : "translate-x-full opacity-0"
                    }`}
                  >
                    {partner.websiteUrl !== null ? (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isActive ? undefined : -1}
                        className="block h-full w-full"
                      >
                        {mark}
                      </a>
                    ) : (
                      mark
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}

      {/* ── Open invitation ──
          The chapter doubles as the page's business CTA, and as the last thing
          above the footer it is the final fork: work with us, or join us. */}
      <div className="s-fade mx-auto mt-20 flex max-w-3xl flex-col items-center gap-6 px-5 text-center sm:px-8">
        <p className="font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
          {t(PARTNERS_UI.invitation, locale)}
        </p>

        {/* The primary action keeps `DitherButton` rather than the site-wide
            `.btn-pixel`: a live Bayer-dither surface marks the one button that
            matters. It must stay the ONLY one on the page — the contrast is the
            point and it stops working the moment it is used twice.

            "BẮT ĐẦU MỘT DỰ ÁN", NOT "LIÊN HỆ HỢP TÁC". The nav carries a fixed
            "Liên hệ hợp tác" button that is on screen at the same time as this
            one, both pointing at `/lien-he`. Two identical labels in two
            different styles read as a mistake even when nobody can say why. Same
            destination, different words, and this one names the outcome rather
            than the mechanism. */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {/* `ditherColor` is a literal hex, not a CSS var: the pattern is
              painted into a canvas and `parseHex` can only read hex. */}
          <DitherButton
            href={localePath("/lien-he", locale)}
            ditherColor="#e8541f"
            ditherOpacity={0.22}
            ditherSize={5}
            className="gap-2 px-8 py-3 text-lg"
          >
            {t(PARTNERS_UI.ctaProject, locale)} <span aria-hidden>▸</span>
          </DitherButton>
          <Link
            href={localePath("/tuyen-dung", locale)}
            className="font-pixel inline-flex items-center gap-2 border-2 border-ink/40 px-7 py-3 text-lg uppercase tracking-wider text-ink transition-colors duration-200 hover:border-ember hover:bg-ink/5 hover:text-ember"
          >
            {t(PARTNERS_UI.ctaJoin, locale)}
          </Link>
        </div>
      </div>

      {/* NO `ActGap` HERE. That spacer is a chapter break — a hairline with a lit
          node, meaning "this beat is over, the next one is coming". This is the
          last section on the page; the only thing after it is the footer, so the
          divider was promising something that never arrives. The footer's own top
          border is the boundary now. */}
    </section>
  );
}
