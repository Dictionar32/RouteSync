# RouteSync Phase 2485 — Resource Knowledge Authority Retirement

## Audit and trace

The Resource -> Model knowledge contract was already upstream-owned, but its operations (`emptyResourceModelKnowledgeDataFlow`, fact constructors, derived index, and lookup) still lived under `compiler/scanner/subscanners/resource`. `ResourceModelResolver` imported the payload type from that implementation module. This left semantic knowledge operations owned by a scanner subcomponent and coupled them to `semantic/relations`.

## Changes

- Added `ResourceModelKnowledgeDataFlowOperationsInterface` to `types/upstream/resourceModelKnowledgeDataFlowInterface.ts`.
- Added `compiler/semantic/resourceModelKnowledgeDataFlowAuthority.ts`, with the operation object explicitly typed by that upstream interface.
- Reimplemented knowledge construction and lookup using canonical fact arrays and the upstream `Presence` ADT, without importing `semantic/relations` or `semantic/foundation`.
- Changed `ResourceModelResolver` to consume the semantic authority rather than the subscanner implementation.
- Relocated the corresponding test beside the semantic authority and updated assertions to match the actual derived tuple index and closed origin ADT.
- Deleted the obsolete `scanner/subscanners/resource/resourceModelKnowledgeDataFlow.ts` implementation after tracing and updating its production consumer.

## Scope boundary

This phase retires one subscanner-owned semantic operation module. It does **not** claim that all Laravel scanner production paths are free of `semantic/relations`, `semantic/foundation`, `subscanners`, or lexer-owned parsing. In particular, the Resource producer, Resource field producer, AST expression mapper, source-evidence scanner, binder, and some resolver dependencies remain for subsequent upstream-contract migrations. They must be migrated by tracing and switching actual consumers before deleting their implementations.

## Verification

Run `node scripts/audits/audit-phase2485-resource-knowledge-authority-retirement.cjs` and the prior Phase 2484 audit. Typecheck/build/Vitest/CLI end-to-end status must be reported separately; this phase does not treat structural audits as substitutes for those checks.
