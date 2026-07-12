-- Venture Connect schema v2 — Idea Workspace + VC Readiness Report naming
-- Run after base schema or as migration.

create type public.workspace_template as enum (
  'ai-project',
  'startup',
  'saas-product',
  'hackathon-project'
);

create type public.workspace_visibility as enum ('private', 'public');

create type public.idea_workspace_status as enum (
  'Draft',
  'Submitted',
  'Reviewing',
  'Accepted',
  'Rejected'
);

create table if not exists public.idea_workspaces (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete set null,
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
  uniqueness_score integer default 0 check (uniqueness_score between 0 and 100),
  demand_score integer default 0 check (demand_score between 0 and 100),
  scalability_score integer default 0 check (scalability_score between 0 and 100),
  competition_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_workspace_versions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.idea_workspaces(id) on delete cascade,
  version_number integer not null,
  sections jsonb not null,
  ai_summary text,
  created_at timestamptz not null default now(),
  unique (workspace_id, version_number)
);

-- VC Readiness Reports (replaces ai_reports naming in app layer)
create table if not exists public.vc_readiness_reports (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.idea_workspaces(id) on delete cascade,
  startup_id uuid references public.startups(id) on delete cascade,
  report_type text not null,
  template public.workspace_template,
  plan public.plan_tier not null default 'Free',
  output jsonb not null,
  readiness_score integer check (readiness_score between 0 and 100),
  provider text not null default 'mock-ai',
  created_at timestamptz not null default now()
);

create index if not exists idea_workspaces_owner_idx on public.idea_workspaces(owner_id, updated_at desc);
create index if not exists vc_reports_workspace_idx on public.vc_readiness_reports(workspace_id, created_at desc);

alter table public.idea_workspaces enable row level security;
alter table public.idea_workspace_versions enable row level security;
alter table public.vc_readiness_reports enable row level security;

create policy "workspace owner access"
  on public.idea_workspaces for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "public workspaces readable"
  on public.idea_workspaces for select
  using (visibility = 'public' or auth.uid() = owner_id);

create policy "workspace versions through owner"
  on public.idea_workspace_versions for all
  using (
    exists (
      select 1 from public.idea_workspaces w
      where w.id = workspace_id and w.owner_id = auth.uid()
    )
  );

create policy "vc reports private to owner"
  on public.vc_readiness_reports for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
