"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_SIZE = 512;
const FRAME_COUNT = 12;
const COLUMNS = 3;
const FPS = 7;

type MemberSpriteProps = {
  animationUrl: string | null;
  avatarUrl: string | null;
  alt: string;
  className?: string;
  trimTransparent?: boolean;
};

export function MemberSprite(props: MemberSpriteProps) {
  const animationUrl = props.animationUrl?.trim() || null;
  return <SpritePlayer key={`${animationUrl ?? "avatar"}|${props.avatarUrl ?? ""}|${Boolean(props.trimTransparent)}`} {...props} animationUrl={animationUrl} />;
}

function visibleBounds(image: HTMLImageElement, width: number, height: number) {
  const full = { x: 0, y: 0, width, height };
  const buffer = document.createElement("canvas");
  buffer.width = image.naturalWidth;
  buffer.height = image.naturalHeight;
  const context = buffer.getContext("2d", { willReadFrequently: true });
  if (!context) return full;
  try {
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, buffer.width, buffer.height);
    let left = width, top = height, right = -1, bottom = -1;
    for (let pixel = 0; pixel < data.length / 4; pixel++) {
      if (data[pixel * 4 + 3] === 0) continue;
      const x = (pixel % buffer.width) % width;
      const y = Math.floor(pixel / buffer.width) % height;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
    return right < left ? full : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  } catch {
    return full;
  }
}

function SpritePlayer({ animationUrl, avatarUrl, alt, className, trimTransparent = false }: MemberSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!animationUrl && (!trimTransparent || !avatarUrl)) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context || !canvas) return;

    let image: HTMLImageElement;
    let bounds = { x: 0, y: 0, width: FRAME_SIZE, height: FRAME_SIZE };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let frame = 0;
    let timer: number | null = null;

    const drawFrame = () => {
      context.clearRect(0, 0, bounds.width, bounds.height);
      context.drawImage(
        image,
        (frame % COLUMNS) * FRAME_SIZE + bounds.x,
        Math.floor(frame / COLUMNS) * FRAME_SIZE + bounds.y,
        bounds.width, bounds.height,
        0, 0, bounds.width, bounds.height,
      );
    };

    const updatePlayback = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      if (motion.matches) {
        frame = 0;
        drawFrame();
        return;
      }
      timer = window.setInterval(() => {
        frame = (frame + 1) % FRAME_COUNT;
        drawFrame();
      }, 1000 / FPS);
    };

    const load = (url: string, animated: boolean) => {
      image = new window.Image();
      if (trimTransparent) image.crossOrigin = "anonymous";
      const fallback = () => {
        if (!disposed && animated && trimTransparent && avatarUrl) load(avatarUrl, false);
      };
      image.onerror = fallback;
      image.onload = () => {
        if (disposed) return;
        if (animated && (image.naturalWidth !== COLUMNS * FRAME_SIZE ||
            image.naturalHeight !== (FRAME_COUNT / COLUMNS) * FRAME_SIZE)) {
          fallback();
          return;
        }
        const width = animated ? FRAME_SIZE : image.naturalWidth;
        const height = animated ? FRAME_SIZE : image.naturalHeight;
        bounds = trimTransparent ? visibleBounds(image, width, height) : { x: 0, y: 0, width, height };
        canvas.width = bounds.width;
        canvas.height = bounds.height;
        context.imageSmoothingEnabled = false;
        drawFrame();
        setReady(true);
        if (animated) {
          motion.addEventListener("change", updatePlayback);
          updatePlayback();
        }
      };
      image.src = url;
    };
    load(animationUrl ?? avatarUrl!, Boolean(animationUrl));

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      if (timer !== null) window.clearInterval(timer);
      motion.removeEventListener("change", updatePlayback);
    };
  }, [animationUrl, avatarUrl, trimTransparent]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={FRAME_SIZE}
        height={FRAME_SIZE}
        role="img"
        aria-label={alt}
        hidden={!ready}
        className="pixelated h-full w-full object-contain object-bottom"
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={alt}
          hidden={ready}
          className="pixelated h-full w-full object-contain object-bottom"
        />
      ) : null}
    </div>
  );
}
