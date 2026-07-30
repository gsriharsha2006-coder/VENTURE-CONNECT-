# Venture Connect Staging Verification Plan

Last reviewed: 2026-07-30

## Branch Snapshot

- Branch: `feat/venture-connect-production-foundation`
- Commit reviewed: `c491c56f6137ce01dcd1d0707a0b20042c4b2cba`
- Upstream: `origin/feat/venture-connect-production-foundation`
- Baseline comparison: `main...HEAD`
- Starting worktree: clean
- Deployment, merge, staging, commit, and push: not performed

## Current Decision

**Not ready for staging workflow sign-off or merge.**

The UI and local build are suitable for prototype review, but several authenticated
workflows use fixture or browser-local state. The active database migration path does
not provision every table and policy referenced by server routes. Live verification
must not begin until the Supabase project is explicitly confirmed as non-production
and dedicated test accounts are available.

## Environment Gate

The following names come from `.env.example`. Configure them only in a local,
untracked `.env.local` or the staging deployment environment:

| Variable | Required for | Current audit state |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging browser/server access | Must be configured for a confirmed staging project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Staging browser auth | Must be configured for the same staging project |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin test setup and server-only integration tests | Required only in server-side test setup |
| `NEXT_PUBLIC_APP_URL` | Auth redirects | Must point to the staging URL |
| `RAZORPAY_KEY_ID` | Razorpay test API | Missing |
| `RAZORPAY_KEY_SECRET` | Razorpay test API | Missing |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay test webhook verification | Missing |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay test checkout | Missing |
| `RAZORPAY_PLAN_STUDENT_PRO` | Test subscription plan | Missing |
| `RAZORPAY_PLAN_FOUNDER_PRO` | Test subscription plan | Missing |
| `OPENAI_API_KEY` | Optional server-side staging AI check | Not required for this database audit |
| `OPENAI_MODEL` | AI model selection | Defaults to `gpt-5-mini` |
| `ENABLE_DEMO_DATA` | Synthetic public validator data | Must remain `false` |

Before any live command, record the Supabase project reference and obtain written
confirmation that it is a disposable staging project. Never print or commit key
values.

## Branch Diff Review

The branch changes 45 files relative to `main`, primarily:

- Public/authentication and pricing UI
- Founder and validator Validation Hub screens
- Validator public profile and trust gating
- Validation fixtures, pricing configuration, and presentation components
- Messaging permission helper and Razorpay signature helper
- Product-rule, report-schema, and validator-trust tests

The branch does not add the complete backend model required by the new UI.

## Functional Readiness

| Area | Status | Evidence / blocker |
| --- | --- | --- |
| Registration and role selection | Partial | Supabase Auth metadata creates one profile role. No organisation membership model. Validator signup does not create `validator_profiles`. |
| Founder Idea Workspace | Partial | Browser data client persists to Supabase when configured; the active `/api/workspaces` route is fixture-only. Page also keeps prototype state in `localStorage`. |
| Workspace autosave/versioning | Partial | Workspace updates exist; durable section version history and upload storage do not. |
| Opportunities | Partial | Browser data client can read/create Supabase opportunities. `/api/opportunities` returns fixture data and creates only an in-memory response. |
| Custom opportunity forms | Missing | No form, section, field, answer, or immutable submission schema. |
| Applications | Partial | Basic direct application insert exists. No custom answers, timeline events, reviewer assignment, or durable review feedback. |
| Organiser workflow | Missing | No organisations, memberships, reviewer assignment, or review score model. |
| Interest-gated messaging | Blocked | One implementation uses application-linked `messages`; newer APIs expect `startup_submissions`, `conversations`, `meetings`, and conversation-shaped message columns that active migrations do not create. |
| Message attachments | Blocked | Route expects a private `messaging-attachments` bucket, but no bucket or storage policies are provisioned. Signed URLs are stored as message data for seven days rather than generated on demand. |
| Validator directory | Prototype | Public responses are trust-gated, but validator records come from fixtures. |
| Validation booking | Prototype | Active API validates fixture input and returns an in-memory booking ID. It does not authenticate, charge, or insert a database row. |
| Validation workspace/messages | Prototype | UI and endpoints use fixture data; booking state transitions are not persisted. |
| Validation reports/reviews | Prototype | API shape checks exist, but no authenticated database writes are performed. |
| Validator administration | Partial schema only | Tables and some admin policies exist. Self-service validator profile creation and most lifecycle updates lack policies/routes. |
| Subscription checkout | Blocked | A subscription is inserted as `active` before verified payment. Profile lookups use the profile PK where the auth `user_id` is required. |
| Razorpay webhook | Blocked | `payments` is absent, webhook events have no idempotency ledger, JSON errors are not handled, and failed/refunded flows are incomplete. |
| AI readiness report | Partial | Provider is server-only, structured output is strictly validated, and request IDs are idempotent after the OpenAI migration. Validation is custom rather than Zod. Prompt version is not persisted. PDF identity/content verification is not automated. |
| Notifications/audit | Partial | `notifications` exists, but route code expects `email_sent`. `audit_logs` is referenced and not provisioned. |
| Admin moderation | Prototype | UI routes compile, but organisation verification, user-role management, moderation, plan configuration, and audit visibility are not backed by the active schema. |

## Active Schema Review

The supported setup path is `supabase/schema.sql` followed by every file in
`supabase/migrations` in timestamp order. `schema-final.sql` and `schema-v2.sql` are
historical snapshots and must not be treated as migrations.

