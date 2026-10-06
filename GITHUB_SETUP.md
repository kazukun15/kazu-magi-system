# GitHubで使う手順

既存のMAGI画面はローカルで使用し、GitHubではActions画面から相談を実行できます。
APIキーはGitHubのSecrets設定へ登録し、実行時だけNodeプロセスへ渡します。
キーはブラウザー、ビルド成果物、結果ファイルへ埋め込みません。

## 1. リポジトリへアップロード

`package.json`、`src/`、`server/`、`scripts/`、`tests/`、`public/`、`.github/`など、
**このフォルダーの中身をリポジトリの直下**へ置いてください。
`.github/workflows/`が一段深いフォルダーに入るとActionsは認識しません。

GitHub Desktopでこのフォルダーを追加してPublish repositoryを実行するか、Gitでpushします。
相談内容や結果を扱うため、Privateリポジトリを推奨します。
`node_modules/`、`.magi-local/`、`.env`、`magi-results/`はアップロードしません。
ZIP自体を置くだけではActionsは動きません。

## 2. APIキーをSecretsに登録

リポジトリの以下を開きます。

**Settings → Secrets and variables → Actions → New repository secret**

| 項目 | 設定 |
| --- | --- |
| Name | `MAGI_API_KEY` |
| Secret | 使用するAIサービスのAPIキー |

キーはこの設定欄だけに入力します。ソース、相談欄、モデル欄、Issueには入力しません。
OpenAI、Gemini、DeepSeek、Groq、OpenRouterのうち、選択するサービスのキーを登録してください。
別のサービスへ切り替える場合はSecretもそのサービスのキーに更新してください。
`VITE_`から始まる環境変数へキーを入れないでください。

公式手順: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets

## 3. 相談を実行

1. `.github/workflows/magi-decide.yml`がデフォルトブランチに入っていることを確認します。
2. **Actions → MAGI Decision → Run workflow**を開きます。
3. 相談内容を入力します。
4. `provider`にキーと同じサービスを指定します。`mock`はキー不要の動作確認です。
5. `model`は必要に応じて利用可能なモデル名を指定します。空欄なら既存の既定値を使います。
6. 必要ならカテゴリ・重視する条件を入力し、**Run workflow**を押します。
7. 終了後、実行の**Summary**で3コアと最終決議を確認します。
8. **Artifacts → magi-decision-…**から`decision.md`と`decision.json`をダウンロードできます。

相談内容はGitHubの実行入力、結果はSummaryとArtifactに保存されます。
個人情報・秘密情報は相談に含めないでください。Publicの場合、他者に見える可能性があります。
Artifactsの保存期間は7日です。Summaryや実行履歴は別に残るため、必要な場合は実行自体を削除してください。
GitHubへのコメント投稿や結果のコミットは行いません。

## 実行と料金

外部AIモードは既存の3コア評価＋合議統合を行うため、1回の相談で4回のAPI呼び出しが発生します。
API利用料・モデルの利用可否・GitHub Actionsの利用枠は各契約によります。
既定モデルが使えない場合はRun workflowの`model`を変更してください。
`mock`ではAPIを呼ばず、判断結果は`INSUFFICIENT_DATA`です。
Context Engine・重み付き合議・ローカルAIは今回のGitHub対応では追加していません。

## 自動チェック

pushとPull Requestで**Build and test**が動き、APIテスト、GitHub実行テスト、
ビルド、Chromiumの画面テストを実行します。このワークフローにはAPIキーを渡しません。
実AIへの接続は手動のMAGI Decisionだけで実行します。

## ローカル画面を使う

```sh
npm ci
npm run dev
```

`http://localhost:5173`を開き、既存の設定画面でキーを登録できます。
GitHub SecretsはローカルPCへ自動配布されません。
ローカル画面のキーは引き続き`.magi-local/`に暗号化保存されます。

## GitHub Pagesについて

GitHub Pagesは静的ファイルの公開用で、このNode APIサーバーを実行できません。
Secretsをフロントエンドへ埋め込むと閲覧者から読めるため、その方式は使用しません。
今回の完成範囲は「GitHubで管理＋Actionsから相談＋Secretsでキー設定」です。
現在の画面を公開Webアプリとして使う場合は、別途認証付きバックエンドが必要です。

公式説明: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
