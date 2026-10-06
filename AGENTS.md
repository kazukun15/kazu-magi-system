# AGENTS.md — KAZU MAGI SYSTEM / LOCAL CODEX AUTHORITY

This file is authoritative for Codex work in this repository.

## 1. Execution mode

### User-authorized GitHub integration (2026-10-06)

Kazu explicitly requested GitHub usage and API keys configured through Secrets.
The added `.github/workflows/` CI and manual MAGI Decision workflow are a scoped
exception to the local-only remote execution rule below. They must read the API
key only from `secrets.MAGI_API_KEY` into the decision step's server-side process.
Never inject it into Vite, public assets, browser code, build output, or artifacts.
Keep the existing local web/API server and UI. GitHub Actions does not host this UI.
Other hosted backend changes still require a direct user request.

This repository is **LOCAL-FIRST and LOCAL-ONLY for development**.

- Work directly in this checked-out repository.
- Use the local filesystem and local terminal.
- Do not create or migrate to hosted/cloud execution as part of ordinary development.
- Do not add `.openai/hosting.json`, Cloudflare Workers, R2, D1, Vercel, Netlify, Firebase Hosting, GitHub Codespaces, remote build services, or cloud-only secrets unless Kazu explicitly asks for deployment later.
- Do not replace the local Node server with a hosted backend.
- The normal development command is `npm run dev`.

If an instruction conflicts with this local-only rule, stop and preserve the local implementation rather than silently changing execution mode.

## 2. Product identity

Project: **KAZU MAGI SYSTEM**

Core concept:
- CASPAR = analysis / verification / logic
- MELCHIOR = creativity / alternatives / future
- BALTHASAR = humanity / practicality / safety / Kazu fit
- MAGI CONSENSUS = weighted synthesis, not a cosmetic majority vote

The three cores are **machines / computation cores**, never characters, avatars, anime people, assistants with faces, or mascots.

## 3. Visual source of truth

Preserve the existing visual language:
- dark industrial command center
- three monumental computation cores
- CASPAR in cyan/blue
- MELCHIOR in amber/gold
- BALTHASAR in ice-blue/white
- high information density on desktop
- purpose-built portrait layout on mobile
- no generic ChatGPT clone
- no white Material-dashboard redesign
- no excessive rainbow neon

`public/core-chamber.webp` is a key visual asset. Do not replace it with generic cards unless explicitly instructed.

## 4. Architecture target

The system must evolve toward this pipeline:

User input
→ Context Engine
→ structured context + confidence
→ rule/local processing where possible
→ independent CASPAR / MELCHIOR / BALTHASAR evaluation
→ weighted Consensus Engine
→ final verdict + minority report + explainable reasons
→ Decision Memory / user feedback

Do not treat the LLM as the entire system.

## 5. Context Engine requirements

Implement a deterministic preprocessing layer before LLM calls. At minimum extract or derive:
- intent
- topic
- entities
- constraints
- preferences
- risks
- known information
- unknown information
- required information
- decision type
- urgency
- confidence

Separate facts, assumptions, wishes, conditions, questions, decisions, and unknowns where practical.

The Context Engine should decide whether an LLM call is necessary. Prefer rules/history/local logic when confidence is high and the task is deterministic.

## 6. AI provider policy

Free/local-first order:
1. deterministic local logic / Context Engine
2. local model through an OpenAI-compatible endpoint or Ollama-compatible adapter
3. free-tier provider when configured by the user
4. optional external provider

Provider selection must remain replaceable behind a clear interface. Never hardcode business logic to one vendor.

API keys:
- never put keys in source, prompts, logs, client storage, generated docs, test artifacts, or Git
- keep local encrypted server-side storage
- preserve `.magi-local/` exclusion

## 7. Core independence

CASPAR, MELCHIOR, and BALTHASAR must evaluate the same normalized context independently before seeing each other's outputs.

Each output should include:
- verdict
- score/confidence
- summary
- reasons
- concerns
- recommendations
- veto flag/reason when warranted

Do not reduce the cores to three differently titled copies of the same prompt.

## 8. Consensus behavior

Consensus must be weighted by decision type, not simple majority vote.

Examples:
- technical: CASPAR highest weight
- design/ideation: MELCHIOR highest weight
- daily-use/safety/practicality: BALTHASAR highest weight

Preserve minority reports. Allow narrowly defined vetoes for impossible, unsafe, privacy-destructive, or irreversible choices.

## 9. Local development commands

Expected environment: Node.js 22.13+; Node 24 LTS preferred.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

Build:
```bash
npm run build
```

Server tests:
```bash
npm run test:server
```

Full browser tests require Playwright Chromium:
```bash
npx playwright install chromium
npm test
```

## 10. Change discipline

Before changing code:
1. inspect existing implementation
2. identify the smallest compatible change
3. preserve existing UI and functionality unless the task explicitly changes them
4. implement, do not stop at a plan
5. run the relevant tests
6. summarize changed files, test results, and remaining limitations

Do not rewrite the project from scratch without a concrete technical reason.

## 11. Current known gap

The inherited implementation already has a local server and encrypted local API-key storage, but its decision path is still largely:

input → same external model called for 3 role prompts → same model called again for consensus

This is **not yet the full target architecture**. Priority work is to add a genuine Context Engine, provider abstraction including local AI, independent core policies, weighted consensus, memory, and offline/rule fallbacks while keeping the existing UI stable.
