import { publicApiGet } from "@/server/api/client";
import type { Locale } from "@/lib/i18n";

export type PublicProductContentBlockType =
  | "Category"
  | "Title"
  | "Description"
  | "Feature";

export interface PublicProductFeatureItem {
  title: string | null;
}

export interface PublicProductContentBlock {
  type: PublicProductContentBlockType;
  order: number;
  text: string | null;
  items: PublicProductFeatureItem[] | null;
}

export interface PublicProductContent {
  blocks: PublicProductContentBlock[];
}

export interface PublicProductListItem {
  /** TDD-043 v1.2 public media contract: Logo is always rendered first. */
  logoUrl: string;
  /** TDD-043 v1.2 public media contract: Wordmark is always rendered after Logo. */
  wordmarkUrl: string;
  content: PublicProductContent | null;
  productUrl: string | null;
}

export interface PublicProductListResponse {
  items: PublicProductListItem[];
}

/**
 * TDD-043 public homepage Product feed.
 *
 * The backend owns visibility and ordering (Completed + published + displayOrder
 * + Logo + Wordmark) and returns blocks in their saved order. FE intentionally
 * does not re-filter or re-sort either products or content blocks.
 */
export function getPublicProducts(locale: Locale) {
  const query = new URLSearchParams({ lang: locale });

  return publicApiGet<PublicProductListResponse>(
    `/api/v1/public/products?${query.toString()}`,
  );
}
