-- Venture Connect live staging schema contract.
-- Run after schema.sql and every ordered migration in a disposable Supabase
-- staging project. This read-only script inspects the deployed database. The
-- offline TypeScript contract does not prove these live RLS checks.

do $$
declare
  required_table text;
  required_tables text[] := array[
    'profiles',
    'idea_workspaces',
    'organisations',
    'organisation_members',
    'opportunities',
    'opportunity_forms',
    'opportunity_form_sections',
    'opportunity_form_fields',
    'applications',
    'application_answers',
    'reviewer_assignments',
    'application_reviews',
    'review_scores',
    'conversations',
    'conversation_members',
    'messages',
    'message_attachments',
    'meetings',
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
  required_column text;
  table_name text;
  column_name text;
  required_columns text[] := array[
    'profiles.user_id',
    'organisations.created_by_profile_id',
    'organisation_members.profile_id',
    'opportunities.created_by_profile_id',
    'opportunity_forms.organisation_id',
    'opportunity_form_sections.form_id',
    'opportunity_form_fields.field_key',
    'applications.founder_profile_id',
    'applications.organisation_id',
    'reviewer_assignments.reviewer_profile_id',
    'application_reviews.assignment_id',
    'review_scores.criterion_key',
    'conversations.authorization_reason',
    'conversation_members.profile_id',
    'messages.conversation_id',
    'messages.sender_profile_id',
    'message_attachments.storage_path',
    'payments.provider_payment_id',
    'payment_events.provider_event_id',
    'payment_events.payload_hash',
    'audit_logs.acting_auth_user_id',
    'audit_logs.acting_profile_id',
    'audit_logs.safe_metadata'
  ];
begin
  foreach required_column in array required_columns loop
    table_name := split_part(required_column, '.', 1);
    column_name := split_part(required_column, '.', 2);
    if not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = table_name
        and c.column_name = column_name
    ) then
      raise exception 'Missing required staging column: public.%', required_column;
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
      'idea_workspaces',
      'organisations',
      'organisation_members',
      'opportunities',
      'opportunity_forms',
      'opportunity_form_sections',
      'opportunity_form_fields',
      'applications',
      'application_answers',
      'reviewer_assignments',
      'application_reviews',
      'review_scores',
      'conversations',
      'conversation_members',
      'messages',
      'message_attachments',
      'meetings',
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
    and c.relname in (
      'profiles',
      'idea_workspaces',
      'organisations',
      'organisation_members',
      'opportunities',
      'opportunity_forms',
      'opportunity_form_sections',
      'opportunity_form_fields',
      'applications',
      'application_answers',
      'reviewer_assignments',
      'application_reviews',
      'review_scores',
      'conversations',
      'conversation_members',
      'messages',
      'message_attachments',
      'meetings',
      'validator_profiles',
      'validation_bookings',
      'validation_reports',
      'vc_reports',
      'subscriptions',
      'notifications'
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

  if exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('payments', 'payment_events', 'audit_logs')
  ) then
    raise exception 'Server-controlled payment or audit table exposes an ordinary RLS policy';
  end if;
end
$$;

do $$
declare
  required_index text;
  required_indexes text[] := array[
    'profiles_user_id_unique_idx',
    'organisation_members_profile_idx',
    'opportunity_forms_one_active_idx',
    'reviewer_assignments_one_active_idx',
    'conversations_application_unique_idx',
    'conversation_members_profile_idx',
    'messages_conversation_created_idx',
    'payments_provider_payment_unique_idx',
    'payment_events_provider_event_unique',
    'audit_logs_entity_idx'
  ];
begin
  foreach required_index in array required_indexes loop
    if to_regclass('public.' || required_index) is null then
      raise exception 'Missing required staging index: public.%', required_index;
    end if;
  end loop;
end
$$;

do $$
begin
  if to_regprocedure('public.current_profile_id()') is null then
    raise exception 'Missing current_profile_id() identity helper';
  end if;
  if to_regprocedure('public.is_organisation_member(uuid,uuid)') is null then
    raise exception 'Missing is_organisation_member(uuid, uuid) authorization helper';
  end if;
  if to_regprocedure('public.is_conversation_participant(uuid,uuid)') is null then
    raise exception 'Missing is_conversation_participant(uuid, uuid) authorization helper';
  end if;

  if not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'profiles'
      and c.column_name = 'user_id'
      and c.is_nullable = 'NO'
  ) then
    raise exception 'profiles.user_id must be NOT NULL';
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

select 'venture_connect_live_staging_contract_passed' as result;
