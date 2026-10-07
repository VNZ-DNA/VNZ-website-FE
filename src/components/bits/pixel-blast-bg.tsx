"use client";

/**
 * Client boundary around `PixelBlast` (React Bits, vendored + re-themed).
 *
 * Two jobs the raw bit doesn't do, and the reason server components import this
 * wrapper instead of `PixelBlast` directly:
 *
 *  1. `dynamic(..., { ssr: false })` — the effect builds a WebGL context, so it
 *     must never run in the server render, and its three.js chunk should stay
 *     out of the initial bundle.
 *  2. `prefers-reduced-motion` — the bit animates unconditionally. Under reduce
 *     we render nothing at all, matching the blanket rule at the bottom of
 *     globals.css that kills every ambient loop.
 *
 * Absolutely positioned and `aria-hidden`: purely decorative, never a layout
 * participant.
 */

import { useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const PixelBlast = dynamic(() => import("./PixelBlast"), { ssr: false });

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Read the motion preference via `useSyncExternalStore` rather than
 * setState-inside-an-effect: the media query IS an external store, so this is
 * both the idiomatic form and one render shorter. `getServerSnapshot` returns
 * `true` so the server render assumes reduced motion and emits nothing — the
 * field is decorative, and that keeps markup identical across the hydration
 * boundary.
 */
function useReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(REDUCE_QUERY);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => true,
  );
}

export function PixelBlastBg({
  color = "#f0b34a",
  pixelSize = 5,
  className = "",
}: {
  color?: string;
  pixelSize?: number;
  className?: string;
}) {
  if (useReducedMotion()) return null;

  return (
    <div aria-hidden className={`pointer-events-auto absolute inset-0 ${className}`}>
      <PixelBlast
        variant="square"
        pixelSize={pixelSize}
        color={color}
        patternScale={3}
        // Sparse on purpose: this sits behind real copy, so the field reads as
        // texture rather than pattern. Anything near 1.0 swallows the type.
        patternDensity={0.62}
        enableRipples
        rippleIntensityScale={1.2}
        speed={0.4}
        edgeFade={0.3}
        transparent
      />
    </div>
  );
}
