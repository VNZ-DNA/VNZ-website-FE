/**
 * Shared primitives for the homepage story sections.
 *
 * Every section between the hero and the footer is a "chapter" of one continuous
 * narrative, so the pieces that make them read as one document live here rather
 * than being re-typed per section:
 *
 *  · `Chapter`  — the gold section eyebrow ("Đội ngũ"). Numbering was removed:
 *                 the labels read as a spine without "Chương 0X" in front, and the
 *                 numbers went stale every time a chapter moved to its own route.
 *  · `Headline` — the section title + optional lead paragraph under a label.
 *  · `ActGap`   — breathing room between full-viewport beats.
 *  · `Motes`    — the ambient rising-ember field.
 *  · `Kinetic`  — word-by-word scroll-scrubbed type.
 *
 * COLOURS ASSUME THE IVORY SURFACE. `Chapter` and `Headline` are used only by the
 * light chapters (Dấu ấn VNZ / Đội ngũ / Đối tác / Tuyển dụng), which sit on
 * `.paper` — so titles are `text-ink` and eyebrows are `text-clay`, not gold: gold
 * (#f0b34a) measures 1.87:1 on ivory and was once the reason three chapter
 * headings rendered nearly invisible. The dark Câu chuyện act deliberately does
 * NOT use these; it sets its own type inline. Don't reuse them on a dark panel
 * without overriding the colours.
 *
 * All of them are server components: the motion comes from the native CSS
 * scroll-driven animation primitives in globals.css (`.s-*`, `.mote`,
 * `.s-words`), never from client JS.
 */

/* Pre-baked mote field — no Math.random, so SSR and client markup match. */
const MOTES = [
  { left: "5%", size: 6, dur: "17s", delay: "0s", mx: "26px", c: "var(--color-gold)" },
  { left: "14%", size: 4, dur: "21s", delay: "3s", mx: "-18px", c: "var(--color-sunset)" },
  { left: "23%", size: 7, dur: "15s", delay: "1.5s", mx: "34px", c: "var(--color-ember)" },
  { left: "32%", size: 3, dur: "24s", delay: "5s", mx: "-24px", c: "var(--color-gold)" },
  { left: "41%", size: 5, dur: "18s", delay: "2s", mx: "20px", c: "var(--color-lotus)" },
  { left: "50%", size: 4, dur: "22s", delay: "6s", mx: "-30px", c: "var(--color-gold)" },
  { left: "59%", size: 6, dur: "16s", delay: "0.8s", mx: "28px", c: "var(--color-sunset)" },
  { left: "68%", size: 3, dur: "25s", delay: "4s", mx: "-16px", c: "var(--color-gold)" },
  { left: "77%", size: 7, dur: "14s", delay: "2.6s", mx: "36px", c: "var(--color-ember)" },
  { left: "86%", size: 4, dur: "20s", delay: "5.5s", mx: "-22px", c: "var(--color-gold)" },
  { left: "94%", size: 5, dur: "19s", delay: "1.2s", mx: "24px", c: "var(--color-lotus)" },
];

/* Pre-baked meteor field — same rule as MOTES: no Math.random, or the server
   and client would render different values and React would discard the subtree
   on hydration.
   `top`/`left` are where the streak STARTS, so most sit above and to the left of
   the frame and fly in from off-screen.

   ANGLES ARE ~45°, NOT ~215°. In CSS a positive angle turns CLOCKWISE from east,
   so 45° points down-and-right and 215° points UP-and-left — the streaks climbed
   off the top of the screen on the first pass. The couple of degrees of scatter
   is deliberate: a field where every streak is exactly parallel reads as a
   texture rather than as motion. */
