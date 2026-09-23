# AZWO Knowledge Repository Catalog v1

## Purpose
This registry is separate from `api_catalog`.

An API is a transport/interface. A knowledge repository is the underlying source of knowledge itself: a knowledge graph, scholarly graph, library, archive, manuscript collection, media repository or corpus.

## Architecture

```text
Knowledge Repository
        ↓
Repository Review
        ↓
Rights & Provenance Check
        ↓
Approved Connector
        ↓
AZWO Provenance Graph
        ↓
Text | Document | Image | Manuscript | Audio | Video
```

## v1 seed
20 researched repositories were added on 2026-09-23:

1. Wikidata
2. OpenAlex
3. Crossref
4. OpenCitations
5. Wikimedia Commons
6. Internet Archive
7. Library of Congress
8. Qatar Digital Library
9. HMML Reading Room & Authority File
10. Europeana
11. Wellcome Collection
12. OpenITI
13. Smithsonian Open Access
14. Digital Public Library of America
15. Open Library
16. Europe PMC
17. Semantic Scholar
18. arXiv
19. CORE
20. Google Books

## Safety / governance
All v1 rows are:
- `verification_status = researched`
- `integration_status = not_connected`
- `enabled = false`

No repository has been connected to the AZWO engine.

A repository must later pass:
1. rights/licensing review,
2. technical access review,
3. provenance-quality review,
4. rate-limit / stability review where applicable,
5. connector design,
6. approval,

before it can become an engine provider.

## Important distinction
`relevance_score` is a discovery/architecture score. It is not a claim that the repository is authoritative for every record it contains, nor that its content is commercially reusable.
