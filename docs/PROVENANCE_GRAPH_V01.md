# AZWO Provenance Graph v0.1

عَزْو لم يعد يُصمم كمحرك `Claim Verification` فقط. البنية الجديدة تتعامل مع أي محتوى بوصفه أصلًا رقميًا يمكن تتبع منشئه ونسخه وتحولاته وأدلته.

## Core model

```text
Content Asset
  ↓
Asset Segment
  ↓
Extraction
  ↓
Provenance Entity
  ↓
Provenance Relation
  ↓
Provenance Evidence
```

Supporting W3C-PROV-inspired concepts:

```text
Entity ← Activity → Agent
```

## Supported asset types in the schema

- text
- document
- image
- manuscript
- audio
- video
- URL
- dataset

Only **text** is processed end-to-end today. The other modalities have database support but no approved processor/connector yet.

## Segment model

A source can be addressed precisely as:

- whole asset
- page
- folio
- page region
- paragraph
- sentence
- table
- image region
- video frame
- time range
- audio segment
- caption
- metadata block

This allows the same graph to represent a manuscript folio, a quoted paragraph, a region in an image, or seconds 01:12–01:28 in a video.

## Extraction model

The schema supports:

- text parsing
- OCR
- HTR
- speech-to-text
- frame sampling
- captioning
- metadata extraction
- entity extraction
- reference extraction
- checksums

## Relation model

Examples:

- derived_from
- revision_of
- version_of
- cites
- supports
- contradicts
- same_as
- depicts
- transcribes
- extracted_from
- published_by
- stored_at
- part_of
- translation_of
- reproduction_of
- mentions

## Compatibility layer

The existing engine remains operational:

- `verification_jobs.content_asset_id`
- `claims.asset_segment_id`
- `claims.provenance_entity_id`
- `evidence.provenance_evidence_id`

The current text engine writes both the legacy claim/evidence model and Provenance Graph v0.1.

## Current engine behavior

Supabase Edge Function `azwo-engine` version 2:

1. hashes the original text,
2. creates a Content Asset,
3. creates the original whole segment,
4. records ingestion and parsing activities,
5. extracts claim candidates,
6. creates claim segments and graph entities,
7. records `extracted_from` and `part_of` relations,
8. converts source matches into Source Record entities,
9. records `supports` relationships,
10. stores provenance evidence while preserving legacy evidence rows.

## Governance rule

A knowledge repository or API may exist in the discovery catalogs without being usable by the engine.

```text
Discovered / Researched
→ Rights Review
→ Technical Test
→ Approved
→ Connector
→ Engine
```

No newly researched repository is connected automatically.
