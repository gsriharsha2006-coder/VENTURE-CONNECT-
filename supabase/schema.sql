-- Venture Connect Phase 2 Supabase foundation
-- Run this in the Supabase SQL editor after creating the project and enabling Auth.
-- This schema intentionally supports the current mock-first MVP. It prepares real storage
-- for core workflows without starting Razorpay, real AI provider calls, or upload storage.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text,
  full_name text,
  company_name text,
  email text,
  phone text,
  plan text default 'free',
  trust_score integer default 0,
  verification_status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.idea_workspaces (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users(id) on delete cascade,
  template_type text,
  title text,
  sections_json jsonb default '{}'::jsonb,
  video_link text,
  completion_percentage integer default 0,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  creator_role text,
  title text,
  organizer_name text,
  opportunity_type text,
  category text,
  prize_or_funding text,
  deadline date,
  eligibility text,
  guidelines text,
  tags text[],
  location text,
  mode text,
  verified boolean default false,
  trending boolean default false,
  external_link text,
  contact_email text,
  created_at timestamptz default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  idea_workspace_id uuid references public.idea_workspaces(id) on delete set null,
  status text default 'submitted',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

create table if not exists public.vc_reports (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users(id) on delete cascade,
  idea_workspace_id uuid references public.idea_workspaces(id) on delete set null,
  report_type text,
  plan_required text,
  report_content jsonb default '{}'::jsonb,
  score integer,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  receiver_id uuid references auth.users(id) on delete set null,
  body text,
  meeting_link text,
  meeting_time timestamptz,
  is_locked_for_free_user boolean default false,
  created_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  firm_name text,
  email text,
  phone text,
  service_category text,
  pan_or_gst text,
  website_or_linkedin text,
  experience_details text,
  certificate_url text,
  cgpdtm_registration_number text,
  verification_status text default 'pending',
  venture_connect_verified boolean default false,
  cgpdtm_checked boolean default false,
  verification_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.service_posts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.service_providers(id) on delete cascade,
  title text,
  category text,
  description text,
  guide_info text,
  original_price integer,
  listed_price integer,
  contact_info text,
  external_link text,
  created_at timestamptz default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users(id) on delete cascade,
  provider_id uuid references public.service_providers(id) on delete cascade,
  service_post_id uuid references public.service_posts(id) on delete cascade,
  status text default 'pending',
  quotation text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text,
  title text,
  message text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  report_count_used integer default 0,
  opportunity_submissions_used integer default 0,
  free_swot_used boolean default false
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists idea_workspaces_founder_id_idx on public.idea_workspaces(founder_id);
create index if not exists opportunities_created_by_idx on public.opportunities(created_by);
create index if not exists applications_founder_id_idx on public.applications(founder_id);
create index if not exists applications_opportunity_id_idx on public.applications(opportunity_id);
create index if not exists vc_reports_founder_id_idx on public.vc_reports(founder_id);
create index if not exists messages_application_id_idx on public.messages(application_id);
create index if not exists service_providers_user_id_idx on public.service_providers(user_id);
create index if not exists service_posts_provider_id_idx on public.service_posts(provider_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where user_id = auth.uid()
      limit 1
    ),
    ''
  );
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = uid
      and lower(coalesce(role, '')) = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.idea_workspaces enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.vc_reports enable row level security;
alter table public.messages enable row level security;
alter table public.service_providers enable row level security;
alter table public.service_posts enable row level security;
alter table public.service_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "idea_workspaces_select_own_or_admin" on public.idea_workspaces;
create policy "idea_workspaces_select_own_or_admin"
on public.idea_workspaces for select
using (founder_id = auth.uid() or public.is_admin());

drop policy if exists "idea_workspaces_insert_own" on public.idea_workspaces;
create policy "idea_workspaces_insert_own"
on public.idea_workspaces for insert
with check (founder_id = auth.uid());

drop policy if exists "idea_workspaces_update_own_or_admin" on public.idea_workspaces;
create policy "idea_workspaces_update_own_or_admin"
on public.idea_workspaces for update
using (founder_id = auth.uid() or public.is_admin())
with check (founder_id = auth.uid() or public.is_admin());

drop policy if exists "opportunities_select_verified_own_or_admin" on public.opportunities;
create policy "opportunities_select_verified_own_or_admin"
on public.opportunities for select
using (verified = true or created_by = auth.uid() or public.is_admin());

drop policy if exists "opportunities_insert_reviewers" on public.opportunities;
create policy "opportunities_insert_reviewers"
on public.opportunities for insert
with check (
  created_by = auth.uid()
  and creator_role in ('Investor', 'Incubator', 'Hackathon Organizer', 'Event Organizer', 'Admin')
);

drop policy if exists "opportunities_update_own_or_admin" on public.opportunities;
create policy "opportunities_update_own_or_admin"
on public.opportunities for update
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "applications_insert_founder" on public.applications;
create policy "applications_insert_founder"
on public.applications for insert
with check (founder_id = auth.uid());

drop policy if exists "applications_select_founder_reviewer_admin" on public.applications;
create policy "applications_select_founder_reviewer_admin"
on public.applications for select
using (
  founder_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.opportunities o
    where o.id = applications.opportunity_id
      and o.created_by = auth.uid()
  )
);

