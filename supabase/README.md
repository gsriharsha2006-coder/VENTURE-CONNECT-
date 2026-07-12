# Venture Connect Supabase Setup

1. Create a Supabase project.
2. Enable Email magic links and Google OAuth in Authentication.
3. Run `supabase/schema.sql` in the SQL editor.
4. Add environment variables from `.env.example`.
5. Deploy the edge function in `supabase/edge-functions/generate-ai-report`.

Core model:
- `profiles` stores role and plan tier.
- `startups` stores structured startup profiles and metrics.
- `idea_vault_items` and `idea_versions` power the private founder workspace.
- `ai_reports` stores validation, pitch, SWOT, TAM/SAM/SOM, and investor-readiness outputs.
- `pitch_submissions` and `pitch_matches` enforce monthly pitch flows.
- `conversations` requires investor initiation.
- `opportunities` and `opportunity_applications` support marketplace monetization.

Security:
- Row-level security is enabled on all public tables.
- Founders can manage their own startups, vault items, reports, and applications.
- Investors can initiate conversations; founders can reply once a conversation exists.
- Premium mentorship booking requires the `Premium Pro` plan.
