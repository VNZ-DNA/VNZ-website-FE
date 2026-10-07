"use client";

import { useState } from "react";

type NewsImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function NewsImage({ src, alt, className = "" }: NewsImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex min-h-48 w-full items-center justify-center bg-ink/5 px-6 py-12 text-center font-viet text-sm font-light text-ink-soft ${className}`}
      >
        {alt}
      </div>
    );
  }

  return (
    // Backend owns the public HTTPS URL and the host can differ by article.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
