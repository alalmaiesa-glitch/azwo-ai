create table if not exists public.knowledge_repository_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  repository_type text not null,
  domains text[] not null default '{}',
  media_types text[] not null default '{}',
  access_methods text[] not null default '{}',
  homepage_url text not null,
  api_url text,
  source_repository text,
  license_summary text,
  commercial_use_status text not null default 'review_required',
  provenance_support text,
  iiif_support text not null default 'unknown',
  arabic_support text not null default 'unknown',
  bulk_access boolean not null default false,
  size_estimate text,
  relevance_score numeric(5,2) not null default 0 check (relevance_score between 0 and 100),
  azwo_use_cases text[] not null default '{}',
  verification_status text not null default 'researched'
    check (verification_status in ('discovered','researched','reviewed','approved','rejected','needs_review')),
  integration_status text not null default 'not_connected'
    check (integration_status in ('not_connected','connector_draft','connected','disabled','error')),
  enabled boolean not null default false,
  evidence_urls jsonb not null default '[]'::jsonb,
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

create index if not exists idx_knowledge_repo_relevance on public.knowledge_repository_catalog(relevance_score desc);
create index if not exists idx_knowledge_repo_type on public.knowledge_repository_catalog(repository_type);
create index if not exists idx_knowledge_repo_verification on public.knowledge_repository_catalog(verification_status);
create index if not exists idx_knowledge_repo_enabled on public.knowledge_repository_catalog(enabled);

alter table public.knowledge_repository_catalog enable row level security;

drop policy if exists "authenticated read knowledge repository catalog"
  on public.knowledge_repository_catalog;
create policy "authenticated read knowledge repository catalog"
on public.knowledge_repository_catalog
for select to authenticated using (true);

comment on table public.knowledge_repository_catalog is
'AZWO discovery registry for knowledge repositories, archives, graphs, libraries and corpora. A row is not an approved connector.';
comment on column public.knowledge_repository_catalog.enabled is
'Must remain false until repository review, rights review and connector approval are complete.';
