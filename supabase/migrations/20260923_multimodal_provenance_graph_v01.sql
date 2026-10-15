-- AZWO Multimodal Provenance Graph v0.1
create or replace function public.azwo_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.content_assets (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  asset_type text not null check (asset_type in ('text','document','image','manuscript','audio','video','url','dataset')),
  title text,
  original_filename text,
  canonical_url text,
  storage_path text,
  mime_type text,
  language text,
  sha256 text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  page_count integer check (page_count is null or page_count >= 0),
  width integer check (width is null or width >= 0),
  height integer check (height is null or height >= 0),
  status text not null default 'ingested' check (status in ('ingested','processing','ready','needs_review','error','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_assets_org_sha256 on public.content_assets(organization_id,sha256) where sha256 is not null;
create index if not exists idx_content_assets_org_created on public.content_assets(organization_id,created_at desc);
create index if not exists idx_content_assets_type on public.content_assets(asset_type);
create index if not exists idx_content_assets_status on public.content_assets(status);
drop trigger if exists trg_content_assets_updated_at on public.content_assets;
create trigger trg_content_assets_updated_at before update on public.content_assets
for each row execute function public.azwo_set_updated_at();

create table if not exists public.asset_segments (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid not null references public.content_assets(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  segment_type text not null check (segment_type in ('whole','page','folio','page_region','paragraph','sentence','table','image_region','frame','time_range','audio_segment','caption','metadata_block')),
  ordinal integer,
  page_no integer,
  folio_label text,
  start_offset integer,
  end_offset integer,
  start_ms bigint,
  end_ms bigint,
  bbox jsonb,
  extracted_text text,
  language text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_asset_segments_asset on public.asset_segments(asset_id,ordinal);
create index if not exists idx_asset_segments_org on public.asset_segments(organization_id);
create index if not exists idx_asset_segments_type on public.asset_segments(segment_type);
drop trigger if exists trg_asset_segments_updated_at on public.asset_segments;
create trigger trg_asset_segments_updated_at before update on public.asset_segments
for each row execute function public.azwo_set_updated_at();

create table if not exists public.content_extractions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.content_assets(id) on delete cascade,
  segment_id uuid references public.asset_segments(id) on delete cascade,
  extraction_type text not null check (extraction_type in ('text_parse','ocr','htr','stt','frame_sampling','captioning','metadata_extract','entity_extract','reference_extract','checksum')),
  provider text,
  model text,
  provider_version text,
  status text not null default 'pending' check (status in ('pending','running','completed','needs_review','error')),
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  output_text text,
  output_json jsonb not null default '{}'::jsonb,
  parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_content_extractions_asset on public.content_extractions(asset_id,created_at desc);
create index if not exists idx_content_extractions_segment on public.content_extractions(segment_id);
create index if not exists idx_content_extractions_type on public.content_extractions(extraction_type);

create table if not exists public.provenance_agents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_type text not null check (agent_type in ('person','organization','software','model','source_system','device','unknown')),
  name text not null,
  external_uri text,
  identifiers jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provenance_activities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid references public.content_assets(id) on delete cascade,
  activity_type text not null check (activity_type in ('ingest','text_parse','ocr','htr','stt','frame_extract','metadata_extract','claim_extract','entity_resolution','source_lookup','citation_lookup','reverse_media_search','transformation','human_review','report_generation')),
  provider text,
  model text,
  status text not null default 'completed' check (status in ('pending','running','completed','needs_review','error')),
  parameters jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provenance_entities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('asset','segment','claim','source_record','external_entity','work','document_version','media_version','manuscript_work','manuscript_copy','citation','identifier','location','event')),
  asset_id uuid references public.content_assets(id) on delete cascade,
  segment_id uuid references public.asset_segments(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  knowledge_repository_id uuid references public.knowledge_repository_catalog(id) on delete set null,
  api_catalog_id uuid references public.api_catalog(id) on delete set null,
  external_uri text,
  canonical_id text,
  title text,
  content_hash text,
  version_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provenance_relations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_entity_id uuid not null references public.provenance_entities(id) on delete cascade,
  relation_type text not null check (relation_type in ('derived_from','generated_by','attributed_to','revision_of','version_of','cites','cited_by','supports','contradicts','same_as','depicts','transcribes','extracted_from','published_by','stored_at','located_at','part_of','translation_of','reproduction_of','mentions','created_from')),
  object_entity_id uuid references public.provenance_entities(id) on delete cascade,
  activity_id uuid references public.provenance_activities(id) on delete set null,
  agent_id uuid references public.provenance_agents(id) on delete set null,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  asserted_by text not null default 'system' check (asserted_by in ('system','provider','user','reviewer')),
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed','verified','rejected','needs_review')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (object_entity_id is not null or activity_id is not null or agent_id is not null)
);

create table if not exists public.provenance_evidence (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid references public.provenance_entities(id) on delete cascade,
  relation_id uuid references public.provenance_relations(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  knowledge_repository_id uuid references public.knowledge_repository_catalog(id) on delete set null,
  api_catalog_id uuid references public.api_catalog(id) on delete set null,
  external_uri text,
  locator text,
  excerpt text,
  media_fragment jsonb,
  retrieval_score numeric check (retrieval_score is null or (retrieval_score >= 0 and retrieval_score <= 1)),
  verification_status text not null default 'retrieved' check (verification_status in ('discovered','retrieved','verified','rejected','needs_review')),
  rights_status text not null default 'unknown' check (rights_status in ('unknown','open','restricted','licensed','review_required')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (entity_id is not null or relation_id is not null)
);

alter table public.verification_jobs add column if not exists content_asset_id uuid references public.content_assets(id) on delete set null;
alter table public.claims add column if not exists asset_segment_id uuid references public.asset_segments(id) on delete set null;
alter table public.claims add column if not exists provenance_entity_id uuid references public.provenance_entities(id) on delete set null;
alter table public.evidence add column if not exists provenance_evidence_id uuid references public.provenance_evidence(id) on delete set null;

alter table public.content_assets enable row level security;
alter table public.asset_segments enable row level security;
alter table public.content_extractions enable row level security;
alter table public.provenance_agents enable row level security;
alter table public.provenance_activities enable row level security;
alter table public.provenance_entities enable row level security;
alter table public.provenance_relations enable row level security;
alter table public.provenance_evidence enable row level security;

-- Production policies are intentionally organization-scoped.
-- See live migration history for the complete insert/update policies.

comment on table public.content_assets is 'Multimodal input layer for AZWO.';
comment on table public.provenance_relations is 'W3C-PROV-inspired edge table forming AZWO Provenance Graph.';
comment on table public.provenance_evidence is 'Evidence for provenance nodes/relations with text, page, time, region and rights locators.';
