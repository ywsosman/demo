"""Generate a static MediDiagnose orb logo PNG for PDF headers."""

from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 256
OUTPUT = Path(__file__).resolve().parent.parent / "assets" / "medidiagnose-orb.png"


def generate_orb_logo(size: int = SIZE) -> Image.Image:
    center = (size - 1) / 2.0
    y, x = np.mgrid[:size, :size].astype(np.float64)
    dx = (x - center) / (size / 2)
    dy = (y - center) / (size / 2)
    dist = np.sqrt(dx * dx + dy * dy)

    edge = np.clip(1.0 - dist, 0.0, 1.0) ** 1.45
    depth = np.clip(1.0 - dist * 0.92, 0.0, 1.0)

    inner = depth ** 0.7
    outer = (1.0 - depth) ** 0.5

    base1 = np.array([156.0, 67.0, 254.0])
    base2 = np.array([77.0, 194.0, 233.0])
    base3 = np.array([15.0, 20.0, 153.0])

    rgb = (
        base2 * inner[..., None]
        + base3 * outer[..., None]
        + base1 * (inner * 0.22)[..., None]
    )
    rgb = np.clip(rgb * (0.45 + edge[..., None] * 0.85), 0, 255)

    glint_dist = np.sqrt((dx + 0.24) ** 2 + (dy + 0.3) ** 2)
    glint = np.exp(-(glint_dist * 6.5) ** 2) * edge * 0.95
    rgb[..., 0] = np.clip(rgb[..., 0] + glint * 255, 0, 255)
    rgb[..., 1] = np.clip(rgb[..., 1] + glint * 255, 0, 255)
    rgb[..., 2] = np.clip(rgb[..., 2] + glint * 220, 0, 255)

    gold_dist = np.sqrt((dx - 0.3) ** 2 + (dy - 0.18) ** 2)
    gold = np.exp(-(gold_dist * 10.0) ** 2) * edge * 0.4
    rgb[..., 0] = np.clip(rgb[..., 0] + gold * 255, 0, 255)
    rgb[..., 1] = np.clip(rgb[..., 1] + gold * 195, 0, 255)

    alpha = (edge * 255).astype(np.uint8)
    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    generate_orb_logo().save(OUTPUT, "PNG")
    print(f"Saved {OUTPUT}")


if __name__ == "__main__":
    main()
