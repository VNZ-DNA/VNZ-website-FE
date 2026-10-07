"use server";

import { ERRORS, RESULTS } from "@/lib/dictionary";
import { DEFAULT_LOCALE, isLocale, t, type Locale } from "@/lib/i18n";
import { FIELDS, LIMITS, isHttpUrl } from "@/lib/application-form";
import type { ApiResponse } from "@/server/api/client";

/**
 * TDD-032 v1.1 job-application submit handler.
 *
 * This action only covers applications tied to a concrete JobPost. Free/open
 * applications stay out of scope until their backend contract is finalized.
 * The backend remains the source of truth for JobPost availability and builds the
 * immutable snapshot; FE sends only jobPostId plus the applicant-entered fields.
 */

export type ApplicationState = {
  status: "idle" | "ok" | "error" | "unconfigured";
  message?: string;
  errors?: Partial<Record<string, string>>;
  attempt?: number;
};

type ProblemDetails = {
  title?: string;
  status?: number;
  traceId?: string;
  errors?: Record<string, string[]>;
};

const INT32_MIN = -2_147_483_648;
const INT32_MAX = 2_147_483_647;

const API_FIELDS = [
  FIELDS.jobPostId,
  FIELDS.fullName,
  FIELDS.email,
  FIELDS.phone,
  FIELDS.graduationYear,
  FIELDS.university,
  FIELDS.major,
  FIELDS.cvUrl,
  FIELDS.portfolioUrl,
  FIELDS.coverLetter,
  FIELDS.availability,
  FIELDS.availableStartDate,
  FIELDS.referralSource,
  FIELDS.consentToDataProcessing,
] as const;

function str(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value || null;
}

/** Mirrors the intentionally-light EmailAddressAttribute contract documented by BE. */
function isBackendEmail(value: string) {
  const at = value.indexOf("@");
  return (
    at > 0 &&
    at === value.lastIndexOf("@") &&
    at < value.length - 1 &&
    !value.includes("\r") &&
    !value.includes("\n")
  );
}

function parseGraduationYear(raw: string): number | null | undefined {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < INT32_MIN || value > INT32_MAX) return undefined;
  return value;
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") return false;
  return "isSuccess" in value && typeof (value as { isSuccess?: unknown }).isSuccess === "boolean";
}

function problemField(rawKey: string) {
  const normalized = rawKey
    .replace(/^\$\./, "")
    .replace(/^request\./i, "")
    .trim()
    .toLowerCase();

  return API_FIELDS.find((field) => field.toLowerCase() === normalized);
}

function requiredFieldMessage(field: string, locale: Locale) {
  switch (field) {
    case FIELDS.jobPostId:
      return t(ERRORS.roleRequired, locale);
    case FIELDS.fullName:
      return t(ERRORS.nameRequired, locale);
    case FIELDS.email:
      return t(ERRORS.emailRequiredApply, locale);
    case FIELDS.phone:
      return t(ERRORS.phoneRequired, locale);
    case FIELDS.cvUrl:
      return t(ERRORS.cvRequired, locale);
    case FIELDS.coverLetter:
      return t(ERRORS.introRequired, locale);
    default:
      return t(ERRORS.fieldInvalid, locale);
  }
}

function apiFieldMessage(
  field: string,
  code: string | undefined,
  backendMessage: string,
  locale: Locale,
) {
  const missingRequired = backendMessage === "Vui lòng nhập đầy đủ thông tin bắt buộc.";

  if (missingRequired) return requiredFieldMessage(field, locale);

  switch (field) {
    case FIELDS.jobPostId:
      return t(ERRORS.roleRequired, locale);
    case FIELDS.fullName:
      return t(ERRORS.nameTooLong, locale);
    case FIELDS.email:
      return t(ERRORS.emailInvalid, locale);
    case FIELDS.phone:
      return t(ERRORS.phoneRequired, locale);
    case FIELDS.cvUrl:
      return code === "JOB_APPLICATION_CV_URL_INVALID"
        ? t(ERRORS.linkInvalid, locale)
        : t(ERRORS.cvRequired, locale);
    case FIELDS.portfolioUrl:
      return t(ERRORS.linkInvalid, locale);
    case FIELDS.coverLetter:
      return t(ERRORS.introRequired, locale);
    case FIELDS.consentToDataProcessing:
      return t(ERRORS.consentRequiredApply, locale);
    case FIELDS.availability:
    case FIELDS.availableStartDate:
    case FIELDS.referralSource:
      return t(ERRORS.tooLong, locale);
    default:
      return t(ERRORS.fieldInvalid, locale);
  }
}

