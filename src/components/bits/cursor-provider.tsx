"use client";

/**
 * Client boundary around Cursorify's `PhingerCursor`.
 *
 * Same reasoning as `pixel-blast-bg` / `grid-distortion-bg`, and the reason
 * `layout.tsx` (a server component) imports this wrapper rather than the
 * provider directly:
 *
 *  1. `dynamic(..., { ssr: false })` — the provider tracks the pointer and
 *     renders a follower element, neither of which means anything on the server.
 *     Loading it client-only also keeps both packages out of the initial HTML.
 *  2. `prefers-reduced-motion` — the cursor is a lagging follower, which is
 *     exactly the kind of ambient motion the blanket rule at the bottom of
 *     globals.css turns off. Under reduce we render children untouched and the
 *     native cursor stays.
 *
 * `breakpoint={768}` is the package's own escape hatch: below it Cursorify
 * disables itself, so touch devices — which have no pointer to follow — never
 * pay for the listener or get a stranded cursor drawn at 0,0.
 *
 * `defaultCursorVisible={false}` hides the OS arrow. That is the whole point of
 * the effect, but it also means the follower IS the cursor now: if it ever fails
 * to mount, the page has no pointer at all. Hence the reduced-motion path
 * returns children rather than rendering a provider with the arrow hidden.
 */

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";

const CursorifyProvider = dynamic(
  () => import("@cursorify/react").then((m) => m.CursorifyProvider),
  { ssr: false },
);
const PhingerCursor = dynamic(
  () => import("@cursorify/cursors").then((m) => m.PhingerCursor),
  { ssr: false },
);

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Read the motion preference via `useSyncExternalStore` — the media query IS an
 * external store. The server snapshot returns `true`, so the server render is
 * the plain children and markup matches across hydration.
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

export function CursorProvider({ children }: { children: ReactNode }) {
  if (useReducedMotion()) return <>{children}</>;

  return (
    <CursorifyProvider
      // `enabled` IS REQUIRED IN PRACTICE. Its type says `enabled?: boolean`, but
      // the provider renders the cursor behind `enabled && breakpointEnabled &&`
      // with no default applied — omit it and `undefined` silently switches the
      // whole thing off while the provider still renders children, so the page
      // looks fine and the cursor simply never exists.
      enabled
      cursor={<PhingerCursor />}
      breakpoint={768}
      defaultCursorVisible={false}
      delay={4}
      opacity={1}
    >
      {children}
    </CursorifyProvider>
  );
}
