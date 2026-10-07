import type { StaticImageData } from "next/image";

// Partner brand marks live in /public/partners/. They shipped as smooth raster
// logos on a SOLID WHITE background (not pixel art, not alpha-cut). Rather than
// flood-fill a cutout — which would leave a halo on the floral gradient or punch
// holes in its highlights — the showcase drops each logo onto a light CREAM
// stage and lets `mix-blend-multiply` melt the white away while preserving the
// brand colors + anti-aliasing perfectly (see `src/components/partners.tsx`).
// Swap the import (not a hardcoded size) to change a mark.
import piedteamLogo from "../../public/partners/piedteam.png";
import hoatheomuaLogo from "../../public/partners/hoatheomua.png";
import bmtLogo from "../../public/partners/bmt.png";

/**
 * Partner roster — drives the "Đối tác" section (see
 * `src/components/partners.tsx`). Edit copy here, not in the component.
 *
 * Like the team + product data, each partner carries a `tint` (a palette token
 * from the `@theme`/`:root` blocks in globals.css) that recolors its whole
 * card: the top accent bar, the brand chip, the category label and the stage
 * floor-glow. Vietnamese copy (`category`, `blurb`) renders in `font-viet` /
 * `font-pixel`, both diacritic-capable.
 *
 * NOTE (placeholder copy): `category`, `blurb` and `href` below are sensible
 * inferences from each brand's name + mark — please confirm/replace them with
 * the real positioning and website for each partner.
 */
export type Partner = {
  slug: string;
  name: string; // brand display name (chip + alt text)
  category: string; // eyebrow — industry / domain (Vietnamese)
  blurb: string; // one-line partnership note (Vietnamese)
  tint: string; // CSS palette-token reference, e.g. "var(--color-lotus)"
  logo: StaticImageData; // brand mark (white-bg raster → multiplied onto cream)
  href?: string; // optional website — renders a "Ghé thăm" link when present
};

export const PARTNERS: Partner[] = [
  {
    slug: "hoatheomua",
    name: "Hoa Theo Mùa",
    category: "Hoa tươi · Quà tặng",
    blurb:
      "Thương hiệu hoa tươi theo mùa — cùng VNZ đưa trải nghiệm đặt hoa lên nền tảng số, gần hơn với mỗi khoảnh khắc yêu thương.",
    tint: "var(--color-lotus)",
    logo: hoatheomuaLogo,
  },
  {
    slug: "bmt",
    name: "BMT Decor",
    category: "Nội thất · Trang trí",
    blurb:
      "Đối tác thiết kế & thi công nội thất — đồng hành cùng VNZ kiến tạo những không gian sống mang đậm dấu ấn riêng.",
    tint: "var(--color-gold)",
    logo: bmtLogo,
  },
  {
    slug: "piedteam",
    name: "PiedTeam",
    category: "Công nghệ · Sáng tạo",
    blurb:
      "Đội ngũ sáng tạo đồng hành cùng VNZ trên những sản phẩm số và giải pháp công nghệ thế hệ mới.",
    tint: "var(--color-jade)",
    logo: piedteamLogo,
  },
];
