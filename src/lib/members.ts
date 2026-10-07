import type { StaticImageData } from "next/image";
import type { L } from "@/lib/i18n";
import binhImg from "../../public/members/cutout/binh.png";
import viImg from "../../public/members/cutout/vi.png";
import duongImg from "../../public/members/cutout/duong.png";
import tanImg from "../../public/members/cutout/tan.png";
import danhImg from "../../public/members/cutout/danh.png";
import giahuyImg from "../../public/members/cutout/giahuy.png";
import tanhungImg from "../../public/members/cutout/tanhung.png";
import nguyenhuongImg from "../../public/members/cutout/nguyenhuong.png";
import quanImg from "../../public/members/cutout/quan.png";
import duongtruongImg from "../../public/members/cutout/duongtruong.png";
import namImg from "../../public/members/cutout/nam.png";

// Hometown scenes — full-bleed pixel-art backdrops shown behind the selected
// member in the hero. Each is a 16:9 cityscape/landscape of that person's quê quán.
import bentreImg from "../../public/members/place/bentre.png";
import binhdinhImg from "../../public/members/place/binhdinh.png";
import binhduongImg from "../../public/members/place/binhduong.png";
import haiduongImg from "../../public/members/place/haiduong.png";
import kontumImg from "../../public/members/place/kontum.png";
import namdinhImg from "../../public/members/place/namdinh.png";
import nhatrangImg from "../../public/members/place/nhatrang.png";
import nhontrachImg from "../../public/members/place/nhontrach.png";
import ninhbinhImg from "../../public/members/place/ninhbinh.png";
import quangngaiImg from "../../public/members/place/quangngai.png";
import saigonImg from "../../public/members/place/saigon.png";

/**
 * Team roster data.
 *
 * Two naming layers on purpose:
 *  - `name` is kept ASCII — it feeds the pixel display fonts (Pixelify Sans /
 *    Silkscreen), which ship NO Vietnamese diacritic glyphs, so full names would
 *    render as missing-glyph boxes. Used by the TeamRoster "player cards".
 *  - `fullName` + the rest of the Vietnamese profile block (`title`, `hometown`,
 *    `hobbies`, `joinDate`, `motto`) carry full diacritics and are rendered in
 *    the `font-viet` (Be Vietnam Pro) face in the hero profile panel.
 *
 * `tint` drives that member's accent everywhere: stat-bar fill, role label, the
 * hero's feet-glow, and the selected-avatar frame.
 */
export type Skill = { label: string; value: number };

/**
 * Where this member stands in the hero lineup. (Legacy: the current hero is a
 * single-character viewer, not a plaza lineup, so `pose` is unused there — it is
 * kept for the data shape / future layouts. TeamRoster order follows the array.)
 */
export type Pose = {
  order?: number;
  scale?: number;
  x?: number;
  y?: number;
  z?: number;
  flip?: boolean;
};

