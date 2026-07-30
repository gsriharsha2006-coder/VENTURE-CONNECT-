# Venture Connect Implementation Plan

## Repository Audit

Venture Connect is an existing Next.js 15 App Router application on the `main`
branch. It already contains a substantial product prototype, Supabase schemas and
migrations, authenticated role-aware navigation, server API routes, an AI provider
layer, Razorpay integration, and the founder, investor, validator, opportunity,
application, messaging, and administration surfaces.

### Current state

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Functional with fallback | Supabase email/password and OAuth are wired. Blank Supabase configuration enables a clearly limited prototype mode. |
| Roles and route protection | Partially functional | Middleware and role-based navigation exist. The current single-role profile model needs a future additive `user_roles` migration for verified secondary roles. |
| Founder Idea Workspace | Functional prototype | Structured templates, progress, preview, export, and local persistence exist. Production autosave and every document action must use Supabase consistently. |
| Opportunities | Functional hybrid | Search, filters, detail views, application methods, and hackathon-specific behavior exist. Some catalogue data is local seed data. |
| Custom application forms | Incomplete | Application-method schema support exists, but the full configurable organiser form builder is not yet production complete. |
| Applications and review | Functional hybrid | Founder tracking and interest status are represented. Some investor review UI still uses local state while server APIs support the core interest transition. |
| Interest-gated messaging | Functional foundation | Server APIs, participant checks, RLS, attachments, notifications, and investor initiation rules exist. Production use requires migrated Supabase tables and storage policies. |
| Validation Hub | Functional prototype | Profiles, services, booking, workspace, reports, reviews, badges, payout configuration, and RLS migration exist. Payment fulfilment and all UI mutations still need end-to-end database verification. |
| VC Readiness reports | Functional foundation | Provider abstraction, structured output parsing, persistence migrations, report history, and safety language exist. Runtime usage limits and provider monitoring need production hardening. |
| Razorpay | Functional foundation | Server-side customer/subscription creation and webhook signature verification exist. Validator-payment order/refund/dispute flows are not complete. |
| Administration | Functional prototype | Moderation and operational views exist. Several actions are demonstrations and require audited server mutations before production use. |
| Notifications and Realtime | Partial | Notification data and selected messaging flows exist. Preference management and complete Realtime subscriptions remain. |
| File security | Partial | Signed URL and participant checks exist for messaging. Unified type, size, ownership, and executable-file validation is still required across every upload surface. |
| Tests | Missing | No test script or committed automated test suite currently exists. |
| Documentation | Incomplete | README covers basic startup only; Supabase, Razorpay, AI, testing, deployment, admin, and security runbooks need expansion. |

## Delivery Plan

### Phase 1 - Production foundation

- Preserve the current Next.js/Supabase architecture and strict TypeScript setup.
- Complete the shared public, authentication, and role-selection UI.
- Verify middleware, server authorization, role navigation, environment handling,
  and the existing RLS policies.
- Document the baseline schema plus migration order instead of creating a competing
  schema.
- Add focused tests around permissions, plan limits, and environment-safe behavior.

### Phase 2 - Core founder and institution workflow

- Keep the completed founder dashboard, Idea Workspace, Opportunities, Applications,
  and Messages surfaces.
- Replace remaining local-only mutations with authenticated Supabase/server actions.
- Complete organiser-defined form creation, publishing, submissions, reviewer
  assignment, configurable scorecards, and immutable submitted answers.
- Verify the full Interested transition creates messaging access only for authorised
  participants.

### Phase 3 - Validation and readiness reports

- Complete the public validator profile, four-step booking flow, tabbed private
  workspace, structured report, and responsive/error states.
- Connect validator service prices, availability, booking status, reports, reviews,
  and badges exclusively to authorised database records.
- Keep AI behind the provider interface, validate structured responses, label
  assumptions, apply usage/rate limits, and retain report provenance.
- Add private PDF generation and short-lived signed download URLs.

### Phase 4 - Commercial functions

- Move plan price and limit configuration to database-backed admin settings.
- Remove unsupported unlimited claims or introduce explicit fair-use controls.
- Complete Razorpay orders for validation services and reports, webhook idempotency,
  refunds, disputes, invoices, and server-confirmed entitlement activation.
- Add integration tests for signature verification and duplicate event handling.

### Phase 5 - Administration and quality

- Convert demonstration admin controls to authorised, audited server mutations.
- Finish notification preferences, selected Realtime subscriptions, abuse reports,
  account deletion, and data-export request handling.
- Add unit, API integration, RLS-assumption, and primary Playwright workflow tests.
- Complete accessibility, responsive, performance, and production security reviews.
- Expand README and deployment documentation, then validate lint, type checking,
  tests, and production build before release.

## Current Delivery Scope

This change set completes the active public and validation UI routes requested after
commit `b8f27c6`: landing, sign-in, registration and role selection, pricing, public
validator profile, four-step booking, validation workspace, and structured report.
It also records verified production gaps. It does not claim that local mock-backed
surfaces are production database workflows until their server mutations and RLS
behavior have automated coverage.
