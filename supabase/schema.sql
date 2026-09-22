-- AZWO / عَزْو — PostgreSQL + Supabase schema
create extension if not exists "uuid-ossp";

create type public.member_role as enum ('owner','admin','reviewer','editor','viewer');
create type public.verification_status as enum ('draft','queued','processing','needs_review','completed','failed');
create type public.claim_status as enum ('supported','partial','unsupported','multiple','human_review');
create type public.source_status as enum ('draft','approved','restricted','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  type text not null default 'institution',
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table public.sources (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  author text,
  source_type text not null,
  publisher text,
  canonical_url text,
  license_name text,
  license_url text,
  status public.source_status not null default 'draft',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_versions (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null references public.sources(id) on delete cascade,
  version_label text,
  checksum text,
  published_at date,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.verification_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id),
  input_type text not null check (input_type in ('text','file','link','image')),
  input_text text,
  input_url text,
  file_path text,
  domain text,
  language text not null default 'ar',
  status public.verification_status not null default 'draft',
  technical_score numeric(5,2),
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.verification_jobs(id) on delete cascade,
  ordinal integer not null,
  claim_text text not null,
  claim_type text not null default 'general',
  start_offset integer,
  end_offset integer,
  risk_level text not null default 'medium',
  status public.claim_status,
  explanation text,
  requires_human_review boolean not null default false,
  model_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(job_id, ordinal)
);

create table public.evidence (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  source_id uuid references public.sources(id),
  source_version_id uuid references public.source_versions(id),
  passage text,
  location_text text,
  relation text,
  retrieval_score numeric,
  rerank_score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  decision public.claim_status,
  comment text,
  is_final boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null unique references public.verification_jobs(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  report_version text not null default '1.0',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helper: organization membership
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = any(allowed)
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.sources enable row level security;
alter table public.source_versions enable row level security;
alter table public.verification_jobs enable row level security;
alter table public.claims enable row level security;
alter table public.evidence enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.audit_log enable row level security;

create policy "profile self read" on public.profiles for select using (id = auth.uid());
create policy "profile self update" on public.profiles for update using (id = auth.uid());

create policy "org members read org" on public.organizations for select using (public.is_org_member(id));
create policy "authenticated create org" on public.organizations for insert
with check (auth.uid() is not null and created_by = auth.uid());
create policy "org admins update org" on public.organizations for update using (public.has_org_role(id,array['owner','admin']::public.member_role[]));

create policy "members read memberships" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "admins manage memberships" on public.organization_members for all using (public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));

create policy "read public or org sources" on public.sources for select using (
  is_public = true or (organization_id is not null and public.is_org_member(organization_id))
);
create policy "editors manage sources" on public.sources for all using (public.has_org_role(organization_id,array['owner','admin','reviewer','editor']::public.member_role[]));

create policy "members read source versions" on public.source_versions for select using (
  exists(select 1 from public.sources s where s.id=source_id and public.is_org_member(s.organization_id))
);
create policy "editors manage source versions" on public.source_versions for all using (
  exists(select 1 from public.sources s where s.id=source_id and public.has_org_role(s.organization_id,array['owner','admin','reviewer','editor']::public.member_role[]))
);

create policy "members read jobs" on public.verification_jobs for select using (public.is_org_member(organization_id));
create policy "editors create jobs" on public.verification_jobs for insert with check (
  public.has_org_role(organization_id,array['owner','admin','reviewer','editor']::public.member_role[])
);
create policy "editors update jobs" on public.verification_jobs for update using (
  public.has_org_role(organization_id,array['owner','admin','reviewer','editor']::public.member_role[])
);

create policy "members read claims" on public.claims for select using (
 exists(select 1 from public.verification_jobs j where j.id=job_id and public.is_org_member(j.organization_id))
);
create policy "reviewers update claims" on public.claims for update using (
 exists(select 1 from public.verification_jobs j where j.id=job_id and public.has_org_role(j.organization_id,array['owner','admin','reviewer']::public.member_role[]))
);

create policy "members read evidence" on public.evidence for select using (
 exists(select 1 from public.claims c join public.verification_jobs j on j.id=c.job_id where c.id=claim_id and public.is_org_member(j.organization_id))
);

create policy "members read reviews" on public.reviews for select using (
 exists(select 1 from public.claims c join public.verification_jobs j on j.id=c.job_id where c.id=claim_id and public.is_org_member(j.organization_id))
);
create policy "reviewers create reviews" on public.reviews for insert with check (
 exists(select 1 from public.claims c join public.verification_jobs j on j.id=c.job_id where c.id=claim_id and public.has_org_role(j.organization_id,array['owner','admin','reviewer']::public.member_role[]))
);

create policy "members read reports" on public.reports for select using (
 exists(select 1 from public.verification_jobs j where j.id=job_id and public.is_org_member(j.organization_id))
);

create policy "admins read audit" on public.audit_log for select using (
 public.has_org_role(organization_id,array['owner','admin']::public.member_role[])
);

-- Add organization creator as owner
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $
begin
  if new.created_by is not null then
    insert into public.organization_members(organization_id,user_id,role)
    values(new.id,new.created_by,'owner')
    on conflict (organization_id,user_id) do nothing;
  end if;
  return new;
end;
$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
after insert on public.organizations
for each row execute procedure public.handle_new_organization();

-- Create profile after signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,full_name)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
