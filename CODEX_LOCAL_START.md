# KAZU MAGI SYSTEM — ローカルCodex開始手順

## 目的

このリポジトリをChatGPT Workやクラウド実行ではなく、**Windows PC上のローカルCodex**で継続開発する。

## 1. ZIPを展開

例:

```powershell
cd C:\Users\<ユーザー名>\Documents\Codex
Expand-Archive .\kazu-magi-system-local-codex.zip -DestinationPath .\kazu-magi-system
cd .\kazu-magi-system
```

GitHubから開始する場合はcloneしたフォルダーで同じ手順を行う。

## 2. Node.jsを確認

```powershell
node -v
npm -v
```

Node.js 22.13以上、推奨24 LTS。

## 3. 依存関係

```powershell
npm ci
```

## 4. まず現状を起動

```powershell
npm run dev
```

ブラウザー:

`http://localhost:5173`

このサーバーは127.0.0.1のみで待ち受ける。

## 5. ローカルCodexでフォルダーを開く

Codexでこのリポジトリのルートを作業フォルダーとして開く。

最初の指示には `PROMPT_CODEX_LOCAL.md` をそのまま使用する。

`AGENTS.md` はこのリポジトリの継続ルールとして扱う。

## 6. クラウド化させない確認

Codexが以下を追加しようとした場合、ユーザーから明示指示がない限り拒否する。

- `.openai/hosting.json`
- Cloudflare Worker / R2 / D1
- Vercel / Netlify
- remote build
- cloud-only database
- hosted secret store

外部AI APIを「ローカルアプリから呼ぶ」ことは許可される。これはアプリ自体のクラウド化とは別物。

## 7. Git開始

まだGit管理していない場合:

```powershell
git init
git add .
git commit -m "Initialize local-first KAZU MAGI SYSTEM"
```

GitHubへ載せる場合:

```powershell
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

`.magi-local/` とAPIキーはGitへ入れない。

## 8. 開発中の基本確認

```powershell
npm run build
npm run test:server
```

ブラウザーテストを行う場合:

```powershell
npx playwright install chromium
npm test
```

## 現在の重要事項

既存版はローカル起動とAPIキー暗号化保存はできている。

しかし、現在のAI決議はまだ「1つの外部モデルにCASPAR・MELCHIOR・BALTHASAR・統合を4回問い合わせる」方式が中心で、前に定義した本格的なContext Engine型MAGIには達していない。

次の実装の最優先は、UIを壊さずに頭脳部分を本物にすること。
