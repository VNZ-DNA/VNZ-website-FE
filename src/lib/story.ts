/**
 * Brand-story content.
 *
 * ORPHANED — NOTHING IMPORTS THIS ANY MORE. It drove "Chương 02 · Con đường"
 * (`src/components/way.tsx`), and that chapter was cut from the page along with
 * its component. The copy is kept because it is written content, not code, and
 * is cheap to re-mount if the chapter ever comes back; delete the file outright
 * if it doesn't. `vision.tsx` reads its own copy inline and never depended on
 * this module.
 *
 * Same convention as the other data modules (members / products / partners /
 * careers): each entry carries a `tint` that is a palette-token reference from
 * the `@theme` block in globals.css. Components set it as the `--tint` inline CSS
 * var and consume it through arbitrary-value utilities
 * (`text-[color:var(--tint)]`, `bg-[color:var(--tint)]`), so a single field
 * recolours an entire card — accent bar, glyph frame, glow.
 *
 * All copy is Vietnamese and renders in `font-viet` (Be Vietnam Pro) or
 * `font-pixel` (VT323); both ship the Vietnamese subset. Never route this text
 * through `font-display` / `font-ui` — those pixel faces have no diacritics.
 */

/**
 * "Những dấu ấn chúng tôi ngưỡng mộ" — the global marks that set the bar, shown
 * as a horizontally-pinned strip. These are reference points VNZ looks up to,
 * not claims about VNZ. `stat` is deliberately loose ("Tỷ +", "~20 năm"): the
 * point is the order of magnitude, not an audited figure.
 */
export type Admired = {
  brand: string; // ASCII brand name — feeds the pixel display face
  stat: string; // headline figure
  label: string; // what the figure counts (Vietnamese)
  note: string; // why it is a landmark (Vietnamese)
  tint: string;
};

export const ADMIRED: Admired[] = [
  {
    brand: "Google",
    stat: "Tỷ +",
    label: "người tra cứu tri thức mỗi ngày",
    note: "Cánh cửa dẫn tới tri thức của cả nhân loại.",
    tint: "var(--color-gold)",
  },
  {
    brand: "Apple",
    stat: "~20 năm",
    label: "định hình cách ta chạm vào công nghệ",
    note: "iPhone tái định nghĩa thiết bị cá nhân.",
    tint: "var(--color-lotus)",
  },
  {
    brand: "Samsung",
    stat: "74",
    label: "quốc gia có mặt sản phẩm",
    note: "Công nghệ một quốc gia hiện diện toàn cầu.",
    tint: "var(--color-jade)",
  },
  {
    brand: "WeChat",
    stat: "1,4 tỷ",
    label: "người dùng mỗi tháng",
    note: "Nền tảng không thể thiếu trong đời sống.",
    tint: "var(--color-sunset)",
  },
];

/** Who the technology serves — "một hành trình, nhiều mắt xích". */
export type Pillar = {
  no: string;
  title: string;
  desc: string;
  tint: string;
};

export const PILLARS: Pillar[] = [
  {
    no: "01",
    title: "Doanh nghiệp",
    desc: "Đồng hành cùng doanh nghiệp trên hành trình lớn lên — vận hành hiệu quả hơn, nâng cao năng lực cạnh tranh.",
    tint: "var(--color-sunset)",
  },
  {
    no: "02",
    title: "Người dùng",
    desc: "Phát triển những sản phẩm số thuận tiện hơn, nâng cao chất lượng cuộc sống cho hàng triệu người.",
    tint: "var(--color-jade)",
  },
  {
    no: "03",
    title: "Khu vực công",
    desc: "Xây dựng các giải pháp quản lý hiện đại để tổ chức phục vụ cộng đồng tốt hơn.",
    tint: "var(--color-lotus)",
  },
];

/** The four principles VNZ won't trade. `glyph` is ASCII (safe in any face). */
export type Value = {
  glyph: string;
  title: string;
  desc: string;
  tint: string;
};

export const VALUES: Value[] = [
  {
    glyph: "✦",
    title: "Học hỏi",
    desc: "Tiếp cận tri thức toàn cầu gần như không khoảng cách, học từ những mô hình thành công của thế giới.",
    tint: "var(--color-gold)",
  },
  {
    glyph: "◈",
    title: "Đổi mới",
    desc: "Tinh thần khởi nghiệp giúp chúng tôi dám thử nghiệm và nhanh chóng thích nghi với thị trường.",
    tint: "var(--color-jade)",
  },
  {
    glyph: "❖",
    title: "Chính trực",
    desc: "Trung thực, tinh thần phụng sự và cam kết đồng hành là lợi thế cạnh tranh bền vững nhất.",
    tint: "var(--color-lotus)",
  },
  {
    glyph: "▲",
    title: "Giá trị thực",
    desc: "Không chạy theo công nghệ vì công nghệ — chọn công nghệ phù hợp để tạo ra giá trị thật mỗi ngày.",
    tint: "var(--color-ember)",
  },
];
