import type { L } from "@/lib/i18n";

/**
 * The `/ung-tuyen` application form — its fields, options and limits.
 *
 * SEPARATE FROM `contact-form.ts` ON PURPOSE. The two forms were briefly one, and
 * the seams showed immediately: an applicant was being asked for a "ngân sách dự
 * kiến" and had nowhere to put a CV link or a graduation year. Merging them again
 * means one of the two audiences reads a field that is visibly not for them, on
 * the page where they are deciding whether this company is worth their time.
 *
 * TDD-032 v1.1 is the contract for job applications. The markup, server action
 * and backend payload all read the same wire names from `FIELDS`, so a rename
 * cannot silently drop a field between the browser and the public API.
 *
 * NO FILE UPLOAD, DELIBERATELY. There is no object storage in this repo and no
 * budget decision behind adding one, and a CV upload that silently drops the file
 * is worse than no upload at all. `cvUrl` takes a link instead — Google Drive,
 * OneDrive, Dropbox — which is already how most Vietnamese intern applications
 * arrive. Wire real uploads (Vercel Blob) when someone owns that decision; the
 * field name is where to start.
 *
 * All copy is Vietnamese and renders in `font-viet` / `font-pixel`. Never route it
 * through `font-display` / `font-ui` — no diacritics in those faces.
 */

/** Field names. The single source of truth for markup ⇄ action ⇄ payload. */
export const FIELDS = {
  /** Internal-only fields used by the website, never sent to the public API. */
  locale: "locale",
  honeypot: "website",

  /** TDD-032 request wire names. */
  jobPostId: "jobPostId",
  fullName: "fullName",
  email: "email",
  phone: "phone",
  graduationYear: "graduationYear",
  university: "university",
  major: "major",
  cvUrl: "cvUrl",
  portfolioUrl: "portfolioUrl",
  coverLetter: "coverLetter",
  availability: "availability",
  availableStartDate: "availableStartDate",
  referralSource: "referralSource",
  consentToDataProcessing: "consentToDataProcessing",
} as const;

/**
 * `value` is only a stable React key. TDD-032 deliberately does not define enum
 * wire values for availability/start/source; the form submits the translated
 * visible label text instead.
 */
export type Option = { value: string; label: L };

/** How much time the applicant can commit — the question interns get asked. */
export const AVAILABILITY = [
  { value: "full-time", label: { vi: "Toàn thời gian", en: "Full time" } },
  {
    value: "part-time-4",
    label: { vi: "Bán thời gian — 4 buổi/tuần", en: "Part time — 4 days a week" },
  },
  {
    value: "part-time-3",
    label: { vi: "Bán thời gian — 3 buổi/tuần", en: "Part time — 3 days a week" },
  },
  { value: "thoa-thuan", label: { vi: "Có thể thỏa thuận", en: "Negotiable" } },
] as const satisfies readonly Option[];

/** When they can start. */
export const START_DATES = [
  { value: "ngay", label: { vi: "Có thể bắt đầu ngay", en: "Available now" } },
  {
    value: "trong-1-thang",
    label: { vi: "Trong vòng 1 tháng", en: "Within a month" },
  },
  {
    value: "trong-2-3-thang",
    label: { vi: "Trong 2 – 3 tháng", en: "In 2 – 3 months" },
  },
  {
    value: "sau-tot-nghiep",
    label: { vi: "Sau khi tốt nghiệp", en: "After I graduate" },
  },
] as const satisfies readonly Option[];

/** Attribution — optional. */
export const SOURCES = [
  { value: "website", label: { vi: "Website VNZ", en: "The VNZ website" } },
  {
    value: "truong",
    label: { vi: "Trường / khoa giới thiệu", en: "My university or faculty" },
  },
  { value: "mang-xa-hoi", label: { vi: "Mạng xã hội", en: "Social media" } },
  { value: "ban-be", label: { vi: "Bạn bè giới thiệu", en: "A friend" } },
  {
    value: "trang-tuyen-dung",
    label: { vi: "Trang tuyển dụng khác", en: "Another job board" },
  },
  { value: "khac", label: { vi: "Khác", en: "Somewhere else" } },
] as const satisfies readonly Option[];

/** Limits explicitly defined by TDD-032 v1.1 after Trim(). */
export const LIMITS = {
  fullName: 200,
  email: 320,
  availability: 100,
  availableStartDate: 100,
  referralSource: 200,
} as const;

/**
 * A CV link has to be a link. Accepts http(s) only — `javascript:` and `data:`
 * URLs are rejected outright rather than stored and later clicked by whoever
 * reviews the application.
 */
export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
