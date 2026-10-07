export interface ApiErrorDetails {
  code: string;
  fields: string[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T | null;
  errors: ApiErrorDetails | null;
  traceId: string | null;
  timestampUtc: string;
}

export class PublicApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "PublicApiError";
  }
}

function apiBaseUrl() {
  const value = process.env.VNZ_API_URL?.trim();

  if (!value) {
    throw new PublicApiError("VNZ_API_URL is not configured.");
  }

  return value.replace(/\/+$/, "");
}

export async function publicApiGet<T>(
  path: string,
  options: { noStore?: boolean; revalidate?: number } = {},
): Promise<T> {
  const cacheOptions = options.noStore
    ? ({ cache: "no-store" } as const)
    : ({ next: { revalidate: options.revalidate ?? 60 } } as const);

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    ...cacheOptions,
  });

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new PublicApiError(
      "Backend returned an invalid response.",
      response.status,
    );
  }

  if (!response.ok || !payload.isSuccess || payload.data === null) {
    throw new PublicApiError(
      payload.message || "Unable to complete the request.",
      response.status,
      payload.errors?.code,
    );
  }

  return payload.data;
}