const METEORS = [
  { top: "-12%", left: "-6%", len: 90, angle: 44, travel: 1150, dur: "5.4s", delay: "0s", op: 0.55 },
  { top: "-20%", left: "14%", len: 120, angle: 46, travel: 1320, dur: "7.1s", delay: "1.8s", op: 0.45 },
  { top: "-6%", left: "30%", len: 70, angle: 43, travel: 980, dur: "6.2s", delay: "0.9s", op: 0.6 },
  { top: "-16%", left: "-18%", len: 140, angle: 47, travel: 1450, dur: "8.3s", delay: "3.2s", op: 0.4 },
  { top: "2%", left: "46%", len: 80, angle: 45, travel: 1050, dur: "5.9s", delay: "4.6s", op: 0.5 },
  { top: "-24%", left: "36%", len: 100, angle: 44, travel: 1240, dur: "6.8s", delay: "2.4s", op: 0.5 },
  { top: "14%", left: "8%", len: 60, angle: 46, travel: 860, dur: "5.1s", delay: "6.1s", op: 0.45 },
  { top: "-9%", left: "58%", len: 110, angle: 43, travel: 1300, dur: "7.6s", delay: "5.3s", op: 0.35 },
  { top: "-28%", left: "62%", len: 130, angle: 45, travel: 1380, dur: "8.9s", delay: "1.1s", op: 0.4 },
  { top: "8%", left: "24%", len: 75, angle: 47, travel: 940, dur: "6.5s", delay: "7.4s", op: 0.5 },
];

/**
 * Falling meteors. Absolute overlay, decorative, CSS-only.
 *
 * Pairs with `Motes` rather than replacing it: motes drift up warm and slow,
 * meteors cut down cold and fast. Both are `-z-[1]`, so they sit above the art
 * plate and below the copy.
 *
 * The streaks are cream and only read on a DARK ground, so this belongs to the
 * Câu chuyện act and not to the ivory chapters below it — on `.paper` they are
 * invisible. Pass `color` a dark token if it is ever needed on a light surface.
 */
export function Meteors({ color = "var(--color-cream)" }: { color?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden"
    >
      {METEORS.map((m, i) => (
        <span
          key={i}
          className="meteor"
          style={{
            top: m.top,
            left: m.left,
            animationDuration: m.dur,
            animationDelay: m.delay,
            ["--len" as string]: `${m.len}px`,
            ["--angle" as string]: `${m.angle}deg`,
            ["--travel" as string]: `${m.travel}px`,
            ["--mto" as string]: m.op,
            ["--mtc" as string]: color,
          }}
        />
      ))}
    </div>
  );
}

/** Ambient rising embers. Absolute overlay; sits just behind the copy. */
export function Motes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden"
    >
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: m.left,
            width: m.size,
            height: m.size,
            animationDuration: m.dur,
            animationDelay: m.delay,
            ["--mx" as string]: m.mx,
            ["--mc" as string]: m.c,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Chapter label. `no` is the chapter number, `label` its name. The flanking
 * hairlines are dropped in `align="left"` so it can also sit above a left-aligned
 * section header without a stray rule running off the grid.
 */
export function Chapter({
  label,
  align = "center",
}: {
  label: string;
  align?: "center" | "left";
}) {
  const rule = <span aria-hidden className="h-px w-8 bg-clay/45 sm:w-12" />;
  return (
    <span className="s-fade inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-clay sm:text-base">
      {align === "center" && rule}
      {label}
      {rule}
    </span>
  );
}

/**
 * Standard section header — chapter label, title, optional lead. Used by the
 * grid-based chapters (Sản phẩm / Đội ngũ / Đối tác / Tuyển dụng) so they all
 * open at the same rhythm; the cinematic beats inside `#story` set their own type.
 */
export function Headline({
  label,
  title,
  lead,
}: {
  label: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <Chapter label={label} />
      <h2 className="s-rise mt-5 font-pixel text-[clamp(2rem,6vw,4.25rem)] uppercase leading-[0.9] text-ink">
        {title}
      </h2>
      {lead ? (
        <p className="s-fade mx-auto mt-6 max-w-2xl font-viet text-base font-light leading-relaxed text-ink-soft sm:text-lg">
          {lead}
        </p>
      ) : null}
    </header>
  );
}

/**
 * Fade spacer between story beats — a hairline that dissolves to both sides with
 * a faint glowing node at centre, so each full-screen beat gets room to breathe
 * instead of butting straight into the next. Purely decorative and static.
 */
export function ActGap() {
  return (
    <div aria-hidden className="relative h-[clamp(4rem,13vh,9rem)] w-full">
      <span className="absolute left-1/2 top-1/2 h-px w-[min(88%,38rem)] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cream/15 to-transparent" />
      <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay/45 [box-shadow:0_0_10px_var(--color-gold)]" />
    </div>
  );
}

/** Word-by-word reveal, scroll-scrubbed via `.s-words` in globals.css. */
export function Kinetic({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`s-words ${className}`}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} style={{ ["--i" as string]: i }}>
          {word}
        </span>
      ))}
    </span>
  );
}
