import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_UI } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { CONTACT, HOURS, RESPONSE_TIME, SITE, SOCIALS } from "@/lib/site";

/**
 * Liên hệ — the contact destination behind every "Liên hệ hợp tác" CTA.
 *
 * It used to be `#contact`, an anchor that dropped you at the footer. The footer
 * still carries that id, but a jump to the bottom of an unrelated page is not a
 * contact page, so the nav and every CTA land here instead.
 *
 * TWO COLUMNS: the enquiry form on the left, a STICKY information rail on the
 * right. The rail is sticky because the form is long — nine fields — and the
 * direct channels are the answer to "I don't want to fill this in"; scrolled out
 * of sight at field three, they may as well not exist. `lg:sticky` +
 * `lg:self-start` is the whole mechanism: `self-start` is the part people forget,
 * and without it the aside stretches to the row's full height and sticky has
 * nothing to travel through. `top-28` clears the fixed header.
 *
 * It collapses to one column below `lg`, form first: on a phone the rail would
 * otherwise push the form itself below the fold.
 *
 * NOTHING HERE IS INVENTED — the same rule the footer runs on. `CONTACT`,
 * `HOURS`, `SOCIALS` and `RESPONSE_TIME` in `src/lib/site.ts` are all empty
 * until someone fills them in, and every block below renders ONLY when its data
 * exists. Do not replace the conditionals with placeholder values: an address
 * that ships as a fact and is wrong is worse than a page that is honestly
 * incomplete. Fill the strings in and the blocks appear with no code change.
 *
 * WHICH IS WHY THE FORM CARRIES THE PAGE. It works regardless of whether a
 * public email exists — see `src/app/lien-he/actions.ts` for how a submission
 * gets out, and what it does instead of lying when no channel is connected.
 *
 * `id="lien-he"`, NOT `id="contact"`: the footer renders on this page too and
 * already owns that id. Two elements with the same id is invalid.
 *
 * JOB APPLICATIONS DO NOT COME HERE. This form briefly grew a `?vi-tri=` prefill
 * that retitled the page "Ứng tuyển vị trí" and preselected a topic; that was
 * replaced by a dedicated form at `/ung-tuyen`, because an application needs
 * fields this one has no business carrying (CV link, trường/chuyên ngành, thời
 * gian có thể bắt đầu) and this one asks for things an applicant should never see
 * (ngân sách dự kiến). One form pretending to be two serves neither.
 *
 * Server component. Only `<ContactForm>` is a client island.
 */

