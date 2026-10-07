"use server";

import { PublicApiError } from "@/server/api/client";
import {
  getPublicTeamMemberById,
  type PublicTeamMemberDetail,
} from "@/server/api/team-members";

export type PublicTeamMemberDetailResult =
  | { ok: true; data: PublicTeamMemberDetail }
  | {
      ok: false;
      status: number;
      code: string | null;
      message: string;
    };

export async function fetchPublicTeamMemberDetail(
  id: string,
): Promise<PublicTeamMemberDetailResult> {
  try {
    return {
      ok: true,
      data: await getPublicTeamMemberById(id),
    };
  } catch (error) {
    if (error instanceof PublicApiError) {
      return {
        ok: false,
        status: error.status ?? 500,
        code: error.code ?? null,
        message: error.message,
      };
    }

    return {
      ok: false,
      status: 500,
      code: "RESOURCE_OPERATION_FAILED",
      message: "Unable to load team member detail.",
    };
  }
}
