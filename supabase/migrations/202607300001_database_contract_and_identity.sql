-- Venture Connect database contract and identity remediation.
-- Additive migration: preserves legacy Auth-ID ownership columns while new domain
-- relationships use public.profiles.id. RLS resolves the current profile through
-- public.profiles.user_id = auth.uid().

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_profile_id() from public;
grant execute on function public.current_profile_id() to authenticated;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  organisation_type text not null check (
    organisation_type in ('incubator', 'accelerator', 'investor', 'institution', 'company', 'community', 'other')
  ),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  website text,
  location text,
  verification_status text not null default 'pending' check (
    verification_status in ('pending', 'verified', 'rejected', 'suspended')
  ),
  verification_metadata jsonb not null default '{}'::jsonb,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.organisations.verification_metadata is
  'Safe verification facts only. Never store credentials, identity-document contents, or access tokens.';

create table if not exists public.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  membership_role text not null check (membership_role in ('owner', 'admin', 'reviewer', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by_profile_id uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, profile_id)
);

create index if not exists organisations_created_by_idx
  on public.organisations(created_by_profile_id, created_at desc);
create index if not exists organisations_verification_idx
  on public.organisations(verification_status, created_at desc);
create index if not exists organisation_members_profile_idx
  on public.organisation_members(profile_id, status, organisation_id);
create index if not exists organisation_members_org_role_idx
  on public.organisation_members(organisation_id, membership_role, status);

create or replace function public.is_organisation_member(
  organisation_uuid uuid,
  profile_uuid uuid default public.current_profile_id()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_uuid
      and om.profile_id = profile_uuid
      and om.status = 'active'
  );
$$;

create or replace function public.has_organisation_role(
  organisation_uuid uuid,
  allowed_roles text[],
  profile_uuid uuid default public.current_profile_id()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = organisation_uuid
      and om.profile_id = profile_uuid
      and om.status = 'active'
      and om.membership_role = any(allowed_roles)
  );
$$;

revoke all on function public.is_organisation_member(uuid, uuid) from public;
revoke all on function public.has_organisation_role(uuid, text[], uuid) from public;
grant execute on function public.is_organisation_member(uuid, uuid) to authenticated;
grant execute on function public.has_organisation_role(uuid, text[], uuid) to authenticated;

create or replace function public.add_organisation_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organisation_members (
    organisation_id,
    profile_id,
    membership_role,
    status,
    joined_at
  )
  values (
    new.id,
    new.created_by_profile_id,
    'owner',
    'active',
    now()
  )
  on conflict (organisation_id, profile_id) do nothing;
  return new;
end;
$$;

drop trigger if exists organisations_add_creator_membership on public.organisations;
create trigger organisations_add_creator_membership
after insert on public.organisations
for each row execute function public.add_organisation_creator_membership();

revoke all on function public.add_organisation_creator_membership() from public;

create or replace function public.prevent_organisation_self_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    new.verification_status = old.verification_status;
    new.verification_metadata = old.verification_metadata;
    new.created_by_profile_id = old.created_by_profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists organisations_prevent_self_verification on public.organisations;
create trigger organisations_prevent_self_verification
before update on public.organisations
for each row execute function public.prevent_organisation_self_verification();

revoke all on function public.prevent_organisation_self_verification() from public;

alter table public.opportunities
  add column if not exists organisation_id uuid references public.organisations(id) on delete set null,
  add column if not exists created_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.opportunities.created_by is
  'Legacy Auth user ID retained for compatibility. New domain authorization uses created_by_profile_id.';
comment on column public.opportunities.created_by_profile_id is
  'Application-domain profile identity resolved through profiles.user_id.';

create index if not exists opportunities_organisation_idx
  on public.opportunities(organisation_id, created_at desc);
create index if not exists opportunities_created_by_profile_idx
  on public.opportunities(created_by_profile_id, created_at desc);

create table if not exists public.opportunity_forms (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) between 2 and 160),
  description text,
  application_mode text not null default 'internal_form' check (
    application_mode in ('internal_form', 'external_application', 'workspace_application')
  ),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists opportunity_forms_one_active_idx
  on public.opportunity_forms(opportunity_id)
  where is_active = true and status = 'published';
create index if not exists opportunity_forms_org_idx
  on public.opportunity_forms(organisation_id, status, updated_at desc);

create table if not exists public.opportunity_form_sections (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.opportunity_forms(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, sort_order)
);

create table if not exists public.opportunity_form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.opportunity_forms(id) on delete cascade,
  section_id uuid references public.opportunity_form_sections(id) on delete cascade,
  field_key text not null check (field_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  field_type text not null check (
    field_type in (
      'short_text',
      'long_text',
      'number',
      'email',
      'url',
      'date',
      'single_select',
      'multi_select',
      'checkbox',
      'file',
      'workspace_reference'
    )
  ),
  label text not null check (length(trim(label)) between 1 and 240),
  help_text text,
  required boolean not null default false,
  sort_order integer not null check (sort_order >= 0),
  configuration jsonb not null default '{}'::jsonb,
  validation_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, field_key)
);

