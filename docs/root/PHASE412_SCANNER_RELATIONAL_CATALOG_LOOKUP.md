# Phase 412 — Scanner Relational Catalog Lookup

## Objective
Move scanner/resolver catalog lookup from host-language `Map.get`/optional dispatch into a declarative relation lookup returning `RelationOption`.

## Changes
- Added `relationLookup(entries, key)` to the relational sequence kernel.
- Positional recursion uses `relationAdvanceIndex`, keeping index arithmetic behind the relational authority.
- Migrated query aggregate catalog resolution to `RelationOption`.
- Aggregate construction now uses `relationOptionFold` and `solveCandidate`.
- Migrated query join descriptor lookup to relational catalog lookup as the first step toward full resolver catalog cutover.
- Named resolver catalogs remain a subsequent cutover target; source-language vocabulary is not counted as host control flow.

## Research basis
MLIR PDLL/PDL explicitly models pattern matching, constraints and rewrites as declarative IR; MLIR DRR provides declarative rewrite rules. JastAdd expresses circular computations as equations evaluated to fixed point. egglog combines equality saturation with Datalog.

## Validation
- TypeScript syntax transpilation of changed files: passed.
- Repository `tsc --noEmit`: environment-blocked by missing `node` and `vitest/globals` type definitions, same as prior phases.
