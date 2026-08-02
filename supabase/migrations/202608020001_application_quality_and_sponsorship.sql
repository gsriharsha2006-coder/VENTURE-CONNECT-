-- Venture Connect production-pilot application quality and sponsored-content contract.
-- Review in a disposable staging database before any remote execution.

alter table public.organisations drop constraint if exists organisations_organisation_type_check;
alter table public.organisations add constraint organisations_organisation_type_check
  check (organisation_type in (
    'incubator', 'accelerator', 'investor', 'institution', 'company', 'community',
    'hackathon_organiser', 'event_organiser', 'other'
  )) not valid;

alter table public.opportunities
  add column if not exists eligibility_rules jsonb not null default '{}'::jsonb,
  add column if not exists required_application_fields text[] not null default '{}'::text[],
  add column if not exists registration_method text not null default 'workspace_application',
  add column if not exists is_sponsored boolean not null default false;

alter table public.opportunities drop constraint if exists opportunities_application_method_allowed;
alter table public.opportunities add constraint opportunities_application_method_allowed
  check (application_method in (
    'internal_registration', 'external_registration', 'idea_workspace_application',
    'hybrid_application', 'information_only'
  )) not valid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_registration_method_allowed') then
    alter table public.opportunities add constraint opportunities_registration_method_allowed
      check (registration_method in ('internal_form', 'external_application', 'workspace_application')) not valid;
  end if;
end
$$;

alter table public.opportunity_forms drop constraint if exists opportunity_forms_status_check;
alter table public.opportunity_forms add constraint opportunity_forms_status_check
  check (status in ('draft', 'published', 'closed', 'archived')) not valid;

alter table public.opportunity_form_fields drop constraint if exists opportunity_form_fields_field_type_check;
alter table public.opportunity_form_fields add constraint opportunity_form_fields_field_type_check
  check (
    field_type in (
      'short_text', 'long_text', 'number', 'email', 'phone', 'url', 'date',
      'single_select', 'multi_select', 'checkbox', 'consent_checkbox', 'file',
      'team_members', 'workspace_reference'
    )
  ) not valid;

alter table public.applications
  add column if not exists application_copy_json jsonb not null default '{}'::jsonb,
  add column if not exists quality_status text not null default 'quality_check_required',
  add column if not exists quality_checked_at timestamptz,
  add column if not exists quality_input_fingerprint text,
  add column if not exists snapshot_created_at timestamptz,
  add column if not exists last_saved_at timestamptz not null default now();

alter table public.applications drop constraint if exists applications_status_allowed_v2;
alter table public.applications add constraint applications_status_allowed_v2 check (
  lower(status) in (
    'started', 'draft', 'submitted', 'under_review', 'needs_changes', 'shortlisted',
    'selected', 'waitlisted', 'interested', 'accepted', 'rejected', 'declined', 'withdrawn'
  )
) not valid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'applications_quality_status_allowed') then
    alter table public.applications add constraint applications_quality_status_allowed
      check (quality_status in (
        'quality_check_required', 'ready_to_submit', 'needs_revision', 'incomplete',
        'eligibility_mismatch', 'manual_review_required', 'outdated', 'not_applicable'
      )) not valid;
  end if;
end
$$;

create table if not exists public.application_quality_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  founder_profile_id uuid not null references public.profiles(id) on delete restrict,
  organisation_id uuid references public.organisations(id) on delete set null,
  input_fingerprint text not null check (input_fingerprint ~ '^[0-9a-f]{64}$'),
  status text not null check (status in (
    'ready_to_submit', 'needs_revision', 'incomplete', 'eligibility_mismatch', 'manual_review_required'
  )),
  score integer not null check (score between 0 and 100),
  result_json jsonb not null,
  is_current boolean not null default true,
  semantic_model text,
  usage_json jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists application_quality_checks_current_idx
  on public.application_quality_checks(application_id)
  where is_current = true;
create index if not exists application_quality_checks_founder_idx
  on public.application_quality_checks(founder_profile_id, checked_at desc);
create index if not exists application_quality_checks_org_idx
  on public.application_quality_checks(organisation_id, checked_at desc);

