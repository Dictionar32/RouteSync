# Phase2975 Runtime Trace — Upstream → CLI → Manifest

## Existing production path retained

The previously audited production route remains:

1. `packages/cli/src/upstreamCompositionFactory.ts` — CLI upstream composition.
2. `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts` — manifest scan operation and scanner composition.
3. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` — manifest builder preparation.
4. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` — Laravel source AST pipeline.
5. `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` — source observation and route scan boundary.
6. Source selection/read judgments preserve selected-source evidence and distinguish optional default absence from explicit missing-source blockers.
7. The scanner's typed judgments are projected through the AST/manifest path rather than being replaced with boolean fallbacks.

Phase2975 does not change the source-selection or manifest evidence contracts. Existing structural audits for Phase2967 (12/12), Phase2972 (15/15), and Phase2974 (10/10) were rerun and passed.

## Migrated consumer slice

This phase migrates the compiler pass graph consumer domain:

`PassGraph` → `passGraphOrderingOperations` → `passGraphAnalysisOperations` → producer ownership / dependency validation → deterministic parallel layers or topological order.

The graph analyzer no longer imports `relationMembership`, `relationalSequence`, or `semanticRelations`. Instead, its domain interface exposes `producerOf`, `containsRemainingProducer`, and `dependentsOf`; these operations follow up on graph analysis results in their domain context. The graph analysis and ordering runtime exports are explicitly interface-typed frozen objects.

## Evidence and blocker preservation

- Empty pass names and duplicate names remain explicit validation failures.
- Duplicate output declarations, external-input/output collisions, and multiple producers remain explicit blockers.
- Missing providers remain distinct from external inputs supplied to the graph.
- A declared producer constraint is still checked against the artifact's actual producer.
- Cycles still produce `Compiler pass cycle detected`.
- The upstream collections file remains empty.
- Deleted relation foundation modules remain deleted; no generic replacement foundation was introduced.

## Remaining migration debt

The direct-import audit now reports 504 direct semantic relation import statements across 271 files in the package tree, down from the previous snapshot's 517 statements across 274 files. The Phase2972 transitive entrypoint audit now reports 254 reachable files importing deleted relation-foundation modules (previously 256). A separate stale-import counter reports 513 lines across 272 files because it counts a slightly different set of import patterns. These are outstanding blockers, not successful migrations.

Full build, typecheck, and unit-test execution were not possible because this workspace has no `node_modules`. Syntax transpilation checks passed for the changed TypeScript files, and structural audits passed. Do not interpret these as full compilation verification.
