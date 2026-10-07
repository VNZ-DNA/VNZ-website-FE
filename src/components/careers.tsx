import Link from "next/link";
import { PERKS, STEPS, applyPath } from "@/lib/careers";
import { CAREERS_UI } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import type { PublicJobPostListItem } from "@/server/api/careers";

type CareerListItem = {
  key: string;
  title: string;
  department: string;
  employmentType: string | null;
  jobLevel: string | null;
  numberOfPositions: number;
  shortDescription: string | null;
  skills: string[];
  tint: string;
  detailHref?: string;
  applyHref?: string;
};

type CareersProps = {
  locale: Locale;
  /** `null` means the locale-aware public API failed; an array is its result. */
  jobs: PublicJobPostListItem[] | null;
};

const ROLE_TINTS = [
  "var(--color-jade)",
  "var(--color-lotus)",
  "var(--color-gold)",
  "var(--color-ember)",
] as const;

const DEPARTMENT_PRESENTATION: Record<string, { order: number; tintOffset: number }> = {
  "Kỹ thuật": { order: 0, tintOffset: 0 },
  "Sản phẩm": { order: 1, tintOffset: 2 },
};

function apiItems(jobs: PublicJobPostListItem[], locale: Locale): CareerListItem[] {
  const fallbackDepartment = t(CAREERS_UI.otherDepartment, locale);
  const departmentOccurrences = new Map<string, number>();

  return jobs.map((job, index) => {
    const department = job.department?.trim() || fallbackDepartment;
    const occurrence = departmentOccurrences.get(department) ?? 0;
    departmentOccurrences.set(department, occurrence + 1);
    const tintOffset = DEPARTMENT_PRESENTATION[department]?.tintOffset ?? index;

    return {
      key: job.id,
      title: job.title,
      department,
      employmentType: job.employmentType,
      jobLevel: job.jobLevel,
      numberOfPositions: job.numberOfPositions,
      shortDescription: job.shortDescription,
      skills: job.skills,
      // Presentation-only: preserve the old careers-page colour rhythm without
      // inventing or altering backend JobPost data.
      tint: ROLE_TINTS[(tintOffset + occurrence) % ROLE_TINTS.length],
      detailHref: localePath(`/tuyen-dung/${job.id}`, locale),
      applyHref: localePath(
        `/ung-tuyen?jobPostId=${encodeURIComponent(job.id)}`,
        locale,
      ),
    };
  });
}

/**
 * `/tuyen-dung` — public job list.
 *
 * Both locales come from `GET /api/v1/public/job-posts?locale=...`. TDD-031 adds
 * public detail by JobPost id, so API-backed rows link to `/tuyen-dung/<id>`.
 *
 * PERKS and STEPS stay local by contract: TDD-030 explicitly treats benefits and
 * the hiring process as website copy rather than JobPost data.
 */
