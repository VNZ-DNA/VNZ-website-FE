#!/usr/bin/env python3
"""Trim the transparent padding around product art (logos + wordmarks).

The product PNGs in public/products/ ship as 1254-ish square / wide RGBA canvases
with the artwork floating in a large transparent margin. That margin makes the
assets hard to lay out tightly (the real content box is much smaller than the
file). This crops each image to its alpha bounding box plus a small uniform pad
so nothing clips, writing `*-trim.png` next to the source. Pixels are only
cropped — never resampled — so the pixel-art edges stay crisp.

Re-run with `python3 scripts/trim.py` if the source art changes.
"""
from PIL import Image

PAD = 6  # transparent breathing room kept around the content box (px)

# (source, output)
JOBS = [
    ("public/products/stylaibox/logo.png", "public/products/stylaibox/logo-trim.png"),
    ("public/products/stylaibox/text.png", "public/products/stylaibox/text-trim.png"),
    ("public/products/taskcoper/logo.png", "public/products/taskcoper/logo-trim.png"),
    ("public/products/taskcoper/text.png", "public/products/taskcoper/text-trim.png"),
]


def trim(src, out):
    im = Image.open(src).convert("RGBA")
    bbox = im.split()[3].getbbox()  # bounding box of the alpha (opaque) region
    if bbox is None:
        print(f"!! {src}: fully transparent, skipped")
        return
    left, top, right, bottom = bbox
    left = max(0, left - PAD)
    top = max(0, top - PAD)
    right = min(im.width, right + PAD)
    bottom = min(im.height, bottom + PAD)
    cropped = im.crop((left, top, right, bottom))
    cropped.save(out)
    print(f"ok {src} {im.size} -> {out} {cropped.size}")


if __name__ == "__main__":
    for src, out in JOBS:
        trim(src, out)