create index if not exists opportunity_form_sections_form_idx
  on public.opportunity_form_sections(form_id, sort_order);
create unique index if not exists opportunity_form_sections_form_id_id_unique_idx
  on public.opportunity_form_sections(form_id, id);
create index if not exists opportunity_form_fields_section_idx
  on public.opportunity_form_fields(section_id, sort_order);
create index if not exists opportunity_form_fields_form_idx
  on public.opportunity_form_fields(form_id, sort_order);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'opportunity_form_fields_section_form_fk'
  ) then
    alter table public.opportunity_form_fields
      add constraint opportunity_form_fields_section_form_fk
      foreign key (form_id, section_id)
      references public.opportunity_form_sections(form_id, id)
      on delete cascade
      not valid;
  end if;
end
$$;

alter table public.applications
  add column if not exists founder_profile_id uuid references public.profiles(id) on delete restrict,
  add column if not exists organisation_id uuid references public.organisations(id) on delete set null,
  add column if not exists opportunity_form_id uuid references public.opportunity_forms(id) on delete set null,
  add column if not exists answers_json jsonb not null default '{}'::jsonb,
  add column if not exists decision_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists decision_reason text,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.applications.founder_id is
  'Legacy Auth user ID retained for compatibility. New domain authorization uses founder_profile_id.';
comment on column public.applications.founder_profile_id is
  'Application-domain founder profile identity resolved through profiles.user_id.';

create index if not exists applications_founder_profile_idx
  on public.applications(founder_profile_id, submitted_at desc);
create index if not exists applications_organisation_idx
  on public.applications(organisation_id, status, submitted_at desc);
create index if not exists applications_form_idx
  on public.applications(opportunity_form_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_status_allowed_v2'
  ) then
    alter table public.applications add constraint applications_status_allowed_v2
      check (
        lower(status) in (
          'draft',
          'submitted',
          'under_review',
          'needs_changes',
          'shortlisted',
          'interested',
          'accepted',
          'rejected',
          'withdrawn'
        )
      ) not valid;
  end if;
end
$$;

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  field_id uuid not null references public.opportunity_form_fields(id) on delete restrict,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, field_id)
);

create index if not exists application_answers_application_idx
  on public.application_answers(application_id);

create table if not exists public.reviewer_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles(id) on delete restrict,
  assigned_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'revoked')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reviewer_assignments_one_active_idx
  on public.reviewer_assignments(application_id, reviewer_profile_id)
  where status = 'active';
create index if not exists reviewer_assignments_reviewer_idx
  on public.reviewer_assignments(reviewer_profile_id, status, assigned_at desc);
create index if not exists reviewer_assignments_org_idx
  on public.reviewer_assignments(organisation_id, status, assigned_at desc);

create table if not exists public.application_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.reviewer_assignments(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  reviewer_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'superseded')),
  recommendation text check (recommendation in ('decline', 'needs_changes', 'advance', 'interested')),
  summary text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_reviews_application_idx
  on public.application_reviews(application_id, status, created_at desc);
create index if not exists application_reviews_reviewer_idx
  on public.application_reviews(reviewer_profile_id, status, updated_at desc);

create table if not exists public.review_scores (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.application_reviews(id) on delete cascade,
  criterion_key text not null check (criterion_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  score numeric(6,2) not null check (score >= 0),
  maximum_score numeric(6,2) not null default 100 check (maximum_score > 0 and score <= maximum_score),
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, criterion_key)
);

create index if not exists review_scores_review_idx
  on public.review_scores(review_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete restrict,
  validation_booking_id uuid references public.validation_bookings(id) on delete restrict,
  programme_context_id uuid references public.opportunities(id) on delete restrict,
  organisation_id uuid references public.organisations(id) on delete set null,
  initiated_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  context_type text not null check (context_type in ('application', 'validation_booking', 'programme')),
  authorization_reason text not null check (authorization_reason in ('interested', 'programme_rule', 'validation_booking')),
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_exactly_one_context check (
    num_nonnulls(application_id, validation_booking_id, programme_context_id) = 1
  ),
  constraint conversations_context_matches check (
    (context_type = 'application' and application_id is not null and authorization_reason = 'interested')
    or (context_type = 'validation_booking' and validation_booking_id is not null and authorization_reason = 'validation_booking')
    or (context_type = 'programme' and programme_context_id is not null and authorization_reason = 'programme_rule')
  )
);

create unique index if not exists conversations_application_unique_idx
  on public.conversations(application_id)
  where application_id is not null and status <> 'archived';
create unique index if not exists conversations_validation_unique_idx
  on public.conversations(validation_booking_id)
  where validation_booking_id is not null and status <> 'archived';
create index if not exists conversations_org_idx
  on public.conversations(organisation_id, updated_at desc);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (
    member_role in ('founder', 'investor', 'institution', 'reviewer', 'validator', 'administrator')
  ),
  status text not null default 'active' check (status in ('active', 'left', 'removed')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, profile_id)
);

create index if not exists conversation_members_profile_idx
  on public.conversation_members(profile_id, status, updated_at desc);

alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade,
  add column if not exists sender_profile_id uuid references public.profiles(id) on delete restrict,
  add column if not exists message_type text not null default 'text',
  add column if not exists message text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists edited_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.messages.sender_id is
  'Legacy Auth user ID retained for compatibility. Conversation authorization uses sender_profile_id.';
comment on column public.messages.sender_profile_id is
  'Application-domain sender profile. Must be an active conversation member.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_message_type_allowed'
  ) then
    alter table public.messages add constraint messages_message_type_allowed
      check (message_type in ('text', 'system', 'file', 'meeting_link')) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'messages_has_context'
  ) then
    alter table public.messages add constraint messages_has_context
      check (conversation_id is not null or application_id is not null) not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'messages_conversation_sender_required'
  ) then
    alter table public.messages add constraint messages_conversation_sender_required
      check (conversation_id is null or sender_profile_id is not null) not valid;
  end if;
end
$$;

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at);
create index if not exists messages_sender_profile_idx
  on public.messages(sender_profile_id, created_at desc);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  uploaded_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  storage_bucket text not null default 'messaging-attachments',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  constraint message_attachments_private_bucket check (
    storage_bucket = 'messaging-attachments'
  ),
  constraint message_attachments_scoped_path check (
    storage_path like conversation_id::text || '/' || uploaded_by_profile_id::text || '/%'
  )
);

comment on column public.message_attachments.storage_path is
  'Private object path only. Never persist signed URLs, access tokens, or public object URLs.';

create index if not exists message_attachments_message_idx
  on public.message_attachments(message_id);
create index if not exists message_attachments_conversation_idx
  on public.message_attachments(conversation_id, created_at);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  meeting_link text not null,
  scheduled_time timestamptz not null,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meetings_conversation_time_idx
  on public.meetings(conversation_id, scheduled_time);

alter table public.notifications
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists body text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists email_sent boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.notifications.user_id is
  'Legacy Auth user ID retained for delivery compatibility. Domain ownership uses profile_id.';

create index if not exists notifications_profile_idx
  on public.notifications(profile_id, read, created_at desc);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  provider text not null check (provider in ('razorpay', 'stripe', 'manual')),
  provider_order_id text,
  provider_payment_id text,
  purpose text not null check (purpose in ('subscription', 'readiness_report', 'validation_booking', 'opportunity_posting')),
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'created' check (
    status in ('created', 'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled')
  ),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  readiness_report_id uuid references public.vc_reports(id) on delete set null,
  validation_booking_id uuid references public.validation_bookings(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_has_related_purpose check (
    (purpose = 'subscription' and subscription_id is not null)
    or (purpose = 'readiness_report' and readiness_report_id is not null)
    or (purpose = 'validation_booking' and validation_booking_id is not null)
    or (purpose = 'opportunity_posting' and opportunity_id is not null)
  )
);

comment on column public.payments.safe_metadata is
  'Allow-listed operational metadata only. Never store credentials, signatures, full provider payloads, or card data.';

create unique index if not exists payments_provider_order_unique_idx
  on public.payments(provider, provider_order_id)
  where provider_order_id is not null;
create unique index if not exists payments_provider_payment_unique_idx
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;
create index if not exists payments_profile_idx
  on public.payments(profile_id, created_at desc);
create index if not exists payments_status_idx
  on public.payments(status, created_at desc);
create index if not exists payments_subscription_idx
  on public.payments(subscription_id)
  where subscription_id is not null;
create index if not exists payments_report_idx
  on public.payments(readiness_report_id)
  where readiness_report_id is not null;
create index if not exists payments_validation_booking_idx
  on public.payments(validation_booking_id)
  where validation_booking_id is not null;
create index if not exists payments_opportunity_idx
  on public.payments(opportunity_id)
  where opportunity_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null check (provider in ('razorpay', 'stripe', 'manual')),
  provider_event_id text not null,
  event_type text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  safe_metadata jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_events_provider_event_unique unique (provider, provider_event_id)
);

comment on column public.payment_events.payload_hash is
  'SHA-256 hash of the raw event body for deduplication evidence; the raw payload is not stored.';

create index if not exists payment_events_payment_idx
  on public.payment_events(payment_id, received_at desc);
