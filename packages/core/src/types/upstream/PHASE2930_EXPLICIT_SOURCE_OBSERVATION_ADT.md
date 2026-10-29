# Phase2930 — Explicit Source Observation ADT

## Root cause addressed

The prior visitor alignment still represented an optional absent source by attaching a no-op `visitScannableSource` operation to that observation. That was not an explicit domain outcome: it forced a caller-facing operation to exist on a result that must never be read.

## Change

`LaravelRouteSourceFileObservation` is now a discriminated union with explicit outcomes:

- `laravel_route_source_file_scanned`
- `laravel_route_source_file_absent_optional_default`

The ready judgment owns a separate `SourceFileInventory` read plan and exposes `visitScannableSources` through the canonical upstream `SourceFileInventoryVisitorInterface`. Optional absent sources remain recorded in `sourceFiles`, but are not inserted into the read plan. No no-op callback is needed. The blocked judgment continues to own `visitMissingFiles` and preserve missing explicit-source evidence.

The scanner consumes the ready judgment's domain operation; it does not need to interpret each observation or implement a second visitor protocol. The existing upstream inventory visitor is reused rather than replaced.

## Remaining limitations

The implementation still compares source paths while classifying missing files, and explicit-intent blocking still uses a missing inventory count. This phase does not claim that all primitive reasoning in the full CLI-to-manifest path has been removed. Full typecheck, test suite, build, and CLI E2E require the project dependencies and were not claimed as passing.
