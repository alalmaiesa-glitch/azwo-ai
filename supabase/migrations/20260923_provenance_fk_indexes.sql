create index if not exists idx_content_assets_created_by
  on public.content_assets(created_by);

create index if not exists idx_content_extractions_org
  on public.content_extractions(organization_id);

create index if not exists idx_prov_entities_api_catalog
  on public.provenance_entities(api_catalog_id);

create index if not exists idx_prov_entities_source
  on public.provenance_entities(source_id);

create index if not exists idx_prov_evidence_api_catalog
  on public.provenance_evidence(api_catalog_id);

create index if not exists idx_prov_evidence_source
  on public.provenance_evidence(source_id);

create index if not exists idx_prov_rel_activity
  on public.provenance_relations(activity_id);

create index if not exists idx_prov_rel_agent
  on public.provenance_relations(agent_id);
