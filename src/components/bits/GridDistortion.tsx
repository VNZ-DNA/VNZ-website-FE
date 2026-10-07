"use client";

/**
 * GridDistortion (React Bits, vendored) — an image on a subdivided plane whose
 * UVs are pushed around by a velocity field the cursor writes into a data
 * texture. The field decays every frame by `relaxation`, so trails heal.
 *
 * Vendored rather than installed, matching `PixelBlast` / `PixelTransition`.
 * Four changes from the upstream JS source, three of them load-bearing:
 *
 *  1. Ported to TSX — the project is `strict`, and a `.jsx` file would sit
 *     outside the type-check that `pnpm build` relies on as its correctness gate.
 *  2. The upstream `./GridDistortion.css` import is gone. This repo has exactly
 *     one stylesheet (`app/globals.css`, Tailwind v4) and no per-component CSS,
 *     so its two rules are Tailwind classes on the root div.
 *  3. THE IMAGE NOW COVERS INSTEAD OF STRETCHING. Upstream measures the image
 *     aspect into `imageAspectRef` and then never reads it, so the texture is
 *     squashed to whatever shape the container happens to be — fine for the demo's
 *     square-ish box, very visible on a full-bleed hero, and brutal on a portrait
 *     phone. The aspect ratio now rides in `resolution.zw` and the fragment shader
 *     insets the UVs with it, giving true `object-fit: cover`. `handleResize` is
 *     re-run on texture load because the ratio isn't known until then.
 *  4. Mouse tracking moved from the container to `window`. The container has to
 *     be `pointer-events-none` (it sits behind real buttons and the ClickSpark
 *     canvas), and a container that ignores pointers never receives mousemove —
 *     upstream's listener would silently never fire here.
 *
 * Server components must not import this directly — go through
 * `grid-distortion-bg`, which adds the `ssr: false` boundary and the
 * reduced-motion gate.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * `resolution.zw` carries the cover-fit UV scale (see note 3 above). Insetting
 * around 0.5 crops the overflowing axis instead of squashing it.
 */
const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * resolution.zw + 0.5;
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset.rg);
}`;

export type GridDistortionProps = {
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  imageSrc: string;
  className?: string;
};

export default function GridDistortion({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = "",
}: GridDistortionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL available — stay decorative and silent.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: null as THREE.Texture | null },
      uDataTexture: { value: null as THREE.DataTexture | null },
    };

    // 1 until the texture reports its real dimensions; `handleResize` re-runs
    // from the load callback, so the first correct frame comes from there.
    let imageAspect = 1;

    const size = grid;
    const data = new Float32Array(4 * size * size);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = Math.random() * 255 - 125;
      data[i * 4 + 1] = Math.random() * 255 - 125;
    }

    const dataTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    dataTexture.needsUpdate = true;
    uniforms.uDataTexture.value = dataTexture;

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const containerAspect = width / height;
      renderer.setSize(width, height);
      plane.scale.set(containerAspect, 1, 1);

      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;
      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      // Cover fit: shrink the UV span on whichever axis overflows, so that axis
      // gets cropped rather than the image being squashed to the container.
      const uvScaleX =
        containerAspect > imageAspect ? 1 : containerAspect / imageAspect;
      const uvScaleY =
        containerAspect > imageAspect ? imageAspect / containerAspect : 1;

      uniforms.resolution.value.set(width, height, uvScaleX, uvScaleY);
    };

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageSrc, (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      imageAspect = texture.image.width / texture.image.height;
      uniforms.uTexture.value = texture;
      handleResize();
    });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const mouseState = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

    // Bound to `window`, not the container — see note 4 above.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    handleResize();

    // PAUSE WHEN OFF-SCREEN. Without this the loop runs for the life of the page:
    // at grid=130 that is two 16,900-cell passes, a ~270KB DataTexture upload and
    // a full-viewport WebGL render EVERY FRAME, still happening while the reader
    // is eight screens further down. It is the single most expensive thing on the
    // page and it was costing the scrubbed acts their frame budget.
    let visible = true;
    let animationId = 0;

    const animate = () => {
      if (!visible) return;
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;

      const d = dataTexture.image.data as unknown as Float32Array;
      for (let i = 0; i < size * size; i++) {
        d[i * 4] *= relaxation;
        d[i * 4 + 1] *= relaxation;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * mouse;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
          if (distSq < maxDist * maxDist) {
            const index = 4 * (i + size * j);
            const power = Math.min(maxDist / Math.sqrt(distSq), 10);
            d[index] += strength * 100 * mouseState.vX * power;
            d[index + 1] -= strength * 100 * mouseState.vY * power;
          }
        }
      }

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === visible) return;
        visible = entry.isIntersecting;
        if (visible) animate();
        else cancelAnimationFrame(animationId);
      },
      // No threshold: resume as soon as any sliver is on screen, so the canvas is
      // never caught mid-scroll showing a stale frame.
      { threshold: 0 },
    );
    visibilityObserver.observe(container);

    return () => {
      visible = false;
      cancelAnimationFrame(animationId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);

      try {
        renderer.dispose();
        renderer.forceContextLoss();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch {
        // Context already lost — nothing left to release.
      }

      geometry.dispose();
      material.dispose();
      dataTexture.dispose();
      uniforms.uTexture.value?.dispose();
    };
  }, [grid, mouse, strength, relaxation, imageSrc]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none h-full w-full min-h-0 min-w-0 overflow-hidden ${className}`.trim()}
    />
  );
}
