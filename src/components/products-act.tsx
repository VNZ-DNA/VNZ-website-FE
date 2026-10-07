"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Chapter } from "@/components/story-kit";
import { TeamStrip } from "@/components/team";
import type { Product } from "@/lib/products";
import { PRODUCTS_UI } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { sanitizeProductRichText } from "@/lib/product-rich-text";
import type {
  PublicProductContentBlock,
  PublicProductListItem,
} from "@/server/api/products";
import type { PublicFeaturedTeamMembersResponse } from "@/server/api/team-members";

gsap.registerPlugin(ScrollTrigger);

/**
 * Chương 03 · Dấu ấn VNZ — the products, as a pinned, scroll-scrubbed conveyor.
 *
 * The second pinned act on the page, built the same way as `story-truth.tsx` and
 * for the same reason: the order matters and it has to be tied to scroll POSITION,
 * not to a timer or to "is it on screen yet".
 *
 * ONE PRODUCT AT A TIME. The rows used to sit stacked in normal flow, both visible
 * at once. Now the stage holds still and each product is dealt onto it:
 *
 *   ENTER   its four parts slide in from the LEFT, one after another —
 *           icon → wordmark → the pitch text → the CTA
 *   EXIT    the assembled product slides off to the RIGHT as one piece
 *   then    the next product enters from the LEFT again
 *
 * Same direction throughout, so it reads as a belt running past rather than
 * things bouncing in and out of the same edge.
 *
 * PARTS ENTER SEPARATELY, THE PRODUCT LEAVES WHOLE. That asymmetry is the point:
 * assembling piece by piece is what makes you read each part, and leaving in one
 * move is what makes room for the next without a second slow disassembly.
 *
 * Pinning is CSS `position: sticky`, not ScrollTrigger's `pin` — see the long note
 * in `story-truth.tsx`; the reasons are identical (a `fixed` pin misbehaves inside
 * the section's `overflow-x-clip`, and sticky leaves native scrolling alone).
 *
 * NO `.s-*` CLASSES IN HERE. The old rows carried `s-rise` / `s-fade`, which are
 * the CSS scroll-driven reveals. Leaving them on would mean two systems animating
 * the same opacity — GSAP would win at some scroll positions and the CSS timeline
 * at others, and parts would flicker. GSAP owns these elements now.
 *
 * SSR, no-JS and reduced motion all get the SAME plain layout: the markup renders
 * FINISHED (nothing is opacity-0 in a className) and the wrapper is one viewport
 * tall, so both products simply stack and read as a normal list. The runway is
 * added from JS and only once we have decided to animate.
 */

/**
 * Scroll distance the stage stays stuck for, on top of its own viewport.
 * The timeline is 17.5 units wide — four reveal steps, a hold and an exit per
 * product (6.25 each), the team panel entering (1), the strip's sideways travel
 * (3) and a tail hold (1). At 900svh that is a bit over half a viewport of
 * scrolling per unit. THE dial for this section's rhythm: the act read as
 * rushed at 580svh over 13.5 units, so both numbers went up together.
 *
 * RUNWAY AND UNIT COUNT MOVE TOGETHER. Whenever a beat is added, grow this by the
 * same proportion — scroll-per-unit is the thing that has been tuned by eye, and
 * holding it constant is what keeps a new beat from re-pacing the whole act.
 *
 * The percentages on `.p-strip` in globals.css are a fraction of these 16 units
 * — retune them whenever the unit layout changes.
 */
/** Seconds of timeline per step. One unit ≈ one reveal. */
const STEP = 1;

/**
 * Beat the finished product sits still before it leaves. Without it the CTA —
 * the LAST part to arrive and the only one you can act on — finished its own
 * 0.85-unit slide barely a rounding error before the exit began, so the payoff
 * of the whole four-step assembly was never actually on screen.
 */
const HOLD = STEP * 1.25;

/**
 * The original two-static-product act was tuned at 900svh for 17.5 timeline
 * units. Keep that visual pace, but scale the runway with however many products
 * the public API returns so 1 item is not stretched like 2 and 5 items are not
 * compressed into the same scroll distance.
 */
const RUNWAY_PER_UNIT = 900 / 17.5;
const TEAM_ENTER_UNITS = STEP;
const TEAM_STRIP_UNITS = STEP * 3;
const TAIL_UNITS = STEP;
const PUBLIC_TINTS = [
  "var(--color-azure)",
  "var(--color-violet)",
  "var(--color-jade)",
  "var(--color-gold)",
];

