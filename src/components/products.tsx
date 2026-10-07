import { ProductsAct } from "@/components/products-act";
import type { Locale } from "@/lib/i18n";
import type { PublicProductListItem } from "@/server/api/products";
import type { PublicFeaturedTeamMembersResponse } from "@/server/api/team-members";

/**
 * Chương 03 · Dấu ấn VNZ — the proof. After the story chapter's argument this is
 * where the page has to show something real.
 *
 * THE PRODUCTS THEMSELVES LIVE IN `<ProductsAct>`, which is why this file is a
 * shell. They are no longer two rows stacked in the document: they are a pinned,
 * scroll-scrubbed conveyor that deals one product onto the stage at a time. That
 * needs GSAP and therefore a client component — `products-act.tsx` documents the
 * sequence. This is the page's SECOND pinned act, after chương 01.
 *
 * What is left here: the chapter label, the section's own ground, the handoff
 * margin from chương 01.
 *
 * LOCKED PRODUCTS. An unreleased product ships NO detail copy at all (see the
 * `locked` note in `src/lib/products.ts`) — not in the DOM, not in the JS bundle.
 * Its row renders a blurred skeleton behind a "Đang được kiến tạo" seal instead,
 * so the teaser is genuinely empty rather than hidden text anyone can read in
 * devtools.
 */
export function Products({
  locale,
  products,
  featuredTeam,
}: {
  locale: Locale;
  /** Locale-aware public feed; null means the API failed or returned no feed. */
  products: PublicProductListItem[] | null;
  /** undefined = keep the current static bilingual team strip. */
  featuredTeam?: PublicFeaturedTeamMembersResponse;
}) {
  // PULLED UP BY ONE VIEWPORT ON PURPOSE. Chương 01 ends by shrinking its whole
  // stage into a card; this section rides up over it during that same stretch of
  // scroll, which is what makes the handoff read as one section replacing another
  // rather than two sections scrolling past. `way.tsx` used to carry this — that
  // chapter was cut, and the handoff has to live on whatever section directly
  // follows the act.
  //
  // `-mt-[100svh]` is paired with the SHRINK phase in `story-truth.tsx` — change
  // one and the other has to move with it. `z-10` puts this above the still-pinned
  // stage, and `paper` has to stay opaque or the card shows through. The top
  // padding is bumped to clear the viewport the negative margin eats into.
  return (
    <section
      id="products"
      className="relative isolate z-10 -mt-[100svh] w-full overflow-x-clip paper pb-20 pt-28 sm:pb-24 sm:pt-32"
    >
      {/* The chapter label is inside `<ProductsAct>`, pinned with the stage — out
          here it would scroll away in the act's first few hundred pixels. There is
          no title or lead: both were cut, so the chapter opens on the products. */}
      <ProductsAct locale={locale} products={products} featuredTeam={featuredTeam} />

      {/* NO `ActGap` HERE ANY MORE. It was a chapter break between this act and
          Đối tác, and once both chapters became the same paper colour all it
          contributed was 88px of blank ground plus a hairline drawn in
          `cream/15` — a value picked for a DARK ground, so effectively invisible.
          184px of dead paper before the next chapter, for nothing. Đối tác's own
          top padding is the separation now. */}
    </section>
  );
}
