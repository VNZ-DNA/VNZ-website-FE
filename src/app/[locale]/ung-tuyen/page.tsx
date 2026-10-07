import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ApplicationForm } from "@/components/application-form";
import { STEPS } from "@/lib/careers";
import { APPLY_UI, CAREERS_UI, META } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import {
  getPublicJobPostDetail,
  getPublicJobPosts,
  type PublicJobPostListItem,
} from "@/server/api/careers";
import { PublicApiError } from "@/server/api/client";

/**
 * /ung-tuyen — the application form, on a route of its own.
 *
 * IT IS NOT `/lien-he`. Applications briefly went through the contact form with a
 * `?vi-tri=` prefill; the field sets barely overlap, so an applicant was reading
 * "ngân sách dự kiến" and had nowhere to put a CV. See `src/lib/application-form.ts`.
 *
 * TDD-032 v1.1 only accepts a concrete backend JobPost id. Every API-backed
 * "Ứng tuyển" link carries `?jobPostId=<uuid>`; this page resolves that id again
 * from the public JobPost API before showing a submit-capable form. A missing,
 * malformed, deleted or unavailable id never turns into a free application.
 *
 * `searchParams` makes this dynamic per request. That is the cost of the
 * preselect and it is free in practice — the page is a form, there is nothing to
 * cache.
 *
 * Two columns with a sticky rail, matching `/lien-he` and the JD pages. The rail
 * carries the role summary and the process, so an applicant mid-form can check
 * what happens next without losing their place.
 */

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadSelectedJob(value: string | undefined, locale: Locale) {
  if (!value || !GUID.test(value)) return null;

  try {
    return await getPublicJobPostDetail(value, locale);
  } catch (error) {
    if (error instanceof PublicApiError && (error.status === 404 || error.status === 409)) {
      return null;
    }
    throw error;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(META.applyTitle, locale),
    description: t(META.applyDescription, locale),
  };
}

