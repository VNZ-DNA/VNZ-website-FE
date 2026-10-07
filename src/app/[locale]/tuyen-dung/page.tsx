import type { Metadata } from "next";
import { t, type Locale } from "@/lib/i18n";
import { META } from "@/lib/dictionary";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Careers } from "@/components/careers";
import {
  getPublicJobPosts,
  type PublicJobPostListItem,
} from "@/server/api/careers";

/**
 * /tuyen-dung — the job list.
 *
 * Both locale variants are loaded server-to-server from the locale-aware public
 * JobPost API and cached briefly by Next.
 *
 * `Careers` no longer takes a `standalone` prop — it did while the block could
 * also be dropped back into the homepage story as a numbered chapter, which is
 * not a thing it can be any more.
 *
 * No breadcrumb here (the detail pages have one): the nav's logo and menu are the
 * way back from a top-level route. `Careers` carries its own `py-24 sm:py-28`,
 * which is what clears the fixed header — don't strip it without replacing that
 * clearance.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(META.careersTitle, locale),
    description: t(META.careersDescription, locale),
  };
}

export default async function TuyenDungPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  let jobs: PublicJobPostListItem[] | null = null;

  try {
    jobs = await getPublicJobPosts(locale);
  } catch (error) {
    console.error("[tuyen-dung] failed to load public job posts", error);
  }

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <Careers locale={locale} jobs={jobs} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
