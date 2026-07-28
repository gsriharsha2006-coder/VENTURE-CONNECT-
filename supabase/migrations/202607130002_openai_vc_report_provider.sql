-- Venture Connect provider-neutral VC Readiness Report metadata and idempotency.
-- Additive migration: preserves existing report rows and the historical Gemini migration.

-- Keep this migration safe for installations that started from an older base
-- schema and never applied the historical Gemini-specific migration.
alter table public.subscriptions
  add column if not exists report_usage_month date not null default date_trunc('month', now())::date;
alter table public.subscriptions
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.vc_reports add column if not exists plan text;
alter table public.vc_reports add column if not exists provider text;
alter table public.vc_reports add column if not exists model text;
alter table public.vc_reports add column if not exists structured_content jsonb;
alter table public.vc_reports add column if not exists readiness_score integer;
alter table public.vc_reports add column if not exists generation_request_id uuid;

update public.vc_reports
set plan = coalesce(plan, plan_required, 'Free'),
    provider = coalesce(provider, 'legacy'),
    structured_content = coalesce(structured_content, report_content -> 'structuredData', report_content, '{}'::jsonb),
    readiness_score = coalesce(readiness_score, score)
where plan is null
   or provider is null
   or structured_content is null
   or readiness_score is null;

alter table public.vc_reports alter column provider set default 'legacy';
alter table public.vc_reports alter column provider set not null;
alter table public.vc_reports alter column structured_content set default '{}'::jsonb;
alter table public.vc_reports alter column structured_content set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vc_reports_readiness_score_range') then
    alter table public.vc_reports
      add constraint vc_reports_readiness_score_range
      check (readiness_score is null or readiness_score between 0 and 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vc_reports_provider_allowed') then
    alter table public.vc_reports
      add constraint vc_reports_provider_allowed
      check (provider in ('openai', 'gemini', 'legacy')) not valid;
  end if;
end $$;

create unique index if not exists vc_reports_founder_generation_request_unique_idx
  on public.vc_reports(founder_id, generation_request_id)
  where founder_id is not null and generation_request_id is not null;

create index if not exists vc_reports_workspace_created_idx
  on public.vc_reports(idea_workspace_id, created_at desc);

create table if not exists public.vc_report_generation_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  founder_id uuid not null references auth.users(id) on delete cascade,
  idea_workspace_id uuid not null references public.idea_workspaces(id) on delete cascade,
  report_type text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  report_id uuid references public.vc_reports(id) on delete set null,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (founder_id, request_id)
);

create index if not exists vc_report_generation_requests_pending_idx
  on public.vc_report_generation_requests(founder_id, status, created_at desc);

drop trigger if exists vc_report_generation_requests_set_updated_at on public.vc_report_generation_requests;
create trigger vc_report_generation_requests_set_updated_at
before update on public.vc_report_generation_requests
for each row execute function public.set_updated_at();

alter table public.vc_report_generation_requests enable row level security;
revoke all on table public.vc_report_generation_requests from anon, authenticated;

