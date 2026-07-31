# Venture Connect Staging Verification Plan

Last reviewed: 2026-07-30

## Branch Snapshot

- Branch: `feat/venture-connect-production-foundation`
- Preserved audit commit: `28b5bdb`
- Upstream: `origin/feat/venture-connect-production-foundation`
- Baseline comparison: `main...HEAD`
- Phase 1 remediation: uncommitted working-tree changes
- Deployment and merge: not performed

## Current Decision

**Not ready for staging workflow sign-off or merge.**

The UI and local build are suitable for prototype review. The Phase 1 migration now
defines the missing data contracts, but several product workflows still use fixture
or browser-local state and no migration or RLS policy has been applied to a live
staging project. Live verification must not begin until the Supabase project is
explicitly confirmed as non-production and dedicated test accounts are available.

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

Phase 1 adds an additive database and identity contract:

- Canonical Auth-to-profile resolution through `profiles.user_id`
- Organisations and role-scoped membership
- Opportunity forms, sections, fields, and application answers
- Reviewer assignments, reviews, and scores
- Explicit conversations, participants, messages, meetings, and attachment metadata
- Server-controlled payment/event and audit-log storage
- Offline identity and schema authorization tests

## Functional Readiness

| Area | Status | Evidence / blocker |
| --- | --- | --- |
| Registration and role selection | Partial | Supabase Auth metadata creates one profile role. Organisation membership is migration-backed, but its management API is incomplete. Validator signup does not create `validator_profiles`. |
| Founder Idea Workspace | Partial | Browser data client persists to Supabase when configured; the active `/api/workspaces` route is fixture-only. Page also keeps prototype state in `localStorage`. |
| Workspace autosave/versioning | Partial | Workspace updates exist; durable section version history and upload storage do not. |
| Opportunities | Partial | Browser data client can read/create Supabase opportunities. `/api/opportunities` returns fixture data and creates only an in-memory response. |
| Custom opportunity forms | Schema ready, integration incomplete | Forms, sections, fields, ordering, draft/published states, and answers are migration-backed. Builder and submission APIs remain incomplete. |
| Applications | Partial | Profile ownership, organisation scope, answers, reviewer assignments, reviews, and scores are migration-backed. Timeline APIs and full immutable submission handling remain incomplete. |
| Organiser workflow | Schema ready, integration incomplete | Organisations, members, assignments, and reviews exist. Organisation-management routes and full review UI persistence remain incomplete. |
| Interest-gated messaging | Schema and routes remediated, live blocked | Conversations use explicit profile participants and an Interested gate. Live RLS and end-to-end behavior have not been verified. |
| Message attachments | Metadata remediated, storage blocked | Only private bucket/path metadata is persisted. The `messaging-attachments` bucket and object policies are not provisioned. |
| Validator directory | Prototype | Public responses are trust-gated, but validator records come from fixtures. |
| Validation booking | Prototype | Active API validates fixture input and returns an in-memory booking ID. It does not authenticate, charge, or insert a database row. |
| Validation workspace/messages | Prototype | UI and endpoints use fixture data; booking state transitions are not persisted. |
| Validation reports/reviews | Prototype | API shape checks exist, but no authenticated database writes are performed. |
| Validator administration | Partial schema only | Tables and some admin policies exist. Self-service validator profile creation and most lifecycle updates lack policies/routes. |
| Subscription checkout | Blocked | Profile lookup now resolves through `profiles.user_id`, but checkout still inserts an active subscription before verified payment. Payment behavior was intentionally not remediated in Phase 1. |
| Razorpay webhook | Blocked | Payment/event tables now provide an idempotency contract, but the webhook route is not integrated with it and failed/refunded flows remain incomplete. |
| AI readiness report | Partial | Provider is server-only, structured output is strictly validated, and request IDs are idempotent after the OpenAI migration. Validation is custom rather than Zod. Prompt version is not persisted. PDF identity/content verification is not automated. |
| Notifications/audit | Schema ready, integration incomplete | Notification profile ownership and email state are migration-backed. Append-oriented audit storage exists but admin visibility is not implemented. |
| Admin moderation | Prototype | Organisation/audit contracts exist, but verification, moderation, plan configuration, and audit visibility APIs remain incomplete. |

## Canonical Identity

