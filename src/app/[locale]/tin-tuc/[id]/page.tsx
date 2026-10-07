import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { NewsImage } from "@/components/news-image";
import { NewsRichContent } from "@/components/news-rich-content";
import { NEWS_UI, META } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/posts";
import {
  getPublicNews,
  getPublicNewsDetail,
  type PublicNewsCategory,
  type PublicNewsDetail,
} from "@/server/api/news";
import { PublicApiError } from "@/server/api/client";

const getNewsDetail = cache(getPublicNewsDetail);

const CATEGORY_TINTS: Record<string, string> = {
  "Góc nhìn": "var(--color-ember)",
  "Sản phẩm": "var(--color-azure)",
  "Tuyển dụng": "var(--color-jade)",
};

type DetailView = {
  id: string;
  slug: string;
  title: string;
  summaryHtml: string | null;
  summaryText: string | null;
  contentHtml: string | null;
  imageUrl: string | null;
  publishAt: string;
  readingTimeMinutes: number | null;
  categories: string[];
  tint: string;
};

type RelatedPost = {
  id: string;
  title: string;
  categories: string[];
  tint: string;
  href: string;
};

function tintForCategories(categories: PublicNewsCategory[]) {
  for (const category of categories) {
    const tint = CATEGORY_TINTS[category.name];
    if (tint) return tint;
  }

  return "var(--color-ember)";
}

function apiDetailView(post: PublicNewsDetail): DetailView {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summaryHtml: post.summary,
    summaryText: null,
    contentHtml: post.content,
    imageUrl: post.imageUrl,
    publishAt: post.publishAt,
    readingTimeMinutes: post.readingTimeMinutes,
    categories: post.categories.map((category) => category.name),
    tint: tintForCategories(post.categories),
  };
}

async function loadDetail(locale: Locale, slug: string) {
  try {
    return apiDetailView(await getNewsDetail(slug, locale));
  } catch (error) {
    if (error instanceof PublicApiError && (error.status === 400 || error.status === 404)) return null;
    throw error;
  }
}

function formatPublishAt(value: string, locale: Locale) {
  if (locale !== "vi" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDate(value, locale);
  }

  return new Date(value).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: locale === "vi" ? "2-digit" : "numeric",
    month: locale === "vi" ? "2-digit" : "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function metadataDescription(summaryHtml: string | null, summaryText: string | null) {
  if (summaryText) return summaryText;
  if (!summaryHtml) return undefined;

  return summaryHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await loadDetail(locale, id);

  if (!post) return { title: t(META.postNotFound, locale) };

  const description = metadataDescription(post.summaryHtml, post.summaryText);

  return {
    title: `${post.title} — VNZ`,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishAt,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

function Categories({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null;

  return (
    <>
      {categories.map((category) => (
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

function Summary({ post }: { post: DetailView }) {
  if (post.summaryHtml) {
    return (
      <div
        className="mt-5 font-viet text-lg font-light leading-relaxed text-ink-soft [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: post.summaryHtml }}
      />
    );
  }

  if (!post.summaryText) return null;

  return (
    <p className="mt-5 font-viet text-lg font-light leading-relaxed text-ink-soft">
      {post.summaryText}
    </p>
  );
}

async function relatedPosts(locale: Locale, currentId: string): Promise<RelatedPost[]> {
  try {
    const response = await getPublicNews(locale, 1, 5);
    return response.items
      .filter((post) => post.id !== currentId)
      .slice(0, 2)
      .map((post) => ({
        id: post.id,
        title: post.title,
        categories: post.categories.map((category) => category.name),
        tint: tintForCategories(post.categories),
        href: localePath(`/tin-tuc/${post.slug}`, locale),
      }));
  } catch (error) {
    console.error("[tin-tuc/detail] failed to load related public news", error);
    return [];
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const post = await loadDetail(locale, id);
  if (!post) notFound();

  const related = await relatedPosts(locale, post.id);

  return (
    <div className="relative paper">
      <SiteNav locale={locale} />
      <main>
        <article
          style={{ ["--tint" as string]: post.tint }}
          className="relative isolate w-full overflow-x-clip paper py-24 sm:py-28"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background:repeating-linear-gradient(0deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px),repeating-linear-gradient(90deg,rgba(21,22,26,0.05)_0_1px,transparent_1px_56px)] [mask-image:radial-gradient(80%_70%_at_50%_50%,#000_35%,transparent_100%)]"
          />

          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <nav aria-label={t(NEWS_UI.allPosts, locale)}>
              <Link
                href={localePath("/tin-tuc", locale)}
                className="inline-flex items-center gap-2 font-pixel text-sm uppercase tracking-[0.2em] text-ink-soft transition-colors duration-200 hover:text-ember"
              >
                <span aria-hidden>◂</span> {t(NEWS_UI.allPosts, locale)}
              </Link>
            </nav>

            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-pixel text-xs uppercase tracking-[0.18em] text-ink-soft">
                <Categories categories={post.categories} />
                <time dateTime={post.publishAt}>{formatPublishAt(post.publishAt, locale)}</time>
                {post.readingTimeMinutes ? (
                  <>
                    <span aria-hidden className="text-clay/60">
                      ·
                    </span>
                    <span>
                      {post.readingTimeMinutes} {t(NEWS_UI.readingTime, locale)}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-5 font-viet text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight text-ink">
                {post.title}
              </h1>

              <Summary post={post} />
            </header>

            {post.imageUrl ? (
              <div className="mt-8 overflow-hidden border border-ink/15 paper-card">
                <NewsImage
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}

            <div className="mt-10">
              {post.contentHtml ? (
                <NewsRichContent
                  html={post.contentHtml}
                  className="font-viet text-[1.0625rem] font-light leading-[1.85] text-ink-soft sm:text-lg [&_a]:underline [&_a]:decoration-ember/50 [&_a]:underline-offset-4 [&_blockquote]:mt-8 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[color:var(--tint)] [&_blockquote]:pl-5 [&_h1]:mt-10 [&_h1]:font-pixel [&_h1]:text-3xl [&_h1]:uppercase [&_h1]:leading-tight [&_h1]:text-ink [&_h2]:mt-10 [&_h2]:font-pixel [&_h2]:text-[clamp(1.3rem,2.6vw,1.85rem)] [&_h2]:uppercase [&_h2]:leading-tight [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-viet [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-2 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-5 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6"
                />
              ) : null}
            </div>
          </div>

          {related.length ? (
            <aside className="mx-auto mt-20 max-w-3xl px-5 sm:px-8">
              <h2 className="font-pixel text-sm uppercase tracking-[0.3em] text-clay">
                {t(NEWS_UI.readNext, locale)}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {related.map((item) => (
                  <li
                    key={item.id}
                    style={{ ["--tint" as string]: item.tint }}
                    className="group relative border border-ink/15 paper-card p-5 backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--tint)]"
                  >
                    {item.categories.length ? (
                      <div className="flex flex-wrap gap-2 font-pixel text-xs uppercase tracking-[0.18em] tint-text">
                        {item.categories.map((category) => (
                          <span key={category}>{category}</span>
                        ))}
                      </div>
                    ) : null}
                    <h3 className="mt-1.5 font-viet text-base font-semibold leading-snug text-ink">
                      <Link
                        href={item.href}
                        className="transition-colors duration-200 after:absolute after:inset-0 after:content-[''] group-hover:text-ember"
                      >
                        {item.title}
                      </Link>
                    </h3>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </article>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