/**
 * A locked product's pitch column. Same shape as a released one — headline,
 * paragraph, bullet list — so the two products read as one layout rather than as
 * a product next to an "empty" slot, but every line is meaningless filler from
 * `PRODUCTS_UI.locked*` under a blur.
 *
 * THE FILLER IS NOT THE REAL COPY. A locked product ships no detail text at all
 * — `src/lib/products.ts` omits `tagline` / `desc` / `features` on purpose so the
 * unreleased pitch never reaches the browser, and keeps the real draft in a
 * comment the build strips. These strings exist only to give the blur something
 * text-shaped to blur, and are deliberately generic: someone who opens devtools
 * and deletes the blur finds nothing worth reading, which is the whole point.
 * NEVER paste the real pitch into the dictionary to "make the blur look right".
 *
 * `aria-hidden` on the blurred block, with a real sentence for screen readers
 * underneath: blurred nonsense is worse than useless when read aloud.
 */
function LockedPitch({ locale }: { locale: Locale }) {
  return (
    <>
      <div aria-hidden className="select-none blur-[6px]">
        <h3 className="mt-4 font-pixel text-[clamp(1.4rem,2.8vw,2.1rem)] uppercase leading-[0.95] text-ink">
          {t(PRODUCTS_UI.lockedTagline, locale)}
        </h3>
        <p className="mt-3 max-w-xl font-viet text-sm font-light leading-relaxed text-ink-soft sm:text-base">
          {t(PRODUCTS_UI.lockedDesc, locale)}
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex gap-2.5 font-viet text-sm font-light leading-snug text-ink-soft"
            >
              <span aria-hidden className="mt-[2px] tint-text">
                ▸
              </span>
              {t(PRODUCTS_UI.lockedFeature, locale)}
            </li>
          ))}
        </ul>
      </div>
      <p className="sr-only">{t(PRODUCTS_UI.lockedSr, locale)}</p>
    </>
  );
}

/**
 * One product. `data-p` numbers the four reveal steps in the order they enter —
 * it is what the timeline reads, so renumber here to re-sequence. Art is always
 * on the left and the pitch always on the right; rows do not alternate.
 */
