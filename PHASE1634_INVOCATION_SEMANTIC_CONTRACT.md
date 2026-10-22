# Phase 1634 — Invocation Semantic Contract / Thin Scanner

## Intent
Elevate callable-boundary handling from a scanner-adjacent low-level rewrite into a typed invocation semantic contract. The scanner facade should only delegate; domain policy is declared in `types/upstream`, while the algebra lowers that policy to the generic relation executor and derives the invocation judgment.

## Changes

1. `packages/core/src/types/upstream/semanticInterproceduralDataFlowInterface.ts`
   - Removed its direct dependency on generic rewrite `Pattern` / `Rewrite` implementation types.
   - Added `SemanticInvocationSemanticContract` and the canonical `SEMANTIC_INVOCATION_SEMANTIC_CONTRACT`.
   - Declares target-resolution evidence and identity meanings, positional argument-binding policy, result/exception emission meanings, and closure obligations.
   - Added typed `argument_parameter_unresolved` obligation.
   - Allows a domain-level `incomplete` judgment to retain a closed rewrite proof when rewrite saturation succeeded but invocation obligations remain. Rewrite closure and semantic closure are separate facts.

2. `packages/core/src/types/upstream/semanticInterproceduralDataFlowAlgebra.ts`
   - Owns invocation semantic reasoning and mechanical lowering from the interface contract to the generic relation rewrite protocol.
   - Keeps already-proven call targets, argument bindings, result flows, and exception flows in incomplete judgments.
   - Emits an explicit obligation for an invocation with no resolved target.
   - Emits an explicit obligation for an argument with no corresponding positional parameter.
   - Reports `closed` only when relation execution is closed and there are no invocation obligations.

3. `packages/core/src/types/upstream/semanticInterproceduralDataFlowAuthority.ts`
   - Reduced to a small public authority binding that delegates to the canonical algebra.
   - Retains compatibility exports for existing consumers.

4. `packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts`
   - Remains a compatibility facade only. It delegates to the upstream interface and authority; it contains no invocation reasoning branch.

5. `packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlow.phase219.test.ts`
   - Added a regression case where one invocation has two arguments but the callable has one parameter.
   - Asserts that the known target and first binding are retained, the second argument becomes an explicit obligation, and semantic status is `incomplete` even though the rewrite proof is `closed`.

## Validation

- Targeted TypeScript check of the interface, algebra, authority, and interprocedural test: **passed** using global `tsc` with ES2022 options and a temporary ambient Vitest declaration because project dependencies are not installed in this workspace.
- Full repository build / runtime Vitest execution: **not run**; `node_modules` is absent. The global TypeScript version also does not support the repository's configured `ES2025` target and the repository's Node/Vitest type packages are unavailable.
- `semantic/foundation` has **not** been emptied. This phase only addresses the invocation/callable semantic boundary; the remaining foundation consumers still require a separate import-and-consumer migration.

## Architectural boundary

`scanner -> interface/authority call -> upstream semantic algebra -> generic rewrite runtime -> closed/incomplete invocation judgment -> downstream projection`

The generic executor still owns generic rewrite mechanics only. The interface owns invocation policy; the invocation algebra owns the domain derivation. No claim is made that every scanner domain has already been migrated.
