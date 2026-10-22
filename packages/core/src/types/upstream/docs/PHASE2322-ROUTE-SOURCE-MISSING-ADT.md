# Phase 2322 — Route source missing-file ADT

## Finding
`laravelRouteScanner.ts` previously returned an ordinary successful route judgment when any selected file did not exist. The missing path was converted into an empty artifact list, so an explicitly requested file could disappear without a blocker or source provenance.

## Contract change
- `LaravelRouteScanOutcome` is now the closed complete-or-blocked outcome.
- `LaravelRouteScanBlockedJudgment` retains the missing explicitly selected `SourceFile` values and a literal reason.
- Complete judgments retain a source-file observation for every selected path. Conventional files absent under default project discovery are explicitly marked as optional-default absences rather than being silently mistaken for scanned empty files.
- Explicitly selected missing files stop route projection. `laravelSourceAstPipeline` returns `laravel_source_ast_projection_route_scan_blocked` with the exact scan judgment and invocation receipt before mapping route artifacts.
- Public upstream exports include the new outcome types; route scanner contract version advances to 6 and source-AST pipeline version to 14.

## Boundary
This phase fixes missing-file completeness semantics. It does not yet retire the route scanner's semantic classification helpers, `semantic/relations` dependency, or the `ResourceRouteMethod` cast; those remain follow-up ownership work and are not claimed as solved.

## Validation
Run `node scripts/audits/audit-phase2322-route-source-missing-adt.cjs` for the structural contract audit. This audit does not replace a full project typecheck or end-to-end CLI run.