export type Member = {
  slug: string;
  name: string; // ASCII short name (pixel fonts) — TeamRoster cards
  role: string; // English role — TeamRoster cards
  klass: string; // RPG-style "class"
  level: number;
  img: StaticImageData; // statically imported so Next derives the real
  // width/height — the image always renders at its true aspect ratio, even if
  // a future member's art isn't square. Swap the import, not a hardcoded size.
  tint: string; // CSS color for accents
  blurb: string;
  skills: Skill[];
  pose?: Pose; // standing position (legacy lineup field)

  // --- Profile block (hero panel; rendered in font-viet) ---
  //
  // ONLY PROSE IS `L`. `fullName`, `hometown` and `joinDate` stay plain strings
  // because they are proper nouns and a date: a person's name does not have an
  // English version, "Nam Định" is "Nam Định" in any language, and translating
  // either would be inventing a second identity for a real person. `title`,
  // `hobbies` and `motto` are prose and carry both languages.
  fullName: string; // Họ và tên — e.g. "Trần Đình Thiên Tân"
  title: L; // Chức vụ — e.g. "Founder"
  /**
   * Cấp bậc — the real engineering seniority shown on the member card, replacing
   * the old RPG `level`. LEFT UNSET ON PURPOSE: it is a fact about a specific
   * person that cannot be inferred from `title` ("Kỹ sư Full-Stack" says nothing
   * about Senior vs Junior), so the card simply omits the badge until it is
   * filled in rather than displaying a guess.
   */
  seniority?: string;
  hometown: string; // Quê quán — e.g. "Nam Định" (proper noun, not translated)
  hobbies: L; // Sở thích — e.g. "Lập trình, Thể thao, Âm nhạc"
  joinDate: string; // Ngày gia nhập công ty — e.g. "01/06/2026"
  motto: L; // Châm ngôn sống
  hometownImg: StaticImageData; // full-bleed backdrop of the member's hometown
  /** Optional member-specific soundtrack. Public API will eventually supply this. */
  audioUrl?: string;
};

/** Company identity shown in the hero (constant across members). */
export const COMPANY_NAME = "VIET NAM Z - DNA";

/**
 * ORPHANED — nothing renders this any more. It was the tagline under the wordmark
 * on `/doi-ngu` and was removed from `member.tsx`. Kept because it is written
 * copy rather than code (same convention as `story.ts`); delete it outright if
 * the line isn't coming back.
 */
export const COMPANY_QUOTE = "Cùng việt nam kiến tạo đội ngũ thế hệ trẻ mới";

