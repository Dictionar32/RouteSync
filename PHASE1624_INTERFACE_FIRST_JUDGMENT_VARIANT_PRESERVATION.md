# Phase 1624 — Interface-First Judgment Variant Preservation

## Trace

The canonical contract is `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. `RequestTypeDerivationSemanticInferenceFor` was preserving specialized `TInput`, but its `judgment` member was still widened to the full `RequestTypeDerivationJudgment` union. That widened semantic meaning at the interface boundary even when an inference implementation had a narrower closed judgment. The bound proof algebra, authority assessment, and pipeline are parameterized by the inference packet, so preserving the judgment type here is the narrowest upstream contract fix.

Scanner trace: the two direct pipeline wiring consumers are `packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts` and `routeManifestTypeLoweringAuthority.ts`. AST-semantic terms are consumed separately by `ResourceModelResolver.ts`, `resourceSemanticMappingRelations.ts`, and `semanticDataFlowAnalyzer.ts`; the trace does not establish that these AST consumers belong to the request-type derivation pipeline, so they are not force-wired into it. The runtime executor remains `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts`.

## Contract change

Added a backward-compatible third generic parameter `TJudgment extends RequestTypeDerivationJudgment`, defaulting to the existing union. The inference packet now preserves `readonly judgment: TJudgment`, alongside the previously preserved input shape. A type-level regression test checks that a specialized `derived` judgment stays specialized. No scanner, wiring implementation, semantic solver, or runtime executor was changed.

## Design basis

MLIR's official interface design describes interfaces as a generic way for analyses and transformations to query semantics without hardcoding concrete operation knowledge: https://mlir.llvm.org/docs/Interfaces/. TypeScript's official generics documentation explains that generic parameters preserve relationships only when they are used by members of the type: https://www.typescriptlang.org/docs/handbook/2/generics. The change applies that principle to the existing canonical interface rather than creating a parallel abstraction.

## Validation

Run `node scripts/audits/audit-phase1623-interface-first-input-shape-preservation.cjs`. A full TypeScript/build validation is only claimed if it is executed separately.
