
import { StoryTruth } from "@/components/story-truth";
import type { Locale } from "@/lib/i18n";

/**
 * Chương 01 · Câu chuyện — VNZ's founding argument, told as three full-viewport
 * beats rather than a wall of "About us" copy:
 *
 *   1. SỰ THẬT   — "Tạo ra công nghệ ≠ Sở hữu công nghệ".
 *   2. CÂU HỎI   — why is there no Vietnamese mark yet?
 *   3. CÁI TÊN   — and so: Vietnam Z-DNA.
 *
 * There used to be a fourth beat ahead of these — a pinned "Khởi nguồn từ một câu
 * hỏi" title card over a slowly turning Đông Sơn drum. It was cut: it spent a
 * whole viewport restating what beat 1 then proves, and the chapter now opens on
 * the ≠ instead. The chapter label moved down onto beat 1 with it, and the
 * `.a1-*` scroll primitives it drove are gone from globals.css.
 *
 * ALL THREE BEATS NOW LIVE IN `<StoryTruth>`, which is why this file is a shell.
 * They are no longer three sections stacked in the document: they are one pinned,
 * scroll-scrubbed act, because each beat's art has to move while the PREVIOUS
 * beat is still on stage (the columns arrive during sự thật, the map and skyline
 * during câu hỏi). Split back into sections and every one of those assets renders
 * twice across the handoff. `story-truth.tsx` documents the full sequence.
 *
 * THIS CHAPTER IS THE PAGE'S ONE EXCEPTION to the "no client JS" rule. Every
 * other chapter is a server component whose reveals are native CSS scroll-driven
 * animations (`.s-*` in globals.css); this one runs GSAP ScrollTrigger. Keep new
 * chapters on the CSS primitives unless they genuinely need hand-ordered timing.
 *
 * What is left here: the chapter-wide scanline wash and the trailing `ActGap`.
 */
export function Story({ locale }: { locale: Locale }) {
  return (
    <section id="story" className="relative isolate w-full overflow-x-clip bg-ink">
      {/* Faint scanlines over the whole chapter. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.05)_0_1px,transparent_1px_3px)]"
      />

      <StoryTruth locale={locale} />
    </section>
  );
}
