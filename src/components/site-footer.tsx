import Image from "next/image";
import Link from "next/link";
import { PixelBlastBg } from "@/components/bits/pixel-blast-bg";
import { FOOTER } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { CONTACT, FOOTER_NAV, SITE, SOCIALS } from "@/lib/site";

/**
 * Site footer — the CRT sign-off, and the site's only `#contact` anchor.
 *
 * IT IS NO LONGER WHERE THE CTAs LAND. The nav button, the Đối tác CTA, the
 * locked product's "Nhận tin ra mắt" and the careers `APPLY_HREF` all point at
 * `/lien-he` now — a real page instead of a jump to the bottom of whatever you
 * were reading. The id stays because it costs nothing and any old link or
 * bookmark still resolves; nothing in the repo targets it.
 *
 * Deliberately still DARK while the chapters above are white paper: the page runs
 * dark hero → light body → dark footer, so the footer closing the frame is the
 * point, not an oversight.
 *
 * It used to be a single centred row of five chapter links, which read as a
 * sitemap stub rather than a company footer. It is now a real multi-column
 * footer: brand + positioning, two navigation groups, and a contact column.
 *
 * NOTHING HERE IS INVENTED. Contact details live in `src/lib/site.ts` and every
 * one of them starts as an empty string, because the repo contained no real email,
 * phone or address. Each block below renders ONLY when its field is filled, so the
 * footer is honest today and completes itself the moment those strings are set —
 * that is why the conditionals exist; don't replace them with hardcoded values.
 *
 * `PixelBlastBg` lays a drifting gold pixel field under the sign-off and clicks
 * ripple through it — the attract-screen behaviour "Press START" is asking for.
 * It sits under the scrim and scanlines so the copy stays legible, and it is the
 * page's only WebGL: dynamically imported, last in document order, and absent
 * entirely under `prefers-reduced-motion`.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const hasContact = Boolean(
    CONTACT.email || CONTACT.recruitEmail || CONTACT.phone || CONTACT.address,
  );

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t-[3px] border-ink bg-ink text-cream"
    >
      <PixelBlastBg color="#f0b34a" pixelSize={5} />

      {/* Scrim — the pixel field is bright enough to eat the copy, so it is pushed
          back hardest exactly where the text sits and left alone at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] [background:radial-gradient(70%_82%_at_50%_50%,rgba(21,22,26,0.94),rgba(21,22,26,0.55)_72%,transparent)]"
      />
      {/* scanlines for the CRT footer vibe — over the pixel field, under the copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(0,0,0,0.35) 0 1px,transparent 1px 3px)",
        }}
      />

      <div className="relative z-[3] mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
          {/* ── Brand ── */}
          <div>
            <Link href={localePath("/", locale)} className="inline-block">
              <Image
                src="/general/logo-dark.png"
                alt={SITE.name}
                width={1094}
                height={560}
                unoptimized
                className="pixelated h-12 w-auto [filter:drop-shadow(0_0_12px_rgba(239,127,31,0.45))]"
              />
            </Link>
            <p className="mt-4 font-ui text-[10px] uppercase tracking-[0.25em] text-gold">
              {SITE.tagline}
            </p>
            <p className="mt-4 max-w-sm font-viet text-sm font-light leading-relaxed text-cream/65">
              {t(SITE.positioning, locale)}
            </p>
          </div>

          {/* ── Navigation groups ── */}
          {FOOTER_NAV.map((group) => (
            <nav key={t(group.heading, locale)} aria-label={t(group.heading, locale)}>
              <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-cream/45">
                {t(group.heading, locale)}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links.map((l) => (
                  <li key={l.path}>
                    <Link
                      href={localePath(l.path, locale)}
                      className="font-viet text-sm font-light text-cream/75 transition-colors duration-200 hover:text-ember"
                    >
                      {t(l.label, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* ── Contact ── renders only what actually exists. */}
          <div>
            <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-cream/45">
              {t(FOOTER.contact, locale)}
            </h2>

            {hasContact ? (
              <ul className="mt-4 flex flex-col gap-2.5 font-viet text-sm font-light text-cream/75">
                {CONTACT.email ? (
                  <li>
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="transition-colors duration-200 hover:text-ember"
                    >
                      {CONTACT.email}
                    </a>
                  </li>
                ) : null}
                {CONTACT.recruitEmail ? (
                  <li>
                    <a
                      href={`mailto:${CONTACT.recruitEmail}`}
                      className="transition-colors duration-200 hover:text-ember"
                    >
                      {CONTACT.recruitEmail}
                      <span className="text-cream/45">
                        {t(FOOTER.recruitTag, locale)}
                      </span>
                    </a>
                  </li>
                ) : null}
                {CONTACT.phone ? (
                  <li>
                    <a
                      href={`tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`}
                      className="transition-colors duration-200 hover:text-ember"
                    >
                      {CONTACT.phone}
                    </a>
                  </li>
                ) : null}
                {CONTACT.address ? (
                  <li className="text-cream/65">{CONTACT.address}</li>
                ) : null}
              </ul>
            ) : (
              /* No contact details in the repo yet — offer the one route that does
                 exist rather than a dead placeholder. */
              <p className="mt-4 max-w-xs font-viet text-sm font-light leading-relaxed text-cream/65">
                {t(FOOTER.noChannels, locale)}
              </p>
            )}

            {SOCIALS.length ? (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {SOCIALS.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-pixel text-sm uppercase tracking-[0.12em] text-cream/70 transition-colors duration-200 hover:text-ember"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link
              href={localePath("/tuyen-dung", locale)}
              className="mt-6 inline-flex items-center gap-2 border-2 border-cream/40 px-5 py-2.5 font-pixel text-base uppercase tracking-[0.12em] text-cream transition-colors duration-200 hover:border-ember hover:text-ember"
            >
              {t(FOOTER.joinTeam, locale)} <span aria-hidden>▸</span>
            </Link>
          </div>
        </div>

        {/* ── Legal bar ── */}
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-cream/12 pt-6 sm:flex-row sm:justify-between">
          <p className="font-mono text-[11px] text-cream/55">
            © {new Date().getFullYear()} {SITE.legalName}.{" "}
            {t(FOOTER.rights, locale)}
          </p>
          <p className="font-mono text-[11px] text-cream/55">
            {t(FOOTER.signoff, locale)}
          </p>
        </div>
      </div>
    </footer>
  );
}
