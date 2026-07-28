# OpenAI VC Readiness Report setup

Venture Connect uses the OpenAI Responses API only for structured VC Readiness Reports. OpenAI is not used for chat, Idea Workspace writing assistance, or unsolicited recommendations.

Report requests set `store: false`, keep the API key server-only, and validate the strict JSON result again in application code before any persistence or allowance update.

## 1. Install dependencies

The repository already includes the official `openai` JavaScript SDK. From the project root, run:

```powershell
npm.cmd install
```

## 2. Apply the additive Supabase migration

In the Supabase SQL Editor, run the complete contents of:

```text
supabase/migrations/202607130002_openai_vc_report_provider.sql
```

This migration preserves existing report rows. It adds provider/model metadata, provider-neutral structured content, readiness score metadata, database-backed idempotency, and the report-usage tracking columns required by older installations. It also replaces the authenticated report-recording RPC with the provider-aware signature while leaving the historical migration file unchanged.

## 3. Configure server-only environment variables

Add these values manually to `.env.local`:

```dotenv
OPENAI_API_KEY=your_server_only_key
OPENAI_MODEL=gpt-5-mini
```

Do not use a `NEXT_PUBLIC_` prefix. Do not paste the key into browser code, API request bodies, logs, Git, or Codex chat.

Restart the development server after changing `.env.local`:

```powershell
npm.cmd run dev
```

## 4. Verify a real report

1. Register or sign in as a Founder.
2. Open Idea Workspace and select a document owned by that founder.
3. Complete every required section until completion is 100%.
4. Open VC Readiness Report.
5. Select **Basic SWOT Report** and generate it once.
6. Confirm the UI shows **Generated securely using OpenAI**.
7. Reload the page and confirm the report remains in report history.
8. In Supabase, verify the report row contains `provider = 'openai'`, the configured model name, structured content, and the readiness score.
9. Verify `free_swot_used` changes only after the report row is saved.

## Failure expectations

- Without `OPENAI_API_KEY` in development, the app shows **Development mock report**. It is temporary and consumes no report allowance.
- If OpenAI authentication, quota, rate limiting, timeout, refusal, or validation fails, the API returns a safe error. No report is saved and no allowance is consumed.
- Rapid duplicate requests reuse the same request ID and cannot create a second persisted report or increment usage twice.
- When Supabase is configured, the server loads the authoritative Idea Workspace by ID and verifies founder ownership, completion, plan access, and allowance before generation.

## Build verification

```powershell
npm.cmd run typecheck
npm.cmd run build
```

The OpenAI key must never appear in build output, browser source, API responses, tracked files, or Git history.
