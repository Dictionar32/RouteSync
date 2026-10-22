# Phase 2320 — Route Selection Executor Contract

## Finding

The source-AST pipeline previously branched between two calls to `routeScanner.scan`, omitting `sourceSelection` in the default arm and supplying it only in the explicit arm. The route scanner contract represented the same distinction as an optional property, and its implementation inferred default behavior from absence. This made the execution input weaker than the already-existing `LaravelRouteSourceSelectionIntent` ADT.

## Change

- `LaravelRouteScanInput` now requires `sourceSelectionIntent: LaravelRouteSourceSelectionIntent`.
- The explicit intent arm is narrowed to `explicit_route_files`; default discovery is represented only by `laravel_route_source_selection_default`.
- The source-AST pipeline invokes the route scanner once and forwards the exact intent unchanged.
- The route scanner consumes the explicit ADT arms instead of interpreting an absent optional selection as a default.
- The route scanner input/result contract version advances from 4 to 5.

## Architectural boundary

This is a wiring-contract correction, not a claim that the whole Laravel scanner is now a pure executor. The route scanner still contains route parsing, filesystem access, and semantic transformations, and `laravelSourceAstPipeline.ts` still imports several subscanner implementations. Those remain separate migration findings and are not disguised as solved by this phase.

No `semantic/foundation` or `semantic/relations` dependency was added to the changed upstream contract or pipeline. Existing relation imports elsewhere in the route scanner were not addressed by this phase.

## Validation

Run `node scripts/audits/audit-phase2320-route-selection-executor-contract.cjs` and `node scripts/audits/phase2122-cli-route-source-selection.audit.mjs`. These are source-contract audits, not a substitute for full TypeScript typechecking or CLI integration tests.