create index if not exists payment_events_status_idx
  on public.payment_events(processing_status, received_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  acting_auth_user_id uuid references auth.users(id) on delete set null,
  acting_profile_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(trim(action)) between 2 and 160),
  entity_type text not null check (length(trim(entity_type)) between 2 and 120),
  entity_id uuid,
  organisation_id uuid references public.organisations(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.audit_logs.safe_metadata is
  'Append-only allow-listed metadata. Never store passwords, tokens, API keys, payment payloads, or private documents.';

create index if not exists audit_logs_actor_idx
  on public.audit_logs(acting_profile_id, created_at desc);
create index if not exists audit_logs_auth_actor_idx
  on public.audit_logs(acting_auth_user_id, created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists audit_logs_organisation_idx
  on public.audit_logs(organisation_id, created_at desc);

-- Backfill explicit profile identities without changing legacy Auth-ID columns.
update public.opportunities o
set created_by_profile_id = p.id
from public.profiles p
where o.created_by_profile_id is null
  and o.created_by = p.user_id;

update public.applications a
set founder_profile_id = p.id
from public.profiles p
where a.founder_profile_id is null
  and a.founder_id = p.user_id;

update public.applications a
set organisation_id = o.organisation_id
from public.opportunities o
where a.organisation_id is null
  and a.opportunity_id = o.id
  and o.organisation_id is not null;

update public.messages m
set sender_profile_id = p.id
from public.profiles p
where m.sender_profile_id is null
  and m.sender_id = p.user_id;

update public.notifications n
set profile_id = p.id,
    body = coalesce(n.body, n.message)
from public.profiles p
where n.profile_id is null
  and n.user_id = p.user_id;

create or replace function public.prevent_opportunity_ownership_reassignment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.created_by is distinct from new.created_by
    or old.created_by_profile_id is distinct from new.created_by_profile_id
    or old.organisation_id is distinct from new.organisation_id then
    raise exception 'Opportunity ownership cannot be reassigned through an update.';
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_prevent_ownership_reassignment on public.opportunities;
create trigger opportunities_prevent_ownership_reassignment
before update on public.opportunities
for each row execute function public.prevent_opportunity_ownership_reassignment();

create or replace function public.prevent_application_ownership_reassignment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.founder_id is distinct from new.founder_id
    or old.founder_profile_id is distinct from new.founder_profile_id
    or old.opportunity_id is distinct from new.opportunity_id
    or old.organisation_id is distinct from new.organisation_id then
    raise exception 'Application ownership and scope cannot be reassigned through an update.';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_prevent_ownership_reassignment on public.applications;
create trigger applications_prevent_ownership_reassignment
before update on public.applications
for each row execute function public.prevent_application_ownership_reassignment();

create or replace function public.prevent_published_form_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_status text;
  target_form_id uuid;
begin
  if tg_table_name = 'opportunity_forms' then
    if old.status = 'published' then
      if not (
        new.status = 'archived'
        and new.is_active = false
        and new.opportunity_id = old.opportunity_id
        and new.organisation_id = old.organisation_id
        and new.created_by_profile_id = old.created_by_profile_id
        and new.title = old.title
        and new.description is not distinct from old.description
        and new.application_mode = old.application_mode
        and new.published_at is not distinct from old.published_at
      ) then
        raise exception 'Published opportunity forms are immutable; archive and replace the form.';
      end if;
    end if;
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_form_id := old.form_id;
  else
    target_form_id := new.form_id;
  end if;

  select f.status into parent_status
  from public.opportunity_forms f
  where f.id = target_form_id;

  if parent_status = 'published' then
    raise exception 'Published opportunity form structure is immutable.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.validate_opportunity_form_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.opportunities o
    where o.id = new.opportunity_id
      and o.organisation_id = new.organisation_id
  ) then
    raise exception 'Opportunity form organisation must own the opportunity.';
  end if;
  return new;
end;
$$;

drop trigger if exists opportunity_forms_validate_scope on public.opportunity_forms;
create trigger opportunity_forms_validate_scope
before insert or update on public.opportunity_forms
for each row execute function public.validate_opportunity_form_scope();

drop trigger if exists opportunity_forms_prevent_published_update on public.opportunity_forms;
create trigger opportunity_forms_prevent_published_update
before update on public.opportunity_forms
for each row execute function public.prevent_published_form_mutation();

drop trigger if exists opportunity_form_sections_prevent_published_change on public.opportunity_form_sections;
create trigger opportunity_form_sections_prevent_published_change
before insert or update or delete on public.opportunity_form_sections
for each row execute function public.prevent_published_form_mutation();

drop trigger if exists opportunity_form_fields_prevent_published_change on public.opportunity_form_fields;
create trigger opportunity_form_fields_prevent_published_change
before insert or update or delete on public.opportunity_form_fields
for each row execute function public.prevent_published_form_mutation();

create or replace function public.validate_reviewer_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.applications a
    where a.id = new.application_id
      and a.organisation_id = new.organisation_id
  ) then
    raise exception 'Reviewer assignment organisation does not own the application.';
  end if;

  if not exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = new.organisation_id
      and om.profile_id = new.reviewer_profile_id
      and om.membership_role in ('reviewer', 'admin', 'owner')
      and om.status = 'active'
  ) then
    raise exception 'Reviewer must be an active member of the application organisation.';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_removing_last_organisation_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removing_active_owner boolean;
begin
  if not exists (
    select 1 from public.organisations o where o.id = old.organisation_id
  ) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    removing_active_owner := old.membership_role = 'owner' and old.status = 'active';
  else
    removing_active_owner :=
      old.membership_role = 'owner'
      and old.status = 'active'
      and (new.membership_role <> 'owner' or new.status <> 'active');
  end if;

  if removing_active_owner and not exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = old.organisation_id
      and om.profile_id <> old.profile_id
      and om.membership_role = 'owner'
      and om.status = 'active'
  ) then
    raise exception 'An organisation must retain at least one active owner.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists organisation_members_retain_owner on public.organisation_members;
