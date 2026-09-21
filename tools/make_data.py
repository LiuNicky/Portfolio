# -*- coding: utf-8 -*-
"""把 photos.json + 美術編排 合成網站用的 assets/data.js"""
import json, os, io

# 網站根目錄 = tools 的上一層，資料夾搬到哪都不用改
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
photos = {p["id"]: p for p in json.load(open(os.path.join(OUT, "photos.json"), encoding="utf-8"))}

# ── 美術編排 ──────────────────────────────────────────────
# lay：12 欄網格上的版面。full=滿版 / wide=幾乎滿版 / lg-l,lg-r=大圖偏側
#      md-c=中置 / sm-l,sm-r=小圖偏側 / duo=成對並排（連續兩張自動並排）
HERO = ["YR5_3422", "IMG_1276", "YR5_3359", "IMG_1190"]

CHAPTERS = [
    {
        "no": "I", "zh": "晴", "en": "Clear Sky",
        "note": "藍得不像話的那天，風把裙襬吹成了海浪。",
        "photos": [
            ("YR5_3069", "wide"),
            ("YR5_3076", "duo"), ("YR5_3082", "duo"),
            ("YR5_3226", "sm-l"),
            ("YR5_3100", "lg-r"),
            ("YR5_3112", "lg-l"),
            ("YR5_3189", "sm-r"),
            ("YR5_3159", "wide"),
        ],
    },
    {
        "no": "II", "zh": "林", "en": "In the Woods",
        "note": "走進樹的陰影裡，聲音都慢了下來。",
        "photos": [
            ("IMG_1074", "md-c"),
            ("YR5_3261", "duo"), ("YR5_3266", "duo"),
            ("YR5_3311", "lg-r"),
            ("YR5_3337", "wide"),
        ],
    },
    {
        "no": "III", "zh": "巷", "en": "Underpass",
        "note": "一條被燈照暖的地下道，車聲在身後，我們在裡面。",
        "photos": [
            ("IMG_1114-1", "md-c"),
            ("IMG_1163-2", "lg-l"),
            ("IMG_1210-1", "sm-r"),
            ("IMG_1173-1", "wide"),
            ("IMG_1178-2", "duo"), ("IMG_1183-3", "duo"),
            ("IMG_1220-2", "sm-l"),
            ("IMG_1190", "lg-r"),
            ("IMG_1202-2", "wide"),
            ("IMG_1191-2", "duo"), ("IMG_1236-2", "duo"),
        ],
    },
    {
        "no": "IV", "zh": "暮", "en": "Golden Hour",
        "note": "太陽下班前的最後一小時，把所有東西都鍍成金色。",
        "photos": [
            ("YR5_3422", "full"),
            ("IMG_1264", "wide"),
            ("IMG_1276", "duo"), ("IMG_1267", "duo"),
            ("IMG_1284", "wide"),
            ("YR5_3345", "lg-l"),
            ("YR5_3406", "sm-r"),
            ("IMG_1315", "sm-l"),
            ("YR5_3371", "lg-r"),
            ("YR5_3349", "wide"),
            ("YR5_3351", "full"),
            ("IMG_1299", "lg-l"),
            ("IMG_1301", "sm-r"),
            ("YR5_3381", "wide"),
            ("YR5_3423", "duo"), ("YR5_3426", "duo"),
            ("YR5_3359", "full"),
        ],
    },
]

