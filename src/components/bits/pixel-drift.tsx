"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";

/**
 * PixelDrift — text rendered as a field of coloured squares that assemble out of
 * nothing and get shoved around by the cursor. Ported from OriginKit's "Pixel
 * Drift" (originkit.dev/components/pixeldrift); the particle engine below —
 * alpha-sampling the glyphs off an offscreen canvas, the spawn ring, the
 * speed-driven repulsion with its eased return — is theirs, kept intact.
 *
 * THREE THINGS CHANGED, and each one is why this isn't a drop-in copy:
 *
 * 1. FORMATION IS DRIVEN FROM OUTSIDE, not from a duration. The original eases
 *    an internal 0→1 value on a rAF clock and triggers it from an
 *    IntersectionObserver (`mode="onEnter"`). Both are useless in `story-truth`:
 *    the act is a PINNED stage, so the element enters the viewport once at the
 *    top and then sits there for five viewports of scrolling — an on-enter
 *    trigger would fire the whole animation before its beat, and a timer would
 *    refuse to run backwards when the reader scrolls up. So the value is a plain
 *    ref written by the caller via `setProgress()`, and GSAP scrubs it. Ease it
 *    on the tween, not here — `progress` is used raw.
 *
 * 2. THE CANVAS TAKES ITS TYPE FROM THE DOM. The original draws with a hardcoded
 *    `700 {fontSize}px system-ui` and offers an autoFit search. Here the text
 *    also exists as a real element (see 3), so the font, weight, letter-spacing
 *    and `text-transform` are read off that element's computed style — the
 *    particles land exactly where the glyphs were, at every breakpoint, with no
 *    size prop to keep in sync with the `clamp()` in the markup. Sampling waits
 *    on `document.fonts.ready`, or it measures the fallback face and the field
 *    comes out the wrong shape.
 *
 * 3. THE TEXT IS REAL TEXT. The original renders a bare canvas — nothing for a
 *    screen reader, nothing without JS. This renders the string, hands its box to
 *    the canvas, and only then hides it (`opacity: 0`, so it stays in the a11y
 *    tree and stays selectable). No JS, no 2D context, or `prefers-reduced-motion`
 *    → we return before that line and the page keeps plain, styled type. Put the
 *    gradient/`bg-clip-text` treatment on `textClassName`, NOT on the parent:
 *    `background-clip: text` clips an ancestor's background to these glyphs, and
 *    an ancestor's background is not something this component can switch off — it
 *    would keep painting the name straight through the particles.
 *
 * The canvas is inflated by `pad` on every side and sits behind `absolute`
 * negative insets, so particles flying in from the spawn ring — and any pushed
 * out by the cursor — have room outside the text box instead of being clipped at
 * its edge.
 */

export type PixelDriftHandle = {
  /** 0 = dispersed / invisible, 1 = fully formed. Values are clamped. */
  setProgress: (v: number) => void;
};

type PixelDriftProps = {
  text: string;
  /**
   * Particle colours, assigned at random per particle. Accepts `var(--token)`
   * and resolves it against the host, so the design-system tokens in
   * `globals.css` can be passed straight through.
   */
  colors?: string[];
  /** 1–50. Higher = denser: the sampling gap is `150 / particleCount`. */
  particleCount?: number;
  /** Drawn square is `particleSize / 4` px — the original's scaling, kept. */
  particleSize?: number;
  mouseEnabled?: boolean;
  mouseRadius?: number;
  mouseForce?: number;
  /** Breathing room, in px, added to the canvas on every side. */
  pad?: number;
  /** Classes for the visible text element (gradient, clip, colour). */
  textClassName?: string;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_COLORS = ["#ffffff"];

/** `var(--color-ember)` → `#e8541f`. Canvas fillStyle can't take a var(). */
function resolveColor(host: HTMLElement, color: string): string {
  const token = /^var\(\s*(--[^),\s]+)\s*\)$/.exec(color.trim());
  if (!token) return color;
  return getComputedStyle(host).getPropertyValue(token[1]).trim() || "#ffffff";
}

