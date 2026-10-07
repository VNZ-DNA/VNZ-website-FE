"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

const PIXEL_REVEAL_DURATION = 0.8;

type PixelMenuProps = {
  open: boolean;
  onActiveChange: (active: boolean) => void;
  children: ReactNode;
};

export function PixelMenu({ open, onActiveChange, children }: PixelMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const playbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const menu = menuRef.current;
    const background = pixelsRef.current;
    const content = contentRef.current;
    if (!menu || !background || !content) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = menu.querySelectorAll("[data-menu-item]");
    let animation: gsap.core.Timeline | null = null;

    const finishClose = () => {
      menu.style.visibility = "hidden";
      content.setAttribute("inert", "");
      onActiveChange(false);
    };
    const updatePlayback = () => {
      if (!animation) return;
      content.setAttribute("inert", "");
      if (openRef.current) {
        menu.style.visibility = "visible";
        onActiveChange(true);
      }
      if (motion.matches) {
        animation.progress(openRef.current ? 1 : 0, true).pause();
        if (openRef.current) content.removeAttribute("inert");
        else finishClose();
      } else if (openRef.current) {
        if (animation.progress() === 1) content.removeAttribute("inert");
        animation.play();
      } else if (animation.time() === 0) {
        finishClose();
      } else {
        animation.reverse();
      }
    };
    const buildAnimation = () => {
      const progress = animation?.progress() ?? 0;
      animation?.kill();
      const size = Math.round(Math.min(64, Math.max(48, window.innerWidth / 20)));
      const columns = Math.ceil(window.innerWidth / size);
      const rows = Math.ceil(window.innerHeight / size);
      const fragment = document.createDocumentFragment();
      const pixels: HTMLDivElement[] = [];
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const pixel = document.createElement("div");
          pixel.className = "absolute bg-ink";
          pixel.setAttribute("data-menu-pixel", "");
          Object.assign(pixel.style, {
            width: `${size}px`, height: `${size}px`,
            left: `${column * size}px`, top: `${row * size}px`, opacity: "0",
          });
          fragment.appendChild(pixel);
          pixels.push(pixel);
        }
      }
      background.replaceChildren(fragment);
      gsap.set(items, { opacity: 0, y: 18 });
      gsap.set(glowRef.current, { opacity: 0 });
      animation = gsap.timeline({
        id: "site-menu-transition",
        paused: true,
        onComplete: () => { if (openRef.current) content.removeAttribute("inert"); },
        onReverseComplete: finishClose,
      });
      pixels.forEach((pixel) => {
        const delay = Math.random() * PIXEL_REVEAL_DURATION;
        animation!.set(pixel, { opacity: 1 }, delay);
      });
      animation.to(glowRef.current, { opacity: 1, duration: 0.2 }, PIXEL_REVEAL_DURATION);
      animation.to(items, {
        opacity: 1, y: 0, duration: 0.2, stagger: 0.015, ease: "power2.out",
      }, PIXEL_REVEAL_DURATION);
      animation.progress(progress, true);
      updatePlayback();
    };
    playbackRef.current = updatePlayback;
    buildAnimation();
    window.addEventListener("resize", buildAnimation);
    motion.addEventListener("change", updatePlayback);
    return () => {
      animation?.kill();
      playbackRef.current = null;
      window.removeEventListener("resize", buildAnimation);
      motion.removeEventListener("change", updatePlayback);
    };
  }, [onActiveChange]);

  useEffect(() => {
    openRef.current = open;
    playbackRef.current?.();
  }, [open]);

  return (
    <div
      ref={menuRef}
      id="site-menu"
      aria-hidden={!open}
      className="fixed inset-0 z-[55] overflow-hidden"
      style={{ visibility: "hidden" }}
    >
      <div ref={pixelsRef} aria-hidden className="pointer-events-none absolute inset-0" />
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(90%_70%_at_78%_18%,rgba(232,84,31,0.16),transparent_70%)]"
      />
      <div ref={contentRef} inert className="relative h-full">{children}</div>
    </div>
  );
}
