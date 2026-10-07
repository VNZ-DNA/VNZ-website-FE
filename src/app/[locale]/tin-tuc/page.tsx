import type { Metadata } from "next";
import Link from "next/link";
import { localePath, t, type Locale } from "@/lib/i18n";
import { META, NEWS_UI } from "@/lib/dictionary";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getPublicNews, type PublicNewsListItem } from "@/server/api/news";

const NEWS_PAGE_SIZE = 5;

const CATEGORY_TINTS: Record<string, string> = {
  "Góc nhìn": "var(--color-ember)",
  "Sản phẩm": "var(--color-azure)",
  "Tuyển dụng": "var(--color-jade)",
};

const FALLBACK_TINTS = [
  "var(--color-ember)",
  "var(--color-azure)",
  "var(--color-jade)",
  "var(--color-gold)",
] as const;

type NewsCard = {
  id: string;
  slug: string;
  title: string;
  summaryHtml: string | null;
  summaryText: string | null;
  publishAt: string;
  readingTimeMinutes: number | null;
  categories: string[];
  tint: string;
  detailHref?: string;
};

type PaginationItem = number | "ellipsis-left" | "ellipsis-right";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(META.newsTitle, locale),
    description: t(META.newsDescription, locale),
  };
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;

  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function apiTint(post: PublicNewsListItem, index: number) {
  for (const category of post.categories) {
    const tint = CATEGORY_TINTS[category.name];
    if (tint) return tint;
  }

  return FALLBACK_TINTS[index % FALLBACK_TINTS.length];
}

function apiCards(items: PublicNewsListItem[], locale: Locale): NewsCard[] {
  return items.map((post, index) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    summaryHtml: post.summary,
    summaryText: null,
    publishAt: post.publishAt,
    // TDD-042 owns this value. While that backend migration is rolling out,
    // hide the label rather than inventing a reading time in the frontend.
    readingTimeMinutes: Number.isFinite(post.readingTimeMinutes)
      ? post.readingTimeMinutes
      : null,
    categories: post.categories.map((category) => category.name),
    tint: apiTint(post, index),
    detailHref: localePath(`/tin-tuc/${post.slug}`, locale),
  }));
}

function formatPublishAt(value: string, locale: Locale) {
  const date = new Date(value);
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: locale === "vi" ? "2-digit" : "numeric",
    month: locale === "vi" ? "2-digit" : "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pageHref(page: number, locale: Locale) {
  return localePath(page <= 1 ? "/tin-tuc" : `/tin-tuc?page=${page}`, locale);
}

function paginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}

function Summary({ post }: { post: NewsCard }) {
  if (post.summaryHtml) {
    return (
      <div
        className="mt-4 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: post.summaryHtml }}
      />
    );
  }

  if (!post.summaryText) return null;

  return (
    <p className="mt-4 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
      {post.summaryText}
    </p>
  );
}

function CompactSummary({ post }: { post: NewsCard }) {
  if (post.summaryHtml) {
    return (
      <div
        className="mt-3 font-viet text-sm font-light leading-relaxed text-ink-soft [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: post.summaryHtml }}
      />
    );
  }

  if (!post.summaryText) return null;

  return (
    <p className="mt-3 font-viet text-sm font-light leading-relaxed text-ink-soft">
      {post.summaryText}
    </p>
  );
}

function Categories({ post }: { post: NewsCard }) {
  if (post.categories.length === 0) return null;

  return (
    <>
      {post.categories.map((category) => (
        <span
          key={category}
          className="border border-[color:var(--tint)]/45 px-2.5 py-1 tint-text"
        >
          {category}
        </span>
      ))}
    </>
  );
}

