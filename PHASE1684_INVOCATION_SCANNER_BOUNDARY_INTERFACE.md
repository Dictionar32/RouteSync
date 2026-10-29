# Phase 1684 — Invocation Scanner Boundary Interface

## Scope: interface first, no wiring migration

This phase advances the invocation semantic contract before changing production call paths. It does not modify the scanner implementation, runtime executor implementation, semantic authority implementation, or algebra implementation.

## Source trace

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts` defines the canonical invocation input, judgment, proof, obligations, and semantic contract.
- `packages/core/src/types/upstream/invocationSemanticAlgebraBoundaryInterface.ts` defines one high-level domain derivation operation; internal target/binding/effect/closure phases are not exposed as caller-facing methods.
- `packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts` defines authority validation ownership and runtime delegation obligations.
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` composes those contracts and now explicitly defines the scanner boundary.
- `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts` remains the current validation authority around algebra-produced judgments.
- `packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts` remains a delegation wrapper.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts` currently calls `invocationSemanticRuntimeExecutor.executeAll(semanticKnowledgeDataFlow)` and projects the resulting analysis into the existing AST shape.

## Contract change

`InvocationSemanticScannerBoundaryContract` now specifies:

- the scanner owns only source-derived input assembly and invocation identity;
- a single invocation delegates once to the runtime executor;
- complete-knowledge analysis uses the aggregate executor operation and is not confused with a list of independent inputs;
- target resolution, argument binding, effect projection, proof synthesis, obligation invention, judgment closure, and fallback/reclassification are forbidden scanner responsibilities;
- the authority-produced judgment, proof trace, and obligations are forwarded without reconstruction;
- authority contract failures propagate instead of creating synthetic semantic judgments.

The pipeline contract version advances from 5 to 6 to record this new boundary. The new contract and type are exposed through the upstream and package public barrels.

## Deliberately not changed

No runtime wiring is migrated in this phase. In particular, the current `executeAll` call remains in place. The new contract is a target for a later, separately audited wiring phase; its presence must not be misrepresented as proof that every scanner path already conforms.

No `any`, generic callable boundary, or `core/src/semantic/foundation` dependency was added.

## Verification

Run the Phase 1681–1684 static audits and a strict TypeScript check of the changed interface modules. This phase does not claim a full repository build unless separately verified.