function ProductRow({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const external = product.href.startsWith("http");

  return (
    <article
      style={{ ["--tint" as string]: product.tint }}
      className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12"
    >
      {/* ── Box art: icon, then wordmark under it ── */}
      <div>
        <div className="relative mx-auto flex w-full max-w-[16rem] flex-col items-center gap-5">
          {/* `animate-bob` rides on the inner wrapper rather than the <Image>,
              because the image is `fill`-positioned and a transform on it would
              fight the inset. GSAP animates the OUTER `data-p` wrapper, so the bob
              and the slide-in never write to the same element. */}
          <div data-p="1" className="relative w-full">
            {/* Tint bloom behind the mark. It has to live INSIDE `data-p="1"`:
                parked outside it, the glow was not part of the slide-in, so it sat
                at full strength in the icon's final position while the icon itself
                was still crossing the screen — a bright orphan blob with nothing
                under it. */}
            <div
              aria-hidden
              className="animate-pulse-glow pointer-events-none absolute -inset-8 -z-10 opacity-60 [background:radial-gradient(60%_60%_at_50%_50%,var(--tint),transparent_70%)]"
            />
            <div
              className="animate-bob relative w-full"
              style={{ aspectRatio: product.logoRatio }}
            >
              <Image
                src={product.logo}
                alt={`${product.name} — ${t(PRODUCTS_UI.logoAlt, locale)}`}
                fill
                unoptimized
                sizes="(max-width:1024px) 60vw, 22rem"
                className="pixelated object-contain [filter:drop-shadow(0_10px_28px_rgba(0,0,0,0.55))]"
              />
            </div>
          </div>

          <Image
            data-p="2"
            src={product.wordmark}
            alt={product.name}
            unoptimized
            className={`pixelated w-auto ${product.wordmarkClass ?? "h-9 sm:h-11"}`}
          />
        </div>
      </div>

      {/* ── Pitch ── */}
      <div>
        <div data-p="3">
          <span className="font-pixel text-sm uppercase tracking-[0.3em] tint-text">
            {t(product.category, locale)}
          </span>

          {product.tagline ? (
            <>
              <h3 className="mt-4 font-pixel text-[clamp(1.4rem,2.8vw,2.1rem)] uppercase leading-[0.95] text-ink">
                {t(product.tagline, locale)}
              </h3>
              <p className="mt-3 max-w-xl font-viet text-sm font-light leading-relaxed text-ink-soft sm:text-base">
                {product.desc ? t(product.desc, locale) : null}
              </p>

              {product.features ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {t(product.features, locale).map((f) => (
                    <li
                      key={f}
                      className="flex gap-2.5 font-viet text-sm font-light leading-snug text-ink-soft"
                    >
                      <span aria-hidden className="mt-[2px] tint-text">
                        ▸
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <LockedPitch locale={locale} />
          )}
        </div>

        {/* Both products get a CTA, so both run the same four-step reveal. The
            label comes from the data: a released product says "Trải nghiệm thử",
            a locked one "Nhận tin ra mắt". It is NOT blurred — the blur is for the
            copy that does not exist yet, and the one thing a visitor can actually
            do here has to stay legible and clickable. */}
        <a
          data-p="4"
          href={external ? product.href : localePath(product.href, locale)}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="btn-pixel font-pixel mt-7 inline-flex items-center gap-2 px-6 py-2.5 text-base uppercase tracking-wider"
        >
          {t(product.cta, locale)} <span aria-hidden>▸</span>
        </a>
      </div>
    </article>
  );
}

function PublicBlock({
  block,
  blockIndex,
}: {
  block: PublicProductContentBlock;
  blockIndex: number;
}) {
  const text = sanitizeProductRichText(block.text);

  // TDD public Product returns sanitized HTML for Category/Title/Description.
  // Render those fields as HTML so encoded Vietnamese entities are decoded by
  // the browser. Feature item titles intentionally remain plain text below.

  switch (block.type) {
    case "Category":
      return text ? (
        <div
          className="font-pixel text-sm uppercase tracking-[0.3em] tint-text [&_p]:m-0 [&_p]:inline"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : null;
    case "Title":
      return text ? (
        <div
          className={`${blockIndex === 0 ? "" : "mt-4"} font-pixel text-[clamp(1.4rem,2.8vw,2.1rem)] uppercase leading-[0.95] text-ink [&_p]:m-0`}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : null;
    case "Description":
      return text ? (
        <div
          className={`${blockIndex === 0 ? "" : "mt-3"} max-w-xl font-viet text-sm font-light leading-relaxed text-ink-soft sm:text-base [&_p]:m-0`}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : null;
    case "Feature": {
      const items = (block.items ?? []).filter((item) => item.title?.trim());
      if (!items.length) return null;
      return (
        <ul className={`${blockIndex === 0 ? "" : "mt-5"} grid gap-2 sm:grid-cols-2`}>
          {items.map((item, itemIndex) => (
            <li
              key={`${block.order}-${itemIndex}`}
              className="flex gap-2.5 font-viet text-sm font-light leading-snug text-ink-soft"
            >
              <span aria-hidden className="mt-[2px] tint-text">
                ▸
              </span>
              {item.title}
            </li>
          ))}
        </ul>
      );
    }
  }
}

function PublicProductRow({
  product,
  index,
  locale,
}: {
  product: PublicProductListItem;
  index: number;
  locale: Locale;
}) {
  const tint = PUBLIC_TINTS[index % PUBLIC_TINTS.length];
  const title = product.content?.blocks.find((block) => block.type === "Title")?.text?.trim();
  const external = product.productUrl?.startsWith("http") ?? false;

  return (
    <article
      style={{ ["--tint" as string]: tint }}
      className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12"
    >
      <div>
        <div
          data-p="1"
          className="relative mx-auto flex w-full max-w-[16rem] flex-col items-center gap-5"
        >
          <div
            aria-hidden
            className="animate-pulse-glow pointer-events-none absolute -inset-8 -z-10 opacity-60 [background:radial-gradient(60%_60%_at_50%_50%,var(--tint),transparent_70%)]"
          />
          {/* TDD-043 v1.2 exposes exactly two public media fields. Their visual
              order is fixed by contract: Logo first, Wordmark second. */}
          <div className="animate-bob relative aspect-square w-full">
            {/* Public URLs may use any configured CDN. Keep rendering decoupled
                from Next Image remotePatterns. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.logoUrl}
              alt={`${title || "VNZ"} — ${t(PRODUCTS_UI.logoAlt, locale)}`}
              className="pixelated h-full w-full object-contain [filter:drop-shadow(0_10px_28px_rgba(0,0,0,0.55))]"
            />
          </div>

          <div className="flex h-12 w-full items-center justify-center sm:h-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.wordmarkUrl}
              alt={`${title || "VNZ"} — wordmark`}
              className="pixelated max-h-full w-auto max-w-full object-contain [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.25))]"
            />
          </div>
        </div>
      </div>

      <div>
        <div data-p="2">
          {product.content?.blocks.map((block, blockIndex) => (
            <PublicBlock
              key={`${block.type}-${block.order}-${blockIndex}`}
              block={block}
              blockIndex={blockIndex}
            />
          ))}
        </div>

        {product.productUrl !== null ? (
          <a
            data-p="3"
            href={product.productUrl}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="btn-pixel font-pixel mt-7 inline-flex items-center gap-2 px-6 py-2.5 text-base uppercase tracking-wider"
          >
            {t(PRODUCTS_UI.tryProduct, locale)} <span aria-hidden>▸</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function ProductsAct({
  locale,
  products,
  featuredTeam,
}: {
  locale: Locale;
  /** Locale-aware public feed; null/[] = feed unavailable or empty. */
  products: PublicProductListItem[] | null;
  featuredTeam?: PublicFeaturedTeamMembersResponse;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const publicProducts = products ?? [];
  // Public products preserve backend order exactly; FE must not re-sort the
  // TDD-043 response or replace an unavailable locale with static copy.
  const productCount = publicProducts.length;
  const hasProducts = productCount > 0;

  const productTimelineUnits = publicProducts.reduce(
    (total, product) =>
      total + (2 + (product.productUrl !== null ? 1 : 0)) * STEP + HOLD + STEP,
    0,
  );
  const stripStartUnit = productTimelineUnits + TEAM_ENTER_UNITS;
  const stripEndUnit = stripStartUnit + TEAM_STRIP_UNITS;
  const totalUnits = stripEndUnit + TAIL_UNITS;
  const runwaySvh = totalUnits * RUNWAY_PER_UNIT;
  const wrapStyle = {
    "--team-strip-start": `${(stripStartUnit / totalUnits) * 100}%`,
    "--team-strip-end": `${(stripEndUnit / totalUnits) * 100}%`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const wrapEl = wrap.current;
    const stageEl = stage.current;
    if (!wrapEl || !stageEl || !hasProducts) return;

    // Leave the finished, one-viewport layout alone for reduced-motion users.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    wrapEl.style.height = `calc(100svh + ${runwaySvh}svh)`;

    const ctx = gsap.context(() => {
      const projects = gsap.utils.toArray<HTMLElement>("[data-proj]");
      if (!projects.length) return;

      for (const proj of projects) {
        const parts = gsap.utils
          .toArray<HTMLElement>("[data-p]", proj)
          .sort((a, b) => Number(a.dataset.p) - Number(b.dataset.p));
        gsap.set(parts, { xPercent: -120, opacity: 0 });
        gsap.set(proj, { xPercent: 0, opacity: 1 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      let at = 0;
      projects.forEach((proj) => {
        const parts = gsap.utils
          .toArray<HTMLElement>("[data-p]", proj)
          .sort((a, b) => Number(a.dataset.p) - Number(b.dataset.p));

        parts.forEach((part) => {
          tl.to(
            part,
            {
              xPercent: 0,
              opacity: 1,
              ease: "power2.out",
              duration: STEP * 0.85,
            },
            at,
          );
          at += STEP;
        });

        at += HOLD;
        tl.to(
          proj,
          { xPercent: 120, opacity: 0, ease: "power2.in", duration: STEP * 1.1 },
          at,
        );
        at += STEP;
      });

      const team = stageEl.querySelector<HTMLElement>("[data-team]");
      const labelProducts = stageEl.querySelector<HTMLElement>("[data-label='products']");
      const labelTeam = stageEl.querySelector<HTMLElement>("[data-label='team']");
      if (labelTeam) gsap.set(labelTeam, { opacity: 0 });

      if (team) {
        gsap.set(team, { xPercent: 120, opacity: 0 });
        tl.to(
          team,
          { xPercent: 0, opacity: 1, ease: "power3.out", duration: STEP * 1.2 },
          at,
        );
        if (labelProducts) {
          tl.to(labelProducts, { opacity: 0, ease: "none", duration: STEP * 0.6 }, at);
        }
        if (labelTeam) {
          tl.to(labelTeam, { opacity: 1, ease: "none", duration: STEP * 0.6 }, at + STEP * 0.5);
        }
        at += TEAM_ENTER_UNITS;
        at += TEAM_STRIP_UNITS;
      }

      tl.to({}, { duration: TAIL_UNITS }, at);
    }, stage);

    return () => {
      ctx.revert();
      wrapEl.style.height = "";
    };
  }, [hasProducts, runwaySvh]);

  return (
    <div ref={wrap} className="p-act relative h-svh" style={wrapStyle}>
      <div
        ref={stage}
        className="sticky top-0 flex h-svh items-center overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
        />

        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 grid text-center sm:top-28">
          {hasProducts ? (
            <span data-label="products" className="col-start-1 row-start-1">
              <Chapter label={t(PRODUCTS_UI.chapter, locale)} />
            </span>
          ) : null}
          <span data-label="team" className="col-start-1 row-start-1">
            <Chapter label={t(PRODUCTS_UI.teamChapter, locale)} />
          </span>
        </div>

        {publicProducts.map((product, index) => (
          <div
            key={`public-product-${index}`}
            data-proj
            className="absolute inset-0 flex items-center"
          >
            <PublicProductRow product={product} index={index} locale={locale} />
          </div>
        ))}

        <div
          data-team
          id="team"
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 pt-32 sm:pt-36"
        >
          <div className="w-full overflow-hidden">
            <div className={hasProducts ? "p-strip" : undefined}>
              <TeamStrip locale={locale} featuredTeam={featuredTeam} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
