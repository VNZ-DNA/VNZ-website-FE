"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PixelDrift,
  type PixelDriftHandle,
} from "@/components/bits/pixel-drift";
import { Meteors, Motes } from "@/components/story-kit";
import { STORY } from "@/lib/dictionary";
import { t, type Locale } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

/**
 * Chương 01 · Câu chuyện — ALL THREE BEATS, as one pinned, scroll-scrubbed act.
 *
 * THE ONLY NON-CSS PART OF THE PAGE. Every other reveal in the story is a native
 * scroll-driven animation (`.s-*` in globals.css) on a server component. This act
 * needed a hand-ordered entrance and two art handoffs that overlap across beat
 * boundaries, so it runs a GSAP ScrollTrigger timeline and is a client component.
 * Don't "tidy" it back to `.s-*` classes — those cannot express the order below,
 * where the ≠ lands AFTER both phrases it separates, nor art that has to arrive
 * during the beat before the one it belongs to.
 *
 * WHY ALL THREE BEATS ARE MERGED. The bronze columns belong to câu hỏi and the
 * map/skyline belong to cái tên, but each has to move WHILE the previous beat is
 * still on stage. Any structure that keeps them in separate sections renders the
 * art twice across each handoff — the animated copy scrolling away as the static
 * copy scrolls in, the two visibly sliding past each other. One pinned stage is
 * what makes each asset a single set of pixels that arrives once. The câu-hỏi and
 * cái-tên markup is otherwise unchanged from when it lived in `story.tsx`; only
 * their `.s-*` classes became `data-q` / `data-n` steps.
 *
 * EVERYTHING IS SCRUBBED, NOTHING IS ON A TIMER. The stage holds still at the top
 * of the viewport while the page scrolls through `RUNWAY`, and every phase is
 * tied to scroll POSITION — scroll down and it plays forward, scroll up and it
 * reassembles exactly.
 *
 *   REVEAL  0–7   eight steps, in `data-r` order
 *   HOLD    8     the finished sự-thật beat sits still and readable
 *   SWAP    9     `data-exit` shrinks + fades out, and AT THE SAME TIME the
 *                 columns fly in from both edges
 *   ASK     11    the câu-hỏi lines rise between the columns
 *   CLEAR   14.4  columns retreat back off both edges, and AT THE SAME TIME the
 *                 câu-hỏi block flies UP and fades
 *   RISE    15.6  the gold skyline climbs in from below the bottom edge
 *   MAP     16.2  the dotted Việt Nam map scales up out of nothing
 *   NAME    18.2  "Đó cũng là ý nghĩa cái tên" → "Vietnam Z-DNA" → the body copy
 *
 * Pinning is plain CSS `position: sticky`, NOT ScrollTrigger's `pin`. Two
 * reasons: `pin` swaps the element to `position: fixed`, which misbehaves inside
 * the chapter's `overflow-x-clip` ancestor; and sticky leaves native momentum
 * scrolling completely untouched, which `page.tsx` asks for in as many words.
 * We drive the tween, we never drive the scroll.
 *
 * REVEAL ORDER IS DATA, NOT DOM ORDER — the point of `data-r`. The ≠ sits between
 * the two phrases in the markup (it has to, for layout) but animates seventh, so
 * the eye reads "Tạo ra công nghệ" and "Sở hữu công nghệ" as complete thoughts
 * before the ≠ slams in and sets them against each other:
 *
 *   1 Câu chuyện VNZ · 2 Một sự thật… · 3 Tạo ra · 4 công nghệ
 *   5 Sở hữu · 6 công nghệ · 7 ≠ · 8 đoạn kết
 *
 * Renumber `data-r` to re-sequence; nothing here reads document order. The line
 * breaks inside each phrase used to be `<br />` — they are `block` spans now,
 * because "Tạo ra" and "công nghệ" animate separately and a `<br />` gives
 * nothing to tween.
 *
 * TWO-LAYER ART WRAPPERS. `[data-map]` and the columns carry their resting
 * opacity on an INNER div, because GSAP animates the outer one's opacity to 1 —
 * put the responsive `opacity-40 sm:opacity-70` on the animated element and the
 * tween would erase the phone-specific dimming.
 *
 * SSR, no-JS and reduced motion all get the SAME plain layout: the markup renders
 * FINISHED (no opacity-0 in any className, art at rest) and the wrapper renders
 * one viewport tall. The scroll runway is added from JS and only once we've
 * decided to animate — so a reader without JS never scrolls through dead space,
 * and `prefers-reduced-motion` collapses to a normal, visible section.
 */

