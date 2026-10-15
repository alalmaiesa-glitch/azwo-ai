# AZWO API Catalog — Phase 1

Source of record:
- GitHub: `public-apis/public-apis`
- README commit observed: `f4e3de11d81c745a68b28850f7ffcfd9322ab339`
- README last commit date observed: 2026-09-20T20:48:35Z

## Import result
- Public APIs rows matching the repository's API table schema: **1793**
- Unique name + documentation URL records imported: **1791**
- Exact duplicates collapsed:
  - TasteDive (Entertainment / Music)
  - Open-Meteo (Environment / Weather)
- Preliminary AZWO-relevant records: **91**
- Approved: **0**
- Enabled: **0**
- Health checked: **0**

No external provider endpoints were called during this phase.

## State machine
`Discovered → Relevant → Reviewed → Tested → Approved → Connected`

Only an Approved provider may later receive a Connector and become eligible for AZWO Engine routing.

## Phase-one scoring limitation
`relevance_score` is a discovery score only. It uses the evidence available in
the Public APIs repository: name, description, category, auth type, HTTPS,
CORS, documentation URL and a small established-provider heuristic.

The following requested factors are deliberately **not treated as verified**
in Phase 1 because that would require reviewing or testing each provider:
- rate limits
- commercial-use rights
- actual uptime/stability
- current free tier
- data quality
- endpoint behavior
- licensing details

Those belong to Reviewed/Tested and must not cause automatic approval.