export function Careers({ locale, jobs }: CareersProps) {
  const hasApiError = jobs === null;
  const listItems = jobs ? apiItems(jobs, locale) : [];
  const slots = listItems.reduce((total, role) => total + role.numberOfPositions, 0);
  const departments = [...new Set(listItems.map((role) => role.department))].sort((a, b) => {
    const aOrder = DEPARTMENT_PRESENTATION[a]?.order;
    const bOrder = DEPARTMENT_PRESENTATION[b]?.order;

    if (aOrder === undefined && bOrder === undefined) return 0;
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;
    return aOrder - bOrder;
  });

  return (
    <section
      id="careers"
      className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
      />

      <header className="mx-auto max-w-6xl px-5 sm:px-8">
        <span className="s-fade inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-clay sm:text-base">
          {t(CAREERS_UI.label, locale)}
        </span>
        <h1 className="s-rise mt-4 max-w-3xl font-pixel text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.9] text-ink">
          {t(CAREERS_UI.titleA, locale)}{" "}
          <span className="text-clay">{t(CAREERS_UI.titleAccent, locale)}</span>
          {t(CAREERS_UI.titleB, locale)}
        </h1>
        <p className="s-fade mt-6 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
          {t(CAREERS_UI.lead, locale)}
        </p>

        {!hasApiError ? (
          <div className="s-fade mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-pixel text-sm uppercase tracking-[0.2em] text-ink-soft sm:text-base">
            <span className="text-ember">
              {listItems.length} {t(CAREERS_UI.openRoles, locale)}
            </span>
            <span aria-hidden className="text-clay/60">
              ·
            </span>
            <span>
              {slots} {t(CAREERS_UI.headcount, locale)}
            </span>
          </div>
        ) : null}
      </header>

      <div className="mx-auto mt-14 max-w-6xl px-5 sm:px-8">
        {hasApiError ? (
          <div className="border border-ink/15 paper-card p-7 backdrop-blur-md sm:p-9">
            <p className="font-viet text-base font-light leading-relaxed text-ink-soft">
              {t(CAREERS_UI.loadError, locale)}
            </p>
            <Link
              href={localePath("/tuyen-dung", locale)}
              className="mt-5 inline-flex border-2 border-ink/30 px-5 py-2.5 font-pixel text-base uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:border-ember hover:bg-ink/5 hover:text-ember"
            >
              {t(CAREERS_UI.retry, locale)}
            </Link>
          </div>
        ) : listItems.length === 0 ? (
          <div className="border border-ink/15 paper-card p-7 backdrop-blur-md sm:p-9">
            <p className="font-viet text-base font-light leading-relaxed text-ink-soft">
              {t(CAREERS_UI.emptyRoles, locale)}
            </p>
          </div>
        ) : (
          departments.map((department) => {
            const departmentRoles = listItems.filter((role) => role.department === department);

            return (
              <div key={department} className="mb-12 last:mb-0">
                <h2 className="font-pixel text-sm uppercase tracking-[0.3em] text-clay">
                  {department}
                  <span className="ml-3 text-ink-soft/70">
                    {departmentRoles.length} {t(CAREERS_UI.rolesInDept, locale)}
                  </span>
                </h2>

                <ul className="mt-5 flex flex-col gap-4">
                  {departmentRoles.map((role) => (
                    <li
                      key={role.key}
                      style={{ ["--tint" as string]: role.tint }}
                      className="s-rise group relative border border-ink/15 paper-card backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--tint)]"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px] bg-[color:var(--tint)]"
                      />

                      <div className="flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                        <div className="min-w-0">
                          <h3 className="font-viet text-lg font-semibold leading-snug text-ink sm:text-xl">
                            {role.detailHref ? (
                              <Link
                                href={role.detailHref}
                                className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-ember"
                              >
                                {role.title}
                              </Link>
                            ) : (
                              <span className="transition-colors duration-200 group-hover:text-ember">
                                {role.title}
                              </span>
                            )}
                          </h3>

                          <ul className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 font-pixel text-xs uppercase tracking-[0.15em] text-ink-soft">
                            {role.employmentType ? (
                              <li className="border border-ink/15 px-2.5 py-1">
                                {role.employmentType}
                              </li>
                            ) : null}
                            {role.jobLevel ? (
                              <li className="border border-ink/15 px-2.5 py-1">
                                {role.jobLevel}
                              </li>
                            ) : null}
                            <li className="border border-ink/15 px-2.5 py-1">
                              {role.numberOfPositions} {t(CAREERS_UI.headcount, locale)}
                            </li>
                          </ul>

                          {role.shortDescription ? (
                            <p className="mt-4 max-w-2xl font-viet text-sm font-light leading-relaxed text-ink-soft">
                              {role.shortDescription}
                            </p>
                          ) : null}

                          {role.skills.length > 0 ? (
                            <ul className="mt-4 flex flex-wrap gap-2">
                              {role.skills.map((skill) => (
                                <li
                                  key={skill}
                                  className="border border-ink/12 bg-white/70 px-2.5 py-1 font-mono text-[11px] text-ink-soft"
                                >
                                  {skill}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>

                        <div className="relative z-10 flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
                          {role.detailHref ? (
                            <Link
                              href={role.detailHref}
                              className="font-pixel inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-ink/30 px-5 py-2.5 text-base uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:border-ember hover:bg-ink/5 hover:text-ember"
                            >
                              {t(CAREERS_UI.viewDetail, locale)}
                            </Link>
                          ) : (
                            <span
                              aria-disabled="true"
                              className="font-pixel inline-flex cursor-default items-center justify-center gap-2 whitespace-nowrap border-2 border-ink/30 px-5 py-2.5 text-base uppercase tracking-[0.12em] text-ink"
                            >
                              {t(CAREERS_UI.viewDetail, locale)}
                            </span>
                          )}

                          {role.applyHref ? (
                            <Link
                              href={role.applyHref}
                              className="btn-pixel font-pixel inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 text-base uppercase tracking-[0.12em]"
                            >
                              {t(CAREERS_UI.apply, locale)} <span aria-hidden>▸</span>
                            </Link>
                          ) : (
                            <span
                              aria-disabled="true"
                              className="btn-pixel font-pixel inline-flex cursor-default items-center justify-center gap-2 whitespace-nowrap px-5 py-2.5 text-base uppercase tracking-[0.12em]"
                            >
                              {t(CAREERS_UI.apply, locale)} <span aria-hidden>▸</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <h2 className="s-rise font-pixel text-[clamp(1.6rem,4vw,2.75rem)] uppercase tracking-wide text-ink">
          {t(CAREERS_UI.benefits, locale)}
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PERKS.map((perk) => (
            <li
              key={perk.title.vi}
              className="s-rise border border-ink/15 paper-card p-5 backdrop-blur-md"
            >
              <h3 className="font-viet text-base font-semibold leading-snug text-ink">
                {t(perk.title, locale)}
              </h3>
              <p className="mt-2 font-viet text-sm font-light leading-relaxed text-ink-soft">
                {t(perk.desc, locale)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <h2 className="s-rise font-pixel text-[clamp(1.6rem,4vw,2.75rem)] uppercase tracking-wide text-ink">
          {t(CAREERS_UI.process, locale)}
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title.vi}
              className="s-rise relative border border-ink/15 bg-white/50 p-5 backdrop-blur-md"
            >
              <span aria-hidden className="font-pixel text-4xl leading-none text-clay/45">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-viet text-base font-semibold leading-snug text-ink">
                {t(step.title, locale)}
              </h3>
              <p className="mt-2 font-viet text-sm font-light leading-relaxed text-ink-soft">
                {t(step.desc, locale)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="s-fade mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <div className="border border-ink/15 paper-card p-7 backdrop-blur-md sm:p-9">
          <h2 className="font-pixel text-[clamp(1.3rem,2.6vw,1.85rem)] uppercase leading-tight text-ink">
            {t(CAREERS_UI.noFitTitle, locale)}
          </h2>
          <p className="mt-3 max-w-2xl font-viet text-sm font-light leading-relaxed text-ink-soft sm:text-base">
            {t(CAREERS_UI.noFitBody, locale)}
          </p>
          <Link
            href={localePath(applyPath(), locale)}
            className="btn-pixel font-pixel mt-6 inline-flex items-center gap-2 px-7 py-3 text-lg uppercase tracking-wider"
          >
            {t(CAREERS_UI.noFitCta, locale)} <span aria-hidden>▸</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
