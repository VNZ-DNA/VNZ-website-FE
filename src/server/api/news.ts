import { publicApiGet } from "@/server/api/client";
import type { Locale } from "@/lib/i18n";

export interface PublicNewsCategory {
  id: string;
  name: string;
}

export interface PublicNewsListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  publishAt: string;
  readingTimeMinutes: number;
  categories: PublicNewsCategory[];
}

export interface PagedPublicNewsList {
  items: PublicNewsListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PublicNewsDetail extends PublicNewsListItem {
  content: string | null;
  imageUrl: string | null;
}

export function getPublicNews(locale: Locale, page = 1, pageSize = 5) {
  const query = new URLSearchParams({
    lang: locale,
    page: String(page),
    pageSize: String(pageSize),
  });

  return publicApiGet<PagedPublicNewsList>(`/api/v1/public/news?${query.toString()}`, {
    noStore: true,
  });
}

export function getPublicNewsDetail(slug: string, locale: Locale) {
  const query = new URLSearchParams({ lang: locale });

  return publicApiGet<PublicNewsDetail>(
    `/api/v1/public/news/${encodeURIComponent(slug)}?${query.toString()}`,
    {
    noStore: true,
    },
  );
}