create trigger organisation_members_retain_owner
before update or delete on public.organisation_members
for each row execute function public.prevent_removing_last_organisation_owner();

revoke all on function public.prevent_removing_last_organisation_owner() from public;

drop trigger if exists reviewer_assignments_validate_scope on public.reviewer_assignments;
create trigger reviewer_assignments_validate_scope
before insert or update on public.reviewer_assignments
for each row execute function public.validate_reviewer_assignment();

create or replace function public.validate_application_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reviewer_assignments ra
    where ra.id = new.assignment_id
      and ra.application_id = new.application_id
      and ra.organisation_id = new.organisation_id
      and ra.reviewer_profile_id = new.reviewer_profile_id
      and ra.status in ('active', 'completed')
  ) then
    raise exception 'Review does not match its reviewer assignment.';
  end if;
  return new;
end;
$$;

drop trigger if exists application_reviews_validate_assignment on public.application_reviews;
create trigger application_reviews_validate_assignment
before insert or update on public.application_reviews
for each row execute function public.validate_application_review();

create or replace function public.protect_conversation_member_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
    and not public.is_admin(auth.uid())
    and (
      old.id is distinct from new.id
      or old.conversation_id is distinct from new.conversation_id
      or old.profile_id is distinct from new.profile_id
      or old.member_role is distinct from new.member_role
      or old.status is distinct from new.status
      or old.joined_at is distinct from new.joined_at
      or old.created_at is distinct from new.created_at
    ) then
    raise exception 'Conversation participants may update only their read state.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversation_members_protect_scope on public.conversation_members;
create trigger conversation_members_protect_scope
before update on public.conversation_members
for each row execute function public.protect_conversation_member_scope();

create or replace function public.prevent_message_reassignment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.id is distinct from new.id
    or old.application_id is distinct from new.application_id
    or old.conversation_id is distinct from new.conversation_id
    or old.sender_id is distinct from new.sender_id
    or old.receiver_id is distinct from new.receiver_id
    or old.sender_profile_id is distinct from new.sender_profile_id
    or old.created_at is distinct from new.created_at then
    raise exception 'Messages cannot be reassigned to another conversation or sender.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_prevent_reassignment on public.messages;
create trigger messages_prevent_reassignment
before update on public.messages
for each row execute function public.prevent_message_reassignment();

create or replace function public.validate_message_attachment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.messages m
    where m.id = new.message_id
      and m.conversation_id = new.conversation_id
      and m.sender_profile_id = new.uploaded_by_profile_id
  ) then
    raise exception 'Attachment must belong to a message sent by the uploader in the same conversation.';
  end if;
  return new;
end;
$$;

drop trigger if exists message_attachments_validate_message on public.message_attachments;
create trigger message_attachments_validate_message
before insert or update on public.message_attachments
for each row execute function public.validate_message_attachment();

create or replace function public.is_conversation_participant(
  conversation_uuid uuid,
  profile_uuid uuid default public.current_profile_id()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conversation_uuid
      and cm.profile_id = profile_uuid
      and cm.status = 'active'
  );
$$;

revoke all on function public.is_conversation_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;

create or replace function public.validate_conversation_context()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.context_type = 'application' and not exists (
    select 1
    from public.applications a
    where a.id = new.application_id
      and lower(a.status) = 'interested'
      and a.organisation_id is not distinct from new.organisation_id
  ) then
    raise exception 'Application conversations require an Interested application in the same organisation context.';
  end if;

  if new.context_type = 'validation_booking' and not exists (
    select 1
    from public.validation_bookings b
    where b.id = new.validation_booking_id
  ) then
    raise exception 'Validation conversation requires an existing validation booking.';
  end if;

  if new.context_type = 'programme' and not exists (
    select 1
    from public.opportunities o
    where o.id = new.programme_context_id
      and o.organisation_id = new.organisation_id
  ) then
    raise exception 'Programme conversation must match its organisation opportunity.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_validate_context on public.conversations;
create trigger conversations_validate_context
before insert or update on public.conversations
for each row execute function public.validate_conversation_context();

