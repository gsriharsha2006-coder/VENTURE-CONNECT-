# Venture Connect Supabase Setup

1. Create a Supabase project.
2. Enable Email/Password authentication.
3. Run `supabase/schema.sql` in the SQL editor.
4. Apply every file in `supabase/migrations` in filename order.
5. Run `supabase/tests/staging_contract.sql` only against a disposable staging project.
6. Add environment variables from `.env.example`.
7. Follow `docs/production-supabase-setup.md` for redirect URLs and verification.

Canonical identity:
- `auth.users.id` authenticates the user.
- `profiles.id` identifies the person in application-domain tables.
- `profiles.user_id` is the unique bridge to Auth.
- RLS resolves ownership through `profiles.user_id = auth.uid()`.

Core model:
- `profiles` stores role and plan tier.
- `idea_workspaces` stores private founder documents and completion percentages.
- `vc_reports` stores generated readiness reports.
- `applications` and `messages` enforce the interest-gated workflow.
- `opportunities` stores reviewer-created marketplace posts.
- `service_providers`, `service_posts`, and `service_requests` support verified services.

Security:
- Row-level security is enabled on all public tables.
- Founders can manage their own workspaces, reports, and applications.
- Investors can initiate conversations; founders can reply once a conversation exists.
- Premium mentorship booking requires the `Premium Pro` plan.
