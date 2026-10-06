# KAZU MAGI SYSTEM — LOCAL CODEX MASTER PROMPT

このリポジトリを、Windows PC上の**ローカルCodex**で直接編集してください。

## 絶対条件

1. このタスクをクラウド開発、ChatGPT Work、Sites、Cloudflare、Vercel、Netlify、Codespaces等へ移行しない。
2. ローカルファイルを直接編集する。
3. 通常起動は `npm run dev`、URLは `http://localhost:5173` を維持する。
4. `.openai/hosting.json`、Cloudflare Worker、R2、D1などのクラウド配備用ファイルを新規作成しない。
5. `AGENTS.md` を正式な開発ルールとして遵守する。
6. 現在の横画面・縦画面UI、3基の巨大コア、`public/core-chamber.webp`、色分け、レスポンシブ構成を壊さない。
7. CASPAR / MELCHIOR / BALTHASARを人物やキャラクターにしない。
8. 設計案だけ出して止まらず、コード変更、テスト、動作確認まで進める。

## 最初に行うこと

リポジトリ全体を調査し、次を報告してから実装へ進む。

- 現在の起動経路
- UI構成
- API構成
- AI Provider構成
- APIキー保存方法
- CASPAR / MELCHIOR / BALTHASARの現在の実装
- Consensusの現在の実装
- Context Engineの有無
- local AI / Ollama対応の有無
- Decision Memoryの有無
- offline fallbackの有無
- テスト構成

ただし調査だけで終了しない。

## 今回の最優先目標

既存UIを維持したまま、AI部分を**本物のKAZU MAGI SYSTEM**へ発展させる。

現在の「同じAIへ役割別に4回問い合わせるだけ」の構成から、以下へ進化させる。

```text
User Input
   ↓
Context Engine
   ↓
Normalized Decision Context
   ↓
AI必要性判定
   ├─ 不要 → Rules / History / Local Logic
   └─ 必要
        ↓
CASPAR ─────┐
MELCHIOR ───┼─ independent evaluation
BALTHASAR ──┘
        ↓
Weighted Consensus Engine
        ↓
Veto / Minority Report / Confidence
        ↓
FINAL VERDICT
        ↓
Decision Memory / Feedback
```

## Context Engine

LLMに入力全文をそのまま丸投げする前に、ローカルで文脈を構造化する。

最低出力:

```json
{
  "intent": "",
  "topic": "",
  "entities": [],
  "constraints": [],
  "preferences": [],
  "risks": [],
  "knownInformation": [],
  "unknownInformation": [],
  "requiredInformation": [],
  "decisionType": "",
  "urgency": "",
  "confidence": 0.0,
  "facts": [],
  "assumptions": [],
  "wishes": [],
  "conditions": []
}
```

Context Engineは完全なLLMでなくてよい。ルール、辞書、履歴、軽量分類を優先し、曖昧な意味解析だけAIへ任せる。

## AI呼び出し抑制

以下ではLLMを呼ばない、または呼び出しを減らす設計にする。

- 高Confidenceでルール処理できる
- 同一質問のキャッシュが有効
- 過去決議から十分な根拠を取得できる
- 定型的な比較/分類

ユーザーに見える画面で、可能なら `LOCAL / FREE / EXTERNAL` の利用状況を表示する。

## Provider abstraction

1社固定にしない。

少なくとも概念として:

```text
AIProvider
├─ LocalOpenAICompatibleProvider
├─ OllamaProvider
├─ GeminiProvider
├─ OpenAICompatibleProvider
└─ MockProvider
```

を分離する。

ローカルAIはユーザーのPC上で動作するエンドポイントを使える構造にする。

外部Provider用APIキーは現行の暗号化ローカル保存を維持する。

## 3コア

同じ文章へ名前だけ変えたPromptを投げる方式から脱却する。

### CASPAR
論理、検証、技術実現性、根拠、矛盾、費用、再現性、リスクを重視。

### MELCHIOR
創造性、代替案、新規性、拡張性、未来性、UI/UX、機会を重視。

### BALTHASAR
安全性、現実性、使いやすさ、負担、プライバシー、継続可能性、Kazuへの適合性を重視。

各コアは他コアの結果を見る前に独立評価する。

出力例:

```json
{
  "core": "CASPAR",
  "verdict": "APPROVE_WITH_CHANGES",
  "score": 82,
  "confidence": 0.84,
  "summary": "",
  "reasons": [],
  "concerns": [],
  "recommendations": [],
  "veto": false,
  "vetoReason": ""
}
```

## Consensus Engine

単純多数決は禁止。

`decisionType` により重みを変更する。

初期値例:

```text
technical:
CASPAR 0.50 / MELCHIOR 0.20 / BALTHASAR 0.30

design:
CASPAR 0.20 / MELCHIOR 0.55 / BALTHASAR 0.25

daily_use:
CASPAR 0.25 / MELCHIOR 0.20 / BALTHASAR 0.55

ideation:
CASPAR 0.25 / MELCHIOR 0.50 / BALTHASAR 0.25
```

最終Confidenceには:
- Context Confidence
- 各Core Confidence
- 一致率
- 未知情報量
- 矛盾数
を反映する。

安全・実現不能・重大なプライバシー問題などは限定的なVETOを許可する。

少数意見は `MINORITY REPORT` として保存する。

## Decision Memory

ローカル保存で実装する。

最低限:
- timestamp
- input
- context
- core results
- final verdict
- confidence
- provider usage
- user feedback

を保存し、履歴画面から検索・再表示できるようにする。

APIキーなど秘密情報をDecision Memoryへ保存しない。

## UI

見た目は既存版を正とする。

Desktop:
- 左Sidebar
- 上部3基の巨大演算コア
- 相談入力
- processing timeline
- 3 Core score
- MAGI Consensus
- latest decision / history

Mobile:
- 3基のコアを維持
- 相談入力
- 3 Core score
- Consensus
- latest decision
- bottom navigation

UIの大規模再設計は禁止。
頭脳の高度化を最優先する。

## 実装フェーズ

以下を順番に進める。

1. 現状調査
2. テストbaseline確認
3. schemas / interfaces整理
4. Context Engine実装
5. AIProvider abstraction
6. local provider / Ollama-compatible対応
7. CASPAR/MELCHIOR/BALTHASAR分離
8. Weighted Consensus
9. Veto / Minority Report
10. Decision Memory
11. UI接続
12. offline / mock fallback
13. tests追加
14. responsive regression確認
15. README更新

各フェーズで既存機能を破壊しない。

## 完成条件

- `npm run dev` で完全ローカル起動
- クラウドホスティング設定なし
- Context Engineが実働
- 3コア独立評価
- Weighted Consensus
- Minority Report
- offline/mock動作
- local AI providerを設定可能
- Decision Memory
- APIキー秘匿維持
- 既存の横/縦UI維持
- `npm run build` 成功
- `npm run test:server` 成功
- 可能なら `npm test` 成功

最後に、変更ファイル、アーキテクチャ、テスト結果、未解決事項をまとめる。

この仕様は参考ではなく正式要件である。
