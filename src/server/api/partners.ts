import { publicApiGet } from "@/server/api/client";

export interface PublicPartnerListItem {
  logoUrl: string | null;
  websiteUrl: string | null;
}

export interface PublicPartnerListResponse {
  total: number;
  items: PublicPartnerListItem[];
}

/**
 * TDD-044 public homepage Partner feed.
 *
 * Backend owns public visibility and ordering. FE intentionally does not filter
 * by publish/order fields or re-sort the returned list.
 */
export function getPublicPartners() {
  return publicApiGet<PublicPartnerListResponse>("/api/v1/public/partners");
}