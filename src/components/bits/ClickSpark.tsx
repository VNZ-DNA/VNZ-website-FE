'use client';

/**
 * ClickSpark (React Bits, vendored) — 8-bit ember sparks on click.
 *
 * Rewritten from upstream in four ways, all forced by using it as a whole-page
 * shell rather than around a small card:
 *
 *  1. VIEWPORT CANVAS, NOT PARENT-SIZED. Upstream measures its parent and sizes
 *     the canvas to it. Wrapping a ~20,000px-tall document that way allocates a
 *     1905x19665 surface (~37 megapixels, ~143 MB) and clears it every frame —
 *     it visibly stalls scrolling. Sparks are transient click feedback, so the
 *     canvas is `fixed` and only ever viewport-sized.
 *  2. NO WRAPPER ELEMENT. Clicks are captured on `window` and children render
 *     straight through, so this component contributes nothing to layout (the old
 *     `relative w-full h-full` div sat between `<body>` and the page).
 *  3. IDLE MEANS IDLE. Upstream's rAF loop runs forever, clearing the canvas
 *     every frame even with zero sparks. Here the loop starts on a click and
 *     stops as soon as the last spark expires.
 *  4. ONE EFFECT OWNS EVERYTHING. The draw step is self-scheduling, so hoisting
 *     it into a `useCallback` would reference it before its own declaration.
 *
 * Honours `prefers-reduced-motion` (checked per click, so toggling the OS
 * setting takes effect immediately).
 */

import React, { useRef, useEffect } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

function ease(kind: ClickSparkProps['easing'], t: number): number {
  switch (kind) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default:
      return t * (2 - t);
  }
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let rafId: number | null = null;

    /* Backing store tracks the viewport, never the document. */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Compact in place rather than reassigning to a fresh array, so a click
      // landing mid-frame can't push into a list about to be discarded.
      const sparks = sparksRef.current;
      let write = 0;
      for (let read = 0; read < sparks.length; read++) {
        const spark = sparks[read];
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) continue;

        const eased = ease(easing, elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle));
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle)
        );
        ctx.stroke();

        sparks[write++] = spark;
      }
      sparks.length = write;

      rafId = write ? requestAnimationFrame(tick) : null;
    };

    // Captured once so the cleanup below closes over the same array the handlers
    // used, rather than re-reading `.current` after unmount.
    const liveSparks = sparksRef.current;

    const onClick = (e: MouseEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Canvas is fixed at the viewport origin, so client coords need no offset.
      const now = performance.now();
      const sparks = liveSparks;
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now
        });
      }

      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
      if (rafId !== null) cancelAnimationFrame(rafId);
      liveSparks.length = 0;
    };
  }, [duration, easing, extraScale, sparkColor, sparkCount, sparkRadius, sparkSize]);

  return (
    <>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9999] h-screen w-screen"
      />
    </>
  );
};

export default ClickSpark;
