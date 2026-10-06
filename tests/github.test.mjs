import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runDecision, renderReport} from '../scripts/github-decide.mjs';

const secret = 'TEST-GITHUB-SECRET-0123456789';
const evaluation = {verdict: 'APPROVE_WITH_CHANGES', score: 80, summary: '段階的な検証',
  reasons: ['実現性'], concerns: ['確認が必要'], recommendations: ['小さく実施'],
  minorityReport: {core: 'MELCHIOR', reason: '代替案も検討'}};

test('mock works without secrets and makes no network calls', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = () => {throw new Error('Unexpected network call');};
  try {
    const result = await runDecision({question: '動作確認'});
    assert.equal(result.aiCalls, 0);
    assert.equal(result.live, false);
    assert.equal(result.verdict, 'INSUFFICIENT_DATA');
  } finally {globalThis.fetch = old;}
});

test('missing secrets and invalid input fail before network access', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = () => {throw new Error('Unexpected network call');};
  try {
    await assert.rejects(runDecision({provider: 'openai', question: '相談'}), /MAGI_API_KEY/);
    await assert.rejects(runDecision({provider: 'other', question: '相談', apiKey: secret}), /プロバイダー/);
    await assert.rejects(runDecision({provider: 'openai', question: '相談', apiKey: secret, model: '../bad?model'}), /AI設定/);
    await assert.rejects(runDecision({question: ''}), /相談内容/);
    await assert.rejects(runDecision({question: 'a'.repeat(5001)}), /相談内容/);
    await assert.rejects(runDecision({question: '誤入力 ' + secret, apiKey: secret, provider: 'openai'}), /APIキーを相談/);
    await assert.rejects(runDecision({question: '相談', values: 'a'.repeat(1001)}), /条件/);
  } finally {globalThis.fetch = old;}
});

test('GitHub execution reuses four provider calls and exports no secret even when echoed', async () => {
  const old = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'api.openai.com');
    assert.equal(options.headers.authorization, 'Bearer ' + secret);
    assert.equal(options.redirect, 'error');
    assert(!options.body.includes(secret));
    calls.push(JSON.parse(options.body));
    return Response.json({choices: [{message: {content: JSON.stringify({...evaluation, summary: evaluation.summary + secret})}}]});
  };
  try {
    const result = await runDecision({question: '技術方式を比較', provider: 'openai', apiKey: secret, model: 'gpt-4.1-mini'});
    assert.equal(calls.length, 4);
    assert.equal(result.aiCalls, 4);
    assert.equal(result.live, true);
    assert.deepEqual(result.cores.map(core => core.name), ['CASPAR', 'MELCHIOR', 'BALTHASAR']);
    assert.equal(result.minorityReport.core, 'MELCHIOR');
    assert(!JSON.stringify(result).includes(secret));
    assert(!renderReport(result).includes(secret));
  } finally {globalThis.fetch = old;}
});

test('provider failure produces no successful decision or vendor secret', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => new Response('debug ' + secret, {status: 401});
  try {
    await assert.rejects(runDecision({question: '相談', provider: 'gemini', apiKey: secret}), error => {
      assert(!error.message.includes(secret));
      assert.match(error.message, /APIキー/);
      return true;
    });
  } finally {globalThis.fetch = old;}
});

test('untrusted content is escaped in summaries', async () => {
  const result = await runDecision({question: '<script>alert(1)</script> ![image](https://evil.test)\n# heading'});
  const report = renderReport(result);
  assert(!report.includes('<script>'));
  assert(!report.includes('![image]'));
  assert(report.includes('&lt;script&gt;'));
});

test('CLI produces downloadable reports and a GitHub summary without credential files', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'magi-github-'));
  const script = fileURLToPath(new URL('../scripts/github-decide.mjs', import.meta.url));
  try {
    const summary = path.join(dir, 'summary.md');
    const result = spawnSync(process.execPath, [script], {cwd: dir, encoding: 'utf8',
      env: {...process.env, MAGI_PROVIDER: 'mock', MAGI_QUESTION: 'CLI確認', MAGI_API_KEY: secret, GITHUB_STEP_SUMMARY: summary}});
    assert.equal(result.status, 0, result.stderr);
    assert(!(result.stdout + result.stderr).includes(secret));
    const decision = JSON.parse(await readFile(path.join(dir, 'magi-results/decision.json'), 'utf8'));
    assert.equal(decision.live, false);
    const report = await readFile(path.join(dir, 'magi-results/decision.md'), 'utf8');
    assert.equal(await readFile(summary, 'utf8'), report);
    assert(!report.includes(secret));
    assert.deepEqual((await readdir(dir)).sort(), ['magi-results', 'summary.md']);
    const failed = spawnSync(process.execPath, [script], {cwd: dir, encoding: 'utf8',
      env: {...process.env, MAGI_PROVIDER: 'gemini', MAGI_QUESTION: '相談', MAGI_API_KEY: '', GITHUB_STEP_SUMMARY: summary}});
    assert.equal(failed.status, 1);
    assert(!failed.stderr.includes(secret));
  } finally {await rm(dir, {recursive: true, force: true});}
});
