-- Venture Connect Gemini report persistence and atomic usage accounting.
-- Safe additive migration: it does not drop tables or user data.

alter table public.subscriptions
  add column if not exists report_usage_month date not null default date_trunc('month', now())::date;

alter table public.subscriptions
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_report_count_nonnegative') then
    alter table public.subscriptions
      add constraint subscriptions_report_count_nonnegative check (report_count_used >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_submission_count_nonnegative') then
    alter table public.subscriptions
      add constraint subscriptions_submission_count_nonnegative check (opportunity_submissions_used >= 0) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select user_id
    from public.subscriptions
    where user_id is not null
    group by user_id
    having count(*) > 1
  ) then
    create unique index if not exists subscriptions_user_id_unique_idx
      on public.subscriptions(user_id)
      where user_id is not null;
  else
    raise notice 'Unique subscription index skipped: review duplicate user_id rows manually';
  end if;
end $$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

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
  ) values (
    v_user_id,
    p_workspace_id,
    p_report_type,
    v_required_plan,
    p_report_content,
    p_score
  ) returning * into v_report;

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

revoke all on function public.record_vc_report(uuid, text, jsonb, integer) from public;
grant execute on function public.record_vc_report(uuid, text, jsonb, integer) to authenticated;

drop policy if exists "vc_reports_insert_own_or_admin" on public.vc_reports;
create policy "vc_reports_insert_own_or_admin"
on public.vc_reports for insert
with check (public.is_admin());

drop policy if exists "subscriptions_insert_own_or_admin" on public.subscriptions;
create policy "subscriptions_insert_own_or_admin"
on public.subscriptions for insert
with check (public.is_admin());

drop policy if exists "subscriptions_update_own_or_admin" on public.subscriptions;
create policy "subscriptions_update_own_or_admin"
on public.subscriptions for update
using (public.is_admin())
with check (public.is_admin());

-- New accounts receive an initial Free usage row. Existing accounts are
-- provisioned transactionally on their first successful report generation.
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
  ) on conflict do nothing;

  if signup_role = 'service_provider' then
    insert into public.service_providers (
      user_id, name, firm_name, email, phone, service_category, pan_or_gst,
      website_or_linkedin, experience_details, cgpdtm_registration_number
    ) values (
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
    ) on conflict do nothing;
  end if;

  if not exists (select 1 from public.subscriptions where user_id = new.id) then
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active');
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