- `auth.users.id` is the authentication identity.
- `profiles.id` is the application-domain person identity.
- `profiles.user_id` is unique, required, and references `auth.users.id`.
- New person relationships reference `profiles.id`.
- RLS resolves the current profile with `profiles.user_id = auth.uid()`.
- Legacy Auth-ID columns remain in place for compatibility and are backfilled into
  explicit profile-ID columns by the Phase 1 migration.

Server routes use `src/lib/auth/server.ts` to require an authenticated profile, role,
or organisation membership. A route must not compare an Auth ID directly with
`profiles.id`.

## Active Schema Review

The supported setup path is `supabase/schema.sql` followed by every file in
`supabase/migrations` in timestamp order. `schema-final.sql` and `schema-v2.sql` are
historical snapshots and must not be treated as migrations.

| Requirement | Table(s) in active path | Status |
| --- | --- | --- |
| Profiles | `profiles` | Present |
| User roles | `profiles.role`, `organisation_members.membership_role` | Present as account role plus organisation role |
| Founder workspaces | `idea_workspaces` | Present |
| Opportunities | `opportunities` | Present |
| Opportunity forms | `opportunity_forms`, `opportunity_form_sections`, `opportunity_form_fields` | Present in Phase 1 migration; not live verified |
| Applications | `applications`, `application_answers`, `external_registrations` | Present; workflow integration partial |
| Reviews | `reviewer_assignments`, `application_reviews`, `review_scores`, `validator_reviews` | Present; not live verified |
| Conversations | `conversations`, `conversation_members` | Present; not live verified |
| Messages | `messages`, `message_attachments`, `meetings`, `validation_messages` | Present; private storage still blocked |
| Validator profiles | `validator_profiles` | Present |
| Validation requests | `validation_bookings` | Present |
| Validation reports | `validation_reports`, `validation_scores` | Present |
| Readiness reports | `vc_reports`, `vc_report_generation_requests` | Present |
| Subscriptions | `subscriptions` | Present |
| Payments | `payments`, `payment_events` | Storage contract present; fulfilment not integrated |
| Notifications | `notifications` | Profile ownership and email state added |
| Audit logs | `audit_logs`, `validation_activity_logs` | Present; server-controlled |

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
- Application reviewer assignment restrictions are encoded in additive RLS and
  validation triggers, but still require live cross-user verification.
- Storage buckets and object policies are absent.
- Messaging routes resolve the authenticated profile and explicitly verify
  conversation membership before service-role writes. Live RLS negative tests remain
  mandatory because service-role operations bypass policies.

Run `supabase/tests/staging_contract.sql` against a disposable staging project after
applying migrations. It intentionally fails while required tables, RLS, or storage
controls are absent.

### Phase 1 Migration Safety

- Historical migrations remain unchanged.
- `202607300001_database_contract_and_identity.sql` is additive and retains legacy
  Auth-ID columns.
- New profile-ID columns are nullable during compatibility backfill so unresolved
  legacy rows are reported instead of deleted or assigned to the wrong person.
- Before enabling dependent staging workflows, manually verify that these queries
  return no unexpected rows:

```sql
select id from public.opportunities where created_by is not null and created_by_profile_id is null;
select id from public.applications where founder_id is not null and founder_profile_id is null;
select id from public.messages where sender_id is not null and sender_profile_id is null;
select id from public.notifications where user_id is not null and profile_id is null;
```

Any result requires manual identity reconciliation. Do not fabricate a profile match.
The Supabase CLI is required to apply and inspect migrations in a repeatable staging
workflow; it was unavailable during the offline review.

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
| Opportunity/application | Offline schema contract | Blocked | Builder/submission APIs and live RLS |
| Organiser review | Offline identity/RLS contract | Blocked | Management APIs and live reviewer tests |
| Validator approval/report/review | Rule tests + schema checks | Blocked | Persisting APIs and lifecycle policies |
| Interest-gated messaging | Identity and permission unit tests | Blocked | Apply migration and run participant RLS tests |
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
| `npm run test` | Pass: 30 tests, 0 failures |
| `npm run lint` | Pass: 0 warnings |
| `npm run typecheck` | Pass |
| `npm run build` | Pass: 84 routes generated |
| Offline schema contract | Pass as part of `npm run test`; Phase 1 tables, keys, indexes, and RLS declarations are present in migration text |
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
6. Verify backfilled profile IDs and reconcile any legacy rows reported by migration review.
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