export default async function TinTucPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const requestedPage = parsePage(query.page);

  let posts: NewsCard[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasLoadError = false;

  currentPage = requestedPage;

  try {
    const response = await getPublicNews(locale, currentPage, NEWS_PAGE_SIZE);
    posts = apiCards(response.items, locale);
    currentPage = response.page;
    totalPages = response.totalPages;
  } catch (error) {
    console.error("[tin-tuc] failed to load public news list", error);
    hasLoadError = true;
  }

  const [lead, ...rest] = posts;
  const showPagination =
    !hasLoadError && totalPages > 1 && currentPage <= totalPages;

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <section className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
          />

          <header className="mx-auto max-w-6xl px-5 sm:px-8">
            <span className="s-fade inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-clay sm:text-base">
              {t(NEWS_UI.label, locale)}
            </span>
            <h1 className="s-rise mt-4 max-w-3xl font-pixel text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.9] text-ink">
              {t(NEWS_UI.titleA, locale)}{" "}
              <span className="text-clay">{t(NEWS_UI.titleAccent, locale)}</span>
            </h1>
            <p className="s-fade mt-6 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
              {t(NEWS_UI.lead, locale)}
            </p>
          </header>

          {hasLoadError ? (
            <div className="mx-auto mt-14 max-w-6xl px-5 sm:px-8">
              <p className="font-viet text-base font-light text-ink-soft">
                {t(NEWS_UI.loadError, locale)}
              </p>
              <Link
                href={pageHref(currentPage, locale)}
                prefetch={false}
                className="mt-5 inline-flex border-2 border-ink/30 px-5 py-2.5 font-pixel text-base uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:border-ember hover:bg-ink/5 hover:text-ember"
              >
                {t(NEWS_UI.retry, locale)}
              </Link>
            </div>
          ) : posts.length === 0 ? (
            <p className="mx-auto mt-14 max-w-6xl px-5 font-viet text-base font-light text-ink-soft sm:px-8">
              {t(NEWS_UI.empty, locale)}
            </p>
          ) : (
            <div className="mx-auto mt-14 max-w-6xl px-5 sm:px-8">
              <article
                style={{ ["--tint" as string]: lead.tint }}
                className="s-rise group relative border border-ink/15 paper-card backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--tint)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--tint)] [box-shadow:0_0_16px_var(--tint)]"
                />
                <div className="p-6 sm:p-9">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-pixel text-xs uppercase tracking-[0.18em] text-ink-soft">
                    <Categories post={lead} />
                    <time dateTime={lead.publishAt}>
                      {formatPublishAt(lead.publishAt, locale)}
                    </time>
                    {lead.readingTimeMinutes ? (
                      <>
                        <span aria-hidden className="text-clay/60">
                          ·
                        </span>
                        <span>
                          {lead.readingTimeMinutes} {t(NEWS_UI.readingTime, locale)}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="mt-4 max-w-3xl font-viet text-2xl font-bold leading-tight text-ink sm:text-[2rem]">
                    {lead.detailHref ? (
                      <Link
                        href={lead.detailHref}
                        className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-ember"
                      >
                        {lead.title}
                      </Link>
                    ) : (
                      <span className="transition-colors duration-200 group-hover:text-ember">
                        {lead.title}
                      </span>
                    )}
                  </h2>
                  <Summary post={lead} />
                  <span className="mt-6 inline-flex items-center gap-2 font-pixel text-base uppercase tracking-[0.15em] text-ink transition-colors duration-200 group-hover:text-ember">
                    {t(NEWS_UI.readMore, locale)} <span aria-hidden>▸</span>
                  </span>
                </div>
              </article>

              {rest.length ? (
                <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {rest.map((post) => (
                    <li
                      key={post.id}
                      style={{ ["--tint" as string]: post.tint }}
                      className="s-rise group relative flex flex-col border border-ink/15 paper-card p-6 backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--tint)]"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[3px] bg-[color:var(--tint)]"
                      />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-pixel text-xs uppercase tracking-[0.18em] text-ink-soft">
                        <Categories post={post} />
                        <time dateTime={post.publishAt}>
                          {formatPublishAt(post.publishAt, locale)}
                        </time>
                      </div>
                      <h2 className="mt-4 font-viet text-lg font-bold leading-snug text-ink sm:text-xl">
                        {post.detailHref ? (
                          <Link
                            href={post.detailHref}
                            className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-ember"
                          >
                            {post.title}
                          </Link>
                        ) : (
                          <span className="transition-colors duration-200 group-hover:text-ember">
                            {post.title}
                          </span>
                        )}
                      </h2>
                      <CompactSummary post={post} />
                      {post.readingTimeMinutes ? (
                        <span className="mt-auto pt-5 font-pixel text-xs uppercase tracking-[0.18em] text-ink-soft">
                          {post.readingTimeMinutes} {t(NEWS_UI.readingTime, locale)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {showPagination ? (
                <nav
                  aria-label={t(NEWS_UI.paginationNav, locale)}
                  className="mt-10 flex flex-wrap items-center justify-center gap-2 font-pixel text-sm uppercase tracking-[0.12em]"
                >
                  {currentPage > 1 ? (
                    <Link
                      href={pageHref(currentPage - 1, locale)}
                      className="inline-flex items-center gap-1.5 border border-ink/20 px-3.5 py-2 text-ink-soft transition-colors duration-200 hover:border-ember hover:text-ember"
                    >
                      <span aria-hidden>◂</span> {t(NEWS_UI.previousPage, locale)}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex cursor-default items-center gap-1.5 border border-ink/10 px-3.5 py-2 text-ink-soft/40"
                    >
                      <span aria-hidden>◂</span> {t(NEWS_UI.previousPage, locale)}
                    </span>
                  )}

                  {paginationItems(currentPage, totalPages).map((item) =>
                    typeof item === "number" ? (
                      <Link
                        key={item}
                        href={pageHref(item, locale)}
                        aria-current={item === currentPage ? "page" : undefined}
                        aria-label={`${t(NEWS_UI.pageLabel, locale)} ${item}`}
                        className={`inline-flex min-w-10 items-center justify-center border px-3 py-2 transition-colors duration-200 ${
                          item === currentPage
                            ? "border-ember text-ember"
                            : "border-ink/20 text-ink-soft hover:border-ember hover:text-ember"
                        }`}
                      >
                        {item}
                      </Link>
                    ) : (
                      <span
                        key={item}
                        aria-hidden
                        className="inline-flex min-w-8 items-center justify-center px-1 text-ink-soft/60"
                      >
                        …
                      </span>
                    ),
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={pageHref(currentPage + 1, locale)}
                      className="inline-flex items-center gap-1.5 border border-ink/20 px-3.5 py-2 text-ink-soft transition-colors duration-200 hover:border-ember hover:text-ember"
                    >
                      {t(NEWS_UI.nextPage, locale)} <span aria-hidden>▸</span>
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="inline-flex cursor-default items-center gap-1.5 border border-ink/10 px-3.5 py-2 text-ink-soft/40"
                    >
                      {t(NEWS_UI.nextPage, locale)} <span aria-hidden>▸</span>
                    </span>
                  )}
                </nav>
              ) : null}
            </div>
          )}
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
