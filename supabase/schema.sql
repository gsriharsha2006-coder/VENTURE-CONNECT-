-- Venture Connect Phase 2 Supabase foundation
-- Run this in the Supabase SQL editor after creating the project and enabling Auth.
-- This schema intentionally supports the current mock-first MVP. It prepares real storage
-- for core workflows without starting Razorpay, real AI provider calls, or upload storage.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'founder' check (role in ('founder', 'investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'service_provider', 'admin')),
  full_name text,
  company_name text,
  email text,
  phone text,
  plan text default 'free',
  trust_score integer default 0,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_workspaces (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  template_type text not null default 'startup',
  title text not null,
  sections_json jsonb default '{}'::jsonb,
  video_link text,
  stage text not null default 'Idea',
  visibility text not null default 'application_only',
  tags text[] not null default '{}',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  status text not null default 'draft',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  report_count_used integer default 0,
  opportunity_submissions_used integer default 0,
  free_swot_used boolean default false,
  report_usage_month date not null default date_trunc('month', now())::date,
  updated_at timestamptz not null default now()
);

-- Safe upgrades for projects that previously ran the Phase 2 foundation schema.
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.idea_workspaces add column if not exists archived boolean not null default false;
alter table public.idea_workspaces add column if not exists stage text not null default 'Idea';
alter table public.idea_workspaces add column if not exists visibility text not null default 'application_only';
alter table public.idea_workspaces add column if not exists tags text[] not null default '{}';
alter table public.subscriptions add column if not exists report_usage_month date not null default date_trunc('month', now())::date;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_user_id_unique_idx on public.profiles(user_id) where user_id is not null;
create unique index if not exists service_providers_user_id_unique_idx on public.service_providers(user_id) where user_id is not null;
do $$
begin
  if not exists (
    select user_id
    from public.subscriptions
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) then
    create unique index if not exists subscriptions_user_id_unique_idx on public.subscriptions(user_id) where user_id is not null;
  else
    raise notice 'subscriptions_user_id_unique_idx was not created because duplicate user rows require manual review';
  end if;
end $$;
create unique index if not exists applications_founder_opportunity_unique_idx on public.applications(founder_id, opportunity_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_user_id_required') then
    alter table public.profiles add constraint profiles_user_id_required check (user_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_allowed') then
    alter table public.profiles add constraint profiles_role_allowed check (role in ('founder', 'investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'service_provider', 'admin')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_allowed') then
    alter table public.profiles add constraint profiles_plan_allowed check (plan in ('free', 'student_pro', 'founder_pro')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_trust_score_range') then
    alter table public.profiles add constraint profiles_trust_score_range check (trust_score between 0 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_verification_status_allowed') then
    alter table public.profiles add constraint profiles_verification_status_allowed check (verification_status in ('pending', 'verified', 'rejected', 'suspended')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_completion_range') then
    alter table public.idea_workspaces add constraint idea_workspaces_completion_range check (completion_percentage between 0 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_founder_required') then
    alter table public.idea_workspaces add constraint idea_workspaces_founder_required check (founder_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_title_required') then
    alter table public.idea_workspaces add constraint idea_workspaces_title_required check (length(trim(title)) > 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_status_allowed') then
    alter table public.idea_workspaces add constraint idea_workspaces_status_allowed check (status in ('draft', 'in_progress', 'complete')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_template_allowed') then
    alter table public.idea_workspaces add constraint idea_workspaces_template_allowed check (template_type in ('startup', 'ai-project', 'hackathon', 'saas', 'marketing', 'student-project', 'custom')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_stage_allowed') then
    alter table public.idea_workspaces add constraint idea_workspaces_stage_allowed check (stage in ('Idea', 'Prototype', 'MVP', 'Revenue', 'Seed')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'idea_workspaces_visibility_allowed') then
    alter table public.idea_workspaces add constraint idea_workspaces_visibility_allowed check (visibility in ('private', 'application_only')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_report_count_nonnegative') then
    alter table public.subscriptions add constraint subscriptions_report_count_nonnegative check (report_count_used >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_submission_count_nonnegative') then
    alter table public.subscriptions add constraint subscriptions_submission_count_nonnegative check (opportunity_submissions_used >= 0) not valid;
  end if;
end $$;

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists idea_workspaces_founder_id_idx on public.idea_workspaces(founder_id);
create index if not exists idea_workspaces_founder_updated_idx on public.idea_workspaces(founder_id, archived, updated_at desc);
create index if not exists opportunities_created_by_idx on public.opportunities(created_by);
create index if not exists applications_founder_id_idx on public.applications(founder_id);
create index if not exists applications_opportunity_id_idx on public.applications(opportunity_id);
create index if not exists vc_reports_founder_id_idx on public.vc_reports(founder_id);
create index if not exists messages_application_id_idx on public.messages(application_id);
create index if not exists service_providers_user_id_idx on public.service_providers(user_id);
create index if not exists service_posts_provider_id_idx on public.service_posts(provider_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

create or replace function public.normalize_signup_role(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select case lower(replace(replace(coalesce(value, ''), ' ', '_'), '-', '_'))
    when 'investor' then 'investor'
    when 'incubator' then 'incubator'
    when 'hackathon_organizer' then 'hackathon_organizer'
    when 'event_organizer' then 'event_organizer'
    when 'service_provider' then 'service_provider'
    else 'founder'
  end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text := public.normalize_signup_role(new.raw_user_meta_data ->> 'role');
begin
  insert into public.profiles (user_id, role, full_name, company_name, email, phone)
  values (
    new.id,
    signup_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict do nothing;

  if signup_role = 'service_provider' then
    insert into public.service_providers (
      user_id,
      name,
      firm_name,
      email,
      phone,
      service_category,
      pan_or_gst,
      website_or_linkedin,
      experience_details,
      cgpdtm_registration_number
    )
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
      nullif(new.raw_user_meta_data ->> 'company_name', ''),
      new.email,
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      nullif(new.raw_user_meta_data ->> 'service_category', ''),
      nullif(new.raw_user_meta_data ->> 'pan_or_gst', ''),
      nullif(new.raw_user_meta_data ->> 'website_or_linkedin', ''),
      nullif(new.raw_user_meta_data ->> 'experience_details', ''),
      nullif(new.raw_user_meta_data ->> 'cgpdtm_registration_number', '')
    )
    on conflict do nothing;
  end if;

  if not exists (select 1 from public.subscriptions where user_id = new.id) then
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists idea_workspaces_set_updated_at on public.idea_workspaces;
create trigger idea_workspaces_set_updated_at before update on public.idea_workspaces
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

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

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id and not public.is_admin(auth.uid()) then
    new.user_id = old.user_id;
    new.role = old.role;
    new.plan = old.plan;
    new.trust_score = old.trust_score;
    new.verification_status = old.verification_status;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create or replace function public.record_vc_report(
  p_workspace_id uuid,
  p_report_type text,
  p_report_content jsonb,
  p_score integer
)
returns public.vc_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_plan text;
  v_required_plan text;
  v_limit integer;
  v_month date := date_trunc('month', now())::date;
  v_subscription public.subscriptions%rowtype;
  v_report public.vc_reports%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select
    lower(coalesce(role, '')),
    lower(replace(replace(coalesce(plan, 'free'), ' ', '_'), '-', '_'))
  into v_role, v_plan
  from public.profiles
  where user_id = v_user_id
  limit 1;

  if v_role <> 'founder' then
    raise exception 'Only founders can generate reports';
  end if;

  if not exists (
    select 1
    from public.idea_workspaces
    where id = p_workspace_id
      and founder_id = v_user_id
      and archived = false
      and completion_percentage = 100
  ) then
    raise exception 'Workspace must be complete and owned by the founder';
  end if;

  if p_report_type not in (
    'Basic SWOT Report',
    'Premium SWOT Analysis',
    'Full Brief Report',
    'Bottleneck Report',
    'Competitor Defensive Report',
    'Roadmap Report',
    'Investor Scorecard Report'
  ) then
    raise exception 'Unsupported report type';
  end if;

  if jsonb_typeof(p_report_content) <> 'object'
    or p_report_content ->> 'reportType' is distinct from p_report_type
    or p_score not between 0 and 100 then
    raise exception 'Invalid structured report content';
  end if;

  if p_report_type = 'Basic SWOT Report' then
    v_required_plan := 'Free';
  elsif p_report_type in ('Roadmap Report', 'Investor Scorecard Report') then
    v_required_plan := 'Founder Pro';
    if v_plan <> 'founder_pro' then
      raise exception 'Report type is not included in the current plan';
    end if;
  else
    v_required_plan := 'Student Pro';
    if v_plan not in ('student_pro', 'founder_pro') then
      raise exception 'Report type is not included in the current plan';
    end if;
  end if;

  select * into v_subscription
  from public.subscriptions
  where user_id = v_user_id
  order by started_at desc
  limit 1
  for update;

  if not found then
    insert into public.subscriptions (user_id, plan, status, report_usage_month)
    values (v_user_id, 'free', 'active', v_month)
    returning * into v_subscription;
  end if;

  if v_subscription.report_usage_month is distinct from v_month then
    update public.subscriptions
    set report_count_used = 0,
        report_usage_month = v_month
    where id = v_subscription.id
    returning * into v_subscription;
  end if;

  if p_report_type = 'Basic SWOT Report' then
    if coalesce(v_subscription.free_swot_used, false) then
      raise exception 'Basic SWOT Report allowance already used';
    end if;
  else
    v_limit := case when v_plan = 'founder_pro' then 5 else 3 end;
    if coalesce(v_subscription.report_count_used, 0) >= v_limit then
      raise exception 'Monthly premium report limit reached';
    end if;
  end if;

  insert into public.vc_reports (
    founder_id,
    idea_workspace_id,
    report_type,
    plan_required,
    report_content,
    score
  )
  values (
    v_user_id,
    p_workspace_id,
    p_report_type,
    v_required_plan,
    p_report_content,
    p_score
  )
  returning * into v_report;

  if p_report_type = 'Basic SWOT Report' then
    update public.subscriptions
    set free_swot_used = true
    where id = v_subscription.id;
  else
    update public.subscriptions
    set report_count_used = coalesce(report_count_used, 0) + 1,
        report_usage_month = v_month
    where id = v_subscription.id;
  end if;

  return v_report;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.prevent_profile_privilege_escalation() from public;
revoke all on function public.record_vc_report(uuid, text, jsonb, integer) from public;
grant execute on function public.record_vc_report(uuid, text, jsonb, integer) to authenticated;

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
with check (
  user_id = auth.uid()
  and role in ('founder', 'investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'service_provider')
  and plan = 'free'
  and trust_score = 0
  and verification_status = 'pending'
);

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

drop policy if exists "idea_workspaces_delete_own_or_admin" on public.idea_workspaces;
create policy "idea_workspaces_delete_own_or_admin"
on public.idea_workspaces for delete
using (founder_id = auth.uid() or public.is_admin());

drop policy if exists "opportunities_select_verified_own_or_admin" on public.opportunities;
create policy "opportunities_select_verified_own_or_admin"
on public.opportunities for select
using (verified = true or created_by = auth.uid() or public.is_admin());

drop policy if exists "opportunities_insert_reviewers" on public.opportunities;
create policy "opportunities_insert_reviewers"
on public.opportunities for insert
with check (
  created_by = auth.uid()
  and creator_role in ('investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'admin')
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
with check (public.is_admin());

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
with check (public.is_admin());

drop policy if exists "subscriptions_update_own_or_admin" on public.subscriptions;
create policy "subscriptions_update_own_or_admin"
on public.subscriptions for update
using (public.is_admin())
with check (public.is_admin());

-- Remaining external integrations:
-- - Replace local/demo upload names with Supabase Storage buckets and signed URLs.
-- - Activate exactly one verified payment provider after pricing/product approval.
-- - Tighten role text values into enums once production roles are finalized.
