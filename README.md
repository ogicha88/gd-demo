# GDデモ

グループディスカッション（GD）未経験の学生向けに、模範的なGDの流れを2〜3分のアニメーションで見られるWebアプリです。

- GDの型（ビジネス型・課題解決型・抽象テーマ型・フェルミ推定型・選択/ディベート型）× お題3つ
- 参加人数（4 / 5 / 6人）を選ぶと役割分担（司会・タイムキーパー・書記・発表者・メンバー）が決まり、キャラクターが吹き出しで議論を進める
- 台本は Cloudflare Workers AI で生成し、KV にキャッシュ
- ログイン不要。リンクを開けば誰でも見られる

## 操作

| 画面 | 操作 |
| --- | --- |
| ホーム | 型カードを左右にフリックで切り替え、お題をタップ |
| 人数選択シート | 人数をタップ or キャラクター部分を左右フリック／上フリックで次へ／下フリックで閉じる |
| 役割分担 | 上フリックでデモ開始／右フリックで戻る／シャッフルで配役変更 |
| デモ | 左右フリックで発言送り・戻し、ステージをタップで一時停止、速度 ×1 / ×1.5 / ×2 |

## 技術構成

| 領域 | 採用技術 |
| --- | --- |
| フロントエンド | React 19 + TypeScript + Vite |
| アニメーション・ジェスチャー | Motion（旧 Framer Motion） |
| バックエンド | Cloudflare Workers + Hono |
| 静的配信 | Workers Static Assets（同じ Worker から配信） |
| AI | Workers AI（`@cf/openai/gpt-oss-120b`） |
| キャッシュ | Workers KV |
| ビルド | `@cloudflare/vite-plugin` |

## 開発

```bash
npm install
npm run dev
```

Windows でプロジェクトのパスが深い場合は、ローカル状態の保存先を短いパスにします。

```bash
set LOCAL_STATE_DIR=C:\temp\gdstate && npm run dev
```

## デプロイ

```bash
npx wrangler login
npm run deploy
```

台本の事前生成（管理用、`WARM_TOKEN` シークレットが必要）:

```bash
curl -X POST -H "x-warm-token: <WARM_TOKEN>" "https://<host>/api/warm?topic=biz-cafe&size=4"
```
