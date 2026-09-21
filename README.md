# Wedding Gallery

41 張婚紗照，依現場的光線與場景分成四段，做成一頁式的滾動相簿。
頁面上沒有任何文字 —— 只有照片，和幾條線。

純 HTML / CSS / JavaScript，沒有套件也沒有建置流程，丟上 GitHub Pages 就能看。

---

## 先看一眼

直接用瀏覽器打開 `index.html`（不需要架伺服器）。

---

## 放到 GitHub Pages

```bash
cd wedding-gallery
git init
git add .
git commit -m "wedding gallery"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<repo 名稱>.git
git push -u origin main
```

推上去之後，到 GitHub 該 repo 的
**Settings → Pages → Build and deployment**
把 Source 設成 `Deploy from a branch`、分支選 `main`、資料夾選 `/ (root)`，按 Save。

一兩分鐘後網址是：

```
https://<你的帳號>.github.io/<repo 名稱>/
```

> repo 要設成 Public，Pages 才會免費開通。

---

## 四段編排

| | 場景 | 張數 |
|---|---|---|
| I | 陽明山草原、藍天藍紗 | 8 |
| II | 森林、深藍晚禮服 | 5 |
| III | 地下道暖金燈光 | 11 |
| IV | 頂樓日落、提燈、頭紗 | 17 |

順序是照色溫排的，從最亮走到最暗。封面用頭紗在風裡展開那張，首屏會在四張精選之間緩慢推近輪播。

---

## 想換照片 / 改編排？

`tools/` 裡有兩支 Python 腳本，重跑一次就會重新產生所有網頁用圖片與資料。
需要 Pillow：`pip install Pillow`

```bash
python tools/build_assets.py "C:\路徑\到\原始照片資料夾"
python tools/make_data.py
```

兩支腳本都會自動把輸出放回這個資料夾，搬到哪都不用改路徑。

`make_data.py` 裡的 `CHAPTERS` 就是編排本身 —— 每一行是
`("檔名不含副檔名", "版面代號")`：

| 版面代號 | 效果 |
|---|---|
| `full` | 整行滿版 |
| `wide` | 整行、左右各留一點邊 |
| `lg-l` / `lg-r` | 大圖靠左 / 靠右 |
| `sm-l` / `sm-r` | 小圖靠左 / 靠右（會和相鄰的大圖並排） |
| `md-c` | 中等大小、置中 |
| `duo` | 兩張並排（連續寫兩個 `duo`） |

> 小圖要和大圖並排時，**小圖那行要寫在大圖前面**（CSS Grid 由左往右填）。

同一支腳本也會在 `_preview/` 產生一批 560px 小圖方便挑照片，
那個資料夾已寫進 `.gitignore`，不會上傳。

`HERO` 那一行是首屏輪播的四張，改成你喜歡的檔名就好。

---

## 檔案結構

```
wedding-gallery/
├── index.html          頁面骨架
├── assets/
│   ├── data.js         照片資料 + 章節編排（腳本產生）
│   ├── style.css       樣式與動畫
│   └── app.js          互動（輪播、視差、燈箱…）
├── photos/
│   ├── thumb/          900px，小版面用（2.3 MB）
│   └── full/           2400px，大版面與燈箱用（7.9 MB）
├── tools/              重新產生圖片的腳本
└── .nojekyll           讓 GitHub Pages 原樣輸出
```

原始檔（約 650 MB）沒有放進來，壓成 WebP 後整站約 10 MB。

網格用 `srcset` 讓瀏覽器自己挑：滿版和大版面抓 2400px 的圖，小版面維持 900px —— 大圖不會糊，小圖也不會白白變重。

---

## 操作方式

- 滾動瀏覽；右側四段細線是進度，也可以點著跳章節
- 點任一張照片開啟燈箱：`←` `→` 換頁、`Esc` 關閉、滾輪也能切換
- 手機上左右滑動換頁、向下滑關閉，底部有縮圖膠卷
- 系統開了「減少動態效果」的話，所有動畫會自動降級