export default async function UngTuyenPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await routeParams;
  const params = await searchParams;
  const rawJobPostId = params.jobPostId;
  const jobPostId = Array.isArray(rawJobPostId) ? rawJobPostId[0] : rawJobPostId;
  const job = await loadSelectedJob(jobPostId, locale);
  let availableJobs: PublicJobPostListItem[] = [];

  if (!job) {
    try {
      availableJobs = await getPublicJobPosts(locale);
    } catch (error) {
      console.error("[ung-tuyen] failed to load public job posts", error);
    }
  }

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <section className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28">
          {/* Blueprint grid — same 56px / 5% as every other paper surface. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
          />

          {/* Breadcrumb back to whichever page they came from — the JD when a
              role is named, the list otherwise. */}
          <nav aria-label={t(CAREERS_UI.breadcrumbNav, locale)} className="mx-auto max-w-6xl px-5 sm:px-8">
            <Link
              href={localePath(
                job ? `/tuyen-dung/${job.id}` : "/tuyen-dung",
                locale,
              )}
              className="inline-flex items-center gap-2 font-pixel text-sm uppercase tracking-[0.2em] text-ink-soft transition-colors duration-200 hover:text-ember"
            >
              <span aria-hidden>◂</span>{" "}
              {t(job ? APPLY_UI.backToJd : CAREERS_UI.allRoles, locale)}
            </Link>
          </nav>

          <header className="mx-auto mt-6 max-w-6xl px-5 sm:px-8">
            <span className="s-fade inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-clay sm:text-base">
              {t(APPLY_UI.label, locale)}
            </span>
            <h1 className="s-rise mt-4 max-w-3xl font-pixel text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.9] text-ink">
              {t(APPLY_UI.titleA, locale)}{" "}
              <span className="text-clay">{t(APPLY_UI.titleAccent, locale)}</span>
            </h1>
            {job ? (
              <p className="s-fade mt-5 font-viet text-lg font-semibold leading-snug text-ink sm:text-xl">
                {job.title}
              </p>
            ) : null}
            <p className="s-fade mt-4 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
              {t(job ? APPLY_UI.leadWithRole : APPLY_UI.leadNoRole, locale)}
            </p>
          </header>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
            {/* ══ Left · the form ══ */}
            <div className="s-rise relative border border-ink/15 paper-card p-6 backdrop-blur-md sm:p-9">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[3px] bg-ember [box-shadow:0_0_16px_var(--color-ember)]"
              />
              {job ? (
                <ApplicationForm locale={locale} jobPostId={job.id} jobTitle={job.title} />
              ) : (
                <div className="py-8 text-center">
                  <p className="font-viet text-base font-light leading-relaxed text-ink-soft">
                    {t(APPLY_UI.leadNoRole, locale)}
                  </p>
                  <Link
                    href={localePath("/tuyen-dung", locale)}
                    className="btn-pixel font-pixel mt-6 inline-flex items-center gap-2 px-7 py-3 text-lg uppercase tracking-wider"
                  >
                    {t(CAREERS_UI.allRoles, locale)} <span aria-hidden>▸</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ══ Right · sticky rail ══
                `self-start` is load-bearing: without it the aside stretches to
                the row height and sticky has nothing to travel through. */}
            <aside className="s-fade flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              {job ? (
                <div
                  style={{ ["--tint" as string]: "var(--color-ember)" }}
                  className="relative border border-ink/15 paper-card p-6 backdrop-blur-md"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--tint)]"
                  />
                  <span className="font-pixel text-xs uppercase tracking-[0.25em] tint-text">
                    {job.department ?? t(CAREERS_UI.otherDepartment, locale)}
                  </span>
                  <h2 className="mt-2 font-viet text-base font-semibold leading-snug text-ink">
                    {job.title}
                  </h2>
                  {job.shortDescription ? (
                    <p className="mt-2 font-viet text-sm font-light leading-relaxed text-ink-soft">
                      {job.shortDescription}
                    </p>
                  ) : null}
                  <ul className="mt-4 flex flex-wrap gap-2 font-pixel text-xs uppercase tracking-[0.15em] text-ink-soft">
                    {job.employmentType ? (
                      <li className="border border-ink/15 px-2.5 py-1">{job.employmentType}</li>
                    ) : null}
                    {job.jobLevel ? (
                      <li className="border border-ink/15 px-2.5 py-1">{job.jobLevel}</li>
                    ) : null}
                    <li className="border border-ink/15 px-2.5 py-1">
                      {job.numberOfPositions} {t(CAREERS_UI.headcount, locale)}
                    </li>
                  </ul>
                  <Link
                    href={localePath(`/tuyen-dung/${job.id}`, locale)}
                    className="mt-5 inline-flex items-center gap-2 font-pixel text-sm uppercase tracking-[0.15em] text-ink-soft transition-colors duration-200 hover:text-ember"
                  >
                    {t(APPLY_UI.seeFullJd, locale)} <span aria-hidden>▸</span>
                  </Link>
                </div>
              ) : (
                <div className="border border-ink/15 paper-card p-6 backdrop-blur-md">
                  <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-clay">
                    {availableJobs.length} {t(APPLY_UI.openRoles, locale)}
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {availableJobs.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={localePath(`/tuyen-dung/${r.id}`, locale)}
                          className="group block"
                        >
                          <span className="block font-viet text-sm font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-ember">
                            {r.title}
                          </span>
                          <span className="mt-0.5 block font-pixel text-xs uppercase tracking-[0.15em] text-ink-soft">
                            {r.department ?? t(CAREERS_UI.otherDepartment, locale)} · {r.numberOfPositions} {t(CAREERS_UI.headcount, locale)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What happens after they press send. This is the question every
                  applicant has and almost no application form answers. */}
              <div className="border border-ink/15 paper-card p-6 backdrop-blur-md">
                <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-clay">
                  {t(APPLY_UI.afterSubmit, locale)}
                </h2>
                <ol className="mt-4 flex flex-col gap-3">
                  {STEPS.map((s, i) => (
                    <li key={s.title.vi} className="flex gap-3">
                      <span
                        aria-hidden
                        className="shrink-0 font-pixel text-lg leading-none text-clay/45"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-viet text-sm font-semibold leading-snug text-ink">
                          {t(s.title, locale)}
                        </h3>
                        <p className="mt-0.5 font-viet text-sm font-light leading-relaxed text-ink-soft">
                          {t(s.desc, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