-- Reuse the baseline timestamp trigger for every editable record.
drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at before update on public.organisations
for each row execute function public.set_updated_at();
drop trigger if exists organisation_members_set_updated_at on public.organisation_members;
create trigger organisation_members_set_updated_at before update on public.organisation_members
for each row execute function public.set_updated_at();
drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_forms_set_updated_at on public.opportunity_forms;
create trigger opportunity_forms_set_updated_at before update on public.opportunity_forms
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_form_sections_set_updated_at on public.opportunity_form_sections;
create trigger opportunity_form_sections_set_updated_at before update on public.opportunity_form_sections
for each row execute function public.set_updated_at();
drop trigger if exists opportunity_form_fields_set_updated_at on public.opportunity_form_fields;
create trigger opportunity_form_fields_set_updated_at before update on public.opportunity_form_fields
for each row execute function public.set_updated_at();
drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();
drop trigger if exists application_answers_set_updated_at on public.application_answers;
create trigger application_answers_set_updated_at before update on public.application_answers
for each row execute function public.set_updated_at();
drop trigger if exists reviewer_assignments_set_updated_at on public.reviewer_assignments;
create trigger reviewer_assignments_set_updated_at before update on public.reviewer_assignments
for each row execute function public.set_updated_at();
drop trigger if exists application_reviews_set_updated_at on public.application_reviews;
create trigger application_reviews_set_updated_at before update on public.application_reviews
for each row execute function public.set_updated_at();
drop trigger if exists review_scores_set_updated_at on public.review_scores;
create trigger review_scores_set_updated_at before update on public.review_scores
for each row execute function public.set_updated_at();
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();
drop trigger if exists conversation_members_set_updated_at on public.conversation_members;
create trigger conversation_members_set_updated_at before update on public.conversation_members
for each row execute function public.set_updated_at();
drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at before update on public.messages
for each row execute function public.set_updated_at();
drop trigger if exists meetings_set_updated_at on public.meetings;
create trigger meetings_set_updated_at before update on public.meetings
for each row execute function public.set_updated_at();
drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at before update on public.notifications
for each row execute function public.set_updated_at();
drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();
drop trigger if exists payment_events_set_updated_at on public.payment_events;
create trigger payment_events_set_updated_at before update on public.payment_events
for each row execute function public.set_updated_at();

alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;
alter table public.opportunity_forms enable row level security;
alter table public.opportunity_form_sections enable row level security;
alter table public.opportunity_form_fields enable row level security;
alter table public.application_answers enable row level security;
alter table public.reviewer_assignments enable row level security;
alter table public.application_reviews enable row level security;
alter table public.review_scores enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.message_attachments enable row level security;
alter table public.meetings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "organisation members read organisations" on public.organisations;
create policy "organisation members read organisations"
on public.organisations for select
using (public.is_organisation_member(id) or public.is_admin());

drop policy if exists "authenticated users create organisations" on public.organisations;
create policy "authenticated users create organisations"
on public.organisations for insert
with check (
  created_by_profile_id = public.current_profile_id()
  and verification_status = 'pending'
  and verification_metadata = '{}'::jsonb
);

drop policy if exists "organisation owners and admins update organisations" on public.organisations;
create policy "organisation owners and admins update organisations"
on public.organisations for update
using (public.has_organisation_role(id, array['owner', 'admin']) or public.is_admin())
with check (public.has_organisation_role(id, array['owner', 'admin']) or public.is_admin());

drop policy if exists "members read organisation membership" on public.organisation_members;
create policy "members read organisation membership"
on public.organisation_members for select
using (
  profile_id = public.current_profile_id()
  or public.is_organisation_member(organisation_id)
  or public.is_admin()
);

drop policy if exists "owners and admins add organisation members" on public.organisation_members;
create policy "owners and admins add organisation members"
on public.organisation_members for insert
with check (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or (
    profile_id = public.current_profile_id()
    and membership_role = 'owner'
    and exists (
      select 1 from public.organisations o
      where o.id = organisation_id
        and o.created_by_profile_id = public.current_profile_id()
    )
  )
  or public.is_admin()
);

