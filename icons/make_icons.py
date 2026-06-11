"""アプリアイコンを生成する（紺背景 + 日の丸 + ゴールドリング）。
   再生成: python icons/make_icons.py
"""
from PIL import Image, ImageDraw
import os

OUT = os.path.dirname(os.path.abspath(__file__))

NAVY = (10, 14, 42)
NAVY2 = (27, 34, 112)
RED = (228, 0, 43)
GOLD = (242, 193, 78)
WHITE = (246, 248, 255)


def draw_icon(size, maskable=False):
    # 高解像度で描いて縮小（アンチエイリアス）
    S = size * 4
    img = Image.new("RGB", (S, S), NAVY)
    d = ImageDraw.Draw(img)

    # 斜めグラデーション風（簡易：上に明るい紺の楕円）
    d.ellipse([-S * 0.3, -S * 0.5, S * 0.9, S * 0.6], fill=NAVY2)

    cx, cy = S / 2, S / 2
    # maskable はセーフゾーンを考慮して円を小さめに
    r = S * (0.30 if maskable else 0.34)

    # ゴールドのリング
    ring = r * 1.16
    d.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], outline=GOLD, width=int(S * 0.012))

    # 日の丸
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=RED)

    img = img.resize((size, size), Image.LANCZOS)
    return img


targets = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-maskable-512.png", 512, True),
    ("icon-180.png", 180, False),  # apple-touch-icon
]

for name, sz, mask in targets:
    draw_icon(sz, mask).save(os.path.join(OUT, name))
    print("wrote", name)
