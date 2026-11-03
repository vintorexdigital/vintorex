#!/usr/bin/env python3
# Builds the header/footer brand name from the gold script artwork
# (dist/images/vintorex-name-3d-source.jpg — the same "Vintorex" lockup as the
# supplied brand file). White is knocked out; the black edge and soft shadow stay.
# A -dark twin lightens that edge so the name still reads on the charcoal footer
# and the boot screen. The "DIGITAL SOLUTIONS" tagline webps are a separate cut
# and are left in place.
#   python3 scripts/build-wordmark.py
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'dist' / 'images'
SOURCE = IMAGES / 'vintorex-name-3d-source.jpg'
WIDTHS = (400, 800)


def cutout(rgb: np.ndarray) -> Image.Image:
    """Lift the script off white. JPEG speckle stays transparent; the soft shadow stays."""
    dist = np.linalg.norm(255 - rgb, axis=-1)
    ys, xs = np.where(dist > 16)
    pad = 8
    y0, y1 = max(0, int(ys.min()) - pad), min(rgb.shape[0], int(ys.max()) + pad + 1)
    x0, x1 = max(0, int(xs.min()) - pad), min(rgb.shape[1], int(xs.max()) + pad + 1)
    rgb = rgb[y0:y1, x0:x1]
    dist = dist[y0:y1, x0:x1]
    # Keep the artwork's own colours. Only the near-white fringe becomes transparent,
    # so the gold, the black edge and the soft shadow match the source on a light header.
    alpha = np.clip((dist - 8) / 12, 0, 1)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.3))
    alpha = np.asarray(alpha_img).astype(np.float32) / 255
    alpha[alpha < 0.03] = 0
    fg = rgb.copy()
    fg[alpha < 0.03] = 0
    return Image.fromarray(np.dstack([np.clip(fg, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA')


def for_dark(img: Image.Image) -> Image.Image:
    """Same gold face and black edge. Drop the pale shadow so it does not turn into a grey plate."""
    arr = np.asarray(img).astype(np.float32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    lum = rgb.mean(axis=-1)
    spread = rgb.max(axis=-1) - rgb.min(axis=-1)
    pale = (spread < 22) & (lum > 70)
    alpha = alpha.copy()
    rgb = rgb.copy()
    alpha[pale] = 0
    rgb[pale] = 0
    return Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')


def save_widths(img: Image.Image, suffix: str) -> None:
    for width in WIDTHS:
        height = max(1, round(img.height * width / img.width))
        out = img.resize((width, height), Image.LANCZOS)
        path = IMAGES / f'vintorex-name{suffix}-{width}.webp'
        out.save(path, 'WEBP', quality=92, method=6)
        print(f'  {path.relative_to(ROOT)}  {out.size[0]}×{out.size[1]}  {path.stat().st_size:,} B')


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f'Missing wordmark artwork: {SOURCE}')
    rgb = np.asarray(Image.open(SOURCE).convert('RGB')).astype(np.float32)
    light = cutout(rgb)
    save_widths(light, '')
    save_widths(for_dark(light), '-dark')
    print(f'Name aspect: {light.width}:{light.height} ({light.width / light.height:.4f})')


if __name__ == '__main__':
    main()