/**
 * Scroll distance the stage stays stuck for, on top of its own viewport.
 * The timeline runs ~25.5 units wide, so this is roughly 20svh of scrolling per
 * unit. This is THE dial for the whole act's pace — raise it for a slower, more
 * deliberate read, lower it if the chapter starts to feel like a wall.
 *
 * The LAST 100svh of this is the handoff window, where the stage shrinks and
 * chương 02 slides up over it. `way.tsx` pulls itself up by exactly that much;
 * the two numbers are a pair.
 */
const RUNWAY = "500svh";

/**
 * The bronze columns that framed the câu-hỏi beat are TEMPORARILY HIDDEN.
 *
 * Flip this back to `true` to restore them — that is the whole switch, and it is
 * why they are behind a flag rather than deleted. Everything they need is still
 * here: the markup below, the SWAP phase that flies them in from both edges, and
 * the CLEAR phase that retreats them.
 *
 * NOTHING ELSE HAS TO CHANGE when this is false. Every tween that touches them is
 * already guarded (`if (colL)` / `if (col)`) because `q()` returns null for an
 * absent node, and the beats after them are scheduled at absolute timeline
 * positions (`ASK = SWAP + 2`) rather than relative to the columns' arrival — so
 * the act keeps its pacing with an empty stage instead of collapsing the gap.
 * Don't "clean up" the guards while this is off; they are what makes the flag
 * work.
 */
const SHOW_COLUMNS = false;

