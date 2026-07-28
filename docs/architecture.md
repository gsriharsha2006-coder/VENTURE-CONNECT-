# Venture Connect Architecture

## Folder Structure

```text
src/
  app/
    page.tsx                      Landing page
    auth/page.tsx                 Email and Google OAuth entry
    pricing/page.tsx              Membership comparison
    (platform)/
      layout.tsx                  Authenticated product shell
      dashboard/page.tsx          Founder dashboard
      feed/page.tsx               Startup feed
      opportunities/page.tsx      Marketplace
      dashboard/vc-readiness/page.tsx  VC Readiness Report workspace
      dashboard/idea-workspace/page.tsx Structured founder documents
      investor/page.tsx           VC portal
      profile/page.tsx            Startup profile
    api/
      ai/report/route.ts          AI report API
      feed/route.ts               Feed API
      messages/route.ts           Controlled messaging API
      opportunities/route.ts      Marketplace API
      pitches/route.ts            Pitch submission API
      startups/route.ts           Startup profile API
  components/
    landing/                      Landing page composition
    layout/                       App shell and navigation
    product/                      Domain-specific product widgets
    ui/                           Reusable UI primitives
  lib/
    ai.ts                         AI provider abstraction
    data.ts                       Mock real-time data
    supabase.ts                   Supabase browser client
    types.ts                      Product types
    utils.ts                      Formatting helpers
supabase/
  schema.sql                      PostgreSQL tables, indexes, and RLS
  edge-functions/generate-ai-report/
docs/
  architecture.md
```

## Auth Flow

1. User selects a role: Founder, Investor, Incubator, Organizer, or Service Provider.
2. User signs in with email magic link or Google OAuth.
3. Supabase stores role metadata and creates a `profiles` row via `handle_new_user`.
4. App routes users into the platform shell.
5. Role and plan tier control pitch limits, mentorship access, opportunity posting, and messaging.

## Pitch Rules

- Free: 1 investor pitch.
- Pro: up to 3 investor pitches.
- Premium Pro: up to 3 investor pitches plus priority matching and advanced reports.
- Founders cannot cold-message investors.
- Investors can initiate a conversation after reviewing a pitch.
- Founders can reply once investor interest exists.

## AI Integration

The AI architecture is intentionally server-side:

- Frontend collects startup context, deck notes, traction, market, and problem/solution details.
- `POST /api/reports/generate` calls the report provider abstraction.
- VC Readiness Reports use the server-only OpenAI provider when `OPENAI_API_KEY` is configured. Development uses an explicitly labelled deterministic mock only when that key is absent; configured provider failures never silently fall back.
- Supabase Edge Function `generate-ai-report` mirrors the same production path for deployment.
- Generated JSON should be persisted in `ai_reports` for auditability, versioning, and investor memo reuse.

Recommended AI outputs:

- Startup validation report
- Funding readiness score
- Pitch deck feedback
- SWOT analysis
- TAM/SAM/SOM estimation
- Competitor analysis
- Investor readiness report
- Roadmap suggestions

## Marketplace Monetization

- Opportunity posting fee: INR 100.
- Application fee: INR 5 per application after the first 100 applications.
- Verification badges distinguish reviewed programs from unverified postings.

## Deployment

- Deploy frontend to Vercel.
- Use Supabase for Auth, PostgreSQL, Storage, Realtime, and Edge Functions.
- Store pitch decks in Supabase Storage with signed URLs.
- Protect server routes with Supabase session checks before moving from prototype to production.
