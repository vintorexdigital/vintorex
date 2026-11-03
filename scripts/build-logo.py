#!/usr/bin/env python3
"""Build site logo, emblems, favicons, app icons and social share art from the brand mark.

Run from the repo root after dropping a new mark into the assets folder (or pass a path):

  python3 scripts/build-logo.py
  python3 scripts/build-logo.py path/to/logo.png
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'dist' / 'images'
ICONS = ROOT / 'dist' / 'icons'
DEFAULT_SRC = Path(__file__).resolve().parents[1] / 'dist' / 'images' / 'vintorex-logo-source.png'
FALLBACK_SRC = Path(
    '/Users/vintorex/.cursor/projects/Users-vintorex-Documents-GitHub-vintorex'
    '/assets/vintorex_-_logo-1-144e79b3-462f-4a2d-9d21-4c4822a9232b.png'
)
# Charcoal plate behind the supplied mark — keep brand splash / app tiles matching it.
PLATE = (26, 26, 28, 255)
# Soft gold used for social-card accents.
GOLD = (196, 156, 74, 255)


def load_source(path: Path) -> Image.Image:
    if not path.exists():
        raise SystemExit(f'Logo source not found: {path}')
    return Image.open(path).convert('RGBA')


def cutout(src: Image.Image) -> Image.Image:
    """Knock out the flat charcoal plate so the mark sits on transparency."""
    arr = np.asarray(src).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3]
    # Sample corners — the plate is a near-solid dark fill.
    corners = np.stack([
        rgb[2, 2], rgb[2, -3], rgb[-3, 2], rgb[-3, -3],
        rgb[8, 8], rgb[8, -9], rgb[-9, 8], rgb[-9, -9],
    ])
    plate = corners.mean(axis=0)
    dist = np.linalg.norm(rgb - plate, axis=-1)
    # Keep metallic gold/silver strokes; drop the plate (and near-plate fringe).
    keep = (dist > 28) & (a > 8)
    # Soften the cut edge so the mark doesn't look punched out.
    soft = Image.fromarray((keep * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.6))
    out = arr.copy()
    out[..., 3] = np.minimum(a, np.asarray(soft, dtype=np.float32))
    # Zero RGB on fully transparent pixels to keep WebP/PNG tidy.
    clear = out[..., 3] < 1
    out[clear, :3] = 0
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    alpha = img.split()[-1]
    box = alpha.getbbox()
    if not box:
        return img
    cropped = img.crop(box)
    canvas = Image.new('RGBA', (cropped.width + pad * 2, cropped.height + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad), cropped)
    return canvas


def fit(img: Image.Image, size: tuple[int, int], bg=(0, 0, 0, 0), scale: float = 0.82) -> Image.Image:
    """Center the mark on a canvas at `scale` of the shorter side."""
    canvas = Image.new('RGBA', size, bg)
    tw, th = size
    target = int(min(tw, th) * scale)
    ratio = img.width / img.height
    if ratio >= 1:
        w, h = target, max(1, round(target / ratio))
    else:
        h, w = target, max(1, round(target * ratio))
    # Prefer width-limited fit when the mark is wider than tall (this logo is).
    if w > tw * scale:
        w = int(tw * scale)
        h = max(1, round(w / ratio))
    if h > th * scale:
        h = int(th * scale)
        w = max(1, round(h * ratio))
    resized = img.resize((w, h), Image.LANCZOS)
    canvas.paste(resized, ((tw - w) // 2, (th - h) // 2), resized)
    return canvas


def save_webp(img: Image.Image, path: Path, width: int) -> None:
    h = max(1, round(img.height * width / img.width))
    out = img.resize((width, h), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, 'WEBP', quality=92, method=6)
    print(f'  {path.relative_to(ROOT)}  {out.size[0]}×{out.size[1]}  {path.stat().st_size:,} B')


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, 'PNG', optimize=True)
    print(f'  {path.relative_to(ROOT)}  {img.size[0]}×{img.size[1]}  {path.stat().st_size:,} B')


def social_card(mark: Image.Image) -> Image.Image:
    w, h = 1200, 630
    card = Image.new('RGBA', (w, h), PLATE)
    draw = ImageDraw.Draw(card)
    # Subtle vignette frame
    draw.rounded_rectangle((36, 36, w - 36, h - 36), radius=28, outline=GOLD, width=2)
    mark_w = 520
    mark_h = round(mark.height * mark_w / mark.width)
    placed = mark.resize((mark_w, mark_h), Image.LANCZOS)
    card.paste(placed, ((w - mark_w) // 2, (h - mark_h) // 2 - 18), placed)
    return card.convert('RGB')


def main() -> None:
    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src_path.exists() and FALLBACK_SRC.exists():
        src_path = FALLBACK_SRC
    if not src_path.exists():
        alt = IMAGES / 'vintorex-logo-original.png'
        src_path = alt if alt.exists() else src_path
    print(f'Source: {src_path}')
    raw = load_source(src_path)

    IMAGES.mkdir(parents=True, exist_ok=True)
    ICONS.mkdir(parents=True, exist_ok=True)

    # Preserve the supplied artwork as the new original.
    save_png(raw, IMAGES / 'vintorex-logo-original.png')

    mark = trim(cutout(raw), pad=12)
    # Emblem sizes used by header / footer / dashboards.
    for width in (144, 288, 480):
        save_webp(mark, IMAGES / f'vintorex-emblem-{width}.webp', width)

    # Transparent master PNG for schema / checkout (square).
    logo_sq = fit(mark, (512, 512), bg=(0, 0, 0, 0), scale=0.9)
    save_png(logo_sq, IMAGES / 'vintorex-logo.png')

    # App / PWA icons — dark plate so home-screen tiles match the brand splash.
    sizes = {
        'icon-16.png': 16,
        'icon-32.png': 32,
        'icon-48.png': 48,
        'icon-192.png': 192,
        'icon-512.png': 512,
        'apple-touch-icon.png': 180,
    }
    for name, px in sizes.items():
        # Tiny favicons need the mark larger in-frame so the silhouette reads.
        scale = 0.92 if px <= 48 else 0.78
        save_png(fit(mark, (px, px), bg=PLATE, scale=scale), ICONS / name)

    # Maskable: extra safe padding for Android adaptive icons.
    save_png(fit(mark, (512, 512), bg=PLATE, scale=0.62), ICONS / 'icon-maskable-512.png')

    # Multi-resolution favicon.ico (largest first — Pillow embeds each size as a PNG frame).
    ico_sizes = [256, 128, 64, 48, 32, 16]
    ico_imgs = [fit(mark, (s, s), bg=PLATE, scale=0.9 if s <= 48 else 0.78) for s in ico_sizes]
    favicon = ROOT / 'dist' / 'favicon.ico'
    ico_imgs[0].save(
        favicon,
        format='ICO',
        sizes=[(im.width, im.height) for im in ico_imgs],
        append_images=ico_imgs[1:],
    )
    print(f'  {favicon.relative_to(ROOT)}  sizes={list(reversed(ico_sizes))}  {favicon.stat().st_size:,} B')

    # Open Graph / Twitter card
    save_png(social_card(mark), IMAGES / 'vintorex-social.png')

    # Aspect used by chrome.js width/height attrs
    print(f'Emblem aspect: {mark.width}:{mark.height} ({mark.width / mark.height:.4f})')


if __name__ == '__main__':
    main()