create table if not exists public.application_snapshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete restrict,
  founder_profile_id uuid not null references public.profiles(id) on delete restrict,
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  quality_check_id uuid not null references public.application_quality_checks(id) on delete restrict,
  application_json jsonb not null,
  quality_result_json jsonb not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists application_snapshots_founder_idx
  on public.application_snapshots(founder_profile_id, submitted_at desc);
create index if not exists application_snapshots_org_idx
  on public.application_snapshots(organisation_id, submitted_at desc);

create table if not exists public.saved_applications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  saved_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (application_id, saved_by_profile_id)
);

create table if not exists public.interested_applications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  marked_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create or replace function public.mark_application_quality_outdated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.answers_json is distinct from new.answers_json
    or old.application_copy_json is distinct from new.application_copy_json
    or old.idea_workspace_id is distinct from new.idea_workspace_id then
    new.quality_status := 'outdated';
    new.quality_checked_at := null;
    new.quality_input_fingerprint := null;
    update public.application_quality_checks
      set is_current = false
      where application_id = old.id and is_current = true;
  end if;
  new.last_saved_at := now();
  return new;
end
$$;
revoke all on function public.mark_application_quality_outdated() from public;

drop trigger if exists applications_mark_quality_outdated on public.applications;
create trigger applications_mark_quality_outdated
before update of answers_json, application_copy_json, idea_workspace_id on public.applications
for each row execute function public.mark_application_quality_outdated();

alter table public.conversations drop constraint if exists conversations_authorization_reason_check;
alter table public.conversations add constraint conversations_authorization_reason_check
  check (authorization_reason in ('interested', 'request_information', 'programme_rule', 'validation_booking')) not valid;
alter table public.conversations drop constraint if exists conversations_context_matches;
alter table public.conversations add constraint conversations_context_matches check (
  (context_type = 'application' and application_id is not null and authorization_reason in ('interested', 'request_information'))
  or (context_type = 'validation_booking' and validation_booking_id is not null and authorization_reason = 'validation_booking')
  or (context_type = 'programme' and programme_context_id is not null and authorization_reason = 'programme_rule')
) not valid;

create or replace function public.validate_conversation_context()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.context_type = 'application' and not exists (
    select 1 from public.applications a
    where a.id = new.application_id
      and (
        (new.authorization_reason = 'interested' and lower(a.status) = 'interested')
        or (new.authorization_reason = 'request_information' and lower(a.status) = 'needs_changes')
      )
      and a.organisation_id is not distinct from new.organisation_id
  ) then
    raise exception 'Application conversation is not authorised for its current status.';
  end if;
  if new.context_type = 'validation_booking' and not exists (
    select 1 from public.validation_bookings b where b.id = new.validation_booking_id
  ) then raise exception 'Validation conversation requires an existing validation booking.'; end if;
  if new.context_type = 'programme' and not exists (
    select 1 from public.opportunities o where o.id = new.programme_context_id and o.organisation_id = new.organisation_id
  ) then raise exception 'Programme conversation must match its organisation opportunity.'; end if;
  return new;
end
$$;

drop policy if exists "applications_insert_founder" on public.applications;
create policy "applications_insert_founder" on public.applications for insert
with check (
  founder_id = auth.uid()
  and founder_profile_id = public.current_profile_id()
  and lower(status) = 'draft'
  and exists (
    select 1 from public.opportunities o
    where o.id = opportunity_id
      and o.organisation_id is not distinct from applications.organisation_id
  )
);

drop policy if exists "founders update own draft applications" on public.applications;
create policy "founders update own draft applications" on public.applications for update
using (founder_profile_id = public.current_profile_id() and lower(status) = 'draft')
with check (founder_profile_id = public.current_profile_id() and lower(status) = 'draft');

create or replace function public.prevent_application_snapshot_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  raise exception 'Submitted application snapshots are immutable.';
end
$$;

drop trigger if exists application_snapshots_immutable on public.application_snapshots;
create trigger application_snapshots_immutable
before update or delete on public.application_snapshots
for each row execute function public.prevent_application_snapshot_mutation();

