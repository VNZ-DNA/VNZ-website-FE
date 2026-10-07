import type { Metadata } from "next";
import { t, type Locale } from "@/lib/i18n";
import { META } from "@/lib/dictionary";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Contact } from "@/components/contact";

/**
 * /lien-he — where every "Liên hệ hợp tác" CTA lands now.
 *
 * It was `#contact`, an anchor onto the footer. The footer keeps that id (it is
 * on every page and still lists whatever contact details exist), but the nav, the
 * Đối tác CTA and the locked product's "Nhận tin ra mắt" point here instead — a
 * jump to the bottom of whatever page you happened to be reading is not a contact
 * destination.
 *
 * JOB APPLICATIONS GO TO `/ung-tuyen`, not here. This page briefly accepted a
 * `?vi-tri=` parameter that turned it into an application form; the two forms
 * need different fields and now have different routes.
 *
 * The page is honest about what does not exist yet: `CONTACT` in
 * `src/lib/site.ts` is still all empty strings, so `Contact` renders the form and
 * says plainly that the direct channels are being set up. Fill those strings in
 * and the channel rows appear with no code change — see the note in that
 * component.
 *
 * Light page, so `SiteNav` keeps its default `tone="light"`. `Contact` carries
 * its own `py-24 sm:py-28`, which is what clears the fixed header.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(META.contactTitle, locale),
    description: t(META.contactDescription, locale),
  };
}

export default async function LienHePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <Contact locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
