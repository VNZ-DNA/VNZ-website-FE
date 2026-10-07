import ClickSpark from "@/components/bits/ClickSpark";
import type { Locale } from "@/lib/i18n";
import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { Story } from "@/components/story";
import { Products } from "@/components/products";
import { Partners } from "@/components/partners";
import { SiteFooter } from "@/components/site-footer";
import {
  getPublicProducts,
  type PublicProductListItem,
} from "@/server/api/products";
import {
  getPublicPartners,
  type PublicPartnerListItem,
} from "@/server/api/partners";
import {
  getPublicFeaturedTeamMembers,
  type PublicFeaturedTeamMembersResponse,
} from "@/server/api/team-members";

/**
 * Homepage — one continuous story, told in numbered chapters.
 *
 * The order is the argument, not a menu: the hero states the thesis, then each
 * chapter earns the next one. Câu chuyện sets up the question ("tạo ra công nghệ
 * ≠ sở hữu công nghệ"), Dấu ấn VNZ is the proof — and it carries Đội ngũ inside
 * its own pinned act — and Đối tác is the outside trust, closing on the fork
 * ("Liên hệ hợp tác / Gia nhập đội ngũ") that hands straight to the footer's
 * "Press START". Moving a chapter breaks the argument; add new ones at the seam
 * where they earn their place, and renumber the `Chapter` labels to match.
 *
 * TWO CHAPTERS LIVE ON THEIR OWN ROUTES, and the story hands off to them rather
 * than inlining them: Tuyển dụng (`/tuyen-dung`) and the full roster
 * (`/doi-ngu`). Both were tall enough to bury everything after them; the Dấu ấn
 * act keeps a horizontal taster strip that links out.
 *
 * TẦM NHÌN IS GONE. It was the closing manifesto ("MADE BY VIỆT NAM" clipped
 * over a Saigon plate); its CTA pair moved up into Đối tác first, then the
 * chapter itself was cut. Its `.clip-art` / `.s-bgpar` primitives are still in
 * globals.css with no caller — reuse or strip them, but don't assume they're live.
 *
 * Every chapter is a SERVER component except the two pinned acts. The rest of the
 * motion is native CSS scroll-driven animation (the `.s-*` / `.h-pin-*`
 * primitives in globals.css). Copy and roster data live in `src/lib/` — edit
 * there, not in the components.
 *
 * SCROLLING IS NATIVE. Both attempts at taking it over are gone: the old
 * `scroll-snap-type: y proximity` on `html` (which silently re-aimed the page
 * whenever scrolling settled near a section top) and the JS pager that replaced
 * it. Don't reintroduce either — plain momentum scrolling is the intended feel.
 *
 * Client JS is deliberately scoped to three decorative places: the nav's scroll +
 * menu state, the `ClickSpark` shell, and the member-card flip inside `Team`.
 * With JS off, or under `prefers-reduced-motion`, the page still reads top to
 * bottom unchanged.
 *
 * `ClickSpark` renders a full-bleed fixed canvas, so it must stay outermost.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  let products: PublicProductListItem[] | null = null;
  let partners: PublicPartnerListItem[] | null = null;
  let featuredTeam: PublicFeaturedTeamMembersResponse | undefined;

  // TDD-043 public Product content is resolved by the requested locale.
  try {
    products = (await getPublicProducts(locale)).items;
  } catch (error) {
    console.error("[home] failed to load public products", error);
  }

  // TDD-044 has no localized content, so one public Partner feed serves both
  // Vietnamese and English homepages.
  try {
    partners = (await getPublicPartners()).items;
  } catch (error) {
    console.error("[home] failed to load public partners", error);
  }

  // TDD-025 is Vietnamese-only in this phase. English keeps the current static
  // bilingual roster until backend member content becomes locale-aware.
  if (locale === "vi") {
    try {
      featuredTeam = await getPublicFeaturedTeamMembers();
    } catch (error) {
      console.error("[home] failed to load featured team members", error);
    }
  }

  return (
    <ClickSpark sparkColor="#e8541f" sparkSize={9} sparkRadius={22} sparkCount={8} duration={420}>
      <div className="relative bg-ink">
        <SiteNav locale={locale} />
        <main>
          <Hero locale={locale} />
          <Story locale={locale} />
          <Products locale={locale} products={products} featuredTeam={featuredTeam} />
          <Partners locale={locale} partners={partners} />
        </main>
        <SiteFooter locale={locale} />
      </div>
    </ClickSpark>
  );
}
