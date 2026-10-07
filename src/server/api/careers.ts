import { publicApiGet } from "@/server/api/client";
import type { Locale } from "@/lib/i18n";

export interface PublicJobPostListItem {
  id: string;
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
  const query = new URLSearchParams({ locale });

  return publicApiGet<PublicJobPostListItem[]>(
    `/api/v1/public/job-posts?${query.toString()}`,
  );
}

export function getPublicJobPostDetail(id: string, locale: Locale) {
  const query = new URLSearchParams({ locale });

  return publicApiGet<PublicJobPostDetail>(
    `/api/v1/public/job-posts/${encodeURIComponent(id)}?${query.toString()}`,
    {
      noStore: true,
    },
  );
}
