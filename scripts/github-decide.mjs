import {randomBytes} from 'node:crypto';
import {appendFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleApi, PROVIDERS} from '../server/magi.js';

// This adapter reuses the local API, with an encrypted in-memory vault only.
// It never starts a web server or writes credentials to disk.
export async function runDecision({provider = 'mock', apiKey = '', model = '', question, category = '', values = ''}) {
  if (typeof question !== 'string' || !question.trim() || question.length > 5000) {
    throw new Error('相談内容を1〜5000文字で入力してください。');
  }
  if (category.length > 50 || values.length > 1000) throw new Error('カテゴリまたは重視する条件が長すぎます。');
  if (apiKey && [question, category, values, model].some(value => value.includes(apiKey))) {
    throw new Error('APIキーを相談内容やモデル名に含めないでください。');
  }
  if (provider === 'mock') {
    return {title: question, provider: 'mock', model: '', live: false, example: true,
      verdict: 'INSUFFICIENT_DATA', confidence: 0, cores: [], aiCalls: 0,
      summary: '動作確認用です。AIによる評価は実行していません。',
      reasons: [], concerns: ['この結果を意思決定の根拠にしないでください。'],
      recommendations: ['SecretsにMAGI_API_KEYを登録し、AIプロバイダーを選択してください。'], minorityReport: null};
  }
  if (!Object.hasOwn(PROVIDERS, provider)) throw new Error('対応するAIプロバイダーを選択してください。');
  if (!apiKey) throw new Error('GitHub Settings → Secrets and variables → Actions にMAGI_API_KEYを登録してください。');
  const store = new Map();
  const env = {MAGI_VAULT_KEY: randomBytes(32).toString('base64'), BUCKET: {
    async get(key) {return store.has(key) ? {json: async () => JSON.parse(store.get(key))} : null;},
    async put(key, value) {store.set(key, value);},
    async delete(key) {store.delete(key);}
  }};
  const request = (endpoint, method, data) => new Request('http://magi.internal' + endpoint, {
    method, headers: {'content-type': 'application/json', origin: 'http://magi.internal', 'oai-authenticated-user-id': 'github-run'},
    body: JSON.stringify(data)
  });
  try {
    const saved = await handleApi(request('/api/providers', 'PUT', {provider, apiKey, model: model || PROVIDERS[provider].model}), env);
    if (!saved.ok) throw new Error('AI設定を確認してください。キーとモデル名の形式が不正な可能性があります。');
    const response = await handleApi(request('/api/decide', 'POST', {question, category, values}), env);
    if (!response.ok) throw new Error('相談の実行に失敗しました。入力とAI設定を確認してください。');
    // The existing API emits one NDJSON event per line and redacts vendor replies.
    // Redact the complete export too, including any user-supplied text.
    const events = (await response.text()).split('\n').filter(Boolean).map(line => JSON.parse(line));
    const failure = events.find(event => event.type === 'error');
    if (failure) throw new Error(failure.message);
    const decision = events.find(event => event.type === 'result')?.decision;
    if (!decision) throw new Error('AIから決議結果を取得できませんでした。');
    return JSON.parse(JSON.stringify(decision).split(apiKey).join('[REDACTED]'));
  } finally {
    store.clear();
  }
}

// Provider/user text is data. Escape HTML and Markdown in GitHub's summary.
function escapeText(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#!|~]/g, '\\$&').replace(/\r?\n/g, ' ');
}
export function renderReport(decision) {
  const lines = ['# KAZU MAGI SYSTEM', '', `実行モード: ${decision.live ? 'AI評価' : 'Mock / 動作確認'}`,
    `プロバイダー: ${escapeText(decision.provider)} / ${escapeText(decision.model)}`, '',
    '## 相談', '', escapeText(decision.title), '', '## 決議', '',
    `判定: **${escapeText(decision.verdict)}** / 確信度: ${decision.confidence}%`, '', escapeText(decision.summary), '',
    '## 3コア', ''];
  for (const core of decision.cores) lines.push(`- ${escapeText(core.name)}: ${escapeText(core.verdict)} / ${core.score} — ${escapeText(core.summary)}`);
  for (const [label, field] of [['理由', 'reasons'], ['懸念点', 'concerns'], ['推奨事項', 'recommendations']]) {
    lines.push('', `## ${label}`, '', ...decision[field].map(item => `- ${escapeText(item)}`));
  }
  if (decision.minorityReport) lines.push('', '## 少数意見', '', `${escapeText(decision.minorityReport.core)}: ${escapeText(decision.minorityReport.reason)}`);
  lines.push('', `AI呼び出し回数: ${decision.aiCalls}`, '', '現在の評価方式は3コア＋AIによる統合です。Context Engine・重み付き合議は未実装です。', '');
  return lines.join('\n');
}

async function main() {
  try {
    const decision = await runDecision({provider: process.env.MAGI_PROVIDER || 'mock', apiKey: process.env.MAGI_API_KEY || '',
      model: process.env.MAGI_MODEL || '', question: process.env.MAGI_QUESTION,
      category: process.env.MAGI_CATEGORY || '', values: process.env.MAGI_VALUES || ''});
    const output = path.resolve('magi-results');
    await mkdir(output, {recursive: true});
    await writeFile(path.join(output, 'decision.json'), JSON.stringify(decision, null, 2) + '\n');
    const report = renderReport(decision);
    await writeFile(path.join(output, 'decision.md'), report);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
    console.log('MAGIの実行が完了しました。結果: magi-results/decision.md');
  } catch {
    // Do not print exceptions, inputs, keys, or vendor error bodies to CI logs.
    console.error('MAGIの実行に失敗しました。相談内容、SecretsのMAGI_API_KEY、プロバイダー、モデル名、AIの利用上限を確認してください。');
    process.exitCode = 1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
