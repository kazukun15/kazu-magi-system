# KAZU MAGI SYSTEM — GitHub対応 / LOCAL CODEX EDITION

CASPAR × MELCHIOR × BALTHASAR。Kazu専用のローカルファースト意思決定コンソールです。

## GitHubで使う

GitHub Actionsの **MAGI Decision → Run workflow** から相談を実行できます。
APIキーは **Settings → Secrets and variables → Actions** に `MAGI_API_KEY` として登録してください。
キーをブラウザーやビルド成果物へ渡さず、実行時のNodeプロセスだけで使います。
結果はActionsのSummaryとダウンロード用Artifactに出力されます。

アップロード、Secrets設定、実行手順は **[GITHUB_SETUP.md](GITHUB_SETUP.md)** を参照してください。
既存画面はローカルで動きます。GitHub ActionsはWeb画面をホスティングしません。
自動CIも追加しています。開発は引き続きローカルで行います。

この版は**開発環境をローカルCodexへ固定するための整理版**です。クラウドホスティング用の `.openai/hosting.json`、Cloudflare Worker、R2/D1前提のビルド処理は除去しています。

## 起動

Node.js **22.13以上**、推奨24 LTS。

```bash
npm ci
npm run dev
```

ブラウザーで:

```text
http://localhost:5173
```

ローカルサーバーは `127.0.0.1` のみで待ち受けます。

## ローカルCodexで続きから作る

1. このフォルダーをCodexの作業フォルダーとして開く。
2. `AGENTS.md` をリポジトリルールとして維持する。
3. 最初の依頼に `PROMPT_CODEX_LOCAL.md` の内容を使う。
4. 詳細は `CODEX_LOCAL_START.md` を参照する。

## 現在の実装

- React 19 + Vite UI
- PC / スマートフォン向けレスポンシブMAGI UI
- CASPAR / MELCHIOR / BALTHASARの3コア表示
- NodeローカルAPI
- APIキーを `.magi-local/` にAES-256-GCMで暗号化保存
- Gemini / OpenAI / DeepSeek / Groq / OpenRouter接続
- Mock / Demoモード
- 決議画面・履歴・詳細・設定・診断

## 重要な現在地

ローカル動作基盤はありますが、頭脳部分はまだ完成形ではありません。

現在は主に:

```text
入力
→ 同じ選択AIへCASPAR Prompt
→ 同じ選択AIへMELCHIOR Prompt
→ 同じ選択AIへBALTHASAR Prompt
→ 同じ選択AIへConsensus Prompt
```

という4回呼び出しです。

目標は:

```text
入力
→ Context Engine
→ AI必要性判定
→ CASPAR / MELCHIOR / BALTHASAR独立評価
→ Weighted Consensus
→ Minority Report / Veto / Confidence
→ Decision Memory
```

です。

## AI設定

設定画面で外部AIのAPIキーを登録できます。キーはブラウザーLocalStorageへ保存せず、ローカルサーバー側の `.magi-local/` へ暗号化保存します。

将来の優先方針は:

1. Context Engine / local rules
2. local AI
3. free-tier AI
4. optional external AI

です。

## APIキー保護

- ブラウザーに再表示しない
- LocalStorageに保存しない
- `.magi-local/` はGit対象外
- サーバーは127.0.0.1のみ
- 外部Provider送信先は固定ホスト
- APIキーをログ・Decision Memory・生成ドキュメントへ保存しない

ローカルキー設定を全消去する場合は、アプリ停止後に `.magi-local/` を削除してください。

## Commands

```bash
npm run dev
npm run build
npm start
npm run test:server
npm run test:local
```

Playwright Chromium導入後:

```bash
npx playwright install chromium
npm test
```

## 主なファイル

- `AGENTS.md`：Codexに対する正式なローカル開発ルール
- `PROMPT_CODEX_LOCAL.md`：最初にCodexへ渡すマスタープロンプト
- `CODEX_LOCAL_START.md`：Windows中心の開始手順
- `src/App.jsx`：画面、相談、履歴、詳細
- `src/components/`：UI部品
- `src/tokens.css`：Design Token
- `server/magi.js`：現行AI API・暗号化キーストア
- `scripts/local-dev.mjs`：ローカルWeb/APIサーバー
- `tests/`：API、ローカルセキュリティ、レスポンシブUI
- `public/core-chamber.webp`：3基の演算コアの主要ビジュアル

## ローカル版で除去したもの

意図しないクラウド移行を防ぐため、以下はこの版に含めません。

- `.openai/hosting.json`
- `server/worker.js`
- `scripts/build-worker.mjs`
- Cloudflare Worker用dist成果物

将来Kazuが公開を明示的に指示したときのみ、ローカル版とは別のdeploy layerとして追加してください。

## 今回の検証（2026-10-06）

- Vite本番ビルド成功
- API・GitHub実行アダプターの14テスト成功（外部AI応答はモック）
- Chromiumで11画面サイズ、相談・履歴・設定操作を確認
- キー保存・接続テスト・AI評価・削除の画面経路をモックAIで確認
- 実ローカルサーバーの暗号化保存、Host検証、CSRF、キー非公開を確認

既存の本番サーバーでトップページが404になるパス判定も修正しました。
Node 24ではfetchのHost上書きが反映されないため、Host検証テストは実HTTPリクエストへ変更しています。
実際のGitHub Actions実行・実APIキーによる接続・GitHubへのアップロードは未実施です。
