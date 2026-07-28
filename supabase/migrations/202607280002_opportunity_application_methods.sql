-- Configurable opportunity application methods and external-registration tracking.

alter table public.opportunities add column if not exists application_method text not null default 'idea_workspace_application';
alter table public.opportunities add column if not exists organizer_logo text;
alter table public.opportunities add column if not exists official_website text;
alter table public.opportunities add column if not exists event_start_date date;
alter table public.opportunities add column if not exists event_end_date date;
alter table public.opportunities add column if not exists venue text;
alter table public.opportunities add column if not exists team_size text;
alter table public.opportunities add column if not exists tracks text[] not null default '{}';
alter table public.opportunities add column if not exists registration_fee text;
alter table public.opportunities add column if not exists required_skills text[] not null default '{}';
alter table public.opportunities add column if not exists official_rules_url text;
alter table public.opportunities add column if not exists source_verification text;
alter table public.opportunities add column if not exists application_instructions text;
alter table public.opportunities add column if not exists direct_application_partner boolean not null default false;

update public.opportunities
set application_method = case
  when lower(coalesce(opportunity_type, '')) in ('hackathon', 'workshop', 'webinar', 'startup event', 'networking event')
    then 'external_registration'
  when lower(coalesce(opportunity_type, '')) = 'investor opportunity'
    then 'idea_workspace_application'
  else application_method
end;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_application_method_allowed') then
    alter table public.opportunities
      add constraint opportunities_application_method_allowed
      check (application_method in ('external_registration', 'idea_workspace_application', 'hybrid_application', 'information_only')) not valid;
  end if;
end $$;

create table if not exists public.external_registrations (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'Not Started' check (
    status in ('Not Started', 'Registration Opened', 'Applied Externally', 'Shortlisted', 'Selected', 'Not Selected', 'Withdrawn')
  ),
  external_application_id text,
  team_name text,
  submission_date date,
  notes text,
  confirmation_file_url text,
  organizer_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (founder_id, opportunity_id)
);

create table if not exists public.opportunity_analytics (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'opportunity_viewed',
      'official_registration_clicked',
      'opportunity_saved',
      'marked_as_applied',
      'deadline_reminder_created',
      'external_application_status_updated'
    )
  ),
  referral_source text,
  occurred_at timestamptz not null default now()
);

create index if not exists external_registrations_founder_idx
  on public.external_registrations(founder_id, updated_at desc);
create index if not exists external_registrations_opportunity_idx
  on public.external_registrations(opportunity_id, status);
create index if not exists opportunity_analytics_opportunity_idx
  on public.opportunity_analytics(opportunity_id, occurred_at desc);

create or replace function public.prevent_invalid_opportunity_application_method()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.application_method in ('external_registration', 'hybrid_application') then
    if new.external_link is null or new.external_link !~* '^https?://[^[:space:]]+$' then
      raise exception 'External and hybrid opportunities require a valid http or https official application URL.';
    end if;
    if nullif(trim(coalesce(new.organizer_name, '')), '') is null
      or new.deadline is null
      or nullif(trim(coalesce(new.source_verification, '')), '') is null then
      raise exception 'External registration requires organiser name, deadline, and source verification.';
    end if;
  end if;

  if lower(coalesce(new.opportunity_type, '')) = 'hackathon'
    and new.application_method <> 'external_registration'
    and coalesce(new.direct_application_partner, false) = false then
    raise exception 'Hackathons require external registration unless a direct application partnership is confirmed.';
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_validate_application_method on public.opportunities;
create trigger opportunities_validate_application_method
before insert or update of opportunity_type, application_method, external_link, organizer_name, deadline, source_verification, direct_application_partner
on public.opportunities
for each row execute function public.prevent_invalid_opportunity_application_method();

create or replace function public.prevent_external_only_internal_application()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_method text;
  v_partner boolean;
begin
  select application_method, direct_application_partner
  into v_method, v_partner
  from public.opportunities
  where id = new.opportunity_id;

  if v_method = 'idea_workspace_application' then
    if new.idea_workspace_id is null then
      raise exception 'Idea Workspace applications require a selected workspace.';
    end if;
    return new;
  end if;

  if v_method = 'hybrid_application' and coalesce(v_partner, false) and new.idea_workspace_id is not null then
    return new;
  end if;

  raise exception 'This opportunity is managed through external organiser registration.';
end;
$$;

drop trigger if exists applications_enforce_opportunity_method on public.applications;
create trigger applications_enforce_opportunity_method
before insert or update of opportunity_id, idea_workspace_id
on public.applications
for each row execute function public.prevent_external_only_internal_application();

alter table public.external_registrations enable row level security;
alter table public.opportunity_analytics enable row level security;

drop policy if exists "founders manage own external registrations" on public.external_registrations;
create policy "founders manage own external registrations"
on public.external_registrations for all
using (founder_id = auth.uid() or public.is_admin())
with check (founder_id = auth.uid() or public.is_admin());

drop policy if exists "users record own opportunity analytics" on public.opportunity_analytics;
create policy "users record own opportunity analytics"
on public.opportunity_analytics for insert
with check (user_id = auth.uid());

drop policy if exists "admins read opportunity analytics" on public.opportunity_analytics;
create policy "admins read opportunity analytics"
on public.opportunity_analytics for select
using (public.is_admin());