drop policy if exists "applications_update_reviewer_or_admin" on public.applications;
create policy "applications_update_reviewer_or_admin"
on public.applications for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.opportunities o
    where o.id = applications.opportunity_id
      and o.created_by = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.opportunities o
    where o.id = applications.opportunity_id
      and o.created_by = auth.uid()
  )
);

drop policy if exists "vc_reports_select_own_or_admin" on public.vc_reports;
create policy "vc_reports_select_own_or_admin"
on public.vc_reports for select
using (founder_id = auth.uid() or public.is_admin());

drop policy if exists "vc_reports_insert_own_or_admin" on public.vc_reports;
create policy "vc_reports_insert_own_or_admin"
on public.vc_reports for insert
with check (founder_id = auth.uid() or public.is_admin());

drop policy if exists "messages_select_participants_or_admin" on public.messages;
create policy "messages_select_participants_or_admin"
on public.messages for select
using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.applications a
    join public.opportunities o on o.id = a.opportunity_id
    where a.id = messages.application_id
      and (a.founder_id = auth.uid() or o.created_by = auth.uid())
  )
);

drop policy if exists "messages_insert_after_interest" on public.messages;
create policy "messages_insert_after_interest"
on public.messages for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.applications a
    join public.opportunities o on o.id = a.opportunity_id
    where a.id = messages.application_id
      and lower(a.status) = 'interested'
      and (a.founder_id = auth.uid() or o.created_by = auth.uid())
  )
);

drop policy if exists "service_providers_select_own_verified_or_admin" on public.service_providers;
create policy "service_providers_select_own_verified_or_admin"
on public.service_providers for select
using (user_id = auth.uid() or venture_connect_verified = true or public.is_admin());

drop policy if exists "service_providers_insert_own" on public.service_providers;
create policy "service_providers_insert_own"
on public.service_providers for insert
with check (user_id = auth.uid());

drop policy if exists "service_providers_update_own_or_admin" on public.service_providers;
create policy "service_providers_update_own_or_admin"
on public.service_providers for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "service_posts_select_verified_provider_or_admin" on public.service_posts;
create policy "service_posts_select_verified_provider_or_admin"
on public.service_posts for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_posts.provider_id
      and (sp.venture_connect_verified = true or sp.user_id = auth.uid())
  )
);

drop policy if exists "service_posts_insert_verified_provider" on public.service_posts;
create policy "service_posts_insert_verified_provider"
on public.service_posts for insert
with check (
  exists (
    select 1
    from public.service_providers sp
    where sp.id = service_posts.provider_id
      and sp.user_id = auth.uid()
      and sp.venture_connect_verified = true
      and lower(sp.verification_status) = 'verified'
  )
);

drop policy if exists "service_posts_update_provider_or_admin" on public.service_posts;
create policy "service_posts_update_provider_or_admin"
on public.service_posts for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_posts.provider_id
      and sp.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_posts.provider_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "service_requests_insert_founder" on public.service_requests;
create policy "service_requests_insert_founder"
on public.service_requests for insert
with check (founder_id = auth.uid());

drop policy if exists "service_requests_select_founder_provider_admin" on public.service_requests;
create policy "service_requests_select_founder_provider_admin"
on public.service_requests for select
using (
  founder_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_requests.provider_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "service_requests_update_provider_or_admin" on public.service_requests;
create policy "service_requests_update_provider_or_admin"
on public.service_requests for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_requests.provider_id
      and sp.user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.service_providers sp
    where sp.id = service_requests.provider_id
      and sp.user_id = auth.uid()
  )
);

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
on public.notifications for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own_or_admin" on public.notifications;
create policy "notifications_update_own_or_admin"
on public.notifications for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
on public.subscriptions for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_insert_own_or_admin" on public.subscriptions;
create policy "subscriptions_insert_own_or_admin"
on public.subscriptions for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_update_own_or_admin" on public.subscriptions;
create policy "subscriptions_update_own_or_admin"
on public.subscriptions for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- TODO Phase 3:
-- - Replace local/demo upload names with Supabase Storage buckets and signed URLs.
-- - Wire Razorpay subscription events only after pricing/product approval.
-- - Use real AI provider keys only after the mock VC Readiness Report flow is accepted.
-- - Tighten role text values into enums once production roles are finalized.