function withTrace(message: string, traceId: string | null | undefined, locale: Locale) {
  if (!traceId) return message;
  return `${message} ${locale === "vi" ? "Mã đối chiếu" : "Reference"}: ${traceId}.`;
}

export async function submitApplication(
  prev: ApplicationState,
  data: FormData,
): Promise<ApplicationState> {
  const attempt = (prev.attempt ?? 0) + 1;
  const rawLocale = str(data, FIELDS.locale);
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Keep the existing silent honeypot behavior; it never reaches the public API.
  if (str(data, FIELDS.honeypot)) {
    return { status: "ok", message: t(RESULTS.applyOk, locale), attempt };
  }

  const jobPostId = str(data, FIELDS.jobPostId);
  const fullName = str(data, FIELDS.fullName);
  const email = str(data, FIELDS.email).toLowerCase();
  const phone = str(data, FIELDS.phone);
  const graduationYearRaw = str(data, FIELDS.graduationYear);
  const university = str(data, FIELDS.university);
  const major = str(data, FIELDS.major);
  const cvUrl = str(data, FIELDS.cvUrl);
  const portfolioUrl = str(data, FIELDS.portfolioUrl);
  const coverLetter = str(data, FIELDS.coverLetter);
  const availability = str(data, FIELDS.availability);
  const availableStartDate = str(data, FIELDS.availableStartDate);
  const referralSource = str(data, FIELDS.referralSource);
  const consentToDataProcessing = str(data, FIELDS.consentToDataProcessing) !== "";

  // Binding-equivalent guard for the only numeric field we serialize ourselves.
  const graduationYear = parseGraduationYear(graduationYearRaw);
  if (graduationYear === undefined) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: { [FIELDS.graduationYear]: t(ERRORS.gradYearInvalid, locale) },
      attempt,
    };
  }

  // Match TDD service order: collect every missing required field first.
  const requiredErrors: Record<string, string> = {};
  if (!jobPostId) requiredErrors[FIELDS.jobPostId] = requiredFieldMessage(FIELDS.jobPostId, locale);
  if (!fullName) requiredErrors[FIELDS.fullName] = requiredFieldMessage(FIELDS.fullName, locale);
  if (!email) requiredErrors[FIELDS.email] = requiredFieldMessage(FIELDS.email, locale);
  if (!phone) requiredErrors[FIELDS.phone] = requiredFieldMessage(FIELDS.phone, locale);
  if (!cvUrl) requiredErrors[FIELDS.cvUrl] = requiredFieldMessage(FIELDS.cvUrl, locale);
  if (!coverLetter) requiredErrors[FIELDS.coverLetter] = requiredFieldMessage(FIELDS.coverLetter, locale);

  if (Object.keys(requiredErrors).length) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: requiredErrors,
      attempt,
    };
  }

  if (!consentToDataProcessing) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: {
        [FIELDS.consentToDataProcessing]: t(ERRORS.consentRequiredApply, locale),
      },
      attempt,
    };
  }

  if (fullName.length > LIMITS.fullName) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: { [FIELDS.fullName]: t(ERRORS.nameTooLong, locale) },
      attempt,
    };
  }

  if (email.length > LIMITS.email || !isBackendEmail(email)) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: { [FIELDS.email]: t(ERRORS.emailInvalid, locale) },
      attempt,
    };
  }

  if (!isHttpUrl(cvUrl)) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: { [FIELDS.cvUrl]: t(ERRORS.linkInvalid, locale) },
      attempt,
    };
  }

  if (portfolioUrl && !isHttpUrl(portfolioUrl)) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: { [FIELDS.portfolioUrl]: t(ERRORS.linkInvalid, locale) },
      attempt,
    };
  }

  const lengthErrors: Record<string, string> = {};
  if (availability.length > LIMITS.availability)
    lengthErrors[FIELDS.availability] = t(ERRORS.tooLong, locale);
  else if (availableStartDate.length > LIMITS.availableStartDate)
    lengthErrors[FIELDS.availableStartDate] = t(ERRORS.tooLong, locale);
  else if (referralSource.length > LIMITS.referralSource)
    lengthErrors[FIELDS.referralSource] = t(ERRORS.tooLong, locale);

  if (Object.keys(lengthErrors).length) {
    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: lengthErrors,
      attempt,
    };
  }

  const apiBaseUrl = process.env.VNZ_API_URL?.trim();
  if (!apiBaseUrl) {
    return {
      status: "unconfigured",
      message: t(RESULTS.applyUnconfigured, locale),
      attempt,
    };
  }

  const payload = {
    jobPostId,
    fullName,
    email,
    phone,
    graduationYear,
    university: optional(university),
    major: optional(major),
    cvUrl,
    portfolioUrl: optional(portfolioUrl),
    coverLetter,
    availability: optional(availability),
    availableStartDate: optional(availableStartDate),
    referralSource: optional(referralSource),
    consentToDataProcessing: true,
  };

  let response: Response;
  try {
    response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/public/job-applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("[ung-tuyen] public job application request failed", error);
    return {
      status: "error",
      message: t(RESULTS.applyUncertain, locale),
      attempt,
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // 413/415/proxy failures are allowed to return non-ApiResponse bodies.
  }

  if (response.status === 201 && isApiResponse(body) && body.isSuccess && body.data !== null) {
    return { status: "ok", message: t(RESULTS.applyOk, locale), attempt };
  }

  if (response.status === 413) {
    return { status: "error", message: t(RESULTS.applyTooLarge, locale), attempt };
  }

  if (response.status === 415) {
    return { status: "error", message: t(RESULTS.applyUnsupported, locale), attempt };
  }

  if (isApiResponse(body)) {
    const code = body.errors?.code;
    const fields = body.errors?.fields ?? [];
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (API_FIELDS.includes(field as (typeof API_FIELDS)[number])) {
        errors[field] = apiFieldMessage(field, code, body.message, locale);
      }
    }

    if (code === "JOB_POST_NOT_FOUND") {
      errors[FIELDS.jobPostId] = t(ERRORS.roleRequired, locale);
      return {
        status: "error",
        message: t(RESULTS.applyJobNotFound, locale),
        errors,
        attempt,
      };
    }

    if (code === "JOB_POST_NOT_AVAILABLE") {
      errors[FIELDS.jobPostId] = t(ERRORS.fieldInvalid, locale);
      return {
        status: "error",
        message: t(RESULTS.applyJobUnavailable, locale),
        errors,
        attempt,
      };
    }

    if (response.status === 400) {
      return {
        status: "error",
        message: t(RESULTS.checkFields, locale),
        errors: Object.keys(errors).length ? errors : undefined,
        attempt,
      };
    }

    if (response.status >= 500) {
      return {
        status: "error",
        message: withTrace(t(RESULTS.applyUncertain, locale), body.traceId, locale),
        attempt,
      };
    }
  }

  const problem = body as ProblemDetails | null;
  if (response.status === 400 && problem?.errors) {
    const errors: Record<string, string> = {};
    for (const key of Object.keys(problem.errors)) {
      const field = problemField(key);
      if (field) errors[field] = t(ERRORS.fieldInvalid, locale);
    }

    return {
      status: "error",
      message: t(RESULTS.checkFields, locale),
      errors: Object.keys(errors).length ? errors : undefined,
      attempt,
    };
  }

  if (response.status >= 500) {
    return {
      status: "error",
      message: withTrace(t(RESULTS.applyUncertain, locale), problem?.traceId, locale),
      attempt,
    };
  }

  return {
    status: "error",
    message: t(RESULTS.applyFailed, locale),
    attempt,
  };
}
