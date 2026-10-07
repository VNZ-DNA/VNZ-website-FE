"use client";

/**
 * Client boundary around `GridDistortion` (React Bits, vendored).
 *
 * Same two jobs as `pixel-blast-bg`, and the same reason server components
 * import this wrapper rather than the raw bit:
 *
 *  1. `dynamic(..., { ssr: false })` — the effect builds a WebGL context, so it
 *     must never run in the server render, and its three.js chunk should stay
 *     out of the initial bundle.
 *  2. `prefers-reduced-motion` — the bit runs a rAF loop unconditionally. Under
 *     reduce we render a plain `<img>` instead of nothing: unlike a particle
 *     field, this effect IS the artwork, so dropping it would leave a hole where
 *     the background should be.
 *
 * `aria-hidden` and `pointer-events-none`: purely decorative, never a layout
 * participant, and it must not eat the clicks the nav and ClickSpark depend on.
 */

import { useCallback, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

const GridDistortion = dynamic(() => import("./GridDistortion"), {
  ssr: false,
});

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Read the motion preference via `useSyncExternalStore` rather than
 * setState-inside-an-effect: the media query IS an external store. The server
 * snapshot returns `true` so the server render emits the static `<img>`, which
 * also means the artwork is present with JS disabled.
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

export function GridDistortionBg({
  imageSrc,
  alt = "",
  grid = 15,
  mouse = 0.12,
  strength = 0.15,
  relaxation = 0.9,
  className = "",
  imgClassName = "object-cover",
}: {
  imageSrc: string;
  /** Only reaches the reduced-motion `<img>`; the canvas is always decorative. */
  alt?: string;
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  className?: string;
  /** Object-fit utilities for the static fallback, e.g. `object-cover object-bottom`. */
  imgClassName?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          className={`pixelated h-full w-full ${imgClassName}`}
        />
      ) : (
        <GridDistortion
          imageSrc={imageSrc}
          grid={grid}
          mouse={mouse}
          strength={strength}
          relaxation={relaxation}
        />
      )}
    </div>
  );
}
