-- Venture Connect PACE one-month pilot scope and analytics safeguards.
-- Apply after 202608020001_application_quality_and_sponsorship.sql.

alter table public.opportunities add column if not exists status text not null default 'published';
alter table public.opportunities drop constraint if exists opportunities_status_pilot_allowed;
alter table public.opportunities add constraint opportunities_status_pilot_allowed
  check (status in ('draft', 'published', 'closed', 'archived')) not valid;
create index if not exists opportunities_pilot_discovery_idx
  on public.opportunities(status, opportunity_type, deadline);

create or replace function public.prevent_published_form_mutation()
returns trigger language plpgsql set search_path = public as $$
declare
  parent_status text;
  target_form_id uuid;
begin
  if tg_table_name = 'opportunity_forms' then
    if old.status = 'published' then
      if not (
        new.status in ('closed', 'archived')
        and new.is_active = false
        and new.opportunity_id = old.opportunity_id
        and new.organisation_id = old.organisation_id
        and new.created_by_profile_id = old.created_by_profile_id
        and new.title = old.title
        and new.description is not distinct from old.description
        and new.application_mode = old.application_mode
        and new.published_at is not distinct from old.published_at
      ) then
        raise exception 'Published opportunity forms are immutable; close or archive the form.';
      end if;
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  target_form_id := case when tg_op = 'DELETE' then old.form_id else new.form_id end;
  select f.status into parent_status from public.opportunity_forms f where f.id = target_form_id;
  if parent_status in ('published', 'closed', 'archived') then
    raise exception 'Published or closed opportunity form structure is immutable.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop policy if exists "opportunities_select_verified_own_or_admin" on public.opportunities;
create policy "opportunities_select_verified_own_or_admin"
on public.opportunities for select
using (
  (status = 'published' and opportunity_type in ('Incubator program', 'Hackathon'))
  or created_by_profile_id = public.current_profile_id()
  or public.has_organisation_role(organisation_id, array['owner', 'admin', 'reviewer'])
  or public.is_admin()
);

drop policy if exists "opportunities_insert_reviewers" on public.opportunities;
create policy "opportunities_insert_reviewers"
on public.opportunities for insert
with check (
  created_by = auth.uid()
  and created_by_profile_id = public.current_profile_id()
  and creator_role = public.current_profile_role()
  and (
    (creator_role = 'incubator' and opportunity_type = 'Incubator program')
    or (creator_role = 'hackathon_organizer' and opportunity_type = 'Hackathon')
    or public.is_admin()
  )
  and (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
);

drop policy if exists "opportunities_update_own_or_admin" on public.opportunities;
create policy "opportunities_update_own_or_admin"
on public.opportunities for update
using (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
with check (
  opportunity_type in ('Incubator program', 'Hackathon')
  and (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
);

update public.applications
set quality_status = 'manual_review'
where quality_status = 'manual_review_required';

alter table public.applications drop constraint if exists applications_quality_status_allowed;
alter table public.applications add constraint applications_quality_status_allowed
  check (quality_status in (
    'quality_check_required', 'ready_to_submit', 'needs_revision', 'incomplete',
    'eligibility_mismatch', 'manual_review', 'outdated', 'not_applicable'
  )) not valid;

update public.application_quality_checks
set status = 'manual_review'
where status = 'manual_review_required';

alter table public.application_quality_checks drop constraint if exists application_quality_checks_status_check;
alter table public.application_quality_checks add constraint application_quality_checks_status_check
  check (status in ('ready_to_submit', 'needs_revision', 'incomplete', 'eligibility_mismatch', 'manual_review')) not valid;

create or replace function public.enforce_pilot_quality_check_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.application_quality_checks where application_id = new.application_id) >= 2 then
    raise exception 'Pilot applications allow one initial quality check and one recheck.';
  end if;
  return new;
end
$$;
revoke all on function public.enforce_pilot_quality_check_limit() from public;
drop trigger if exists application_quality_checks_pilot_limit on public.application_quality_checks;
create trigger application_quality_checks_pilot_limit before insert on public.application_quality_checks
for each row execute function public.enforce_pilot_quality_check_limit();

create or replace function public.enforce_pilot_startup_template()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.template_type <> 'startup' then raise exception 'The PACE pilot supports the Startup Template only.'; end if;
  return new;
end
$$;
revoke all on function public.enforce_pilot_startup_template() from public;
drop trigger if exists idea_workspaces_pilot_template on public.idea_workspaces;
create trigger idea_workspaces_pilot_template before insert or update of template_type on public.idea_workspaces
for each row execute function public.enforce_pilot_startup_template();

create or replace function public.enforce_pilot_readiness_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.report_type <> 'Basic SWOT Report' then raise exception 'The PACE pilot supports one basic readiness report only.'; end if;
  if exists (select 1 from public.vc_reports where founder_id = new.founder_id and report_type = 'Basic SWOT Report') then
    raise exception 'The pilot readiness report has already been generated.';
  end if;
  return new;
end
$$;
revoke all on function public.enforce_pilot_readiness_limit() from public;
drop trigger if exists vc_reports_pilot_limit on public.vc_reports;
create trigger vc_reports_pilot_limit before insert on public.vc_reports
for each row execute function public.enforce_pilot_readiness_limit();

create table if not exists public.pilot_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null check (event_name in (
    'founder_registered', 'idea_created', 'idea_section_completed', 'idea_completed', 'readiness_report_generated',
    'incubation_application_started', 'quality_check_failed', 'quality_check_passed', 'application_corrected',
    'incubation_application_submitted', 'incubation_application_reviewed', 'incubation_application_interested',
    'conversation_created', 'hackathon_viewed', 'hackathon_application_started', 'hackathon_application_submitted',
    'external_hackathon_marked_applied'
  )),
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now()
);
create index if not exists pilot_events_name_created_idx on public.pilot_events(event_name, created_at desc);
create index if not exists pilot_events_profile_created_idx on public.pilot_events(profile_id, created_at desc);
alter table public.pilot_events enable row level security;
drop policy if exists "members record own pilot events" on public.pilot_events;
create policy "members record own pilot events" on public.pilot_events for insert
with check (profile_id = public.current_profile_id());
drop policy if exists "members read own pilot events" on public.pilot_events;
create policy "members read own pilot events" on public.pilot_events for select
using (profile_id = public.current_profile_id() or public.is_admin());

comment on table public.pilot_events is 'Minimal event log for the PACE one-month pilot. It must not contain private startup answers.';

create or replace function public.record_pilot_founder_registration()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.role = 'founder' then
    insert into public.pilot_events(profile_id, event_name) values (new.id, 'founder_registered');
  end if;
  return new;
end
$$;
revoke all on function public.record_pilot_founder_registration() from public;
drop trigger if exists profiles_record_pilot_registration on public.profiles;
create trigger profiles_record_pilot_registration after insert on public.profiles
for each row execute function public.record_pilot_founder_registration();
