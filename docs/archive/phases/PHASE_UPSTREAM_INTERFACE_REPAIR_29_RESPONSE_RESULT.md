# Phase 29 — Canonical Response Result

## Scope
Upstream interface only.

## Trace finding
`ResponseDefinition` represented one semantic response through three independent fields: `payload`, `wrapper`, and `transport`. This allowed consumers to inspect several discriminators and reconstruct whether the response was a JSON single/collection/paginated response, redirect, or download.

## Repair
`ResponseDefinition` now carries one correlated `ResponseResult`:
- `json` → correlated `ResponseJsonShape` + payload
- `redirect` → target
- `download` → file + filename

JSON shape itself correlates cardinality and payload, with pagination only on the paginated variant.

## Principle
One semantic decision must have one closed ADT. Downstream should consume `result`, not re-classify transport + wrapper + payload independently.

## Migration signal
Existing response producers/consumers will report compile errors because they still construct/read `payload`, `wrapper`, or `transport`. These errors are expected and must be repaired later at the producer boundary, not by weakening this interface.
