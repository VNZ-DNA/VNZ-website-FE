#!/usr/bin/env python3
"""Recolour the chương 01 pixel-art assets without touching a single pixel's shape.

WHY A SCRIPT AND NOT AN IMAGE MODEL. The obvious move is to hand these to a
generative model and ask for "the same thing, in black and white". It does not
work: a generative model redraws, it does not recolour. Asked to do exactly this,
one returned a single merged 1024x1536 canvas, in an engraving style instead of
pixel art, with new details invented into the map, a solid white background, and
none of the three original sizes. Every one of those is disqualifying for a
drop-in asset swap.

A per-pixel transform is exact by construction. Geometry, resolution and the
alpha channel are carried through untouched, because they are never read as
anything but themselves — only the RGB triple changes, and only through a fixed
function. The output is a true recolour of the same artwork.

NON-DESTRUCTIVE. Sources are never written to. Each variant lands beside its
original with a suffix, so the swap is a one-line `src` change in
`story-truth.tsx` and reverting is the same edit backwards.

    python scripts/recolor.py

VARIANTS
  -mono   Pure greyscale on Rec. 709 luminance. This is the "trắng đen" option.
          Contrast is stretched a little, because a straight desaturation of art
          that was carrying its separation in HUE leaves the layers muddy — the
          columns in particular lose their edge against their own shadow.
  -ink    The same luminance ramped between the page's ink (#1b2433) and its
          paper (#f8f6f1), so the art reads as printed in the site's own colours
          rather than as a greyscale photo dropped onto a warm page.

TRANSPARENCY IS PRESERVED EXACTLY. Alpha is split off before the transform and
reattached after, so the cutouts' soft edges survive. RGB under fully transparent
pixels is transformed too, on purpose: those values still bleed when the browser
scales the image, and leaving them at the old orange produces a faint warm halo.
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent / "public" / "general"

SOURCES = [
    ROOT / "about3" / "column.png",
    ROOT / "about4" / "vietnam.png",
    ROOT / "about4" / "city.png",
]

# Endpoints of the -ink ramp: the page's own ink and paper.
INK = (27, 36, 51)
PAPER = (248, 246, 241)

# How hard to stretch the greyscale. `cutoff` is the percentage clipped from each
# end of the histogram before rescaling; 1.5 recovers the separation lost with the
# hue without crushing the darkest pixel-art outlines into a single flat black.
AUTOCONTRAST_CUTOFF = 1.5


def luminance(rgba: Image.Image) -> Image.Image:
    """Rec. 709 luminance of the RGB channels, as an L-mode image."""
    return rgba.convert("RGB").convert("L")


def mono(rgba: Image.Image) -> Image.Image:
    grey = ImageOps.autocontrast(luminance(rgba), cutoff=AUTOCONTRAST_CUTOFF)
    out = Image.merge("RGB", (grey, grey, grey)).convert("RGBA")
    out.putalpha(rgba.getchannel("A"))
    return out


def ink(rgba: Image.Image) -> Image.Image:
    grey = ImageOps.autocontrast(luminance(rgba), cutoff=AUTOCONTRAST_CUTOFF)
    # `colorize` maps black -> INK and white -> PAPER across the same ramp.
    out = ImageOps.colorize(grey, black=INK, white=PAPER).convert("RGBA")
    out.putalpha(rgba.getchannel("A"))
    return out


VARIANTS = {"mono": mono, "ink": ink}


def main() -> None:
    for src in SOURCES:
        if not src.exists():
            print(f"  MISSING  {src}")
            continue

        original = Image.open(src).convert("RGBA")
        for suffix, transform in VARIANTS.items():
            dst = src.with_name(f"{src.stem}-{suffix}.png")
            out = transform(original)

            assert out.size == original.size, "geometry must not change"
            assert out.mode == "RGBA", "alpha must survive"

            out.save(dst)
            kb = dst.stat().st_size // 1024
            print(f"  {dst.relative_to(ROOT)}  {out.size[0]}x{out.size[1]}  {kb} KB")


if __name__ == "__main__":
    main()
