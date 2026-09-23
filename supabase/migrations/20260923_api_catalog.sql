create table if not exists public.api_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  auth_type text,
  https boolean,
  cors text,
  documentation_url text not null,
  source text not null,
  relevance_score numeric(5,2) not null default 0
    check (relevance_score between 0 and 100),
  azwo_use_case text,
  verification_status text not null default 'discovered'
    check (verification_status in (
      'discovered','relevant','reviewed','tested',
      'approved','rejected','needs_review'
    )),
  integration_status text not null default 'not_connected'
    check (integration_status in (
      'not_connected','connector_draft','connected','disabled','error'
    )),
  enabled boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, documentation_url)
);

create index if not exists idx_api_catalog_relevance
  on public.api_catalog(relevance_score desc);
create index if not exists idx_api_catalog_category
  on public.api_catalog(category);
create index if not exists idx_api_catalog_verification
  on public.api_catalog(verification_status);
create index if not exists idx_api_catalog_use_case
  on public.api_catalog(azwo_use_case);
create index if not exists idx_api_catalog_enabled
  on public.api_catalog(enabled);

alter table public.api_catalog enable row level security;

drop policy if exists "authenticated read api catalog" on public.api_catalog;
create policy "authenticated read api catalog"
on public.api_catalog
for select
to authenticated
using (true);

comment on table public.api_catalog is
'Discovery-only API catalog. A row is not an approved or connected provider.';
comment on column public.api_catalog.last_checked_at is
'NULL until AZWO performs a real health/terms check against the provider.';
