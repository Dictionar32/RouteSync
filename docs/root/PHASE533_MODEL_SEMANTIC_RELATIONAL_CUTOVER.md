# Phase 533 — Model Semantic Relational Cutover

Targets:
- `packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/model/modelParser.ts`

Architecture:

`model evidence -> semantic relation catalog -> candidate/witness -> recursive relation closure -> canonical model authority`

Changes:
- canonical model collection construction uses relation projection rather than host collection combinators;
- key semantic type and property-origin classification use relation gates;
- primary-key auto-generation resolves through a relation witness and option fold;
- model parser inheritance, return-type presence, key inference and property-state accumulation are relation-driven;
- linked schema traversal is recursive relation closure with explicit RelationOption presence;
- no target-level parser-control/absence constructs remain from the Phase 533 audit surface.

Validation:
- Phase 533 target audit passes;
- `transpileModule` diagnostics are zero for both targets;
- repository-wide TypeScript validation remains environment-limited by missing `node` and `vitest/globals` type definitions.