export function StoryTruth({ locale }: { locale: Locale }) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  /** The name's particle field. See the DRIFT phase in the timeline below. */
  const drift = useRef<PixelDriftHandle>(null);

  useLayoutEffect(() => {
    const wrapEl = wrap.current;
    const stageEl = stage.current;
    if (!wrapEl || !stageEl) return;

    // Leave the finished, one-viewport layout alone for reduced-motion users.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Add the scroll runway only now — see the SSR note above.
    wrapEl.style.height = `calc(100svh + ${RUNWAY})`;

    const ctx = gsap.context(() => {
      const q = <T extends HTMLElement>(sel: string) =>
        stageEl.querySelector<T>(sel);

      const steps = gsap.utils
        .toArray<HTMLElement>("[data-r]")
        .sort((a, b) => Number(a.dataset.r) - Number(b.dataset.r));
      if (!steps.length) return;

      const neq = q("[data-neq]");
      const exit = q("[data-exit]");
      const colL = q("[data-col='l']");
      const colR = q("[data-col='r']");
      const asks = gsap.utils.toArray<HTMLElement>("[data-q]");
      const askWrap = q("[data-qwrap]");
      const city = q("[data-city]");
      const map = q("[data-map]");
      const nameBg = q("[data-namebg]");
      const names = gsap.utils.toArray<HTMLElement>("[data-n]");

      // ── Initial states ──
      gsap.set(steps, { opacity: 0, y: 30 });
      if (neq) gsap.set(neq, { y: 0, scale: 0.35 });
      // Columns park just past their own edge of the screen. The right column is
      // already mirrored by `-scale-x-100`, so a POSITIVE xPercent still walks it
      // off the right edge — the flip lives on the inner image wrapper.
      if (colL) gsap.set(colL, { xPercent: -135, opacity: 0 });
      if (colR) gsap.set(colR, { xPercent: 135, opacity: 0 });
      if (asks.length) gsap.set(asks, { opacity: 0, y: 26 });
      if (city) gsap.set(city, { yPercent: 100, opacity: 0 });
      if (map) gsap.set(map, { scale: 0.55, opacity: 0 });
      if (nameBg) gsap.set(nameBg, { opacity: 0 });
      if (names.length) gsap.set(names, { opacity: 0, y: 34 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      // ── REVEAL ──
      steps.forEach((step, i) => {
        if (step === neq) {
          tl.to(step, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2.4)" }, i);
        } else {
          tl.to(step, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, i);
        }
      });

      // ── HOLD ── the completed beat is readable before anything moves.
      const HOLD = steps.length;
      tl.to({}, { duration: 1 }, HOLD);

      // ── SWAP ── truth shrinks away as the columns arrive. Same start position
      // on purpose: "cùng lúc" — they cross over each other.
      const SWAP = HOLD + 1;
      if (exit) {
        tl.to(exit, { scale: 0.55, opacity: 0, ease: "power2.in", duration: 2 }, SWAP);
      }
      for (const col of [colL, colR]) {
        if (col) {
          tl.to(col, { xPercent: 0, opacity: 0.8, ease: "power3.out", duration: 2.2 }, SWAP);
        }
      }

      // ── ASK ── the question rises once the frame is standing.
      const ASK = SWAP + 2;
      asks.forEach((line, i) => {
        tl.to(line, { opacity: 1, y: 0, ease: "power2.out", duration: 0.8 }, ASK + i * 0.35);
      });

      // ── CLEAR ── columns retreat the way they came in, and the question lifts
      // out of frame at the same moment, leaving an empty stage for the name.
      const CLEAR = ASK + 3.4;
      if (colL) {
        tl.to(colL, { xPercent: -135, opacity: 0, ease: "power2.in", duration: 1.8 }, CLEAR);
      }
      if (colR) {
        tl.to(colR, { xPercent: 135, opacity: 0, ease: "power2.in", duration: 1.8 }, CLEAR);
      }
      if (askWrap) {
        tl.to(askWrap, { y: -140, opacity: 0, ease: "power2.in", duration: 1.5 }, CLEAR);
      }

      // ── RISE ── the skyline climbs in from under the bottom edge.
      const RISE = CLEAR + 1.2;
      if (city) {
        tl.to(city, { yPercent: 0, opacity: 1, ease: "power2.out", duration: 2 }, RISE);
      }

      // ── MAP ── the map grows out of nothing behind where the name will land.
      const MAP = RISE + 0.6;
      if (map) {
        tl.to(map, { scale: 1, opacity: 1, ease: "power2.out", duration: 2.2 }, MAP);
      }
      if (nameBg) {
        tl.to(nameBg, { opacity: 1, ease: "none", duration: 2 }, MAP);
      }

      // ── NAME ── the payoff.
      const NAME = MAP + 2;
      /** Where the stage begins pulling back. See the SHRINK block below. */
      const SHRINK = 21;
      names.forEach((line, i) => {
        tl.to(line, { opacity: 1, y: 0, ease: "power2.out", duration: 0.9 }, NAME + i * 0.5);
      });

      // ── DRIFT ── the wordmark itself doesn't fade in, it ASSEMBLES: `PixelDrift`
      // samples the glyphs and flies the pixels in from a ring outside the frame.
      //
      // It is scrubbed like everything else on this stage, which is the whole
      // reason the component was rewritten to take an external 0→1 (see the
      // header of `bits/pixel-drift.tsx`). The version it was ported from fires
      // on an IntersectionObserver and eases on its own clock — on a PINNED act
      // that observer trips the moment the chapter reaches the top of the
      // viewport, five viewports of scrolling before this beat, and a timer
      // can't run backwards when the reader scrolls up.
      //
      // IT HAS TO BE FINISHED BY THE TAIL HOLD BELOW (NAME + 1.9), which is why
      // the duration is 1.4 and not longer. Two reasons, and they compound:
      // the cursor is ignored while the field is still assembling, so a drift
      // that ran into the hold would leave the name interactive only while the
      // stage is already shrinking away; and the hold exists to let the payoff
      // be READ, which it can't be if it's still arriving. So the assembly runs
      // across the h3's own fade and lands with the body copy at NAME + 1.9.
      const drifted = { v: 0 };
      tl.to(
        drifted,
        {
          v: 1,
          ease: "power2.out",
          duration: 1.4,
          onUpdate: () => drift.current?.setProgress(drifted.v),
        },
        NAME + 0.5,
      );

      // Tail hold so the name is readable before the stage starts to leave.
      tl.to({}, { duration: 1 }, NAME + 1.9);

      // ── SHRINK ── the whole stage pulls back into a card while chương 02
      // rides up over it. This scales the STAGE itself, not its contents, so the
      // art, the type and the ground all go together as one rectangle.
      //
      // The timing is tied to `way.tsx`'s `-mt-[100svh]`: that pulls the next
      // section up by exactly one viewport, so the last ~5 units of this
      // timeline are the window where it is sliding across. Change one and the
      // other has to move with it, or the card finishes shrinking to nothing
      // long before anything covers it.
      tl.to(
        stageEl,
        { scale: 0.82, borderRadius: 28, ease: "power2.inOut", duration: 4.5 },
        SHRINK,
      );
    }, stage);

    return () => {
      ctx.revert();
      wrapEl.style.height = "";
    };
  }, []);

  return (
    <div ref={wrap} className="relative h-svh">
      {/* No seam guard at either end any more. This act runs on `ink`, the hero
          dusk-fades to the same ink, and every chapter below is dark too — there
          is no colour change left for a join to show. The gradient hems that used
          to sit here (an ink crown up top, then a fade-to-white at the bottom)
          both existed only to bridge into white, and a fade-to-white now reads as
          a bright band in the middle of a dark page. */}
      <div
        ref={stage}
        className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-5 py-24 text-center sm:px-8"
      >
        {/* ── Art layer ── paints solid `ink` over the act. This used to be
            `paper`; going dark is what lets the act butt straight against the
            hero with no seam, and it is also the ground all this pixel art was
            drawn for — the source plates (`about2.png`, `about3.png`) are dark
            navy, so the gold reads the way it was meant to.
            (The two lotus corner pieces that used to open the act are gone.) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ink"
        >
          {/* Bronze columns — currently off; see `SHOW_COLUMNS` above.
              Held at 0.8 once landed: they are the brightest art on the page and
              at full strength they out-shout the question they frame.
              column.png's cloud capital fans RIGHT by nature, so the left one
              stays natural and the right one is mirrored. */}
          {SHOW_COLUMNS ? (
            <>
              <div
                data-col="l"
                className="absolute -left-[7%] top-0 aspect-[739/1495] h-full opacity-80 max-sm:h-auto max-sm:w-[30vw]"
              >
                <Image
                  src="/general/about3/column-mono.png"
                  alt=""
                  fill
                  unoptimized
                  sizes="30vw"
                  className="pixelated object-contain object-left-top"
                />
              </div>
              <div
                data-col="r"
                className="absolute -right-[7%] top-0 aspect-[739/1495] h-full -scale-x-100 opacity-80 max-sm:h-auto max-sm:w-[30vw]"
              >
                <Image
                  src="/general/about3/column-mono.png"
                  alt=""
                  fill
                  unoptimized
                  sizes="30vw"
                  className="pixelated object-contain object-left-top"
                />
              </div>
            </>
          ) : null}

          {/* ══ BACKGROUND ART ══
              The map and the skyline are SET INTO THE GROUND, not laid on top of
              it. Both used to sit at or near full strength and read as two heavy
              objects competing with the type — the client called it exactly that.
              Three things push them back, and they work together:

                1. LOW OPACITY. The map dropped from 40/70% to 16/26%, the
                   skyline to 30%.
                2. `saturate-[.55] contrast-[.85]`. Opacity alone leaves the gold
                   still reading as gold, just fainter; pulling saturation and
                   contrast down moves it toward the ink temperature so the eye
                   files it as ground rather than as an object.
                3. A GRADIENT MASK ON EACH. This is what actually sells it — art
                   that stops at a hard edge always reads as a pasted rectangle
                   no matter how faint. The map dissolves at top and bottom, the
                   skyline dissolves upward out of the floor.

              NO BLUR, deliberately: every asset here is pixel art rendered with
              `image-rendering: pixelated`, and blurring it fights the entire
              visual language of the site.

              ALL OF IT LIVES ON THE INNER DIV. GSAP animates the OUTER
              `data-map` / `data-city` element's opacity to 1, so anything put
              there is erased the moment the tween runs — which is precisely how
              the skyline ended up at full strength. If these need to go fainter
              still, the numbers below are the dial; don't move them outward. */}
          <div
            data-map
            className="absolute left-1/2 top-[5%] aspect-[962/1377] h-[58%] -translate-x-1/2"
          >
            <div className="relative h-full w-full opacity-[0.16] saturate-[.55] contrast-[.85] [mask-image:linear-gradient(to_bottom,transparent,#000_22%,#000_72%,transparent)] sm:opacity-[0.26]">
              <Image
                src="/general/about4/vietnam-mono.png"
                alt=""
                fill
                unoptimized
                sizes="(max-width:640px) 50vw, 28vw"
                className="pixelated object-contain"
              />
            </div>
          </div>

          {/* Gold skyline — rises in from under the bottom edge, then settles
              into the floor rather than standing on it. */}
          <div
            data-city
            className="absolute bottom-0 left-0 aspect-[2138/589] w-full"
          >
            <div className="relative h-full w-full opacity-30 saturate-[.55] contrast-[.85] [mask-image:linear-gradient(to_top,#000_18%,transparent)]">
              <Image
                src="/general/about4/city-mono.png"
                alt=""
                fill
                unoptimized
                sizes="100vw"
                className="pixelated object-contain object-bottom"
              />
            </div>
          </div>

          {/* `data-namebg` used to hold an ink radial scrim here, to push the map
              back behind the name. It is gone: at any strength that actually knocked
              the map down it read as a dark halo sitting on the artwork, which is
              worse than the overlap it was fixing. The element stays because the
              timeline still fades it in with the map — see the MAP phase — and it
              is the hook for whatever replaces the scrim. */}
          <div data-namebg className="absolute inset-0" />
        </div>
        <Meteors />
        <Motes />

        {/* ══ Beat 1 · Sự thật. Leaves as one group, chapter label included. ══ */}
        <div data-exit className="flex flex-col items-center">
          <span
            data-r="1"
            className="inline-flex items-center gap-3 font-pixel text-sm uppercase tracking-[0.35em] text-gold sm:text-base"
          >
            <span aria-hidden className="h-px w-8 bg-gold/40 sm:w-12" />
            {t(STORY.chapter, locale)}
            <span aria-hidden className="h-px w-8 bg-gold/40 sm:w-12" />
          </span>

          <p
            data-r="2"
            className="mt-7 font-pixel text-sm uppercase tracking-[0.4em] text-cream/70 sm:text-base"
          >
            {t(STORY.truthLabel, locale)}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 font-pixel uppercase leading-[0.82] sm:flex-row sm:gap-7">
            <span className="text-[clamp(2.5rem,8.5vw,7.5rem)] text-cream">
              <span data-r="3" className="block">
                {t(STORY.createLine1, locale)}
              </span>
              <span data-r="4" className="block">
                {t(STORY.createLine2, locale)}
              </span>
            </span>

            <span
              data-r="7"
              data-neq
              className="text-[clamp(3.5rem,12vw,11rem)] leading-none text-ember [text-shadow:0_0_50px_rgba(232,84,31,0.65)]"
            >
              ≠
            </span>

            <span className="text-[clamp(2.5rem,8.5vw,7.5rem)] text-terracotta">
              <span data-r="5" className="block">
                {t(STORY.ownLine1, locale)}
              </span>
              <span data-r="6" className="block">
                {t(STORY.ownLine2, locale)}
              </span>
            </span>
          </div>

          <p
            data-r="8"
            className="mx-auto mt-12 max-w-2xl font-viet text-base font-light leading-relaxed text-cream/70 sm:text-lg"
          >
            {t(STORY.truthBody, locale)}
          </p>
        </div>

        {/* ══ Beat 2 · Câu hỏi. Absolutely positioned so it occupies the same
            optical centre beat 1 is vacating, instead of being laid out below it
            and dragging the stage taller than the viewport. ══ */}
        <div
          data-qwrap
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 sm:px-8 lg:px-[18vw]"
        >
          <span
            data-q
            aria-hidden
            className="font-pixel text-7xl leading-none text-gold/40 sm:text-8xl"
          >
            “
          </span>
          <p className="-mt-4 mx-auto max-w-4xl font-pixel uppercase leading-[0.85] text-cream sm:-mt-6">
            <span data-q className="block text-[clamp(1.6rem,4.6vw,3.5rem)]">
              {t(STORY.questionLine1, locale)}
            </span>
            <span data-q className="block text-[clamp(1.6rem,4.6vw,3.5rem)]">
              {t(STORY.questionLine2, locale)}
            </span>
            {/* The drop shadow was a WHITE ridge for the paper ground; on ink it
                has to be a dark one or the type grows a glowing outline. */}
            <span
              data-q
              className="mt-4 block text-[clamp(2.25rem,7vw,6rem)] leading-[0.85] text-sunset [text-shadow:0_2px_0_rgba(0,0,0,0.55)]"
            >
              {t(STORY.questionAccentA, locale)}{" "}
              <span className="whitespace-nowrap">
                {t(STORY.questionAccentB, locale)}
              </span>
            </span>
          </p>
          <p
            data-q
            className="mt-12 font-pixel text-sm uppercase tracking-[0.35em] text-gold"
          >
            {t(STORY.questionFooter, locale)}
          </p>
        </div>

        {/* ══ Beat 3 · Cái tên. Same overlay trick; `pb-44` keeps the copy clear
            of the skyline the way the standalone beat's padding used to. ══ */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 pb-44 pt-24 sm:px-8 sm:pb-52 sm:pt-32">
          <span
            data-n
            className="font-pixel text-sm uppercase tracking-[0.4em] text-cream/70"
          >
            {t(STORY.nameLabel, locale)}
          </span>
          {/* NO `filter:` ON THIS ELEMENT. It carried a
              `drop-shadow(0 6px 30px rgba(232,84,31,.4))` glow, which rendered as
              a blurred RECTANGLE the size of the h3 box instead of hugging the
              glyphs: Chrome feeds the element's whole background box to the
              filter when the background is `background-clip: text` with a
              transparent colour. Over the dark ground that box read as a murky
              halo sitting behind the name. If a glow is wanted here, use
              `text-shadow` — it follows the glyphs even when the text itself is
              transparent. */}
          {/* THE GRADIENT MOVED ONTO THE INNER SPAN, and it had to. `PixelDrift`
              redraws this name as particles and hides the real glyphs by taking
              the element it was handed down to `opacity: 0` — but
              `background-clip: text` is painted by the ANCESTOR, and clipping it
              to a transparent child still paints. Left on the h3 the gradient
              wordmark would sit there, solid, behind the whole effect. On the
              span it disappears with it, and SSR / no-JS / reduced-motion still
              get exactly the type that used to be here. */}
          <h3
            data-n
            className="mx-auto mt-5 max-w-5xl font-pixel text-[clamp(2.25rem,8vw,7rem)] uppercase leading-[0.84]"
          >
            <PixelDrift
              ref={drift}
              text={t(STORY.nameBrand, locale)}
              textClassName="bg-gradient-to-br from-clay via-ember to-lantern bg-clip-text text-transparent"
              /* The same three stops the gradient runs through, so the field
                 reads as the wordmark coming apart rather than as a new
                 palette arriving. */
              colors={[
                "var(--color-clay)",
                "var(--color-ember)",
                "var(--color-lantern)",
              ]}
              particleCount={50}
              particleSize={12}
              /* 110 was the first try and it ate three letters at a time —
                 "VIETNAM" lost its NAM to a resting cursor. 80 carves a void
                 you can read the name around. */
              mouseRadius={80}
              mouseForce={30}
              pad={140}
            />
          </h3>
          <p
            data-n
            className="mx-auto mt-8 max-w-3xl font-viet text-base font-light leading-relaxed text-cream/70 sm:text-lg"
          >
            <span className="text-gold">{t(STORY.nameBodyLead, locale)}</span>
            {t(STORY.nameBody, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