| Requirement | Table(s) in active path | Status |
| --- | --- | --- |
| Profiles | `profiles` | Present |
| User roles | Single `profiles.role` column | Partial; no multi-role or membership model |
| Founder workspaces | `idea_workspaces` | Present |
| Opportunities | `opportunities` | Present |
| Opportunity forms | None | Missing |
| Applications | `applications`, `external_registrations` | Partial |
| Reviews | `validator_reviews` only | Partial; application reviews missing |
| Conversations | None | Missing |
| Messages | `messages`, `validation_messages` | Partial; active API/schema shapes conflict |
| Validator profiles | `validator_profiles` | Present |
| Validation requests | `validation_bookings` | Present |
| Validation reports | `validation_reports`, `validation_scores` | Present |
| Readiness reports | `vc_reports`, `vc_report_generation_requests` | Present |
| Subscriptions | `subscriptions` | Present |
| Payments | None | Missing |
| Notifications | `notifications` | Present but route expects a missing column |
| Audit logs | Validation-specific activity only | Partial; global `audit_logs` missing |

### Database Integrity Findings

- Primary keys and core foreign keys exist on the tables that are created.
- Many baseline columns are nullable even though product flows require values.
- Several tables lack `updated_at`, including opportunities, applications, messages,
  notifications, and most validation child tables.
- The baseline only prevents duplicate founder/opportunity applications. It does not
  make submitted application data immutable.
- Validation tables have useful unique constraints and delete restrictions, but not
  all foreign-key columns have supporting indexes.
- `validator_profiles` has no self-insert policy. Expertise, services, availability,
  scores, revisions, disputes, and activity logs lack required participant write
  policies.
- Validation bookings have no participant lifecycle update policies.
- Application reviewer assignment restrictions cannot be expressed because the
  assignment tables do not exist.
- Storage buckets and object policies are absent.
- The API uses the service-role client for participant messaging, so route checks,
  not RLS, become the primary boundary. Live negative tests are mandatory.

Run `supabase/tests/staging_contract.sql` against a disposable staging project after
applying migrations. It intentionally fails while required tables, RLS, or storage
controls are absent.

## Test Account Plan

See `docs/STAGING_TEST_ACCOUNTS.md`. No credentials are stored in the repository.

Minimum accounts:

1. Founder
2. Validator
3. Institution/organiser
4. Reviewer
5. Administrator
6. A second unrelated founder for negative RLS and realtime tests

## Workflow Verification Matrix

| Workflow | Local unit/contract | Live staging | Required before pass |
| --- | --- | --- | --- |
| Founder register/profile/workspace | Partial | Blocked | Confirm staging project and create test users |
| Workspace autosave/privacy | Static schema checks | Blocked | Live user A/user B RLS test |
| Opportunity/application | Partial | Blocked | Forms, answers, reviewer model, immutable submit |
| Organiser review | None | Blocked | Organisation and reviewer schema/routes |
| Validator approval/report/review | Rule tests + schema checks | Blocked | Persisting APIs and lifecycle policies |
| Interest-gated messaging | Permission unit test | Blocked | Reconcile schema/API and add participant RLS tests |
| Attachments | MIME/size route checks only | Blocked | Private bucket and signed URL ownership tests |
| Razorpay test mode | Signature unit tests | Blocked | Test keys, payment tables, idempotent webhook ledger |
| AI report | Structured-response unit tests | Blocked live | Confirm staging project; mock provider remains preferred for automation |
| Admin | Static role policy review | Blocked | Admin APIs, audit model, and negative tests |

## Browser E2E Scenarios

Playwright is not installed in this repository, and no authenticated staging accounts
are available. Automated browser tests were therefore not added as false-green
placeholders. Once those prerequisites exist, add bounded tests for:

1. Founder registration through application submission and reviewer feedback.
2. Organiser opportunity creation, reviewer assignment, and Interested decision.
3. Validator pending approval through report delivery and founder review.
4. Founder cold-message rejection followed by messaging after Interested.

Each scenario must create unique run data, assert a second user cannot read it, and
clean up through a server-only admin helper.

## Verification Results

Local checks completed on 2026-07-30:

| Check | Result |
| --- | --- |
| `npm run test` | Pass: 18 tests, 0 failures |
| `npm run lint` | Pass: 0 warnings |
| `npm run typecheck` | Pass |
| `npm run build` | Pass: 84 routes generated |
| Offline schema contract | Pass as part of `npm run test`; known gaps match this plan |
| Live SQL contract | Blocked: Supabase CLI unavailable and configured project is not confirmed as staging |
| Authenticated integration tests | Blocked: no service-role key or dedicated test accounts |
| Razorpay test-mode checks | Blocked: all Razorpay test variables are missing |
| Browser E2E | Blocked: Playwright is not installed and authenticated staging prerequisites are missing |
| Visual route review | Not performed in this audit because no safe authenticated staging target is available |

No OpenAI provider call was made. Automated AI schema tests use local synthetic
payloads and do not send workspace data to a provider.

## Required Staging Sequence

1. Confirm a disposable Supabase project reference.
2. Apply `supabase/schema.sql` and ordered migrations in a fresh project.
3. Run `supabase/tests/staging_contract.sql`; do not waive failures.
4. Provision private storage buckets and policies.
5. Create test accounts using `docs/STAGING_TEST_ACCOUNTS.md`.
6. Reconcile active API table/column names with the deployed schema.
7. Configure Razorpay test mode only and expose the webhook through a staging URL.
8. Run unit, lint, type, build, database, integration, and bounded browser tests.
9. Review database rows and audit events, then clean up the test run.

## Sign-off Criteria

The branch is safe to merge only when:

- The SQL contract has no failures.
- All active APIs use tables and columns created by ordered migrations.
- Every authenticated workflow passes positive and cross-user negative tests.
- Payment fulfilment is signature-verified and idempotent.
- Storage objects are private and ownership-tested.
- AI reports persist provider, model, prompt version, and source workspace identity.
- `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Bounded browser E2E tests pass against the confirmed staging project.