// Founder is first so he is the default-selected character + leading avatar.
export const MEMBERS: Member[] = [
  {
    slug: "tan",
    name: "Tan",
    role: "CCO/CTO",
    klass: "Visionary",
    level: 50,
    img: tanImg,
    tint: "var(--color-gold)",
    blurb: "Sets the vision and reads three moves ahead of the market.",
    skills: [
      { label: "Vision", value: 96 },
      { label: "Leadership", value: 92 },
      { label: "Strategy", value: 90 },
      { label: "Negotiation", value: 88 },
    ],
    pose: { order: 0, y: 3.4 },
    fullName: "Trần Đình Thiên Tân",
    title: { vi: "CCO/CTO", en: "CCO/CTO" },
    hometown: "Nam Định",
    hobbies: { vi: "Lập trình, Thể Thao, Âm Nhạc", en: "Coding, Sport, Music" },
    joinDate: "01/06/2026",
    motto: { vi: "Sống là phải để lại tiếng thơm cho đời", en: "Live so that your name is worth remembering" },
    hometownImg: namdinhImg,
  },
  {
    slug: "binh",
    name: "Binh",
    role: "CEO",
    klass: "Guardian",
    level: 42,
    img: binhImg,
    tint: "var(--color-sunset)",
    blurb: "Holds the whole system together. Designs for the long game.",
    skills: [
      { label: "System Design", value: 96 },
      { label: "Backend", value: 91 },
      { label: "Mentoring", value: 84 },
      { label: "Code Review", value: 88 },
    ],
    pose: { order: 1, y: 2 },
    fullName: "Nguyễn Đức Bình",
    title: { vi: "CEO", en: "CEO" },
    hometown: "Hải Dương",
    hobbies: { vi: "Đọc sách, Cờ vua, Cà phê", en: "Reading, Chess, Coffee" },
    joinDate: "15/06/2026",
    motto: { vi: "Nền móng có vững thì nhà mới cao", en: "Build the foundation right and the house can go high" },
    hometownImg: haiduongImg,
  },
  {
    slug: "vi",
    name: "Vi",
    role: "Product Designer",
    klass: "Artisan",
    level: 38,
    img: viImg,
    tint: "var(--color-lotus)",
    blurb: "Turns rough ideas into pixel-perfect, joyful interfaces.",
    skills: [
      { label: "UI / UX", value: 95 },
      { label: "Illustration", value: 89 },
      { label: "Prototyping", value: 82 },
      { label: "Pixel Art", value: 93 },
    ],
    pose: { order: 2, y: 3.5 },
    fullName: "Lê Thảo Vi",
    title: { vi: "Product Designer", en: "Product Designer" },
    hometown: "Kon Tum",
    hobbies: { vi: "Vẽ tranh, Nhiếp ảnh, Cây cảnh", en: "Painting, Photography, Plants" },
    joinDate: "20/06/2026",
    motto: { vi: "Đơn giản là đỉnh cao của sự tinh tế", en: "Simplicity is the highest form of refinement" },
    hometownImg: kontumImg,
  },
  {
    slug: "giahuy",
    name: "Gia Huy",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: giahuyImg,
    tint: "var(--color-jade)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 3, y: 3.4 },
    fullName: "Phạm Gia Huy",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Nha Trang",
    hobbies: { vi: "Bóng đá, Du lịch, Đầu tư", en: "Football, Travel, Investing" },
    joinDate: "01/07/2026",
    motto: { vi: "Nhìn xa trông rộng, đi trước một bước", en: "See far, look wide, move one step ahead" },
    hometownImg: nhatrangImg,
  },
  {
    slug: "duong-truong",
    name: "Duong",
    role: "Full-Stack Engineer",
    klass: "Ranger",
    level: 36,
    img: duongtruongImg,
    tint: "var(--color-terracotta)",
    blurb: "Ships features end to end and hunts bugs across the stack.",
    skills: [
      { label: "Frontend", value: 92 },
      { label: "APIs", value: 86 },
      { label: "DevOps", value: 78 },
      { label: "Debugging", value: 90 },
    ],
    pose: { order: 4, y: 1.6 },
    fullName: "Trương Tùng Dương",
    title: { vi: "Kỹ sư Full-Stack", en: "Full-Stack Engineer" },
    hometown: "Quảng Ngãi",
    hobbies: { vi: "Leo núi, Game, Phim ảnh", en: "Climbing, Games, Film" },
    joinDate: "10/07/2026",
    motto: { vi: "Không gì là không thể, chỉ là chưa làm", en: "Nothing is impossible — only not attempted yet" },
    hometownImg: quangngaiImg,
  },
  {
    slug: "duong",
    name: "Duong",
    role: "Full-Stack Engineer",
    klass: "Ranger",
    level: 36,
    img: duongImg,
    tint: "var(--color-jade)",
    blurb: "Ships features end to end and hunts bugs across the stack.",
    skills: [
      { label: "Frontend", value: 92 },
      { label: "APIs", value: 86 },
      { label: "DevOps", value: 78 },
      { label: "Debugging", value: 90 },
    ],
    pose: { order: 5, y: 1.6 },
    fullName: "Đỗ Hải Dương",
    title: { vi: "Kỹ sư Full-Stack", en: "Full-Stack Engineer" },
    hometown: "Bình Dương",
    hobbies: { vi: "Chạy bộ, Nấu ăn, Podcast", en: "Running, Cooking, Podcasts" },
    joinDate: "15/07/2026",
    motto: { vi: "Mỗi ngày học thêm một điều mới", en: "Learn one new thing every day" },
    hometownImg: binhduongImg,
  },
  {
    slug: "danh",
    name: "Danh",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: danhImg,
    tint: "var(--color-lantern)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 6, y: 3.4 },
    fullName: "Võ Thành Danh",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Nhơn Trạch",
    hobbies: { vi: "Cầu lông, Lịch sử, Trà đạo", en: "Badminton, History, Tea" },
    joinDate: "01/08/2026",
    motto: { vi: "Kiên trì là chìa khóa của thành công", en: "Persistence is the key to everything" },
    hometownImg: nhontrachImg,
  },
  {
    slug: "nguyenhuong",
    name: "Nguyen Huong",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: nguyenhuongImg,
    tint: "var(--color-lotus)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 7, y: 3.4 },
    fullName: "Nguyễn Thu Hương",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Ninh Bình",
    hobbies: { vi: "Yoga, Viết lách, Làm bánh", en: "Yoga, Writing, Baking" },
    joinDate: "12/08/2026",
    motto: { vi: "Tâm sáng thì việc gì cũng thành", en: "With a clear heart, any work succeeds" },
    hometownImg: ninhbinhImg,
  },
  {
    slug: "tanhung",
    name: "Tan Hung",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: tanhungImg,
    tint: "var(--color-ember)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 8, y: 3.4 },
    fullName: "Lý Tấn Hùng",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Bình Định",
    hobbies: { vi: "Guitar, Phượt, Bóng rổ", en: "Guitar, Road trips, Basketball" },
    joinDate: "01/09/2026",
    motto: { vi: "Làm hết sức, chơi hết mình", en: "Work all the way, play all the way" },
    hometownImg: binhdinhImg,
  },
  {
    slug: "nam",
    name: "Nam",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: namImg,
    tint: "var(--color-clay)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 9, y: 3.4 },
    fullName: "Huỳnh Hoài Nam",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Bến Tre",
    hobbies: { vi: "Câu cá, Bơi lội, Làm vườn", en: "Fishing, Swimming, Gardening" },
    joinDate: "15/09/2026",
    motto: { vi: "Chậm mà chắc, chắc mà bền", en: "Slow but sure, sure but lasting" },
    hometownImg: bentreImg,
  },
  {
    slug: "quan",
    name: "Quan",
    role: "Strategy Lead",
    klass: "Strategist",
    level: 40,
    img: quanImg,
    tint: "var(--color-terracotta)",
    blurb: "Sets the roadmap and reads three moves ahead of the market.",
    skills: [
      { label: "Roadmapping", value: 91 },
      { label: "Analytics", value: 85 },
      { label: "Negotiation", value: 88 },
      { label: "Vision", value: 94 },
    ],
    pose: { order: 10, y: 3.4 },
    fullName: "Đặng Minh Quân",
    title: { vi: "Trưởng nhóm Chiến lược", en: "Strategy Lead" },
    hometown: "Sài Gòn",
    hobbies: { vi: "Cờ tướng, Sưu tầm, Thiền", en: "Chinese chess, Collecting, Meditation" },
    joinDate: "01/10/2026",
    motto: { vi: "Tĩnh để chế ngự động", en: "Stillness masters motion" },
    hometownImg: saigonImg,
  },
];