create or replace function public.begin_vc_report_generation(
  p_request_id uuid,
  p_workspace_id uuid,
  p_report_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_plan text;
  v_free_used boolean := false;
  v_reports_used integer := 0;
  v_usage_month date;
  v_month date := date_trunc('month', now())::date;
  v_limit integer;
  v_pending integer := 0;
  v_existing public.vc_report_generation_requests%rowtype;
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
    select 1 from public.idea_workspaces
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

  update public.vc_report_generation_requests
  set status = 'failed', error_code = 'STALE_REQUEST'
  where founder_id = v_user_id
    and status = 'pending'
    and updated_at < now() - interval '10 minutes';

  select * into v_existing
  from public.vc_report_generation_requests
  where founder_id = v_user_id and request_id = p_request_id
  for update;

  if found then
    if v_existing.idea_workspace_id <> p_workspace_id or v_existing.report_type <> p_report_type then
      raise exception 'Request ID does not match this report';
    end if;
    if v_existing.status = 'completed' then
      return jsonb_build_object('state', 'completed', 'report_id', v_existing.report_id);
    end if;
    if v_existing.status = 'pending' then
      return jsonb_build_object('state', 'pending');
    end if;
  end if;

  select
    coalesce(free_swot_used, false),
    coalesce(report_count_used, 0),
    report_usage_month
  into v_free_used, v_reports_used, v_usage_month
  from public.subscriptions
  where user_id = v_user_id
  order by started_at desc
  limit 1;

  if v_usage_month is distinct from v_month then
    v_reports_used := 0;
  end if;

  if p_report_type = 'Basic SWOT Report' then
    select count(*) into v_pending
    from public.vc_report_generation_requests
    where founder_id = v_user_id
      and status = 'pending'
      and report_type = 'Basic SWOT Report'
      and request_id <> p_request_id;
    if v_free_used or v_pending > 0 then
      raise exception 'Basic SWOT Report allowance already used or reserved';
    end if;
  else
    if p_report_type in ('Roadmap Report', 'Investor Scorecard Report') and v_plan <> 'founder_pro' then
      raise exception 'Report type is not included in the current plan';
    end if;
    if p_report_type not in ('Roadmap Report', 'Investor Scorecard Report') and v_plan not in ('student_pro', 'founder_pro') then
      raise exception 'Report type is not included in the current plan';
    end if;
    v_limit := case when v_plan = 'founder_pro' then 5 else 3 end;
    select count(*) into v_pending
    from public.vc_report_generation_requests
    where founder_id = v_user_id
      and status = 'pending'
      and report_type <> 'Basic SWOT Report'
      and request_id <> p_request_id;
    if v_reports_used + v_pending >= v_limit then
      raise exception 'Monthly premium report limit reached or reserved';
    end if;
  end if;

  if v_existing.id is null then
    insert into public.vc_report_generation_requests (
      request_id, founder_id, idea_workspace_id, report_type, status
    ) values (
      p_request_id, v_user_id, p_workspace_id, p_report_type, 'pending'
    );
  else
    update public.vc_report_generation_requests
    set status = 'pending', report_id = null, error_code = null
    where id = v_existing.id;
  end if;

  return jsonb_build_object('state', 'ready');
end;
$$;

create or replace function public.record_vc_report(
  p_request_id uuid,
  p_workspace_id uuid,
  p_report_type text,
  p_provider text,
  p_model text,
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
  v_plan_label text;
  v_required_plan text;
  v_limit integer;
  v_month date := date_trunc('month', now())::date;
  v_subscription public.subscriptions%rowtype;
  v_request public.vc_report_generation_requests%rowtype;
  v_report public.vc_reports%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select * into v_request
  from public.vc_report_generation_requests
  where founder_id = v_user_id and request_id = p_request_id
  for update;

  if not found or v_request.idea_workspace_id <> p_workspace_id or v_request.report_type <> p_report_type then
    raise exception 'Report generation request was not reserved';
  end if;
  if v_request.status = 'completed' and v_request.report_id is not null then
    select * into v_report from public.vc_reports where id = v_request.report_id;
    return v_report;
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Report generation request is not active';
  end if;

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
    select 1 from public.idea_workspaces
    where id = p_workspace_id
      and founder_id = v_user_id
      and archived = false
      and completion_percentage = 100
  ) then
    raise exception 'Workspace must be complete and owned by the founder';
  end if;

  if p_provider <> 'openai' or nullif(trim(p_model), '') is null or length(p_model) > 200 then
    raise exception 'Invalid report provider metadata';
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

  v_plan_label := case
    when v_plan = 'founder_pro' then 'Founder Pro'
    when v_plan = 'student_pro' then 'Student Pro'
    else 'Free'
  end;

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
    set report_count_used = 0, report_usage_month = v_month
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
    plan,
    plan_required,
    provider,
    model,
    report_content,
    structured_content,
    score,
    readiness_score,
    generation_request_id
  ) values (
    v_user_id,
    p_workspace_id,
    p_report_type,
    v_plan_label,
    v_required_plan,
    p_provider,
    p_model,
    p_report_content,
    coalesce(p_report_content -> 'structuredData', p_report_content),
    p_score,
    p_score,
    p_request_id
  ) returning * into v_report;

  if p_report_type = 'Basic SWOT Report' then
    update public.subscriptions set free_swot_used = true where id = v_subscription.id;
  else
    update public.subscriptions
    set report_count_used = coalesce(report_count_used, 0) + 1,
        report_usage_month = v_month
    where id = v_subscription.id;
  end if;

  update public.vc_report_generation_requests
  set status = 'completed', report_id = v_report.id, error_code = null
  where id = v_request.id;

  return v_report;
end;
$$;

create or replace function public.fail_vc_report_generation(
  p_request_id uuid,
  p_error_code text default 'GENERATION_FAILED'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.vc_report_generation_requests
  set status = 'failed', error_code = left(coalesce(p_error_code, 'GENERATION_FAILED'), 80)
  where founder_id = auth.uid()
    and request_id = p_request_id
    and status = 'pending';
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

drop function if exists public.record_vc_report(uuid, text, jsonb, integer);
revoke all on function public.begin_vc_report_generation(uuid, uuid, text) from public;
revoke all on function public.record_vc_report(uuid, uuid, text, text, text, jsonb, integer) from public;
revoke all on function public.fail_vc_report_generation(uuid, text) from public;

grant execute on function public.begin_vc_report_generation(uuid, uuid, text) to authenticated;
grant execute on function public.record_vc_report(uuid, uuid, text, text, text, jsonb, integer) to authenticated;
grant execute on function public.fail_vc_report_generation(uuid, text) to authenticated;
