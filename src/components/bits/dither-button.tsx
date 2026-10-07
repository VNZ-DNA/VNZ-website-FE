"use client";

/**
 * DitherButton — adapted from evilbuttons.com (`@evilbuttons/dither-button`).
 *
 * A 4x4 ordered (Bayer) dither animated as a slow rotating sine wave, drawn at
 * 1/`ditherSize` resolution and scaled back up with `image-rendering: pixelated`,
 * so the pattern lands on a hard pixel grid instead of a smooth gradient. That
 * is exactly the texture the rest of this site is built from, which is why it
 * earns a place next to `.btn-pixel` rather than replacing it.
 *
 * Four deliberate changes from upstream:
 *
 *  1. NO `cn` / `clsx` / `tailwind-merge`. Upstream pulls two packages in just to
 *     join class strings; a template literal does the same job here and keeps the
 *     dependency count at zero.
 *  2. VNZ TOKENS, NOT SHADCN ONES. Upstream styles itself with `foreground` /
 *     `background`, which this project doesn't define. Colours come from props
 *     defaulting to the `@theme` palette, and the caller owns the frame.
 *  3. TRANSPARENT "OFF" PIXELS. Upstream fills unlit pixels with the canvas's
 *     computed `background-color` — which, on a canvas with no background, reads
 *     as opaque black and would paste a black rectangle over a cream surface.
 *     Here unlit pixels are left at alpha 0, so whatever the button sits on shows
 *     through and the same component works on ink and on cream.
 *  4. NO `rounded-md`. Every frame in this design system is `border-radius: 0`.
 *
 * `prefers-reduced-motion` draws a single static frame and never starts the loop
 * — carried over from upstream, and consistent with the blanket rule at the
 * bottom of globals.css.
 */

import { ButtonHTMLAttributes, useEffect, useRef } from "react";

const DEFAULT_PIXEL_SIZE = 4;
const MIN_PIXEL_SIZE = 1;
const MAX_PIXEL_SIZE = 32;

/** 4x4 ordered dither matrix. Values 1..16, compared against a 0..1 signal. */
const BAYER: ReadonlyArray<ReadonlyArray<number>> = [
  [16, 8, 14, 6],
  [5, 12, 2, 10],
  [13, 4, 15, 7],
  [1, 9, 3, 11],
];

function parseHex(input: string): [number, number, number] | null {
  const hex = input.trim().replace(/^#/, "");
  if (hex.length === 3) {
    const rgb = [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16)) as [
      number,
      number,
      number,
    ];
    return rgb.some(Number.isNaN) ? null : rgb;
  }
  if (hex.length === 6) {
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ];
    return rgb.some(Number.isNaN) ? null : rgb;
  }
  return null;
}

export type DitherButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  /**
   * Render as an anchor instead of a button. Every CTA on this site is a link to
   * a chapter or an external product, so this is the common case — wrapping a
   * `<button>` in an `<a>` would nest two interactive elements.
   */
  href?: string;
  /** Colour of the lit pixels. Defaults to the `gold` palette token. */
  ditherColor?: string;
  /**
   * Canvas opacity, 0–1. Vietnamese labels stack diacritics above the cap line,
   * and a dense dither eats them, so this defaults deliberately low.
   */
  ditherOpacity?: number;
  /** Pixel scale, 1–32. Higher is chunkier. */
  ditherSize?: number;
};

export function DitherButton({
  children,
  className = "",
  href,
  ditherColor = "#e8541f",
  ditherOpacity = 0.22,
  ditherSize = DEFAULT_PIXEL_SIZE,
  ...props
}: DitherButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Derived inside the effect, which already re-runs when either prop changes.
    // Writing them to refs during render is a render-phase side effect.
    const [r, g, b] = parseHex(ditherColor) ?? [240, 179, 74];
    const ps = Math.max(
      MIN_PIXEL_SIZE,
      Math.min(MAX_PIXEL_SIZE, Math.round(ditherSize)),
    );

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width / ps));
      const h = Math.max(1, Math.floor(rect.height / ps));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    const draw = (timeSec: number) => {
      const { width: w, height: h } = canvas;
      if (!w || !h) return;

      // Wave direction wobbles slowly, so the pattern drifts rather than marches.
      const angle = Math.sin(timeSec * 0.4545) * 0.112;
      const dx = -Math.sin(angle);
      const dy = Math.cos(angle);

      const img = ctx.createImageData(w, h);
      const data = img.data;
      const cx = w / 2;
      const cy = h / 2;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const posX = (px - cx) * ps;
          const posY = (py - cy) * ps;
          const value =
            Math.sin((posX * dx + posY * dy) * 0.048 - timeSec * 1.412) * 0.5 +
            0.5;
          const lit = value < BAYER[py & 3][px & 3] / 17;
          const i = (py * w + px) * 4;
          if (lit) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          }
          // Unlit pixels stay at alpha 0 — the surface below shows through.
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw(0);
    });
    ro.observe(canvas);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
      return () => ro.disconnect();
    }

    let rafId = 0;
    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [ditherColor, ditherSize]);

  // `font-pixel`, not upstream's `font-mono` / this project's `font-ui`: per
  // CLAUDE.md only `font-pixel` and `font-viet` ship Vietnamese diacritics, and
  // every other CTA on the page is `font-pixel` — a different face here reads as
  // a mistake rather than emphasis.
  //
  // LIGHT FILL, NOT DARK. Every button using this sits in the paper chapters, and
  // an ink fill there reads as a hole punched in the page. Light ground + ink
  // label + an ember dither keeps the pattern visible AND the text crisp; on a
  // dark fill the dither composites into a muddy olive instead. The outline below
  // is the ink border, so it still reads as the same pixel-button family as
  // `.btn-pixel`.
  //
  // `paper-card`, NOT `bg-cream`. The raw cream token is the OLD ivory and now
  // sits visibly yellower than the paper ground it lands on; `paper-card` is the
  // raised-panel colour and moves with the ground whenever it is retuned. It also
  // brings the fibre texture, so the button is a piece of the same paper rather
  // than a smooth chip laid on it.
  const frame = `group relative inline-flex items-center justify-center overflow-hidden border-2 border-ink paper-card font-pixel uppercase tracking-wider text-ink transition-[transform,border-color,color,background-color] duration-200 hover:bg-ember hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember active:translate-y-[3px] ${className}`;

  const inner = (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ opacity: ditherOpacity }}
        className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]"
      />
      {/* Knockout ring so the label stays crisp where the dither runs under it.
          It has to match the FILL, not the text — ivory here, and it would have to
          become ink again if this ever goes back to a dark button. */}
      <span className="relative z-10 [text-shadow:1px_1px_0_#fbf4e2,-1px_1px_0_#fbf4e2,1px_-1px_0_#fbf4e2,-1px_-1px_0_#fbf4e2,0_2px_0_#fbf4e2,0_-2px_0_#fbf4e2,2px_0_0_#fbf4e2,-2px_0_0_#fbf4e2] group-hover:[text-shadow:none]">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={frame}>
        {inner}
      </a>
    );
  }

  return (
    <button {...props} className={frame}>
      {inner}
    </button>
  );
}

export default DitherButton;
