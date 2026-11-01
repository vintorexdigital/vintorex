#!/usr/bin/env python3
# Cuts the brand name and tagline out of the supplied logo artwork for the site header, footer and
# dashboards: "Vintorex" in Gladiola and "DIGITAL SOLUTIONS" in Montaser Arabic, both with Canva's
# echo effect. Every pixel of the artwork is gold over grey, so each is stored as how much of each it
# holds. That recolours the echo and tagline exactly for dark backgrounds and fits a small palette.
# Run from the repo root after replacing dist/images/vintorex-wordmark-original.png:
#   python3 scripts/build-wordmark.py
from pathlib import Path
import numpy as np
from PIL import Image

IMAGES = Path('dist/images')
GOLD = np.array([173, 131, 48]) / 255
GREY = np.array([84, 84, 84]) / 255
STEPS = 21  # coverage steps per colour: (21 + 1) * (21 + 2) / 2 = 253 palette entries
# Crop boxes in the artwork (each part with its echo), output widths, and the grey that replaces
# #545454 on light (header, client dashboard) and dark (footer, admin) backgrounds.
PARTS = {
    'name': ((49, 56, 1447, 357), (400, 800), {'': (84, 84, 84), '-dark': (170, 170, 170)}),
    'tagline': ((257, 379, 1197, 427), (300, 600), {'': (84, 84, 84), '-dark': (217, 217, 217)}),
}

art = np.array(Image.open(IMAGES / 'vintorex-wordmark-original.png').convert('RGBA')) / 255
premultiplied = art[..., :3] * art[..., 3:]
mix, *_ = np.linalg.lstsq(np.stack([GOLD, GREY], 1), premultiplied.reshape(-1, 3).T, rcond=None)
gold, grey = np.clip(mix, 0, 1).reshape(2, *art.shape[:2])

def scaled(layer, box, width):
    crop = Image.fromarray(layer[box[1]:box[3], box[0]:box[2]].astype(np.float32), 'F')
    return np.clip(np.array(crop.resize((width, round(crop.height * width / crop.width)), Image.LANCZOS)), 0, 1)

def palette_image(g, s, echo):
    gi, si = np.rint(g * STEPS).astype(int), np.rint(s * STEPS).astype(int)
    si = np.minimum(si, STEPS - gi)
    entries = [(i, j) for i in range(STEPS + 1) for j in range(STEPS + 1 - i)]
    lookup = np.zeros((STEPS + 1, STEPS + 1), np.uint8)
    colours, alphas = [], []
    for k, (i, j) in enumerate(entries):
        lookup[i, j] = k
        alpha = (i + j) / STEPS
        rgb = (i * GOLD + j * np.array(echo) / 255) / (i + j) if i + j else np.zeros(3)
        colours += [round(c * 255) for c in rgb]
        alphas.append(round(alpha * 255))
    image = Image.fromarray(lookup[gi, si], 'P')
    image.putpalette(colours)
    image.info['transparency'] = bytes(alphas)
    return image.convert('RGBA')

for part, (box, widths, variants) in PARTS.items():
    for width in widths:
        g, s = scaled(gold, box, width), scaled(grey, box, width)
        for suffix, echo in variants.items():
            out = IMAGES / f'vintorex-{part}{suffix}-{width}.webp'
            palette_image(g, s, echo).save(out, lossless=True, method=6)
            print(out, out.stat().st_size, 'bytes')