# 每張照片的替代文字（無障礙 + SEO）
ALT = {
    "IMG_1074": "新郎站在蕨葉叢前的全身照",
    "IMG_1114-1": "為新娘戴上婚戒的手部特寫",
    "IMG_1163-2": "地下道裡相視而笑的兩人",
    "IMG_1173-1": "靠著牆親吻的側影",
    "IMG_1178-2": "地下道長廊中並肩而立",
    "IMG_1183-3": "隔著走道對望",
    "IMG_1190": "新娘捧著新郎的臉",
    "IMG_1191-2": "額頭相靠的特寫",
    "IMG_1202-2": "越過新郎肩膀望向新娘",
    "IMG_1210-1": "新郎倚牆的單人照",
    "IMG_1220-2": "新娘抬頭凝視新郎",
    "IMG_1236-2": "手牽手走過地下道，手裡是白玫瑰捧花",
    "IMG_1264": "夕陽下相視而笑的半身合影",
    "IMG_1267": "額頭相抵的親密時刻",
    "IMG_1276": "從高處俯拍，兩人仰頭大笑",
    "IMG_1284": "頭紗罩住兩人，中間是一束捧花",
    "IMG_1299": "提著油燈對望的逆光剪影",
    "IMG_1301": "提燈相依，背後是城市天際線",
    "IMG_1315": "低頭看著手中油燈的兩人",
    "YR5_3069": "藍天下的木柵欄前並肩而立",
    "YR5_3076": "草原上的擁抱",
    "YR5_3082": "新郎坐在柵欄上，新娘倚著他",
    "YR5_3100": "新娘趴在木柵欄上遠望",
    "YR5_3112": "並肩趴在柵欄上看向遠方山谷",
    "YR5_3159": "透過前景柵欄望見的兩人",
    "YR5_3189": "坐在草地上，手裡一束小花",
    "YR5_3226": "在草原上一邊走一邊大笑",
    "YR5_3261": "森林裡坐在倒木上的兩人",
    "YR5_3266": "林間的笑臉特寫",
    "YR5_3311": "捧著紅色花束親吻",
    "YR5_3337": "蕨類環繞的林中背影",
    "YR5_3345": "撐著紅傘走來",
    "YR5_3349": "夕照停車場裡牽著手",
    "YR5_3351": "逆光長廊中的遠景剪影",
    "YR5_3359": "橙色天光下的擁抱剪影",
    "YR5_3371": "把新娘抱起來的那一刻",
    "YR5_3381": "隔著鏽蝕欄杆看見的兩人",
    "YR5_3406": "圓鏡裡的兩人與比出的愛心",
    "YR5_3422": "頭紗在風裡展開，新娘捧著花",
    "YR5_3423": "提燈相望",
    "YR5_3426": "天台兩端，燈光在中間",
}

items, seen_order = [], []
for ch in CHAPTERS:
    for pid, lay in ch["photos"]:
        if pid not in photos:
            raise SystemExit("找不到照片：" + pid)

# 展平成燈箱用的連續序列（同一張圖在不同章節重複出現時，只算第一次）
flat, index_of = [], {}
for ch in CHAPTERS:
    for pid, lay in ch["photos"]:
        if pid not in index_of:
            index_of[pid] = len(flat)
            flat.append(pid)

used = set(index_of)
missing = set(photos) - used
if missing:
    raise SystemExit("有照片沒排進任何章節：" + ", ".join(sorted(missing)))

def entry(pid):
    p = photos[pid]
    return {
        "id": pid, "w": p["w"], "h": p["h"], "r": p["ratio"],
        "o": p["orient"][0],              # p / l
        "c": p["colors"][0], "lum": p["lum"],
        "q": p["lqip"], "alt": ALT.get(pid, "婚紗照"),
    }

data = {
    "hero": HERO,
    "photos": {pid: entry(pid) for pid in flat},
    "order": flat,
    "chapters": [
        {"no": c["no"], "zh": c["zh"], "en": c["en"], "note": c["note"],
         "items": [{"id": p, "lay": l} for p, l in c["photos"]]}
        for c in CHAPTERS
    ],
}

os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
with open(os.path.join(OUT, "assets", "data.js"), "w", encoding="utf-8") as f:
    f.write("/* 照片資料與章節編排 —— 由 build 腳本產生，可手動微調 */\n")
    f.write("window.GALLERY = ")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

size = os.path.getsize(os.path.join(OUT, "assets", "data.js")) / 1024
print("data.js  %.1f KB  /  %d 張照片  /  %d 個章節" % (size, len(flat), len(CHAPTERS)))
for c in CHAPTERS:
    print("  %-4s %s %-14s %2d 張" % (c["no"], c["zh"], c["en"], len(c["photos"])))
