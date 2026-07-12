# Venture Connect

Venture Connect is a production-style prototype for an AI-powered startup ecosystem platform. It is designed for student founders, early-stage startups, incubators, mentors, angels, and venture capitalists.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- Supabase Auth, PostgreSQL, and Edge Functions
- OpenAI or Gemini-ready AI report generation
- Vercel deployment target

## Product Surfaces

- Landing page with product-led hero, differentiation, investor matching, opportunities, success stories, and pricing.
- Founder dashboard with Idea Workspace documents, VC Readiness Reports, opportunities, applications, notifications, and progress metrics.
- Startup Feed with posts, upvotes, comments, AI recommendations, and trending startups.
- Idea Workspace for structured documents, uploads, completion tracking, exports, and version history.
- VC Readiness Reports for SWOT, full brief, bottleneck, competitor defense, roadmap, and investor scorecard analysis.
- Opportunities marketplace with filters, deadline tracking, bookmarks, verification badges, and apply flow.
- Investor portal for reviewing pitches, filtering founders, marking interest, messaging, posting opportunities, and analytics.
- Role-based auth entry for Founder, Investor, Incubator, and Student accounts.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

AI routes return premium mock reports when no provider key is configured.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor and deploy `supabase/edge-functions/generate-ai-report` when moving beyond the prototype.
