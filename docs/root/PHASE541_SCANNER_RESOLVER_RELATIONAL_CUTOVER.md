# Phase 541 — Scanner/Resolver Relational Cutover

Targets:
- `packages/core/src/compiler/scanner/subscanners/schemaProducer.ts`
- `packages/core/src/compiler/scanner/subscanners/controller/responseDtoReader.ts`

Architecture:

`scanner evidence -> semantic relation catalog -> candidate/option witnesses -> recursive relation traversal -> canonical schema/response authority`

The schema producer now constructs migration state through relation folds, recursive sequence construction, relation selection, relation equality and option witnesses. Response DTO analysis now uses relation projection, relation gates, explicit type witnesses and recursive token discovery for class declarations.

Validation:
- Phase 541 target structural audit: all forbidden surfaces zero.
- Target transpilation diagnostics: zero.
- Phase 525 inactive vacuum rerun.
- Phase 528 scanner inactive-path vacuum rerun.
- Phase 540 regression rerun.

Repository-wide TypeScript typecheck remains environment-limited by missing `node` and `vitest/globals` type definitions; this phase does not claim a full repository typecheck.
