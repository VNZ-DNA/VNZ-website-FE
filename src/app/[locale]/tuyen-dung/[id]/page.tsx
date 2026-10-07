import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PERKS, STEPS } from "@/lib/careers";
import { CAREERS_UI, META } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import {
  getPublicJobPostDetail,
  getPublicJobPosts,
  type PublicJobPostDetail,
  type PublicJobPostListItem,
} from "@/server/api/careers";
import { PublicApiError } from "@/server/api/client";

const getJobDetail = cache(getPublicJobPostDetail);

const DEPARTMENT_TINTS: Record<string, string> = {
  "Kỹ thuật": "var(--color-jade)",
  "Sản phẩm": "var(--color-gold)",
};

type DetailViewModel = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  employmentType: string | null;
  jobLevel: string | null;
  numberOfPositions: number;
  skills: string[];
  shortDescription: string | null;
  descriptionItems: string[];
  requirementItems: string[];
  expiredDate: string | null;
  tint: string;
  applyHref: string;
};

type OtherRole = {
  id: string;
  title: string;
  department: string | null;
  numberOfPositions: number;
  href: string;
};

function multilineItems(value: string | null) {
  return value
    ? value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
}

function formatDateOnly(value: string, locale: Locale) {
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function apiDetailView(job: PublicJobPostDetail, locale: Locale): DetailViewModel {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    department: job.department,
    employmentType: job.employmentType,
    jobLevel: job.jobLevel,
    numberOfPositions: job.numberOfPositions,
    skills: job.skills,
    shortDescription: job.shortDescription,
    descriptionItems: multilineItems(job.description),
    requirementItems: multilineItems(job.requirements),
    expiredDate: job.expiredDate,
    tint: job.department ? DEPARTMENT_TINTS[job.department] ?? "var(--color-ember)" : "var(--color-ember)",
    applyHref: localePath(`/ung-tuyen?jobSlug=${encodeURIComponent(job.slug)}`, locale),
  };
}

function apiOtherRoles(
  jobs: PublicJobPostListItem[],
  currentId: string,
  locale: Locale,
): OtherRole[] {
  return jobs
    .filter((job) => job.id !== currentId)
    .map((job) => ({
      id: job.id,
      title: job.title,
      department: job.department,
      numberOfPositions: job.numberOfPositions,
      href: localePath(`/tuyen-dung/${job.slug}`, locale),
    }));
}

