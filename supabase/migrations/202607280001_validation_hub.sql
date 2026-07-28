-- Venture Connect Validation Hub
-- Human validation workflow for Idea Workspace documents.

do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_allowed;
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_allowed
    check (role in ('founder', 'investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'service_provider', 'validator', 'admin')) not valid;
exception
  when duplicate_object then null;
end $$;

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
    when 'validator' then 'validator'
    else 'founder'
  end;
$$;

create table if not exists public.validator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  role_title text not null,
  institution text,
  location text,
  languages text[] not null default '{}',
  bio text,
  qualifications text[] not null default '{}',
  industry_experience text[] not null default '{}',
  incubation_activities text[] not null default '{}',
  mentoring_experience text,
  level text not null default 'new_validator' check (level in ('new_validator', 'verified_validator', 'partner_validator', 'institutional_expert')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  weekly_limit integer,
  min_price integer,
  max_price integer,
  rating numeric(3,2) not null default 0,
  completed_validations integer not null default 0,
  response_time_hours integer,
  dispute_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.validator_expertise (
  id uuid primary key default gen_random_uuid(),
  validator_id uuid not null references public.validator_profiles(id) on delete cascade,
  expertise text not null,
  created_at timestamptz not null default now(),
  unique (validator_id, expertise)
);

create table if not exists public.validator_services (
  id uuid primary key default gen_random_uuid(),
  validator_id uuid not null references public.validator_profiles(id) on delete cascade,
  service_type text not null check (service_type in ('written_idea_review', 'live_validation_session', 'expert_validation')),
  founder_price integer not null check (founder_price > 0),
  validator_payout integer not null check (validator_payout >= 0),
  platform_share integer not null check (platform_share >= 0),
  expected_delivery_hours integer not null,
  requires_live_session boolean not null default false,
  includes_revision_review boolean not null default false,
  deliverables text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint validator_service_commission_matches check (founder_price = validator_payout + platform_share)
);

create table if not exists public.validator_availability (
  id uuid primary key default gen_random_uuid(),
  validator_id uuid not null references public.validator_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  language text,
  status text not null default 'open' check (status in ('open', 'booked', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.validation_bookings (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  validator_id uuid not null references public.validator_profiles(id) on delete restrict,
  service_id uuid not null references public.validator_services(id) on delete restrict,
  idea_workspace_id uuid not null references public.idea_workspaces(id) on delete restrict,
  idea_workspace_version integer not null default 1,
  domain text not null,
  status text not null default 'payment_confirmed' check (
    status in (
      'payment_confirmed',
      'awaiting_validator_acceptance',
      'document_under_review',
      'session_scheduled',
      'report_in_progress',
      'improvements_required',
      'revised_document_submitted',
      'validation_completed',
      'disputed',
      'cancelled'
    )
  ),
  request_note text,
  scheduled_for timestamptz,
  meeting_language text,
  meeting_link text,
  delivery_deadline timestamptz,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'held_in_escrow', 'released', 'refunded')),
  payout_status text not null default 'not_eligible' check (payout_status in ('not_eligible', 'pending_report', 'pending_dispute_window', 'ready_to_release', 'released')),
  total_amount integer not null check (total_amount >= 0),
  secure_document_access_granted boolean not null default false,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.validation_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.validation_bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text', 'attachment', 'system_update', 'meeting_link', 'report_delivery')),
  body text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.validation_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.validation_bookings(id) on delete cascade,
  validator_id uuid not null references public.validator_profiles(id) on delete restrict,
  validation_date date not null default current_date,
  service_type text not null,
  idea_workspace_version integer not null,
  areas_reviewed text[] not null default '{}',
  evidence_reviewed text[] not null default '{}',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  major_assumptions text[] not null default '{}',
  major_risks text[] not null default '{}',
  recommended_experiments text[] not null default '{}',
  required_improvements text[] not null default '{}',
  validator_conclusion text not null,
  readiness_stage text not null check (
    readiness_stage in ('needs_research', 'early_validation', 'evidence_developing', 'validation_ready', 'pilot_ready', 'investor_application_ready')
  ),
  approved_for_badge boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.validation_scores (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.validation_reports(id) on delete cascade,
  dimension text not null,
  score integer not null check (score between 0 and 100),
  justification text not null check (length(trim(justification)) >= 12),
  unique (report_id, dimension)
);

create table if not exists public.validation_revisions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.validation_bookings(id) on delete cascade,
  idea_workspace_version integer not null,
  founder_note text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'changes_requested')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.validation_badges (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.validation_reports(id) on delete restrict,
  booking_id uuid not null references public.validation_bookings(id) on delete restrict,
  idea_workspace_id uuid not null references public.idea_workspaces(id) on delete restrict,
  idea_workspace_version integer not null,
  validator_id uuid not null references public.validator_profiles(id) on delete restrict,
  badge_name text not null check (
    badge_name in (
      'human_reviewed',
      'problem_review_completed',
      'customer_evidence_reviewed',
      'technical_feasibility_reviewed',
      'business_model_reviewed',
      'incubation_cell_reviewed',
      'investor_application_ready'
    )
  ),
  areas_reviewed text[] not null default '{}',
  readiness_stage text not null,
  verification_id text not null unique,
  limited_summary text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.validator_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.validation_bookings(id) on delete cascade,
  validator_id uuid not null references public.validator_profiles(id) on delete cascade,
  founder_id uuid not null references auth.users(id) on delete cascade,
  overall_rating integer not null check (overall_rating between 1 and 5),
  domain_knowledge integer not null check (domain_knowledge between 1 and 5),
  usefulness integer not null check (usefulness between 1 and 5),
  clarity integer not null check (clarity between 1 and 5),
  report_quality integer not null check (report_quality between 1 and 5),
  punctuality integer not null check (punctuality between 1 and 5),
  written_review text not null,
  verified_booking boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.validator_payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.validation_bookings(id) on delete cascade,
  validator_id uuid not null references public.validator_profiles(id) on delete cascade,
  amount integer not null check (amount >= 0),
  platform_share integer not null check (platform_share >= 0),
  status text not null default 'pending_report' check (status in ('pending_report', 'pending_dispute_window', 'ready_to_release', 'released', 'held', 'refunded')),
  release_after timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.validation_disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.validation_bookings(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.validation_activity_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.validation_bookings(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.validation_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.validation_settings (key, value)
values
  ('commission', '{"written_idea_review":{"founder_price":149,"validator_payout":100,"platform_share":49},"live_validation_session":{"founder_price":299,"validator_payout":220,"platform_share":79},"expert_validation":{"founder_price":599,"validator_payout":450,"platform_share":149}}'::jsonb),
  ('badge_rules', '{"badge_requires_completed_report":true,"badge_requires_document_version_approval":true,"revalidation_on_major_change":true,"investor_summary_limited_by_default":true}'::jsonb)
on conflict (key) do nothing;

create index if not exists validator_profiles_user_id_idx on public.validator_profiles(user_id);
create index if not exists validator_profiles_status_idx on public.validator_profiles(status);
create index if not exists validation_bookings_founder_idx on public.validation_bookings(founder_id, created_at desc);
create index if not exists validation_bookings_validator_idx on public.validation_bookings(validator_id, created_at desc);
create index if not exists validation_messages_booking_idx on public.validation_messages(booking_id, created_at);
create index if not exists validation_badges_workspace_idx on public.validation_badges(idea_workspace_id, idea_workspace_version);

create or replace function public.prevent_invalid_validation_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.validation_bookings b
    where b.id = new.booking_id
      and b.status = 'validation_completed'
      and b.payment_status in ('held_in_escrow', 'released')
  ) then
    raise exception 'Only completed paid validation bookings can create public reviews.';
  end if;
  return new;
end;
$$;

drop trigger if exists validator_reviews_completed_booking on public.validator_reviews;
create trigger validator_reviews_completed_booking
before insert or update on public.validator_reviews
for each row execute function public.prevent_invalid_validation_review();

create or replace function public.prevent_invalid_validation_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.validation_reports r
    join public.validation_bookings b on b.id = r.booking_id
    where r.id = new.report_id
      and r.approved_for_badge = true
      and b.status = 'validation_completed'
      and b.idea_workspace_id = new.idea_workspace_id
      and b.idea_workspace_version = new.idea_workspace_version
  ) then
    raise exception 'A badge requires a completed approved report for the exact Idea Workspace version.';
  end if;
  return new;
end;
$$;

drop trigger if exists validation_badges_require_report on public.validation_badges;
create trigger validation_badges_require_report
before insert or update on public.validation_badges
for each row execute function public.prevent_invalid_validation_badge();

alter table public.validator_profiles enable row level security;
alter table public.validator_expertise enable row level security;
alter table public.validator_services enable row level security;
alter table public.validator_availability enable row level security;
alter table public.validation_bookings enable row level security;
alter table public.validation_messages enable row level security;
alter table public.validation_reports enable row level security;
alter table public.validation_scores enable row level security;
alter table public.validation_revisions enable row level security;
alter table public.validation_badges enable row level security;
alter table public.validator_reviews enable row level security;
alter table public.validator_payouts enable row level security;
alter table public.validation_disputes enable row level security;
alter table public.validation_activity_logs enable row level security;
alter table public.validation_settings enable row level security;

drop policy if exists "approved validators are discoverable" on public.validator_profiles;
create policy "approved validators are discoverable"
on public.validator_profiles for select
using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage validator profiles" on public.validator_profiles;
create policy "admins manage validator profiles"
on public.validator_profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "validators update own profile draft" on public.validator_profiles;
create policy "validators update own profile draft"
on public.validator_profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "validator public expertise readable" on public.validator_expertise;
create policy "validator public expertise readable"
on public.validator_expertise for select
using (
  exists (
    select 1 from public.validator_profiles vp
    where vp.id = validator_id
      and (vp.status = 'approved' or vp.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "validator services discoverable" on public.validator_services;
create policy "validator services discoverable"
on public.validator_services for select
using (
  active = true
  and exists (
    select 1 from public.validator_profiles vp
    where vp.id = validator_id
      and (vp.status = 'approved' or vp.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "bookings visible to participants and admin" on public.validation_bookings;
create policy "bookings visible to participants and admin"
on public.validation_bookings for select
using (
  founder_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.validator_profiles vp
    where vp.id = validator_id and vp.user_id = auth.uid()
  )
);

drop policy if exists "founders create own bookings" on public.validation_bookings;
create policy "founders create own bookings"
on public.validation_bookings for insert
with check (founder_id = auth.uid());

drop policy if exists "participants read validation messages" on public.validation_messages;
create policy "participants read validation messages"
on public.validation_messages for select
using (
  exists (
    select 1 from public.validation_bookings b
    join public.validator_profiles vp on vp.id = b.validator_id
    where b.id = booking_id
      and (b.founder_id = auth.uid() or vp.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "participants send validation messages" on public.validation_messages;
create policy "participants send validation messages"
on public.validation_messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.validation_bookings b
    join public.validator_profiles vp on vp.id = b.validator_id
    where b.id = booking_id
      and b.accepted_at is not null
      and (b.founder_id = auth.uid() or vp.user_id = auth.uid())
  )
);

drop policy if exists "reports visible to booking participants" on public.validation_reports;
create policy "reports visible to booking participants"
on public.validation_reports for select
using (
  exists (
    select 1 from public.validation_bookings b
    join public.validator_profiles vp on vp.id = b.validator_id
    where b.id = booking_id
      and (b.founder_id = auth.uid() or vp.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "validators create reports for assigned bookings" on public.validation_reports;
create policy "validators create reports for assigned bookings"
on public.validation_reports for insert
with check (
  exists (
    select 1 from public.validation_bookings b
    join public.validator_profiles vp on vp.id = b.validator_id
    where b.id = booking_id and vp.user_id = auth.uid()
  )
);

drop policy if exists "scores follow report access" on public.validation_scores;
create policy "scores follow report access"
on public.validation_scores for select
using (
  exists (
    select 1 from public.validation_reports r
    join public.validation_bookings b on b.id = r.booking_id
    join public.validator_profiles vp on vp.id = b.validator_id
    where r.id = report_id
      and (b.founder_id = auth.uid() or vp.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "badges are limited public summaries" on public.validation_badges;
create policy "badges are limited public summaries"
on public.validation_badges for select
using (revoked_at is null or public.is_admin());

drop policy if exists "admins create badges" on public.validation_badges;
create policy "admins create badges"
on public.validation_badges for insert
with check (public.is_admin());

drop policy if exists "verified paid reviews are public" on public.validator_reviews;
create policy "verified paid reviews are public"
on public.validator_reviews for select
using (verified_booking = true);

drop policy if exists "founders create own completed booking reviews" on public.validator_reviews;
create policy "founders create own completed booking reviews"
on public.validator_reviews for insert
with check (founder_id = auth.uid());

drop policy if exists "admins manage validation financials" on public.validator_payouts;
create policy "admins manage validation financials"
on public.validator_payouts for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "participants view disputes" on public.validation_disputes;
create policy "participants view disputes"
on public.validation_disputes for select
using (
  opened_by = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.validation_bookings b
    join public.validator_profiles vp on vp.id = b.validator_id
    where b.id = booking_id
      and (b.founder_id = auth.uid() or vp.user_id = auth.uid())
  )
);

drop policy if exists "admins manage validation settings" on public.validation_settings;
create policy "admins manage validation settings"
on public.validation_settings for all
using (public.is_admin())
with check (public.is_admin());
