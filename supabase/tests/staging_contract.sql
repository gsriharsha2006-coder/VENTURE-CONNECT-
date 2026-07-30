-- Venture Connect staging schema contract.
-- Run after schema.sql and all ordered migrations in a disposable staging project.
-- This script is read-only. It raises on missing production-readiness controls.

do $$
declare
  required_table text;
  required_tables text[] := array[
    'profiles',
    'user_roles',
    'idea_workspaces',
    'organisations',
    'organisation_memberships',
    'opportunities',
    'opportunity_forms',
    'applications',
    'application_reviews',
    'reviewer_assignments',
    'conversations',
    'messages',
    'validator_profiles',
    'validation_bookings',
    'validation_reports',
    'vc_reports',
    'subscriptions',
    'payments',
    'payment_events',
    'notifications',
    'audit_logs'
  ];
begin
  foreach required_table in array required_tables loop
    if to_regclass('public.' || required_table) is null then
      raise exception 'Missing required staging table: public.%', required_table;
    end if;
  end loop;
end
$$;

do $$
declare
  unsecured_table text;
begin
  select c.relname
  into unsecured_table
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'profiles',
      'user_roles',
      'idea_workspaces',
      'organisations',
      'organisation_memberships',
      'opportunities',
      'opportunity_forms',
      'applications',
      'application_reviews',
      'reviewer_assignments',
      'conversations',
      'messages',
      'validator_profiles',
      'validation_bookings',
      'validation_reports',
      'vc_reports',
      'subscriptions',
      'payments',
      'payment_events',
      'notifications',
      'audit_logs'
    )
    and not c.relrowsecurity
  limit 1;

  if unsecured_table is not null then
    raise exception 'RLS is disabled on public.%', unsecured_table;
  end if;
end
$$;

do $$
declare
  table_without_policy text;
begin
  select c.relname
  into table_without_policy
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and c.relname in (
      'profiles',
      'user_roles',
      'idea_workspaces',
      'organisations',
      'organisation_memberships',
      'opportunities',
      'opportunity_forms',
      'applications',
      'application_reviews',
      'reviewer_assignments',
      'conversations',
      'messages',
      'validator_profiles',
      'validation_bookings',
      'validation_reports',
      'vc_reports',
      'subscriptions',
      'payments',
      'payment_events',
      'notifications',
      'audit_logs'
    )
    and not exists (
      select 1
      from pg_policies p
      where p.schemaname = n.nspname
        and p.tablename = c.relname
    )
  limit 1;

  if table_without_policy is not null then
    raise exception 'No RLS policy exists for public.%', table_without_policy;
  end if;
end
$$;

do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'Supabase Storage schema is unavailable';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'messaging-attachments'
      and public = false
  ) then
    raise exception 'Private messaging-attachments bucket is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  ) then
    raise exception 'Storage object policies are missing';
  end if;
end
$$;

select 'venture_connect_staging_contract_passed' as result;
