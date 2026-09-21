# -*- coding: utf-8 -*-
"""把原始婚紗照轉成網頁用資源：縮圖、大圖、LQIP 模糊佔位、主色調。"""
import base64, io, json, os, sys
from PIL import Image, ImageOps, ImageFilter

# 原始照片資料夾（也可以用命令列第一個參數指定）
SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\nicky\Desktop\水花\41"
# 網站根目錄 = tools 的上一層，資料夾搬到哪都不用改
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DIR_THUMB = os.path.join(OUT, "photos", "thumb")
DIR_FULL = os.path.join(OUT, "photos", "full")
DIR_PREVIEW = os.path.join(OUT, "_preview")   # 給我自己看的小圖，不進網站
for d in (DIR_THUMB, DIR_FULL, DIR_PREVIEW):
    os.makedirs(d, exist_ok=True)

THUMB_W = 900          # 網格用（考量 2x 螢幕）
FULL_LONG = 2400       # 燈箱大圖長邊
LQIP_W = 20            # 模糊佔位


def dominant(img):
    """取幾個代表色，回傳 hex 與平均亮度。"""
    small = img.convert("RGB").resize((60, 60), Image.LANCZOS)
    pal = small.quantize(colors=6, method=Image.MEDIANCUT).convert("RGB")
    colors = sorted(pal.getcolors(60 * 60), key=lambda c: -c[0])
    hexes = ["#%02x%02x%02x" % c[1] for c in colors[:3]]
    px = list(small.getdata())
    lum = sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px) / len(px)
    return hexes, round(lum / 255, 3)


def lqip(img):
    w = LQIP_W
    h = max(1, round(img.height / img.width * w))
    tiny = img.convert("RGB").resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    buf = io.BytesIO()
    tiny.save(buf, "JPEG", quality=42)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


files = sorted(f for f in os.listdir(SRC) if f.lower().endswith((".jpg", ".jpeg", ".png")))
items = []
for i, name in enumerate(files, 1):
    stem = os.path.splitext(name)[0]
    with Image.open(os.path.join(SRC, name)) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        w, h = im.size

        # 大圖
        scale = FULL_LONG / max(w, h)
        full = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS) if scale < 1 else im.copy()
        full.save(os.path.join(DIR_FULL, stem + ".webp"), "WEBP", quality=84, method=6)

        # 縮圖
        ts = THUMB_W / w
        thumb = im.resize((THUMB_W, max(1, round(h * ts))), Image.LANCZOS) if ts < 1 else im.copy()
        thumb.save(os.path.join(DIR_THUMB, stem + ".webp"), "WEBP", quality=80, method=6)

        # 給美術決策看的預覽（小 jpg，不進 repo）
        pv = im.copy()
        pv.thumbnail((560, 560), Image.LANCZOS)
        pv.save(os.path.join(DIR_PREVIEW, "%02d_%s.jpg" % (i, stem)), "JPEG", quality=72)

        colors, lum = dominant(im)
        items.append({
            "id": stem,
            "src": name,
            "w": w, "h": h,
            "ratio": round(w / h, 4),
            "orient": "landscape" if w > h else "portrait",
            "colors": colors,
            "lum": lum,
            "lqip": lqip(im),
        })
    print("[%2d/%d] %s  %dx%d  %s" % (i, len(files), name, w, h, colors[0]), flush=True)

with open(os.path.join(OUT, "photos.json"), "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=1)


def dirsize(p):
    return sum(os.path.getsize(os.path.join(p, x)) for x in os.listdir(p)) / 1048576

print("\nthumb %.1f MB / full %.1f MB" % (dirsize(DIR_THUMB), dirsize(DIR_FULL)))
