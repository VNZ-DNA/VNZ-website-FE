import { publicApiGet } from "@/server/api/client";
import type { Locale } from "@/lib/i18n";

export interface PublicJobPostListItem {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  employmentType: string | null;
  jobLevel: string | null;
  numberOfPositions: number;
  skills: string[];
  shortDescription: string | null;
  expiredDate: string;
}

export interface PublicJobPostDetail extends PublicJobPostListItem {
  description: string | null;
  requirements: string | null;
}

export function getPublicJobPosts(locale: Locale) {
  const query = new URLSearchParams({ lang: locale });

  return publicApiGet<PublicJobPostListItem[]>(
    `/api/v1/public/job-posts?${query.toString()}`,
  );
}

export function getPublicJobPostDetail(slug: string, locale: Locale) {
  const query = new URLSearchParams({ lang: locale });

  return publicApiGet<PublicJobPostDetail>(
    `/api/v1/public/job-posts/${encodeURIComponent(slug)}?${query.toString()}`,
    {
      noStore: true,
    },
  );
}