/** Small labelled block in the rail. Renders nothing without children. */
function RailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-ink/12 pt-5 first:border-t-0 first:pt-0">
      <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-clay">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Contact({ locale }: { locale: Locale }) {
  const apiBaseUrl = process.env.VNZ_API_URL?.trim().replace(/\/+$/, "");
  const contactEndpoint = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/public/contacts`
    : undefined;

  const channels = [
    CONTACT.email
      ? {
          key: "email",
          label: t(CONTACT_UI.emailLabel, locale),
          value: CONTACT.email,
          href: `mailto:${CONTACT.email}`,
        }
      : null,
    CONTACT.recruitEmail
      ? {
          key: "recruit",
          label: t(CONTACT_UI.recruitLabel, locale),
          value: CONTACT.recruitEmail,
          href: `mailto:${CONTACT.recruitEmail}`,
        }
      : null,
    CONTACT.phone
      ? {
          key: "phone",
          label: t(CONTACT_UI.phoneLabel, locale),
          value: CONTACT.phone,
          href: `tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    CONTACT.address
      ? {
          key: "address",
          label: t(CONTACT_UI.addressLabel, locale),
          value: CONTACT.address,
          href: null,
        }
      : null,
  ].filter((c) => c !== null);

  return (
    <section
      id="lien-he"
      className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28"
    >
      {/* Blueprint grid — same 56px / 5% as every other paper surface on the
          site. Keep in step with `products-act.tsx` / `partners.tsx`. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
      />

      {/* HEADER IS LEFT-ALIGNED, unlike the other chapters' centred `Headline`.
          A centred title over a left-aligned two-column body leaves the eye
          starting in the middle and then jumping left for every field; the page
          reads as one column of text this way. */}
      <header className="mx-auto max-w-6xl px-5 sm:px-8">
        <span className="s-fade inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-clay sm:text-base">
          {t(CONTACT_UI.label, locale)}
        </span>
        <h1 className="s-rise mt-4 max-w-3xl font-pixel text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.9] text-ink">
          {t(CONTACT_UI.titleA, locale)}{" "}
          <span className="text-clay">{t(CONTACT_UI.titleAccent, locale)}</span>
        </h1>
        <p className="s-fade mt-6 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
          {t(CONTACT_UI.lead, locale)}
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
        {/* ══ Left · the form ══ */}
        <div className="s-rise relative border border-ink/15 paper-card p-6 backdrop-blur-md sm:p-9">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px] bg-ember [box-shadow:0_0_16px_var(--color-ember)]"
          />
          <h2 className="font-pixel text-[clamp(1.3rem,2.6vw,1.85rem)] uppercase leading-tight text-ink">
            {t(CONTACT_UI.formTitle, locale)}
          </h2>
          <p className="mt-2 font-viet text-sm font-light leading-relaxed text-ink-soft">
            {t(CONTACT_UI.formLead, locale)}
          </p>

          <div className="mt-7">
            {/* The address is passed in rather than imported, so the form never
                has to reason about whether one exists — it renders the fallback
                only when given something real. */}
            <ContactForm
              locale={locale}
              fallbackEmail={CONTACT.email || undefined}
              endpoint={contactEndpoint}
            />
          </div>
        </div>

        {/* ══ Right · the sticky rail ══
            `self-start` is what gives sticky something to travel through — see
            the file note. */}
        <aside className="s-fade flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="relative border border-ink/15 paper-card p-6 backdrop-blur-md">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-gold"
            />
            <div className="flex flex-col gap-5">
              <RailBlock title={t(CONTACT_UI.directChannels, locale)}>
                {channels.length ? (
                  <ul className="flex flex-col gap-3">
                    {channels.map((c) => (
                      <li key={c.key}>
                        <span className="block font-pixel text-xs uppercase tracking-[0.2em] text-ink-soft">
                          {c.label}
                        </span>
                        {c.href ? (
                          <a
                            href={c.href}
                            className="mt-0.5 block break-words font-viet text-base font-medium leading-snug text-ink transition-colors duration-200 hover:text-ember"
                          >
                            {c.value}
                          </a>
                        ) : (
                          <span className="mt-0.5 block break-words font-viet text-base font-medium leading-snug text-ink">
                            {c.value}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* No channel is filled in yet. Say so plainly rather than
                     shipping a `mailto:` to an address nobody reads. */
                  <p className="font-viet text-sm font-light leading-relaxed text-ink-soft">
                    {t(CONTACT_UI.noChannels, locale)}
                  </p>
                )}
              </RailBlock>

              {HOURS.length ? (
                <RailBlock title={t(CONTACT_UI.hours, locale)}>
                  <dl className="flex flex-col gap-1.5">
                    {HOURS.map((h) => (
                      <div
                        key={h.days.vi}
                        className="flex items-baseline justify-between gap-4 font-viet text-sm font-light text-ink-soft"
                      >
                        <dt>{t(h.days, locale)}</dt>
                        <dd className="text-ink">{h.hours}</dd>
                      </div>
                    ))}
                  </dl>
                </RailBlock>
              ) : null}

              {t(RESPONSE_TIME, locale) ? (
                <RailBlock title={t(CONTACT_UI.responseTime, locale)}>
                  <p className="font-viet text-sm font-light leading-relaxed text-ink-soft">
                    {t(CONTACT_UI.responseBody, locale)}{" "}
                    {t(RESPONSE_TIME, locale)}.
                  </p>
                </RailBlock>
              ) : null}

              {SOCIALS.length ? (
                <RailBlock title={t(CONTACT_UI.follow, locale)}>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2">
                    {SOCIALS.map((s) => (
                      <li key={s.href}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-pixel text-base uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:text-ember"
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </RailBlock>
              ) : null}
            </div>
          </div>

          {/* ── Recruitment shortcut ──
              A separate card, not a rail block, because it is a DIFFERENT ERRAND
              rather than another contact detail: someone here to apply should
              not be filling in a budget field. It sits below the channels so it
              reads as "or, if you're here for this instead". */}
          <div className="relative border border-ink/15 paper-card p-6 backdrop-blur-md">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-jade"
            />
            <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-clay">
              {t(CONTACT_UI.joinTitle, locale)}
            </h2>
            <p className="mt-3 font-viet text-sm font-light leading-relaxed text-ink-soft">
              {t(CONTACT_UI.joinBody, locale)}
            </p>
            <Link
              href={localePath("/tuyen-dung", locale)}
              className="mt-5 inline-flex items-center gap-2 border-2 border-ink/40 px-5 py-2.5 font-pixel text-base uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:border-ember hover:bg-ink/5 hover:text-ember"
            >
              {t(CONTACT_UI.joinCta, locale)} <span aria-hidden>▸</span>
            </Link>
          </div>

          <p className="px-1 font-ui text-[10px] uppercase leading-relaxed tracking-[0.25em] text-clay">
            {SITE.tagline}
          </p>
        </aside>
      </div>
    </section>
  );
}
