# ゴールデンレコード財務ダッシュボード

freeeのデータをリアルタイムで表示するAI財務参謀ダッシュボードです。

---

## デプロイ手順（所要時間：約20分）

### 事前準備（インストール）

以下が必要です（すべて無料）：
- **Node.js** https://nodejs.org/ja からダウンロード・インストール
- **Git** https://git-scm.com からダウンロード・インストール
- **GitHubアカウント** https://github.com で作成
- **Vercelアカウント** https://vercel.com で作成（GitHubでログイン）

---

### Step 1：freeeのrefresh_tokenを取得する

ターミナル（Macの場合はアプリ「ターミナル」）を開き、このフォルダに移動：

```bash
cd （このフォルダのパス）/golden-record-dashboard
npm install
node scripts/get-token.js
```

表示されたURLをブラウザで開き → freeeにログイン → 認証コードをコピーしてターミナルに貼り付ける。

すると以下のような出力が出ます：
```
FREEE_CLIENT_ID=743790946263976
FREEE_CLIENT_SECRET=xxxxx
FREEE_REFRESH_TOKEN=xxxxxxxxxxxxxxxx  ← これが重要！
FREEE_COMPANY_ID=11590903
```

**この4行をメモしておいてください（後でVercelに設定します）。**

---

### Step 2：GitHubにコードをアップロードする

1. https://github.com/new でリポジトリを作成
   - Repository name: `golden-record-dashboard`
   - **Private**（非公開）を選択
   - 「Create repository」をクリック

2. ターミナルで以下を実行（`your-username`は自分のGitHubユーザー名に変更）：

```bash
cd （このフォルダのパス）/golden-record-dashboard
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/your-username/golden-record-dashboard.git
git push -u origin main
```

---

### Step 3：Vercelにデプロイする

1. https://vercel.com にアクセス（GitHubでログイン）
2. 「Add New Project」→ GitHubの `golden-record-dashboard` を選択
3. 「Environment Variables」に以下を追加：

| Name | Value |
|------|-------|
| `FREEE_CLIENT_ID` | `743790946263976` |
| `FREEE_CLIENT_SECRET` | （Step1で取得した値） |
| `FREEE_REFRESH_TOKEN` | （Step1で取得した値） |
| `FREEE_COMPANY_ID` | `11590903` |

4. 「Deploy」をクリック

---

### Step 4：URLを共有する

デプロイ完了後、`https://golden-record-dashboard-xxxx.vercel.app` のようなURLが発行されます。
このURLをゴールデンレコードの代表に共有すれば完了です。

---

## ローカルで試す場合

```bash
cp .env.local.example .env.local
# .env.local を編集して各値を入力
npm run dev
# http://localhost:3000 で確認
```

---

## 注意事項

- `.env.local` はGitにコミットしないでください（`.gitignore`で除外済み）
- refresh_tokenは30日使わないと失効します（使っていれば自動更新）
- 失効した場合は `node scripts/get-token.js` を再実行してVercelの環境変数を更新してください
