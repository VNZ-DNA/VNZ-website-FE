"use client";

import { useEffect, useRef } from "react";

type NewsRichContentProps = {
  html: string;
  className?: string;
};

function replaceBrokenImage(image: HTMLImageElement) {
  if (!image.isConnected) return;

  const alt = image.getAttribute("alt")?.trim() ?? "";
  const fallback = document.createElement("span");
  fallback.className = "news-media-fallback";
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", alt || "Hình ảnh không tải được");
  fallback.textContent = alt || "Hình ảnh không tải được";

  image.replaceWith(fallback);
}

export function NewsRichContent({ html, className = "" }: NewsRichContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const images = Array.from(root.querySelectorAll<HTMLImageElement>("figure img"));
    const cleanups: Array<() => void> = [];

    for (const image of images) {
      const onError = () => replaceBrokenImage(image);

      if (image.complete && image.naturalWidth === 0) {
        replaceBrokenImage(image);
        continue;
      }

      image.addEventListener("error", onError, { once: true });
      cleanups.push(() => image.removeEventListener("error", onError));
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [html]);

  return (
    <div
      ref={contentRef}
      className={`news-content [&_figure.news-image]:my-8 [&_figure.news-gallery]:my-8 [&_figure]:max-w-full [&_figure]:overflow-hidden [&_figure_img]:block [&_figure_img]:h-auto [&_figure_img]:max-w-full [&_figure_img]:w-full [&_.news-gallery-images]:grid [&_.news-gallery-images]:grid-cols-1 [&_.news-gallery-images]:gap-3 sm:[&_.news-gallery-images]:grid-cols-2 [&_figcaption]:mt-2.5 [&_figcaption]:font-viet [&_figcaption]:text-sm [&_figcaption]:font-light [&_figcaption]:leading-relaxed [&_figcaption]:text-ink-soft/80 [&_.news-media-fallback]:flex [&_.news-media-fallback]:min-h-40 [&_.news-media-fallback]:w-full [&_.news-media-fallback]:items-center [&_.news-media-fallback]:justify-center [&_.news-media-fallback]:border [&_.news-media-fallback]:border-ink/15 [&_.news-media-fallback]:bg-ink/5 [&_.news-media-fallback]:px-5 [&_.news-media-fallback]:py-10 [&_.news-media-fallback]:text-center [&_.news-media-fallback]:font-viet [&_.news-media-fallback]:text-sm [&_.news-media-fallback]:font-light [&_.news-media-fallback]:text-ink-soft ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
