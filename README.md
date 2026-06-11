# サムライブルー トラッカー ⚽🇯🇵

日本代表のW杯を追うための **PWA**（ホーム画面に追加してアプリのように使える）。
日程・結果・ライブスコア・観戦ガイド・YouTubeライブ配信（実況／同時視聴）を1つにまとめています。

- **フロント**：素のHTML/CSS/JS（ビルド不要）→ GitHub Pages で無料公開
- **API中継**：Cloudflare Workers（APIキーを隠す・CORS解決）→ 無料
- **データ**：football-data.org（試合）＋ YouTube Data API（ライブ配信）

> Workers URL を設定しなくても、**デモデータで全画面が動きます**。まず見た目を確認 → あとからAPI接続、の順でOK。

---

## ディレクトリ構成

```
wc-japan-tracker/
├─ index.html          画面の入れ物
├─ manifest.json       PWA設定
├─ sw.js               Service Worker（オフライン）
├─ css/styles.css
├─ js/
│  ├─ app.js           タブ/ルーティング/設定
│  ├─ api.js           Workers呼び出し＋フォールバック
│  ├─ store.js         設定・キャッシュ（localStorage）
│  ├─ util.js          時刻整形・DOM生成
│  ├─ sampleData.js    デモデータ
│  └─ views/           home / schedule / live / watch
├─ icons/              アイコン（make_icons.py で再生成可）
└─ worker/
   ├─ worker.js        Cloudflare Worker 本体
   └─ wrangler.toml    設定
```

---

## 1. ローカルで動かす

静的サイトなので、簡易サーバーで開くだけ（`file://` だとESモジュールが動きません）。

```powershell
# Python があれば
cd wc-japan-tracker
python -m http.server 8000
# → http://localhost:8000 を開く
```

この時点ではデモデータが表示されます。

---

## 2. 実データに接続（Cloudflare Workers）

### 2-1. APIキーを取得（どちらも無料）
- **football-data.org**：登録 → `X-Auth-Token` を取得 … https://www.football-data.org/
- **YouTube Data API v3**：Google Cloud でAPI有効化 → APIキー作成

### 2-2. Workers をデプロイ
```powershell
cd wc-japan-tracker/worker
npx wrangler login
npx wrangler secret put FOOTBALL_TOKEN   # football-data のトークンを貼る
npx wrangler secret put YOUTUBE_KEY       # YouTube APIキーを貼る
npx wrangler deploy
# → https://samurai-blue-tracker.xxx.workers.dev が発行される
```

### 2-3. 日本代表チームIDの確認
`worker/wrangler.toml` の `TEAM_ID`（既定 `765`）。違う場合は football-data の
`/v4/teams/{id}` で日本代表のIDを確認して書き換え → 再 `deploy`。

### 2-4. アプリに登録
アプリ右上の ⚙ → 発行された Workers URL を貼って保存。実データに切り替わります。

---

## 3. 公開（GitHub Pages）

```powershell
cd wc-japan-tracker
git init
git add .
git commit -m "init: サムライブルー トラッカー"
git branch -M main
git remote add origin https://github.com/<あなた>/wc-japan-tracker.git
git push -u origin main
```
GitHub → Settings → Pages → Branch を `main` / `root` に設定 → 数分で公開URLが出ます。

---

## 4. iPhoneでアプリ化

1. SafariでGitHub PagesのURLを開く
2. 共有ボタン → **「ホーム画面に追加」**
3. アイコンが追加され、フルスクリーンのアプリとして起動します

---

## メモ

- ライブ画面は30秒ごとに自動更新します。
- 「観戦」のライブ配信は **実況・同時視聴系** を狙った検索クエリ（`wrangler.toml` の `STREAM_QUERY`）でチューニング可能。
- アイコンを変えたい場合：`python icons/make_icons.py` で再生成。
- 試合データ・配信は権利者の都合でリンク切れになることがあります（仕様）。
