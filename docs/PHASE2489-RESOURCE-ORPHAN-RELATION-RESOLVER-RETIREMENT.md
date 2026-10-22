# RouteSync Phase 2489 — Resource Orphan Relation Resolver Retirement

## Scope

This phase continues the Resource Laravel scanner trace from Phase2488. It targets one verified dead path rather than claiming a repository-wide `semantic/relations` cleanup.

## Trace and evidence

`packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts` exported `resolveInitialModel` and `propagateRelationEdges`, and imported `semantic/relations`. A repository-wide search of `packages/core/src/**/*.ts` found no production TypeScript imports or references to the module or either exported operation. The active model resolver is `packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts`, which consumes the upstream-owned `ResourceModelKnowledgeDataFlow` data type and `reasonResourceModel` judgment. The old two-pass file was therefore an orphaned parallel path, not the producer that wires knowledge into the canonical scanner.

## Change

- Deleted `packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts` after confirming no production TypeScript callers.
- Updated the current Phase2485 and Phase2486 structural audits to assert the retired state rather than requiring the dead file to remain.
- Added `scripts/audits/audit-phase2489-resource-orphan-relation-resolver-retirement.cjs` and the package script `audit:phase2489-resource-orphan-relation-resolver-retirement`.
- Did not move the old implementation or recreate its relation reasoning under another filename.

## Verification

Run:

```bash
node scripts/audits/audit-phase2489-resource-orphan-relation-resolver-retirement.cjs
node scripts/audits/audit-phase2485-resource-knowledge-authority-retirement.cjs
node scripts/audits/audit-phase2486-resource-upstream-contract-connectivity.cjs
node scripts/audits/audit-phase2488-resource-expression-mapping-contract.cjs
```

The retirement and structural audits check source ownership and wiring, not runtime behavior. Full typecheck, package build, Vitest, and end-to-end CLI are not claimed as passing by this phase.

## Remaining production frontiers

- `subscanners/resourceProducer.ts` is still the concrete producer implementation and imports `semantic/relations`.
- `subscanners/resource/resourceFieldProducer.ts` and `resourceAstExpressionMapper.ts` still import `semantic/relations`.
- `binders/resource/resourceBinder.ts` remains a separate legacy binder and imports `semantic/relations`; `ResourceDefinitionBindingOperationInterface` is not the canonical `laravelResourceScanner` contract.
- `scanner/lexer/resourceSourceEvidence.ts` still imports `semantic/relations`.
- The upstream knowledge data-flow contract is accepted by the legacy binder/resolver type surface, but this phase did not prove that the canonical scanner constructs and passes a populated `ResourceModelKnowledgeDataFlow` value. That connection requires a separate trace of the current evidence and binding path.
- No repository-wide claim is made that `semantic/foundation` is absent.

## External technical context

TypeScript supports named call-signature interfaces for function-valued operations; this is useful for interface-first wiring, but the contract must also have a real production consumer. Laravel describes API Resources as a transformation layer from Eloquent models and relationships to response representations. Those docs are context, not evidence about RouteSync's own wiring.
