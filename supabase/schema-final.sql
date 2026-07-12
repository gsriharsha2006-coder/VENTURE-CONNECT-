-- Venture Connect – Production schema (messaging, subscriptions, Razorpay, reports)
create extension if not exists "uuid-ossp";

-- Enums
create type public.user_role as enum ('Founder', 'Investor', 'Admin');
create type public.subscription_plan as enum ('Free', 'Starter', 'Growth');
create type public.subscription_status as enum ('active', 'cancelled', 'past_due', 'expired', 'trialing');
create type public.payment_status as enum ('created', 'authorized', 'captured', 'failed', 'refunded');
create type public.workspace_template as enum ('ai-project', 'startup', 'saas-product', 'hackathon-project');
create type public.workspace_visibility as enum ('private', 'public');
create type public.idea_workspace_status as enum ('Draft', 'Submitted', 'Reviewing', 'Accepted', 'Rejected');
create type public.startup_stage as enum ('Idea', 'Prototype', 'MVP', 'Revenue', 'Seed');
create type public.application_status as enum ('New', 'Reviewing', 'Shortlisted', 'Meeting Requested', 'Invested', 'Rejected', 'Interested', 'Ignored');
create type public.conversation_status as enum ('active', 'archived', 'closed');
create type public.message_type as enum ('text', 'file', 'meeting_link', 'system');
create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role public.user_role not null default 'Founder',
  plan public.subscription_plan not null default 'Free',
  avatar_url text,
  razorpay_customer_id text,
  free_report_used boolean not null default false,
  reports_used_this_month integer not null default 0,
  reports_month_reset date not null default (date_trunc('month', now())::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'Founder')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

-- Idea Workspaces
create table public.idea_workspaces (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  template public.workspace_template not null default 'startup',
  status public.idea_workspace_status not null default 'Draft',
  stage public.startup_stage not null default 'Idea',
  visibility public.workspace_visibility not null default 'private',
  tags text[] not null default '{}',
  category text,
  sections jsonb not null default '{}',
  uploads text[] not null default '{}',
  archived boolean not null default false,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions (Razorpay)
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null default 'active',
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount integer not null,
  currency text not null default 'INR',
  razorpay_payment_id text,
  razorpay_order_id text,
  status public.payment_status not null default 'created',
  created_at timestamptz not null default now()
);

-- VC Readiness Reports
create table public.vc_readiness_reports (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.idea_workspaces(id) on delete cascade,
  report_tier text not null check (report_tier in ('free', 'premium')),
  template public.workspace_template,
  output jsonb not null,
  overall_score integer check (overall_score between 0 and 100),
  ai_provider text not null default 'gemini',
  created_at timestamptz not null default now()
);

-- Startup submissions (founder → investor pipeline)
create table public.startup_submissions (
  id uuid primary key default uuid_generate_v4(),
  founder_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.idea_workspaces(id) on delete cascade,
  investor_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'New',
  pitch_deck_url text,
  report_id uuid references public.vc_readiness_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, investor_id)
);

-- Conversations
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  founder_id uuid not null references public.profiles(id) on delete cascade,
  investor_id uuid not null references public.profiles(id) on delete cascade,
  startup_idea_id uuid not null references public.idea_workspaces(id) on delete cascade,
  submission_id uuid references public.startup_submissions(id) on delete set null,
  status public.conversation_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (founder_id, investor_id, startup_idea_id)
);

-- Messages
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role public.user_role not null,
  message_type public.message_type not null default 'text',
  message text,
  attachment_url text,
  attachment_name text,
  attachment_mime text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Meetings
create table public.meetings (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  meeting_link text not null,
  scheduled_time timestamptz not null,
  notes text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  status public.meeting_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Typing indicators (ephemeral via realtime; persisted for audit)
create table public.typing_status (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_typing boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Audit log
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_workspaces_owner on public.idea_workspaces(owner_id, updated_at desc);
create index idx_submissions_investor on public.startup_submissions(investor_id, status);
create index idx_submissions_founder on public.startup_submissions(founder_id);
create index idx_conversations_founder on public.conversations(founder_id, status);
create index idx_conversations_investor on public.conversations(investor_id, status);
create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_reports_owner on public.vc_readiness_reports(owner_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.idea_workspaces enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.vc_readiness_reports enable row level security;
alter table public.startup_submissions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.meetings enable row level security;
alter table public.notifications enable row level security;
alter table public.typing_status enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles policies
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_self on public.profiles for update using (auth.uid() = id);

-- Workspace policies
create policy workspace_owner on public.idea_workspaces for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy workspace_public_read on public.idea_workspaces for select
  using (visibility = 'public' or auth.uid() = owner_id);

-- Subscription policies
create policy subscriptions_own on public.subscriptions for select using (auth.uid() = user_id);
create policy payments_own on public.payments for select using (auth.uid() = user_id);

-- Reports policies
create policy reports_own on public.vc_readiness_reports for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Submissions policies
create policy submissions_founder on public.startup_submissions for all
  using (auth.uid() = founder_id) with check (auth.uid() = founder_id);
create policy submissions_investor_read on public.startup_submissions for select
  using (auth.uid() = investor_id);
create policy submissions_investor_update on public.startup_submissions for update
  using (auth.uid() = investor_id);

-- Conversation policies – participants only
create policy conversations_participant on public.conversations for select
  using (auth.uid() in (founder_id, investor_id));
create policy conversations_investor_insert on public.conversations for insert
  with check (auth.uid() = investor_id);

-- Messages policies
create policy messages_participant_read on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.founder_id, c.investor_id)
  ));
create policy messages_participant_insert on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.founder_id, c.investor_id)
    )
  );
create policy messages_read_update on public.messages for update
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.founder_id, c.investor_id)
  ));

-- Meetings policies
create policy meetings_participant on public.meetings for all
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.founder_id, c.investor_id)
  ))
  with check (auth.uid() = created_by);

-- Notifications policies
create policy notifications_own on public.notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Typing policies
create policy typing_participant on public.typing_status for all
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.founder_id, c.investor_id)
  ))
  with check (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.typing_status;
alter publication supabase_realtime add table public.notifications;

-- Storage bucket (run in dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('messaging-attachments', 'messaging-attachments', false);
