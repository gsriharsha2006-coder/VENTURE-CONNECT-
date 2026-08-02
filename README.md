# Venture Connect

The frozen PACE one-month pilot release checklist is documented in [docs/PACE_PILOT_RELEASE.md](docs/PACE_PILOT_RELEASE.md).

Venture Connect is a startup-readiness and opportunity-application platform for
student founders and emerging entrepreneurs. It carries one structured startup
document through human validation, improvement, opportunity applications,
application tracking, and interest-gated messaging.

It is not a social network, crowdfunding product, public startup directory, or an
AI investment-decision system. Readiness reports are educational analysis and do
not promise funding, incubation, or investment.

## Architecture

- Next.js 15 App Router, React 19, strict TypeScript, and Tailwind CSS
- Supabase Authentication, PostgreSQL, Row-Level Security, Storage, and selected Realtime flows
- Server-only OpenAI or Gemini provider abstraction for structured readiness reports
- Razorpay subscription creation and signed webhook verification
- Vercel deployment target

The app can render a limited local prototype when Supabase is not configured.
Production workflows require the database migrations, storage policies, server
environment variables, and authenticated users described below.

## Demo Data

Synthetic validator fixtures are disabled by default. To inspect the local validation
workflow during development, set `ENABLE_DEMO_DATA=true` in `.env.local` and rebuild
or restart the application. Demo profiles are explicitly labelled, contain no verified
badge or institutional affiliation, and are not real people, endorsements, reviews,
qualifications, or performance records.

Never enable demo fixtures in production. Production validator identity, affiliation,
statistics, and reviews must come from administrator-approved database records and
eligible completed bookings.

## Product Areas

- Founder dashboard, structured Idea Workspaces, VC Readiness Reports, and exports
- Verified Opportunities Hub with workspace, organiser-managed, or external applications
- Application tracking and investor/institution review
- Interest-gated founder messaging
- Validator discovery, four-step booking, private workspace, structured reports, reviews, and badges
- Investor, validator, service provider, and administrator dashboards

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the audited implementation
state and remaining production work.

## Local Setup

Requirements: Node.js 20 or newer and a Supabase project for persisted workflows.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. On Windows PowerShell systems that block `npm.ps1`,
use `npm.cmd run dev`.

## Environment Variables

All secret values belong in `.env.local` locally and encrypted environment settings
in Vercel. Never expose `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secrets, or AI keys in
`NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Temporary legacy fallback for the publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only administrative Supabase access |
| `NEXT_PUBLIC_APP_URL` | Canonical auth callback and application URL |
| `ENABLE_DEMO_DATA` | Opt-in synthetic local fixtures; keep `false` in production |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Primary server-side report provider |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional provider fallback |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side Razorpay credentials |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser-safe checkout key ID only |
| `RAZORPAY_PLAN_STUDENT_PRO` | Razorpay plan ID for Student Pro |
| `RAZORPAY_PLAN_FOUNDER_PRO` | Razorpay plan ID for Founder Pro |

## Supabase Setup

For a new Supabase project, apply the baseline schema and migrations in order:

1. `supabase/schema.sql`
2. `supabase/migrations/202607130001_gemini_vc_report_persistence.sql`
3. `supabase/migrations/202607130002_openai_vc_report_provider.sql`
4. `supabase/migrations/202607280001_validation_hub.sql`
5. `supabase/migrations/202607280002_opportunity_application_methods.sql`
6. `supabase/migrations/202607300001_database_contract_and_identity.sql`

Review migration output before applying it to an existing database. The repository
also contains historical schema snapshots; do not apply them on top of the baseline
without reconciling them first.

Use the Supabase CLI for repeatable staging migration application and inspection.
After migration, run `supabase/tests/staging_contract.sql` against staging and review
any legacy rows whose new profile-ID backfill remains null. Do not infer profile
ownership when a legacy Auth ID has no unique profile match.

### Identity Model

- `auth.users.id` is the Supabase authentication identity.
- `profiles.id` is the Venture Connect application-domain profile ID.
- `profiles.user_id` is a required, unique foreign key to `auth.users.id`.
- New domain relationships use `profiles.id`.
- RLS resolves the signed-in profile with `profiles.user_id = auth.uid()`.
- Legacy columns such as `applications.founder_id` continue to store Auth IDs until
  a separately verified compatibility migration can remove them.

Server routes must use the helpers in `src/lib/auth/server.ts` instead of comparing
an Auth user ID directly with `profiles.id`.

The identity migration adds organisations and memberships, organiser-defined
opportunity forms, reviewer assignments and reviews, explicit conversation
participants, private attachment metadata, payment/event storage contracts, and
append-oriented audit logs. Payment and audit tables intentionally expose no
authenticated client policies.

Create private Storage buckets for founder documents, applications, validation
documents, message attachments, and report PDFs. Production policies must restrict
access to owners or explicitly assigned participants and issue short-lived signed
URLs.

Configure Supabase Auth redirect URLs for the local URL and the final Vercel domain.
An administrator profile must be granted deliberately in the database; never infer
admin access from an email domain in production.

## Razorpay Test Setup

The current migration provides payment and payment-event storage only. It does not
activate subscriptions, reports, or validation bookings. Do not enable a live
Razorpay workflow until the webhook route uses the new idempotent event contract and
all fulfilment happens only after a verified server-side event.

When that remediation is complete, use test-mode keys and plan IDs, configure
`/api/webhooks/razorpay`, and verify duplicate delivery, failure, cancellation,
refund, and dispute behavior against a staging database.

## AI Provider Setup

Set one server-side provider key and model. Generated JSON is parsed against the
report-specific schema before it is stored or rendered. Reports retain the provider,
model, prompt version, generation date, and status where supported by the migration.
Never treat a readiness score as financial advice or an automated selection decision.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The current unit suite covers identity resolution, organisation/reviewer boundaries,
founder conversation restrictions, schema migration contracts, role routing, plan
limits, opportunity URL safety, Razorpay signatures, and structured AI report
validation. These offline tests inspect code and migration text; they do not prove
that a deployed Supabase project enforces RLS.

## Deployment

1. Apply and verify Supabase migrations and RLS policies in staging.
2. Configure private Storage buckets and Auth callback URLs.
3. Add environment variables to the Vercel project for Preview and Production.
4. Build and smoke-test the Preview deployment with each supported role.
5. Register the Preview webhook in Razorpay test mode and verify signed events.
6. Promote the validated commit to the production branch and inspect Vercel logs.

## Security Assumptions

- Route protection supplements, but never replaces, database RLS and server authorization.
- The service-role key is server-only and must be used only after explicit authorization checks.
- Conversations are created by a verified interest transition; founders cannot initiate investor threads.
- Uploaded content requires ownership, file type, file size, and executable-content checks.
- Logs must not contain document contents, credentials, access tokens, or payment secrets.
- AI and human validation are advisory and must not make automatic investment or selection decisions.

## Known Limitations

- Several catalogue and dashboard surfaces still use clearly bounded local seed or
  browser state when Supabase is unavailable.
- Organisation, custom-form, reviewer, and conversation schemas now exist, but their
  complete product workflows still need server integration and live RLS verification.
- The payment/event schema is storage-only. Razorpay fulfilment, refunds, disputes,
  invoices, and webhook idempotency still require implementation and staging tests.
- Private Storage bucket policies and live database RLS checks remain unverified.
- Full browser workflows for founder, organiser, and validator journeys are not yet
  included in the automated test suite.