create or replace function public.submit_ready_application(
  p_application_id uuid,
  p_founder_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  app public.applications%rowtype;
  latest_check public.application_quality_checks%rowtype;
  snapshot_id uuid;
begin
  if public.current_profile_id() is distinct from p_founder_profile_id and not public.is_admin() then
    raise exception 'Application ownership mismatch.';
  end if;

  select * into app
  from public.applications
  where id = p_application_id and founder_profile_id = p_founder_profile_id
  for update;
  if app.id is null then raise exception 'Application draft not found.'; end if;
  if lower(app.status) <> 'draft' then raise exception 'Only an application draft can be submitted.'; end if;
  if exists (
    select 1 from public.opportunities o
    where o.id = app.opportunity_id
      and case when o.deadline ~ '^\d{4}-\d{2}-\d{2}$' then o.deadline::date < current_date else false end
  ) then raise exception 'The application deadline has passed.'; end if;

  select * into latest_check
  from public.application_quality_checks
  where application_id = app.id and is_current = true
  order by checked_at desc
  limit 1;
  if latest_check.id is null or latest_check.status <> 'ready_to_submit' then
    raise exception 'A current Ready to Submit quality check is required.';
  end if;

  insert into public.application_snapshots (
    application_id, founder_profile_id, organisation_id, opportunity_id,
    quality_check_id, application_json, quality_result_json
  ) values (
    app.id, app.founder_profile_id, app.organisation_id, app.opportunity_id,
    latest_check.id,
    jsonb_build_object('answers', app.answers_json, 'applicationCopy', app.application_copy_json, 'ideaWorkspaceId', app.idea_workspace_id),
    latest_check.result_json
  ) returning id into snapshot_id;

  update public.applications
  set status = 'Submitted', quality_status = 'ready_to_submit',
      quality_checked_at = latest_check.checked_at,
      quality_input_fingerprint = latest_check.input_fingerprint,
      snapshot_created_at = now(), submitted_at = now(), updated_at = now()
  where id = app.id;

  insert into public.notifications (user_id, profile_id, type, title, message, body, metadata)
  select p.user_id, p.id, 'Application Update', 'New application submitted',
         'A founder submitted an application to your organisation.',
         'A founder submitted an application to your organisation.',
         jsonb_build_object('applicationId', app.id, 'opportunityId', app.opportunity_id)
  from public.organisation_members om
  join public.profiles p on p.id = om.profile_id
  where om.organisation_id = app.organisation_id
    and om.status = 'active'
    and om.membership_role in ('owner', 'admin', 'reviewer');

  return jsonb_build_object('applicationId', app.id, 'snapshotId', snapshot_id, 'status', 'Submitted');
end
$$;

revoke all on function public.submit_ready_application(uuid, uuid) from public;
grant execute on function public.submit_ready_application(uuid, uuid) to authenticated;

-- Sponsored content is deliberately separate from application scoring and review tables.
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete set null,
  organisation_name text not null check (length(trim(organisation_name)) between 2 and 160),
  logo_url text,
  contact_name text,
  contact_email text,
  website text,
  verified_status text not null default 'pending' check (verified_status in ('pending', 'verified', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  campaign_name text not null check (length(trim(campaign_name)) between 2 and 160),
  campaign_type text not null check (campaign_type in (
    'hackathon', 'incubation', 'startup_competition', 'debugging_challenge', 'workshop',
    'innovation_event', 'startup_event', 'cloud_credits', 'developer_tools',
    'ip_services', 'company_registration', 'student_founder_services'
  )),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'active', 'paused', 'rejected', 'completed')),
  placements text[] not null default '{}'::text[],
  start_date date not null,
  end_date date not null,
  target_roles text[] not null default '{}'::text[],
  target_colleges text[] not null default '{}'::text[],
  target_locations text[] not null default '{}'::text[],
  target_categories text[] not null default '{}'::text[],
  target_sectors text[] not null default '{}'::text[],
  daily_limit integer check (daily_limit is null or daily_limit > 0),
  total_budget numeric(12,2) check (total_budget is null or total_budget >= 0),
  approved_by_profile_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (placements <@ array['dashboard_sidebar', 'opportunity_sidebar', 'opportunity_feed', 'sponsored_opportunity']::text[])
);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  sponsor_name text not null check (length(trim(sponsor_name)) between 2 and 160),
  headline text not null check (length(trim(headline)) between 2 and 120),
  description text not null check (length(trim(description)) between 10 and 300),
  cta_label text not null check (cta_label in ('Learn More', 'View Opportunity', 'Apply Now', 'Follow Program')),
  cta_url text not null check (cta_url ~ '^https://'),
  image_url text,
  logo_url text,
  promoted_label text not null default 'Promoted' check (promoted_label in ('Promoted', 'Sponsored')),
  approved_status text not null default 'pending' check (approved_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsored_opportunities (
  campaign_id uuid primary key references public.ad_campaigns(id) on delete cascade,
  opportunity_id uuid not null unique references public.opportunities(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  creative_id uuid references public.ad_creatives(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('impression', 'click', 'hide', 'report', 'apply_started', 'apply_completed')),
  page_location text not null check (page_location in ('dashboard_sidebar', 'opportunity_sidebar', 'opportunity_feed', 'sponsored_opportunity')),
  session_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_hides (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, profile_id)
);

create table if not exists public.ad_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (length(trim(reason)) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_active_idx on public.ad_campaigns(status, start_date, end_date);
create index if not exists ad_creatives_campaign_idx on public.ad_creatives(campaign_id, approved_status);
create index if not exists ad_events_campaign_idx on public.ad_events(campaign_id, event_type, created_at desc);
create index if not exists ad_events_profile_idx on public.ad_events(profile_id, created_at desc);
create index if not exists ad_reports_status_idx on public.ad_reports(status, created_at desc);

create or replace function public.prevent_campaign_self_approval()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() and (
    new.status in ('approved', 'active')
    or new.approved_by_profile_id is not null
    or new.approved_at is not null
  ) then
    raise exception 'Campaign approval requires an administrator.';
  end if;
  return new;
end
$$;

drop trigger if exists ad_campaigns_require_admin_approval on public.ad_campaigns;
create trigger ad_campaigns_require_admin_approval
before insert or update on public.ad_campaigns
for each row execute function public.prevent_campaign_self_approval();

alter table public.application_quality_checks enable row level security;
alter table public.application_snapshots enable row level security;
alter table public.saved_applications enable row level security;
alter table public.interested_applications enable row level security;
alter table public.sponsors enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.sponsored_opportunities enable row level security;
alter table public.ad_events enable row level security;
alter table public.ad_hides enable row level security;
alter table public.ad_reports enable row level security;

create policy "founders read own quality checks" on public.application_quality_checks for select
using (founder_profile_id = public.current_profile_id() or public.is_admin());
create policy "organisations read submitted quality checks" on public.application_quality_checks for select
using (public.is_organisation_member(organisation_id) and exists (
  select 1 from public.applications a where a.id = application_id and lower(a.status) = 'submitted'
));

create policy "founders read own snapshots" on public.application_snapshots for select
using (founder_profile_id = public.current_profile_id() or public.is_admin());
create policy "organisations read assigned snapshots" on public.application_snapshots for select
using (public.is_organisation_member(organisation_id) or public.is_admin());

create policy "organisation members manage saved applications" on public.saved_applications for all
using (
  (public.is_organisation_member(organisation_id) and exists (
    select 1 from public.applications a
    where a.id = application_id and a.organisation_id = saved_applications.organisation_id
  )) or public.is_admin()
)
with check (
  (public.is_organisation_member(organisation_id) and exists (
    select 1 from public.applications a
    where a.id = application_id and a.organisation_id = saved_applications.organisation_id
      and lower(a.status) <> 'draft'
  )) or public.is_admin()
);
create policy "organisation members read interested applications" on public.interested_applications for select
using (
  (public.is_organisation_member(organisation_id) and exists (
    select 1 from public.applications a
    where a.id = application_id and a.organisation_id = interested_applications.organisation_id
  )) or public.is_admin()
);
create policy "organisation members mark interested applications" on public.interested_applications for insert
with check (
  public.is_organisation_member(organisation_id)
  and marked_by_profile_id = public.current_profile_id()
  and exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.organisation_id = interested_applications.organisation_id
      and lower(a.status) = 'interested'
  )
);

create policy "sponsor owners and admins read sponsor records" on public.sponsors for select
using (public.is_admin() or public.is_organisation_member(organisation_id));
create policy "admins manage sponsors" on public.sponsors for all
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users read active campaigns" on public.ad_campaigns for select
using (
  (status = 'active' and current_date between start_date and end_date)
  or public.is_admin()
  or exists (select 1 from public.sponsors s where s.id = sponsor_id and public.is_organisation_member(s.organisation_id))
);
create policy "sponsor organisations manage draft campaigns" on public.ad_campaigns for all
using (exists (select 1 from public.sponsors s where s.id = sponsor_id and public.is_organisation_member(s.organisation_id)))
with check (status in ('draft', 'pending_review', 'paused') and exists (
  select 1 from public.sponsors s where s.id = sponsor_id and public.is_organisation_member(s.organisation_id)
));
create policy "admins manage campaigns" on public.ad_campaigns for all
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users read approved creatives" on public.ad_creatives for select
using (
  public.is_admin()
  or (
    approved_status = 'approved'
    and exists (
      select 1 from public.ad_campaigns c
      where c.id = campaign_id
        and c.status = 'active'
        and current_date between c.start_date and c.end_date
    )
  )
);
create policy "sponsor organisations manage draft creatives" on public.ad_creatives for all
using (exists (
  select 1 from public.ad_campaigns c
  join public.sponsors s on s.id = c.sponsor_id
  where c.id = campaign_id and public.is_organisation_member(s.organisation_id)
))
with check (
  approved_status = 'pending'
  and exists (
    select 1 from public.ad_campaigns c
    join public.sponsors s on s.id = c.sponsor_id
    where c.id = campaign_id
      and c.status in ('draft', 'pending_review', 'paused')
      and public.is_organisation_member(s.organisation_id)
  )
);
create policy "admins manage creatives" on public.ad_creatives for all
using (public.is_admin()) with check (public.is_admin());
create policy "authenticated users read sponsored opportunities" on public.sponsored_opportunities for select
using (
  public.is_admin()
  or exists (
    select 1 from public.ad_campaigns c
    where c.id = campaign_id
      and c.status = 'active'
      and current_date between c.start_date and c.end_date
  )
);
create policy "admins manage sponsored opportunities" on public.sponsored_opportunities for all
using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users record own ad events" on public.ad_events for insert
with check (
  profile_id = public.current_profile_id()
  and exists (
    select 1 from public.ad_campaigns c
    where c.id = campaign_id and c.status = 'active'
      and current_date between c.start_date and c.end_date
  )
  and (creative_id is null or exists (
    select 1 from public.ad_creatives cr
    where cr.id = creative_id and cr.campaign_id = campaign_id and cr.approved_status = 'approved'
  ))
);
create policy "users read own ad events" on public.ad_events for select
using (profile_id = public.current_profile_id() or public.is_admin());
create policy "users manage own ad hides" on public.ad_hides for all
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id() and exists (
  select 1 from public.ad_campaigns c where c.id = campaign_id
));
create policy "users create own ad reports" on public.ad_reports for insert
with check (profile_id = public.current_profile_id() and exists (
  select 1 from public.ad_campaigns c where c.id = campaign_id
));
create policy "users and admins read ad reports" on public.ad_reports for select
using (profile_id = public.current_profile_id() or public.is_admin());
create policy "admins update ad reports" on public.ad_reports for update
using (public.is_admin()) with check (public.is_admin());

drop trigger if exists sponsors_set_updated_at on public.sponsors;
create trigger sponsors_set_updated_at before update on public.sponsors
for each row execute function public.set_updated_at();
drop trigger if exists ad_campaigns_set_updated_at on public.ad_campaigns;
create trigger ad_campaigns_set_updated_at before update on public.ad_campaigns
for each row execute function public.set_updated_at();
drop trigger if exists ad_creatives_set_updated_at on public.ad_creatives;
create trigger ad_creatives_set_updated_at before update on public.ad_creatives
for each row execute function public.set_updated_at();
drop trigger if exists ad_reports_set_updated_at on public.ad_reports;
create trigger ad_reports_set_updated_at before update on public.ad_reports
for each row execute function public.set_updated_at();
