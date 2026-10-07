#!/usr/bin/env python3
"""Key out the flat background of pixel-art assets via border flood-fill.

The member/logo PNGs ship as RGB with a solid near-white (members) or cream
(logo) background. A naive global threshold would also erase interior whites
(Vi's trousers, Tan's collar). Flood-filling inward from the border only removes
background that is actually connected to the edge, so enclosed whites survive.
"""
import sys
from collections import deque
from PIL import Image

# (source, output, per-channel tolerance) -- target bg color is sampled from corners
JOBS = [
    ("public/members/binh.png",  "public/members/cutout/binh.png",  26),
    ("public/members/vi.png",    "public/members/cutout/vi.png",    26),
    ("public/members/duong.png", "public/members/cutout/duong.png", 26),
    ("public/members/tan.png",   "public/members/cutout/tan.png",   26),
    ("public/general/logo.png",  "public/general/logo-cut.png",     30),
]


def sample_bg(px, w, h):
    """Average the four corner pixels to get the background color."""
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    r = sum(c[0] for c in corners) // 4
    g = sum(c[1] for c in corners) // 4
    b = sum(c[2] for c in corners) // 4
    return (r, g, b)


def near(c, target, tol):
    return abs(c[0] - target[0]) <= tol and abs(c[1] - target[1]) <= tol and abs(c[2] - target[2]) <= tol


def cutout(src, out, tol):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    px = im.load()
    target = sample_bg(px, w, h)

    transparent = bytearray(w * h)  # 0 = keep, 1 = clear
    q = deque()

    def consider(x, y):
        if 0 <= x < w and 0 <= y < h and not transparent[y * w + x]:
            c = px[x, y]
            if near(c, target, tol):
                transparent[y * w + x] = 1
                q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)

    while q:
        x, y = q.popleft()
        consider(x + 1, y)
        consider(x - 1, y)
        consider(x, y + 1)
        consider(x, y - 1)

    # One edge-cleanup pass: trim near-white fringe pixels that touch a cleared
    # region (kills the 1px halo around the pixel-art outline).
    fringe = []
    for y in range(h):
        for x in range(w):
            if transparent[y * w + x]:
                continue
            c = px[x, y]
            if c[0] >= 240 and c[1] >= 240 and c[2] >= 240:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and transparent[ny * w + nx]:
                        fringe.append((x, y))
                        break
    for x, y in fringe:
        transparent[y * w + x] = 1

    cleared = 0
    for y in range(h):
        row = y * w
        for x in range(w):
            if transparent[row + x]:
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
                cleared += 1

    # Trim transparent margins so the art is cropped tight to the character.
    mask = im.split()[3].point(lambda a: 255 if a > 10 else 0)
    bbox = mask.getbbox()
    if bbox:
        im = im.crop(bbox)

    import os
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)
    pct = 100 * cleared / (w * h)
    print(f"{src} -> {out}  bg={target}  cleared={pct:.1f}%")


if __name__ == "__main__":
    for src, out, tol in JOBS:
        cutout(src, out, tol)
