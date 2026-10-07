import { FOOTER, NAV_LABELS } from "@/lib/dictionary";
import type { L } from "@/lib/i18n";

/**
 * Site-wide identity + contact details, in one place.
 *
 * WHY THE CONTACT FIELDS ARE EMPTY. The footer and `/lien-he` need real contact
 * affordances, and there were none anywhere in the repo. Rather than invent an
 * email, a phone number and an address (which would ship as facts and be wrong),
 * every contact field here starts EMPTY and each block renders only when its
 * field is filled. So the site is complete and correct today and grows the moment
 * these strings are set — nothing to remember, nothing fake.
 *
 * Fill in what exists, leave the rest as "".
 *
 * NOTE ON LANGUAGE: an email address, a phone number and a street address are
 * the same in both languages, so `CONTACT` is plain strings. Only prose is `L`.
 */

export const SITE = {
  name: "VNZ",
  legalName: "Vietnam Z-DNA Technology",
  /** ASCII, so it is safe in every face including the pixel display fonts. */
  tagline: "Vietnamese Minds · Global Solutions",
  /** One-sentence positioning shown under the logo. */
  positioning: {
    vi: "Một thế hệ người Việt làm chủ công nghệ — tạo ra sản phẩm của riêng mình và ghi dấu ấn trên bản đồ công nghệ thế giới.",
    en: "A Vietnamese generation mastering technology — building products of its own and leaving a mark on the world’s technology map.",
  } satisfies L,
} as const;

/** Every field optional on purpose — see the note above. */
export type Contact = {
  /** General enquiries, e.g. "hello@vnzdna.com". */
  email: string;
  /** Recruitment inbox, e.g. "tuyendung@vnzdna.com". */
  recruitEmail: string;
  /** Display phone, e.g. "+84 28 1234 5678". */
  phone: string;
  /** Office address, one line. */
  address: string;
};

export const CONTACT: Contact = {
  email: "",
  recruitEmail: "",
  phone: "",
  address: "",
};

export type SocialLink = { label: string; href: string };

/** Add entries as accounts go live; the footer hides the block when empty. */
export const SOCIALS: SocialLink[] = [];

/**
 * Office hours, shown in the `/lien-he` sidebar.
 *
 * EMPTY ON PURPOSE, same rule as `CONTACT`: the repo has no confirmed working
 * hours, and "Thứ 2 – Thứ 6: 8:00 – 17:00" is the kind of plausible default that
 * ships as a fact and is wrong. The sidebar hides the whole block while this is
 * empty. Both languages are required once you fill it in — a day name is prose.
 *
 *   { days: { vi: "Thứ 2 – Thứ 6", en: "Mon – Fri" }, hours: "8:00 – 17:30" },
 */
export type OfficeHours = { days: L; hours: string };

export const HOURS: OfficeHours[] = [];

/**
 * How long a form submission takes to answer, e.g. "trong vòng 24 giờ làm việc".
 * EMPTY ON PURPOSE — it is a promise to the visitor, so it has to be one the team
 * has actually made. The sidebar drops the block when both sides are unset.
 */
export const RESPONSE_TIME: L = { vi: "", en: "" };

/**
 * Footer navigation, grouped into columns.
 *
 * `path` IS LOCALE-FREE — a bare route like `/tuyen-dung`. The footer runs it
 * through `localePath()` so the English footer links to `/en/tuyen-dung`. Never
 * hard-code a prefixed href here; that is the one mistake that strands an English
 * reader back in Vietnamese, and it is invisible until someone clicks.
 *
 * EVERY ENTRY IS A REAL ROUTE — no `#` targets, and none should come back. These
 * used to mirror the nav's homepage bookmarks (`/#story`, `/#products`,
 * `/#partners`), which meant the footer of `/tuyen-dung` sent you home and then
 * dropped you into the middle of a chapter.
 *
 * TWO GROUPS, DELIBERATELY. The footer grid in `site-footer.tsx` is four explicit
 * columns — brand, group, group, contact — so collapsing these into one leaves a
 * hole where the second belongs. Keep in step with `NAV` in
 * `src/components/site-nav.tsx`; both lists must resolve to a directory under
 * `src/app/[locale]/`.
 */
export const FOOTER_NAV: {
  heading: L;
  links: { label: L; path: string }[];
}[] = [
  {
    heading: FOOTER.explore,
    links: [
      { label: NAV_LABELS.home, path: "/" },
      { label: NAV_LABELS.team, path: "/doi-ngu" },
      { label: NAV_LABELS.news, path: "/tin-tuc" },
    ],
  },
  {
    heading: FOOTER.company,
    links: [
      { label: NAV_LABELS.careers, path: "/tuyen-dung" },
      { label: NAV_LABELS.apply, path: "/ung-tuyen" },
      { label: NAV_LABELS.contact, path: "/lien-he" },
    ],
  },
];