export const PixelDrift = forwardRef<PixelDriftHandle, PixelDriftProps>(
  function PixelDrift(
    {
      text,
      colors = DEFAULT_COLORS,
      particleCount = 50,
      particleSize = 12,
      mouseEnabled = true,
      mouseRadius = 90,
      mouseForce = 30,
      pad = 120,
      textClassName,
      className,
      style,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        setProgress: (v: number) => {
          progressRef.current = v < 0 ? 0 : v > 1 ? 1 : v;
        },
      }),
      [],
    );

    // Arrays are new on every render; join them so the effect doesn't re-run
    // (and re-sample the whole field) unless the colours actually changed.
    const colorsKey = colors.join("|");

    useEffect(() => {
      const host = hostRef.current;
      const textEl = textRef.current;
      const canvas = canvasRef.current;
      if (!host || !textEl || !canvas) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      // Read back off the key rather than the prop array, so the effect has no
      // dependency the linter can't see through.
      const requested = colorsKey.split("|").filter(Boolean);
      const palette = (requested.length ? requested : DEFAULT_COLORS).map((c) =>
        resolveColor(host, c),
      );

      // Past this point the canvas is the name. Hide the glyphs — opacity, not
      // `visibility`, so the string stays readable to assistive tech.
      textEl.style.opacity = "0";

      let count = 0;
      // Text origins — where a particle rests once formed.
      let ox = new Float32Array(0);
      let oy = new Float32Array(0);
      // Spawn positions on a ring outside the canvas, so formation can
      // interpolate spawn → origin (and dissolve back out the same way).
      let sx = new Float32Array(0);
      let sy = new Float32Array(0);
      // Drawn positions.
      let px = new Float32Array(0);
      let py = new Float32Array(0);
      // Cursor repulsion offset from home.
      let repX = new Float32Array(0);
      let repY = new Float32Array(0);
      let cIdx = new Uint8Array(0);

      // Cursor speed + smoothed position for the repulsion engine.
      const pointer = { x: -99999, y: -99999, active: false };
      let prevMx = -99999;
      let prevMy = -99999;
      let mouseSpeed = 0;
      let smoothX = -99999;
      let smoothY = -99999;

      let cssW = 0;
      let cssH = 0;
      let dpr = 1;

      const sampleText = () => {
        const W = cssW;
        const H = cssH;
        if (W <= 0 || H <= 0) return;

        const off = document.createElement("canvas");
        off.width = Math.max(1, Math.floor(W * dpr));
        off.height = Math.max(1, Math.floor(H * dpr));
        const offCtx = off.getContext("2d", { willReadFrequently: true });
        if (!offCtx) return;
        offCtx.scale(dpr, dpr);

        // Type comes from the hidden element — see note 2 in the header.
        const cs = getComputedStyle(textEl);
        const label =
          cs.textTransform === "uppercase"
            ? text.toUpperCase()
            : cs.textTransform === "lowercase"
              ? text.toLowerCase()
              : text;
        offCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if (cs.letterSpacing && cs.letterSpacing !== "normal") {
          (
            offCtx as CanvasRenderingContext2D & { letterSpacing?: string }
          ).letterSpacing = cs.letterSpacing;
        }
        offCtx.clearRect(0, 0, W, H);
        offCtx.fillStyle = "#fff";
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        offCtx.fillText(label, W / 2, H / 2);

        const img = offCtx.getImageData(
          0,
          0,
          Math.floor(W * dpr),
          Math.floor(H * dpr),
        );
        const data = img.data;

        const pCount = Math.max(1, Math.min(50, particleCount));
        const stride = Math.max(2, Math.round(150 / pCount));

        let candidates = 0;
        for (let y = 0; y < H; y += stride) {
          for (let x = 0; x < W; x += stride) {
            const ix = Math.floor(x * dpr);
            const iy = Math.floor(y * dpr);
            if (data[(iy * img.width + ix) * 4 + 3] > 128) candidates++;
          }
        }

        const downsample = candidates > 30000 ? Math.ceil(candidates / 30000) : 1;
        const alloc = Math.min(candidates, 30000);

        const newOx = new Float32Array(alloc);
        const newOy = new Float32Array(alloc);
        const newSx = new Float32Array(alloc);
        const newSy = new Float32Array(alloc);
        const newPx = new Float32Array(alloc);
        const newPy = new Float32Array(alloc);
        const newC = new Uint8Array(alloc);

        let i = 0;
        let seen = 0;
        for (let y = 0; y < H && i < alloc; y += stride) {
          for (let x = 0; x < W && i < alloc; x += stride) {
            const ix = Math.floor(x * dpr);
            const iy = Math.floor(y * dpr);
            if (data[(iy * img.width + ix) * 4 + 3] > 128) {
              if (seen % downsample === 0) {
                newOx[i] = x;
                newOy[i] = y;
                const ang = Math.random() * Math.PI * 2;
                const rad = Math.max(W, H) * (0.6 + Math.random() * 0.5);
                const rx = W / 2 + Math.cos(ang) * rad;
                const ry = H / 2 + Math.sin(ang) * rad;
                newSx[i] = rx;
                newSy[i] = ry;
                newPx[i] = rx;
                newPy[i] = ry;
                newC[i] = Math.floor(Math.random() * palette.length);
                i++;
              }
              seen++;
            }
          }
        }

        count = i;
        ox = newOx;
        oy = newOy;
        sx = newSx;
        sy = newSy;
        px = newPx;
        py = newPy;
        repX = new Float32Array(alloc);
        repY = new Float32Array(alloc);
        cIdx = newC;
      };

      const resize = () => {
        // `offsetWidth`, NOT `getBoundingClientRect()`: the whole stage is scaled
        // down by the act's SHRINK tween near the end, and a rect would hand us
        // the transformed size and resample the field at the wrong scale.
        const w = host.offsetWidth + pad * 2;
        const h = host.offsetHeight + pad * 2;
        if (w <= pad * 2 || h <= pad * 2) return;
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        cssW = w;
        cssH = h;
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sampleText();
      };

      resize();

      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // Webfonts land after first paint; the first sample is of the fallback.
      let disposed = false;
      void document.fonts?.ready.then(() => {
        if (!disposed) resize();
      });

      const onMove = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        // Screen px → canvas space, so the stage's scale doesn't shrink the
        // effective radius as the act pulls back.
        const scaleX = rect.width > 0 ? cssW / rect.width : 1;
        const scaleY = rect.height > 0 ? cssH / rect.height : 1;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;
        if (prevMx > -9000) {
          const ddx = mx - prevMx;
          const ddy = my - prevMy;
          mouseSpeed = Math.sqrt(ddx * ddx + ddy * ddy);
        }
        prevMx = mx;
        prevMy = my;
        pointer.x = mx;
        pointer.y = my;
        pointer.active = true;
      };
      const onLeave = () => {
        pointer.x = -99999;
        pointer.y = -99999;
        pointer.active = false;
        prevMx = -99999;
        prevMy = -99999;
      };
      if (mouseEnabled) {
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerleave", onLeave);
        canvas.addEventListener("pointercancel", onLeave);
      }

      const buckets: number[][] = palette.map(() => []);

      const drawFrame = () => {
        ctx.clearRect(0, 0, cssW, cssH);
        if (count === 0) return;

        // Scrubbed from outside — see note 1 in the header. Raw, unedged: the
        // caller's tween owns the curve.
        const factor = progressRef.current;
        if (factor <= 0.001) return;
        const forming = factor < 1;

        const drawSize = Math.max(1, particleSize / 4);
        const half = drawSize / 2;

        // Capture cursor speed before decay, then smooth the cursor position so
        // a fast sweep carves a continuous channel instead of stamping rings.
        const hitSpeed = mouseSpeed;
        mouseSpeed *= 0.88;
        const active = !forming && mouseEnabled && pointer.active;
        if (active) {
          const lerp = Math.max(0.08, 0.3 - hitSpeed * 0.006);
          if (smoothX < -9000) {
            smoothX = pointer.x;
            smoothY = pointer.y;
          } else {
            smoothX += (pointer.x - smoothX) * lerp;
            smoothY += (pointer.y - smoothY) * lerp;
          }
        } else {
          smoothX = -99999;
          smoothY = -99999;
        }
        const mx = smoothX;
        const my = smoothY;
        const cutoff = Math.max(1, mouseRadius);
        const cutoffSq = cutoff * cutoff;

        for (let b = 0; b < buckets.length; b++) buckets[b].length = 0;

        for (let i = 0; i < count; i++) {
          const oxi = ox[i];
          const oyi = oy[i];

          if (forming) {
            // Assembling (or dissolving): spawn ring ↔ text origin. Opacity
            // rides the same factor, below. The cursor is ignored while moving.
            px[i] = sx[i] + (oxi - sx[i]) * factor;
            py[i] = sy[i] + (oyi - sy[i]) * factor;
            buckets[cIdx[i]].push(i);
            continue;
          }

          // Settled: home position plus a repulsion offset that eases back to
          // zero once the cursor is away.
          let inZone = false;
          if (active) {
            const dx = oxi - mx;
            const dy = oyi - my;
            const distSq = dx * dx + dy * dy;
            if (distSq > 0 && distSq < cutoffSq) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const falloff = 1 - dist / cutoff;
              const push = falloff * hitSpeed * mouseForce * 0.05;
              repX[i] += nx * push;
              repY[i] += ny * push;
              repX[i] += (nx * (cutoff - dist) - repX[i]) * 0.06;
              repY[i] += (ny * (cutoff - dist) - repY[i]) * 0.06;
              inZone = true;
            }
          }
          if (!inZone) {
            repX[i] *= 0.97;
            repY[i] *= 0.97;
          }

          px[i] = oxi + repX[i];
          py[i] = oyi + repY[i];
          buckets[cIdx[i]].push(i);
        }

        ctx.globalAlpha = forming ? Math.min(1, Math.max(0, factor)) : 1;
        for (let b = 0; b < buckets.length; b++) {
          const bucket = buckets[b];
          if (bucket.length === 0) continue;
          ctx.fillStyle = palette[b];
          for (let k = 0; k < bucket.length; k++) {
            const i = bucket[k];
            ctx.fillRect(px[i] - half, py[i] - half, drawSize, drawSize);
          }
        }
        ctx.globalAlpha = 1;
      };

      // The loop only runs while the stage is on screen — this act is pinned for
      // five viewports, and the chapters below it are long.
      let raf: number | null = null;
      const loop = () => {
        drawFrame();
        raf = requestAnimationFrame(loop);
      };
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (raf == null) raf = requestAnimationFrame(loop);
          } else if (raf != null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        },
        { rootMargin: "20% 0px" },
      );
      io.observe(host);

      return () => {
        disposed = true;
        if (raf != null) cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("pointercancel", onLeave);
        textEl.style.opacity = "";
      };
    }, [
      text,
      colorsKey,
      particleCount,
      particleSize,
      mouseEnabled,
      mouseRadius,
      mouseForce,
      pad,
    ]);

    return (
      <span
        ref={hostRef}
        className={`relative block ${className ?? ""}`}
        style={style}
      >
        <span ref={textRef} className={`block ${textClassName ?? ""}`}>
          {text}
        </span>
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute block"
          style={{
            left: -pad,
            top: -pad,
            width: `calc(100% + ${pad * 2}px)`,
            height: `calc(100% + ${pad * 2}px)`,
            pointerEvents: mouseEnabled ? "auto" : "none",
          }}
        />
      </span>
    );
  },
);
