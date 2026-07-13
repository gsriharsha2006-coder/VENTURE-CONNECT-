# Venture Connect Supabase Integration Plan

## Current state

Venture Connect keeps a no-credentials demo mode while supporting real Supabase email/password authentication, cookie-based sessions, role-aware routing, profile creation, and founder Idea Workspace persistence when public Supabase variables are configured. The repository is connected to GitHub and `main` is the delivery branch.

## Phase 2 scope

This phase adds a Supabase foundation without replacing the existing mock MVP:

- Supabase browser/server/service helpers with safe missing-env fallbacks.
- Database types for the Phase 2 tables.
- SQL schema for profiles, Idea Workspace documents, opportunities, applications, VC Readiness Reports, messages, service providers/posts/requests, notifications, and subscriptions.
- Conservative RLS policies with founder, reviewer, service provider, and admin paths.
- Data access services that use Supabase only when configured and otherwise return existing demo data.
- Light wiring for safe workflows where mock behavior stays intact.

## Environment variables

Supabase is enabled only when the project URL and a public key exist:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a temporary backward-compatible fallback.

Server/admin paths can also use:

- `SUPABASE_SERVICE_ROLE_KEY`

If Supabase variables are missing, the app should not crash. In development it emits a single console warning and keeps using mock/local data.

## What remains mock-first

- Authentication stays in prototype mode only without Supabase keys.
- Idea Workspace still autosaves locally when Supabase is missing.
- VC Readiness Report still uses mock AI report generation.
- Opportunities, applications, messaging, and services retain the current demo data and gating rules without Supabase.

## Phase 2 safety boundaries

Do not start these integrations in this phase:

- Razorpay payments/subscriptions
- Real AI provider API calls
- Persistent upload storage
- Production email/notification delivery

## Next implementation steps

1. Create a real Supabase project and run `supabase/schema.sql`.
2. Add Supabase credentials to `.env.local`.
3. Follow `docs/production-supabase-setup.md` to test Auth and persistence.
4. Seed initial demo rows or create admin tooling for first data.
5. Add Supabase Storage buckets for uploaded documents and certificates.
6. Only after this foundation is accepted, begin Razorpay and real AI provider integration.
