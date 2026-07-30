# Staging Test Accounts

This runbook is for a disposable Venture Connect staging project. Never run it
against production and never commit passwords, access tokens, magic links, or
service-role keys.

## Email Pattern

Use a controlled mailbox or catch-all domain:

```text
vc-staging+<role>-<run-id>@<STAGING_TEST_EMAIL_DOMAIN>
```

Examples of `<role>` are `founder-a`, `founder-b`, `validator`, `organiser`,
`reviewer`, and `admin`. The run ID should be a UTC date plus a short random suffix.
Do not use `example.com` addresses when email confirmation must be exercised.

Generate unique passwords in the test runner or password manager. Do not place them
in shell history, screenshots, fixtures, or repository files.

## Required Accounts

| Account | Initial profile role | Purpose |
| --- | --- | --- |
| Founder A | `founder` | Positive founder workflow |
| Founder B | `founder` | Cross-user privacy and realtime leakage checks |
| Validator | `validator` | Pending-to-approved validation workflow |
| Organiser | `incubator` | Organisation and opportunity workflow |
| Reviewer | Future reviewer membership | Assigned-review restrictions |
| Administrator | `admin` | Verification, moderation, configuration, cleanup |

## Provisioning Procedure

1. Confirm the Supabase project reference is the approved staging project.
2. Register Founder A, Founder B, Validator, and Organiser through the public UI.
3. Verify email confirmation and redirect behavior for each account.
4. Create Reviewer and Administrator through a server-only setup script or Supabase
   dashboard using the service-role key. Never permit public signup to select `admin`.
5. Query `auth.users` and `public.profiles` by email and confirm exactly one profile
   and one active free subscription exist for each auth user.
6. Record only auth user UUIDs and the run ID in an ephemeral test-run record.

## Role Assignment

The current schema stores one role in `profiles.role`; it does not have `user_roles`.
Role changes must be made by a trusted admin path and followed by a new session.

Expected assignments:

```text
Founder A/B -> founder
Validator   -> validator
Organiser   -> incubator
Reviewer    -> not representable until reviewer membership is implemented
Admin       -> admin
```

Do not update role metadata from a browser client. Verify the
`profiles_prevent_privilege_escalation` trigger rejects self-promotion.

## Organisation Membership

Blocked in the current active schema. Before staging verification, add:

- `organisations`
- `organisation_memberships`
- membership roles such as owner, admin, reviewer
- invitation/acceptance state
- verified organisation status
- RLS that scopes opportunities, applications, and reviews to active membership

After implementation, create one staging organisation, make the organiser its owner,
and assign the reviewer only to that organisation.

## Validator Verification

1. Register the validator and confirm `profiles.role = 'validator'`.
2. Confirm public discovery is denied while status is pending.
3. Create the validator profile through the intended trusted flow. The current schema
   lacks a validator self-insert policy, so this step is presently blocked.
4. As the administrator, set the validator status to approved and record an audit
   event.
5. Refresh the validator session and confirm discovery and dashboard access.
6. Suspend the validator in a negative test and confirm new bookings are blocked.

## Administrator Setup

Create the admin only through the staging Supabase dashboard or a reviewed,
server-only script using `SUPABASE_SERVICE_ROLE_KEY`. Public registration normalizes
unknown/admin signup metadata to `founder`; keep that protection.

After assignment:

- Refresh the session.
- Confirm admin routes load.
- Confirm a normal user cannot call the same admin operation.
- Confirm every verification/moderation action creates an audit event.

## Cleanup

1. Stop browser and integration test runners.
2. Delete test-owned storage objects first.
3. Delete payment/webhook test events and domain rows in foreign-key order.
4. Delete organisation memberships and organisations.
5. Delete auth users through the Supabase Admin API so cascade rules execute.
6. Confirm no rows remain for the run ID or test user UUIDs.
7. Revoke any temporary test tokens and rotate keys if they were exposed.
8. Keep only sanitized test output containing route names, assertions, and opaque IDs.
