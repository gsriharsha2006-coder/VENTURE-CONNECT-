# Supabase Integration Checklist

This checklist prepares Venture Connect for a future disposable staging integration. It does not confirm that a Supabase project, migration, policy, storage bucket or authenticated workflow is live.

## 1. Create isolated environments

- [ ] Create separate Supabase projects for local/staging validation and production.
- [ ] Record ownership, region, recovery contacts and change-approval responsibility.
- [ ] Keep production credentials out of local development and preview deployments.
- [ ] Leave `NEXT_PUBLIC_VENTURE_CONNECT_DEMO_DATA` unset or `false` outside an explicit demo environment.

## 2. Configure environment variables

Configure values through the local secret store and the deployment provider. Never commit them.

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - public project URL.
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` - browser-safe public key.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - server runtime only; never expose with a `NEXT_PUBLIC_` prefix.
- [ ] `NEXT_PUBLIC_APP_URL` - canonical environment URL used for authentication redirects.
- [ ] AI provider keys - server runtime only.
- [ ] Payment webhook and signing secrets - server runtime only when payments are implemented.
- [ ] Confirm logs and error responses never print any configured values.

## 3. Configure authentication

- [ ] Enable required email and OAuth providers in the staging project.
- [ ] Add exact localhost, preview and staging callback URLs to the redirect allowlist.
- [ ] Configure email confirmation, recovery and password-update templates.
- [ ] Verify new users receive one profile and one valid role mapping.
- [ ] Verify the supported product roles: Founder, Validator and Institution, with institution subtype stored separately.
- [ ] Confirm disabled, deleted and unconfirmed users cannot access protected routes.

## 4. Establish migration order

- [ ] Review `supabase/schema.sql` and establish an immutable baseline migration before applying later timestamped migrations.
- [ ] Review every migration in timestamp order in a disposable database.
- [ ] Confirm tables, columns, enums, functions, triggers and indexes exist before later migrations reference them.
- [ ] Run migrations against representative legacy rows and confirm backfills finish before new `NOT NULL` constraints.
- [ ] Review migration output and generated schema diff; do not apply directly to production.
- [ ] Record rollback or forward-fix steps for each release migration.

## 5. Verify row-level security

- [ ] Enable RLS on every account, workspace, application, message, validation, payment and audit table.
- [ ] Test each policy with Founder, Validator, Institution and Admin staging accounts.
- [ ] Verify auth user IDs are compared with the correct owner or membership columns.
- [ ] Verify organisation membership cannot grant cross-organisation access.
- [ ] Verify founders cannot initiate restricted investor conversations.
- [ ] Verify validators access only assigned bookings, documents and conversations.
- [ ] Verify client roles cannot write payment events, audit logs or trusted verification fields.
- [ ] Review every `SECURITY DEFINER` function for an explicit safe `search_path` and least privilege.

## 6. Configure private storage

- [ ] Create private buckets for pitch documents, validation attachments and message attachments.
- [ ] Define file type, file size, malware-scanning and retention rules.
- [ ] Add object policies based on workspace, application, booking or conversation membership.
- [ ] Use short-lived signed URLs and verify revoked access expires as intended.
- [ ] Confirm public URLs cannot expose private founder documents.

## 7. Generate and review types

- [ ] Generate TypeScript database types from the staging schema.
- [ ] Review generated changes before replacing the checked-in contract.
- [ ] Run typecheck and tests against the generated types.
- [ ] Confirm API request and report schemas remain narrower than raw database rows.

## 8. Create controlled test accounts

- [ ] Create non-production Founder, Validator, Institution and Admin accounts.
- [ ] Create verified and unverified account states without real personal data.
- [ ] Seed only clearly labelled staging records through reviewed scripts.
- [ ] Keep test credentials in the approved secret manager, never source control.

## 9. Verify locally and in staging

- [ ] Start with missing environment variables and confirm public routes load while protected routes redirect safely.
- [ ] Test registration, confirmation, sign-in, recovery, sign-out and role-based navigation.
- [ ] Test workspace, application, validation and messaging authorization with multiple accounts.
- [ ] Test loading, empty, error, retry and success states without fixture fallback.
- [ ] Verify browser console, server logs and network responses contain no secrets.
- [ ] Verify desktop and mobile layouts with authenticated staging data.

## 10. Production deployment gate

- [ ] Complete security review of migrations, RLS, storage and server-only credentials.
- [ ] Complete staging acceptance for every supported role and critical workflow.
- [ ] Confirm backup, recovery, monitoring, rate-limit and incident-response procedures.
- [ ] Confirm payment processing and webhooks separately before enabling any paid action.
- [ ] Require an explicit release approval before production migration or deployment.

## Current verification status

Supabase has not been linked or verified for this repository. No live migration, RLS policy, storage policy, test account or authenticated staging workflow is confirmed by this document.
