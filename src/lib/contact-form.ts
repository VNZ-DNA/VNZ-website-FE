import type { L } from "@/lib/i18n";

/**
 * The `/lien-he` enquiry form — its fields, its options and its validation
 * contract, in one place.
 *
 * WHY THE SHAPE LIVES HERE AND NOT IN THE COMPONENT. Three things have to agree
 * about this form or it breaks in a way nobody notices until a real enquiry is
 * lost: the client markup (`contact-form.tsx`), the server action that validates
 * and forwards it (`src/app/lien-he/actions.ts`), and whatever inbox or webhook
 * receives it. A field renamed in the markup but not in the action silently
 * arrives empty. So both sides import `FIELDS` from here and neither one types a
 * field name as a string literal.
 *
 * Same convention as the other data modules — copy is Vietnamese and renders in
 * `font-viet` / `font-pixel`, both diacritic-capable. Never route any of it
 * through `font-display` / `font-ui`; those pixel faces have no diacritics.
 */

/** Field names. The single source of truth for markup ⇄ action ⇄ payload. */
export const FIELDS = {
  /**
   * WHICH LANGUAGE THE VISITOR IS USING, carried as a hidden input.
   *
   * The server action validates and returns error messages, and those messages
   * are read by a human — so they have to come back in the language that human
   * was reading. A server action has no access to the request URL, so the locale
   * cannot be inferred there; the form has to state it. The action checks the
   * value with `isLocale` and falls back to Vietnamese, so a tampered field
   * changes nothing but the language of the error.
   */
  locale: "locale",
  topic: "inquiryTopic",
  name: "fullName",
  email: "email",
  phone: "phone",
  company: "companyName",
  budget: "budgetRange",
  timeline: "expectedStart",
  message: "message",
  source: "source",
  consent: "consentToDataProcessing",
  /**
   * HONEYPOT. Hidden from sighted users and from assistive tech, and left empty
   * by every human; bots fill every input they find. A filled `website` is the
   * cheapest spam signal there is, and it costs the visitor nothing — no puzzle,
   * no third-party captcha script, no tracking. The action drops those
   * submissions silently and reports success, so a bot learns nothing from the
   * response. Do NOT rename this to something a password manager would skip —
   * the plausible name is the point.
   */
  honeypot: "website",
} as const;

export type ContactField = (typeof FIELDS)[keyof typeof FIELDS];

/**
 * An option in a `<select>`.
 *
 * `value` IS THE STABLE IDENTIFIER and is never translated — it is what the
 * browser posts, what the action validates against, and what lands in the
 * payload. Only `label` changes with the language. Translating a value would
 * mean the same choice arrives as two different strings depending on which
 * version of the page the visitor happened to be reading.
 */
export type Option = { value: string; label: L };

/** What the enquiry is about. */
export const TOPICS = [
  {
    value: "PartnershipProject",
    label: { vi: "Hợp tác / dự án", en: "Partnership / project" },
  },
  {
    value: "TechnologyConsulting",
    label: { vi: "Tư vấn giải pháp công nghệ", en: "Technology consulting" },
  },
  {
    value: "VnzProducts",
    label: { vi: "Sản phẩm của VNZ", en: "A VNZ product" },
  },
  {
    value: "RecruitmentApplication",
    label: { vi: "Tuyển dụng / ứng tuyển", en: "Recruitment / applying" },
  },
  {
    value: "MediaPress",
    label: { vi: "Báo chí · truyền thông", en: "Press · media" },
  },
  { value: "Other", label: { vi: "Nội dung khác", en: "Something else" } },
] as const satisfies readonly Option[];

/**
 * Budget bands. RANGES, NOT AN EXACT FIGURE, and "chưa xác định" comes first on
 * purpose: an enquiry form that demands a number before it will listen turns
 * away the people who genuinely don't know yet, who are often the ones with the
 * most interesting problem. The field is optional for the same reason.
 */
export const BUDGETS = [
  { value: "Undetermined", label: { vi: "Chưa xác định", en: "Not decided yet" } },
  { value: "Under50Million", label: { vi: "Dưới 50 triệu", en: "Under 50M VND" } },
  {
    value: "From50To200Million",
    label: { vi: "50 – 200 triệu", en: "50 – 200M VND" },
  },
  {
    value: "From200To500Million",
    label: { vi: "200 – 500 triệu", en: "200 – 500M VND" },
  },
  { value: "Over500Million", label: { vi: "Trên 500 triệu", en: "Over 500M VND" } },
] as const satisfies readonly Option[];

/** When they want to start. */
export const TIMELINES = [
  {
    value: "AsSoonAsPossible",
    label: { vi: "Càng sớm càng tốt", en: "As soon as possible" },
  },
  {
    value: "WithinOneToThreeMonths",
    label: { vi: "Trong 1 – 3 tháng", en: "In 1 – 3 months" },
  },
  {
    value: "WithinThreeToSixMonths",
    label: { vi: "Trong 3 – 6 tháng", en: "In 3 – 6 months" },
  },
  {
    value: "Exploring",
    label: { vi: "Mới đang tìm hiểu", en: "Just exploring for now" },
  },
] as const satisfies readonly Option[];

/** Attribution. Optional — a required "how did you hear about us" is a toll. */
export const SOURCES = [
  {
    value: "GoogleSearch",
    label: { vi: "Tìm kiếm trên Google", en: "A Google search" },
  },
  { value: "SocialMedia", label: { vi: "Mạng xã hội", en: "Social media" } },
  {
    value: "Referral",
    label: { vi: "Bạn bè / đối tác giới thiệu", en: "A friend or partner" },
  },
  { value: "EventSeminar", label: { vi: "Sự kiện · hội thảo", en: "An event or talk" } },
  { value: "Other", label: { vi: "Khác", en: "Somewhere else" } },
] as const satisfies readonly Option[];

/**
 * Server-side limits. The markup mirrors them in `maxLength` for a good typing
 * experience, but THE ACTION IS THE ONE THAT COUNTS — an attacker posts straight
 * to it and never renders the form. Generous on `message` and tight everywhere
 * else: a real enquiry can be long, a real name cannot.
 */
export const LIMITS = {
  name: 200,
  email: 320,
  phone: 40,
  company: 200,
} as const;

/** Match TDD-023's Vietnamese mobile/fixed-line acceptance for client UX only. */
export function isVietnamPhone(value: string) {
  if (!value.trim()) return true;

  let normalized = value.trim().replace(/[ .\-()]/g, "");
  if (normalized.startsWith("+84")) normalized = `0${normalized.slice(3)}`;
  else if (normalized.startsWith("84")) normalized = `0${normalized.slice(2)}`;

  return /^(?:0[35789][0-9]{8}|02[0-9]{9})$/.test(normalized);
}

/**
 * The label for a value, in both languages.
 *
 * IT RETURNS THE WHOLE `L`, not a resolved string, because it has two callers
 * with different needs: the form renders the visitor's language, and the outgoing
 * payload carries the Vietnamese one so whoever reads the inbox always sees the
 * same wording regardless of which version of the page the enquiry came from.
 *
 * Falls back to a synthesised `L` for an unknown value so a stale option in an
 * old cached page still produces something readable instead of `undefined`.
 */
export function labelOf(options: readonly Option[], value: string): L {
  return (
    options.find((o) => o.value === value)?.label ?? { vi: value, en: value }
  );
}
