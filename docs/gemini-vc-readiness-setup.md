# Gemini VC Readiness Report setup (legacy rollback reference)

> Gemini is no longer the active Venture Connect report provider. This document and the historical migration remain temporarily for rollback/audit purposes until real OpenAI generation has been verified.

Venture Connect uses the official `@google/genai` server SDK. Gemini receives only a completed Idea Workspace selected by its authenticated founder. The browser cannot choose a model, provide a system prompt, or submit document content when Supabase is configured.

## 1. Apply the Supabase migration

Open the Supabase SQL Editor for the Venture Connect project and run:

`supabase/migrations/202607130001_gemini_vc_report_persistence.sql`

The migration is additive. It adds report-usage month tracking, an authenticated transactional `record_vc_report` function, and policies that prevent browsers from writing report credits or paid entitlements directly.

Do not continue to a real Gemini report until the SQL Editor reports success.

## 2. Configure local environment values

Add these values to `.env.local` only:

```dotenv
GEMINI_API_KEY=your_server_key
GEMINI_MODEL=gemini-3.5-flash
```

Never prefix the Gemini key with `NEXT_PUBLIC_`. Never add `.env.local` to Git.

## 3. Start the application

```powershell
npm.cmd run dev
```

Log in as a founder and open `/dashboard/vc-readiness`.

## 4. Verify a real report

1. Create or open an Idea Workspace document owned by the founder.
2. Complete every required section so completion is 100%.
3. Select **Basic SWOT Report**.
4. Generate the report once.
5. Confirm the UI reports permanent Supabase persistence rather than mock fallback.
6. Refresh the page and confirm the report remains in report history.
7. Confirm `vc_reports` contains the founder ID, workspace ID, report type, plan requirement, structured JSON, score, and timestamp.
8. Confirm the founder's `subscriptions.free_swot_used` value is true.

Failed, refused, timed-out, quota-limited, or structurally invalid Gemini responses must not create a report or consume an allowance.

## 5. Test plan gates

- **Free:** one lifetime Basic SWOT Report.
- **Student Pro:** Premium SWOT, Full Brief, Bottleneck, and Competitor Defensive reports; three premium reports per month.
- **Founder Pro:** all Student Pro reports plus Roadmap and Investor Scorecard; five premium reports per month.

Plan values must be changed only through trusted administration until a verified payment webhook becomes the source of truth.

## Development fallback

When `GEMINI_API_KEY` is absent in local development, the page shows a warning and uses a deterministic mock. Mock reports are temporary, are not written to Supabase, and consume no report allowance. A configured Gemini failure never silently falls back to mock output.
