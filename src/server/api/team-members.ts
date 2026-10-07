import { PublicApiError, publicApiGet } from "@/server/api/client";

export interface PublicFeaturedTeamMember {
  id: string;
  displayName: string | null;
  fullName: string;
  position: string | null;
  jobLevel: string | null;
  avatarUrl: string | null;
  hometown: string | null;
  backgroundUrl: string | null;
}

export interface PublicFeaturedTeamMembersResponse {
  total: number;
  items: PublicFeaturedTeamMember[];
}

export interface PublicTeamMemberListItem {
  id: string;
  fullName: string;
  position: string | null;
  avatarUrl: string | null;
}

export interface PublicTeamMemberDetail {
  id: string;
  fullName: string;
  position: string | null;
  jobLevel: string | null;
  avatarUrl: string | null;
  hometown: string | null;
  backgroundUrl: string | null;
  hobbies: string | null;
  joinedDate: string | null;
  personalQuote: string | null;
  animationUrl: string | null;
  audioUrl: string | null;
}

/** TDD-025 homepage feed: backend owns visibility, ordering and the six-item cap. */
export async function getPublicFeaturedTeamMembers() {
  const data = await publicApiGet<
    PublicFeaturedTeamMembersResponse | PublicTeamMemberListItem[]
  >(
    "/api/v1/public/team-members/featured",
  );

  // The deployed backend may temporarily still expose the pre-v1.5 array shape.
  // Fail closed so the homepage uses its existing static fallback instead of
  // silently rendering an invalid response while BE catches up with TDD-025 v1.5.
  if (Array.isArray(data)) {
    throw new PublicApiError(
      "Featured team API is still using the legacy response shape.",
    );
  }

  return data;
}

/** TDD-025 full selector feed: backend returns every eligible member in display order. */
export function getPublicTeamMembers() {
  return publicApiGet<PublicTeamMemberListItem[]>("/api/v1/public/team-members");
}

/**
 * TDD-040 detail feed. It is deliberately no-store so every selection re-checks
 * current publish/employment visibility instead of trusting selector state.
 */
export function getPublicTeamMemberById(id: string) {
  return publicApiGet<PublicTeamMemberDetail>(
    `/api/v1/public/team-members/${encodeURIComponent(id)}`,
    { noStore: true },
  );
}