/**
 * Phòng ban — DERIVED FROM `title`, not stored per member.
 *
 * One map instead of eleven fields: the department is a pure function of the job
 * title here, so duplicating it onto every entry would just be eleven places to
 * forget when a title changes. Correct a department by editing this map.
 *
 * These were inferred from the titles, not supplied — check them against the real
 * org chart before this ships.
 */
export const DEPARTMENT_BY_TITLE: Record<string, L> = {
  CEO: { vi: "Ban điều hành", en: "Leadership" },
  "CCO/CTO": { vi: "Ban điều hành", en: "Leadership" },
  "Product Designer": { vi: "Thiết kế", en: "Design" },
  "Kỹ sư Full-Stack": { vi: "Kỹ thuật", en: "Engineering" },
  "Trưởng nhóm Chiến lược": { vi: "Chiến lược", en: "Strategy" },
};

/**
 * Department for a member's title, falling back to the title itself if unmapped.
 *
 * KEYED ON THE VIETNAMESE TITLE, which is the stable identifier — the English
 * one is a translation of it, so keying on whichever language happened to be
 * active would make the lookup miss on `/en` and silently print the job title
 * where the department belongs.
 */
export function departmentOf(title: L): L {
  return DEPARTMENT_BY_TITLE[title.vi] ?? title;
}