async function loadDetail(locale: Locale, slug: string) {
  try {
    return apiDetailView(await getJobDetail(slug, locale), locale);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id: slug } = await params;
  const role = await loadDetail(locale, slug);

  if (!role) return { title: t(META.roleNotFound, locale) };

  return {
    title: `${role.title} — ${t(CAREERS_UI.label, locale)} VNZ`,
    description: role.shortDescription ?? undefined,
  };
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-ink/10 py-2.5 first:border-t-0 first:pt-0">
      <dt className="shrink-0 font-pixel text-xs uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </dt>
      <dd className="text-right font-viet text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-pixel text-[clamp(1.15rem,2.2vw,1.5rem)] uppercase tracking-wide text-ink">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="flex gap-3 font-viet text-sm font-light leading-relaxed text-ink-soft sm:text-base"
          >
            <span aria-hidden className="mt-[3px] shrink-0 tint-text">
              ▸
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function RolePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id: slug } = await params;
  const role = await loadDetail(locale, slug);
  if (!role) notFound();

  let others: OtherRole[] = [];

  try {
    others = apiOtherRoles(await getPublicJobPosts(locale), role.id, locale);
  } catch (error) {
    console.error("[tuyen-dung/detail] failed to load other public job posts", error);
  }

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <article
          style={{ ["--tint" as string]: role.tint }}
          className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
          />

          <nav
            aria-label={t(CAREERS_UI.breadcrumbNav, locale)}
            className="mx-auto max-w-6xl px-5 sm:px-8"
          >
            <Link
              href={localePath("/tuyen-dung", locale)}
              className="inline-flex items-center gap-2 font-pixel text-sm uppercase tracking-[0.2em] text-ink-soft transition-colors duration-200 hover:text-ember"
            >
              <span aria-hidden>◂</span> {t(CAREERS_UI.allRoles, locale)}
            </Link>
          </nav>

          <header className="mx-auto mt-6 max-w-6xl px-5 sm:px-8">
            {role.department ? (
              <span className="font-pixel text-sm uppercase tracking-[0.3em] tint-text">
                {role.department}
              </span>
            ) : null}
            <h1 className="mt-3 max-w-4xl font-viet text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-ink">
              {role.title}
            </h1>
            <ul className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 font-pixel text-xs uppercase tracking-[0.15em] text-ink-soft">
              {role.employmentType ? (
                <li className="border border-ink/15 px-2.5 py-1">{role.employmentType}</li>
              ) : null}
              {role.jobLevel ? (
                <li className="border border-ink/15 px-2.5 py-1">{role.jobLevel}</li>
              ) : null}
              <li className="border border-ink/15 px-2.5 py-1">
                {role.numberOfPositions} {t(CAREERS_UI.headcount, locale)}
              </li>
            </ul>
          </header>

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              {role.shortDescription ? (
                <p className="font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
                  {role.shortDescription}
                </p>
              ) : null}

              <Section
                title={t(CAREERS_UI.jobDescription, locale)}
                items={role.descriptionItems}
              />
              <Section
                title={t(CAREERS_UI.requirements, locale)}
                items={role.requirementItems}
              />

              {role.skills.length > 0 ? (
                <section className="mt-10">
                  <h2 className="font-pixel text-[clamp(1.15rem,2.2vw,1.5rem)] uppercase tracking-wide text-ink">
                    {t(CAREERS_UI.stackTitle, locale)}
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <li
                        key={skill}
                        className="border border-ink/15 bg-white/70 px-3 py-1.5 font-mono text-xs text-ink-soft"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-10">
                <h2 className="font-pixel text-[clamp(1.15rem,2.2vw,1.5rem)] uppercase tracking-wide text-ink">
                  {t(CAREERS_UI.benefits, locale)}
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PERKS.map((perk) => (
                    <li key={perk.title.vi} className="border border-ink/15 paper-card p-4">
                      <h3 className="font-viet text-sm font-semibold leading-snug text-ink">
                        {t(perk.title, locale)}
                      </h3>
                      <p className="mt-1.5 font-viet text-sm font-light leading-relaxed text-ink-soft">
                        {t(perk.desc, locale)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-10">
                <h2 className="font-pixel text-[clamp(1.15rem,2.2vw,1.5rem)] uppercase tracking-wide text-ink">
                  {t(CAREERS_UI.process, locale)}
                </h2>
                <ol className="mt-4 flex flex-col gap-3">
                  {STEPS.map((step, index) => (
                    <li key={step.title.vi} className="flex gap-4">
                      <span
                        aria-hidden
                        className="shrink-0 font-pixel text-2xl leading-none text-clay/45"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-viet text-base font-semibold leading-snug text-ink">
                          {t(step.title, locale)}
                        </h3>
                        <p className="mt-1 font-viet text-sm font-light leading-relaxed text-ink-soft">
                          {t(step.desc, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <div className="relative border border-ink/15 paper-card p-6 backdrop-blur-md">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--tint)] [box-shadow:0_0_16px_var(--tint)]"
                />
                <h2 className="font-pixel text-lg uppercase tracking-[0.15em] text-ink">
                  {t(CAREERS_UI.applyPanelTitle, locale)}
                </h2>
                <p className="mt-2 font-viet text-sm font-light leading-relaxed text-ink-soft">
                  {t(CAREERS_UI.applyPanelBody, locale)}
                </p>

                <Link
                  href={role.applyHref}
                  className="btn-pixel font-pixel mt-5 inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base uppercase tracking-[0.12em]"
                >
                  {t(CAREERS_UI.applyNow, locale)} <span aria-hidden>▸</span>
                </Link>

                <dl className="mt-6 flex flex-col border-t border-ink/10 pt-4">
                  <Fact label={t(CAREERS_UI.factDepartment, locale)} value={role.department} />
                  <Fact label={t(CAREERS_UI.factEmployment, locale)} value={role.employmentType} />
                  <Fact label={t(CAREERS_UI.factLevel, locale)} value={role.jobLevel} />
                  <Fact
                    label={t(CAREERS_UI.factHeadcount, locale)}
                    value={`${role.numberOfPositions} ${t(CAREERS_UI.people, locale)}`}
                  />
                  <Fact
                    label={t(CAREERS_UI.factDeadline, locale)}
                    value={
                      role.expiredDate
                        ? locale === "vi"
                          ? formatDateOnly(role.expiredDate, locale)
                          : role.expiredDate
                        : null
                    }
                  />
                </dl>
              </div>

              {others.length > 0 ? (
                <div className="border border-ink/15 paper-card p-6 backdrop-blur-md">
                  <h2 className="font-pixel text-sm uppercase tracking-[0.25em] text-clay">
                    {t(CAREERS_UI.otherRoles, locale)}
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {others.map((other) => (
                      <li key={other.id}>
                        <Link href={other.href} className="group block">
                          <span className="block font-viet text-sm font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-ember">
                            {other.title}
                          </span>
                          <span className="mt-0.5 block font-pixel text-xs uppercase tracking-[0.15em] text-ink-soft">
                            {other.department ?? t(CAREERS_UI.otherDepartment, locale)} ·{" "}
                            {other.numberOfPositions} {t(CAREERS_UI.headcount, locale)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
