# PACE one-month pilot release

This release intentionally limits Venture Connect to the workflows required for the PACE Institute of Technology & Sciences pilot. Disabled future-product code is retained behind server middleware and is not part of the live pilot interface.

## Live pilot roles and routes

- Founder / Student: `/dashboard`, `/dashboard/idea-workspace`, `/dashboard/opportunities`, `/dashboard/vc-readiness`, `/dashboard/messages`
- Incubator: `/organisation`, `/organisation/publish`, `/organisation/applications`, `/organisation/interested`, `/organisation/messages`
- Hackathon Organiser: `/organisation`, `/organisation/publish`, `/organisation/forms`, `/organisation/applications`
- Pilot administrator: `/admin`

Investor, advertising, payment, marketplace, event, validation, meeting, upload, and social routes are disabled by `src/lib/pilot/config.ts` and `src/middleware.ts` while their pilot flags are false.

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local`.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
PILOT_INVESTORS_ENABLED=false
PILOT_ADS_ENABLED=false
PILOT_EVENTS_ENABLED=false
PILOT_MULTIPLE_TEMPLATES_ENABLED=false
PILOT_READINESS_REPORT_LIMIT=1
PILOT_QUALITY_CHECK_LIMIT=2
ENABLE_DEMO_DATA=false
```

`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and any future provider secret are server-only. Never prefix them with `NEXT_PUBLIC_`.

## Database release

Apply the SQL files in `supabase/migrations` in filename order after `supabase/schema.sql`. The pilot-specific final migration is:

```text
supabase/migrations/202608020002_pace_pilot_release.sql
```

It narrows published opportunities, validates pilot statuses, enforces one initial Application Quality Check plus one recheck, enforces one Startup Template, enforces one Basic SWOT Report per founder, and creates the RLS-protected `pilot_events` table.

Run the migration in a staging Supabase project first. Verify that legacy `manual_review_required` values are converted to `manual_review`, then repeat in production during a maintenance window.

## Development-only demo records

Set `ENABLE_DEMO_DATA=true` only in a local development environment without a configured Supabase session. The isolated fixtures in `src/lib/pilot/demo-data.ts` contain:

- Demo Founder, Demo Incubator, and Demo Hackathon Organiser labels
- two startup ideas
- one incubation programme and two hackathons
- incomplete, passing, Interested, and hackathon application examples
- one permission-created conversation
- one Basic VC Readiness Report

The fixtures contain no real credentials and never create production Auth users. For an end-to-end staging rehearsal, create three ordinary test users through the registration UI and use non-production email addresses controlled by the pilot team.

## Local verification

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Manually verify all three roles, the 360 px and 390 px mobile layouts, tablet, laptop, and desktop. Confirm that founder navigation contains exactly four primary items and direct disabled URLs return to the landing page or a 404 response.

## Vercel release

1. Push the pilot branch to the existing GitHub repository.
2. Create or select the existing Vercel project and connect that repository.
3. Add the required environment variables for Production and Preview. Keep demo data false.
4. Set `NEXT_PUBLIC_APP_URL` to the production HTTPS URL.
5. Add that URL and `/auth/callback` to the Supabase Auth redirect allow-list.
6. Deploy the pilot branch to Preview and complete the three-role smoke test.
7. Promote the verified deployment to Production.

CLI commands, when the Vercel CLI is installed and authenticated:

```powershell
vercel link
vercel --prod
```

Do not claim a successful production release until the Supabase migration, Vercel environment configuration, and deployed three-role smoke test have all passed.