drop policy if exists "owners and admins update organisation members" on public.organisation_members;
create policy "owners and admins update organisation members"
on public.organisation_members for update
using (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
with check (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin());

drop policy if exists "owners and admins remove organisation members" on public.organisation_members;
create policy "owners and admins remove organisation members"
on public.organisation_members for delete
using (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin());

drop policy if exists "opportunities_insert_reviewers" on public.opportunities;
create policy "opportunities_insert_reviewers"
on public.opportunities for insert
with check (
  created_by = auth.uid()
  and created_by_profile_id = public.current_profile_id()
  and creator_role = public.current_profile_role()
  and public.current_profile_role() in ('investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'admin')
  and (
    organisation_id is null
    or public.has_organisation_role(organisation_id, array['owner', 'admin'])
    or public.is_admin()
  )
);

drop policy if exists "opportunities_update_own_or_admin" on public.opportunities;
create policy "opportunities_update_own_or_admin"
on public.opportunities for update
using (
  created_by_profile_id = public.current_profile_id()
  or public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
)
with check (
  created_by_profile_id = public.current_profile_id()
  or public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
);

drop policy if exists "published opportunity forms are public" on public.opportunity_forms;
create policy "published opportunity forms are public"
on public.opportunity_forms for select
using (
  (
    status = 'published'
    and is_active = true
    and exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.verified = true
    )
  )
  or public.is_organisation_member(organisation_id)
  or public.is_admin()
);

drop policy if exists "organisation admins create opportunity forms" on public.opportunity_forms;
create policy "organisation admins create opportunity forms"
on public.opportunity_forms for insert
with check (
  created_by_profile_id = public.current_profile_id()
  and public.has_organisation_role(organisation_id, array['owner', 'admin'])
);

drop policy if exists "organisation admins update draft opportunity forms" on public.opportunity_forms;
create policy "organisation admins update draft opportunity forms"
on public.opportunity_forms for update
using (
  status = 'draft'
  and (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
)
with check (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin());

drop policy if exists "organisation admins archive published opportunity forms" on public.opportunity_forms;
create policy "organisation admins archive published opportunity forms"
on public.opportunity_forms for update
using (
  status = 'published'
  and (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
)
with check (
  status = 'archived'
  and is_active = false
  and (public.has_organisation_role(organisation_id, array['owner', 'admin']) or public.is_admin())
);

drop policy if exists "published opportunity form sections are public" on public.opportunity_form_sections;
create policy "published opportunity form sections are public"
on public.opportunity_form_sections for select
using (
  exists (
    select 1 from public.opportunity_forms f
    join public.opportunities o on o.id = f.opportunity_id
    where f.id = form_id
      and (
        (f.status = 'published' and f.is_active = true and o.verified = true)
        or public.is_organisation_member(f.organisation_id)
        or public.is_admin()
      )
  )
);

drop policy if exists "organisation admins manage form sections" on public.opportunity_form_sections;
create policy "organisation admins manage form sections"
on public.opportunity_form_sections for all
using (
  exists (
    select 1 from public.opportunity_forms f
    where f.id = form_id
      and f.status = 'draft'
      and (public.has_organisation_role(f.organisation_id, array['owner', 'admin']) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.opportunity_forms f
    where f.id = form_id
      and f.status = 'draft'
      and (public.has_organisation_role(f.organisation_id, array['owner', 'admin']) or public.is_admin())
  )
);

drop policy if exists "published opportunity form fields are public" on public.opportunity_form_fields;
create policy "published opportunity form fields are public"
on public.opportunity_form_fields for select
using (
  exists (
    select 1 from public.opportunity_forms f
    join public.opportunities o on o.id = f.opportunity_id
    where f.id = form_id
      and (
        (f.status = 'published' and f.is_active = true and o.verified = true)
        or public.is_organisation_member(f.organisation_id)
        or public.is_admin()
      )
  )
);

drop policy if exists "organisation admins manage form fields" on public.opportunity_form_fields;
create policy "organisation admins manage form fields"
on public.opportunity_form_fields for all
using (
  exists (
    select 1 from public.opportunity_forms f
    where f.id = form_id
      and f.status = 'draft'
      and (public.has_organisation_role(f.organisation_id, array['owner', 'admin']) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.opportunity_forms f
    where f.id = form_id
      and f.status = 'draft'
      and (public.has_organisation_role(f.organisation_id, array['owner', 'admin']) or public.is_admin())
  )
);

drop policy if exists "founders manage own draft answers" on public.application_answers;
create policy "founders manage own draft answers"
on public.application_answers for all
using (
  exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.founder_profile_id = public.current_profile_id()
      and a.status = 'draft'
  )
)
with check (
  exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.founder_profile_id = public.current_profile_id()
      and a.status = 'draft'
  )
);

drop policy if exists "applications_insert_founder" on public.applications;
create policy "applications_insert_founder"
on public.applications for insert
with check (
  founder_id = auth.uid()
  and founder_profile_id = public.current_profile_id()
  and lower(status) in ('draft', 'submitted')
  and exists (
    select 1
    from public.opportunities o
    where o.id = opportunity_id
      and o.organisation_id is not distinct from applications.organisation_id
  )
);

drop policy if exists "assigned reviewers read applications" on public.applications;
create policy "assigned reviewers read applications"
on public.applications for select
using (
  exists (
    select 1 from public.reviewer_assignments ra
    where ra.application_id = applications.id
      and ra.reviewer_profile_id = public.current_profile_id()
      and ra.status in ('active', 'completed')
  )
);

drop policy if exists "organisation admins read applications" on public.applications;
create policy "organisation admins read applications"
on public.applications for select
using (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
);

drop policy if exists "organisation admins update application decisions" on public.applications;
create policy "organisation admins update application decisions"
on public.applications for update
using (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
)
with check (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
);

drop policy if exists "organisation admins manage reviewer assignments" on public.reviewer_assignments;
create policy "organisation admins manage reviewer assignments"
on public.reviewer_assignments for all
using (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
)
with check (
  (
    assigned_by_profile_id = public.current_profile_id()
    and public.has_organisation_role(organisation_id, array['owner', 'admin'])
  )
  or public.is_admin()
);

drop policy if exists "reviewers read own assignments" on public.reviewer_assignments;
create policy "reviewers read own assignments"
on public.reviewer_assignments for select
using (reviewer_profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "reviewers manage assigned reviews" on public.application_reviews;
create policy "reviewers manage assigned reviews"
on public.application_reviews for all
using (
  reviewer_profile_id = public.current_profile_id()
  and exists (
    select 1 from public.reviewer_assignments ra
    where ra.id = assignment_id
      and ra.reviewer_profile_id = public.current_profile_id()
      and ra.status in ('active', 'completed')
  )
)
with check (
  reviewer_profile_id = public.current_profile_id()
  and exists (
    select 1 from public.reviewer_assignments ra
    where ra.id = assignment_id
      and ra.reviewer_profile_id = public.current_profile_id()
      and ra.status in ('active', 'completed')
  )
);

drop policy if exists "organisation admins read application reviews" on public.application_reviews;
create policy "organisation admins read application reviews"
on public.application_reviews for select
using (
  public.has_organisation_role(organisation_id, array['owner', 'admin'])
  or public.is_admin()
);

drop policy if exists "reviewers manage own review scores" on public.review_scores;
create policy "reviewers manage own review scores"
on public.review_scores for all
using (
  exists (
    select 1 from public.application_reviews ar
    where ar.id = review_id
      and ar.reviewer_profile_id = public.current_profile_id()
      and ar.status = 'draft'
  )
)
with check (
  exists (
    select 1 from public.application_reviews ar
    where ar.id = review_id
      and ar.reviewer_profile_id = public.current_profile_id()
      and ar.status = 'draft'
  )
);

drop policy if exists "organisation admins read review scores" on public.review_scores;
create policy "organisation admins read review scores"
on public.review_scores for select
using (
  exists (
    select 1
    from public.application_reviews ar
    where ar.id = review_id
      and (
        public.has_organisation_role(ar.organisation_id, array['owner', 'admin'])
        or public.is_admin()
      )
  )
);

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations"
on public.conversations for select
using (public.is_conversation_participant(id) or public.is_admin());

drop policy if exists "authorised partners create gated conversations" on public.conversations;
create policy "authorised partners create gated conversations"
on public.conversations for insert
with check (
  initiated_by_profile_id = public.current_profile_id()
  and public.current_profile_role() in ('investor', 'incubator', 'hackathon_organizer', 'event_organizer', 'admin')
  and (
    (
      context_type = 'application'
      and authorization_reason = 'interested'
      and exists (
        select 1
        from public.applications a
        join public.opportunities o on o.id = a.opportunity_id
        where a.id = application_id
          and lower(a.status) = 'interested'
          and (
            o.created_by_profile_id = public.current_profile_id()
            or public.has_organisation_role(a.organisation_id, array['owner', 'admin'])
          )
      )
    )
    or (
      context_type = 'programme'
      and authorization_reason = 'programme_rule'
      and public.has_organisation_role(organisation_id, array['owner', 'admin'])
    )
  )
);

drop policy if exists "participants read own conversation membership" on public.conversation_members;
create policy "participants read own conversation membership"
on public.conversation_members for select
using (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists "participants update own read state" on public.conversation_members;
create policy "participants update own read state"
on public.conversation_members for update
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

-- Limit legacy message policies to rows that predate conversation membership.
drop policy if exists "messages_select_participants_or_admin" on public.messages;
create policy "messages_select_participants_or_admin"
on public.messages for select
using (
  conversation_id is null
  and (
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
  )
);

drop policy if exists "messages_insert_after_interest" on public.messages;
create policy "messages_insert_after_interest"
on public.messages for insert
with check (
  conversation_id is null
  and (
    public.is_admin()
    or exists (
      select 1
      from public.applications a
      join public.opportunities o on o.id = a.opportunity_id
      where a.id = messages.application_id
        and lower(a.status) = 'interested'
        and (a.founder_id = auth.uid() or o.created_by = auth.uid())
    )
  )
);

drop policy if exists "conversation participants read messages" on public.messages;
create policy "conversation participants read messages"
on public.messages for select
using (
  conversation_id is not null
  and (public.is_conversation_participant(conversation_id) or public.is_admin())
);

drop policy if exists "conversation participants send messages" on public.messages;
create policy "conversation participants send messages"
on public.messages for insert
with check (
  conversation_id is not null
  and sender_profile_id = public.current_profile_id()
  and public.is_conversation_participant(conversation_id)
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and c.status = 'active'
  )
);

drop policy if exists "senders edit own messages" on public.messages;
create policy "senders edit own messages"
on public.messages for update
using (
  conversation_id is not null
  and sender_profile_id = public.current_profile_id()
  and public.is_conversation_participant(conversation_id)
)
with check (
  conversation_id is not null
  and sender_profile_id = public.current_profile_id()
  and public.is_conversation_participant(conversation_id)
);

drop policy if exists "participants read message attachments" on public.message_attachments;
create policy "participants read message attachments"
on public.message_attachments for select
using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "senders create message attachments" on public.message_attachments;
create policy "senders create message attachments"
on public.message_attachments for insert
with check (
  uploaded_by_profile_id = public.current_profile_id()
  and public.is_conversation_participant(conversation_id)
  and exists (
    select 1 from public.messages m
    where m.id = message_id
      and m.conversation_id = message_attachments.conversation_id
      and m.sender_profile_id = public.current_profile_id()
  )
);

drop policy if exists "participants read meetings" on public.meetings;
create policy "participants read meetings"
on public.meetings for select
using (public.is_conversation_participant(conversation_id) or public.is_admin());

drop policy if exists "participants create meetings" on public.meetings;
create policy "participants create meetings"
on public.meetings for insert
with check (
  created_by_profile_id = public.current_profile_id()
  and public.is_conversation_participant(conversation_id)
);

-- Payment, payment event, and audit tables intentionally have no authenticated
-- policies. Only trusted server/service-role code may read or write them.
