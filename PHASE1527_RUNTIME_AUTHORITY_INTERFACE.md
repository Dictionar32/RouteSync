# Phase 1527 — Runtime Authority Interface Contract

## Objective

Strengthen the semantic interface before changing runtime functions. The new contract makes the boundary explicit between source ownership and rule execution:

`Source evidence + source span → claimed family-specific contract → family-specific executor → closed derivation judgment`

## Interface changes

- `QueryOperationSemanticExecutorRequest<Rule>` binds source provenance, operation evidence, and the exact `QueryOperationSemanticRuleDeclarationFor<Rule>`.
- `QueryOperationSemanticExecutorTable` is mapped over the closed rule-family union. Each executor accepts and returns the same family-indexed contract/judgment.
- `QueryOperationSemanticRuntimeAuthority` separates `claim(methodName)` from the executor table. Unclaimed operations do not enter a claimed executor, and the executor result type cannot be `not_applicable`.
- Public type exports were added in `packages/core/src/index.ts`.

## Trace and migration boundary

- `core/src/types/upstream/queryProducerSemanticInterface.ts`: interface authority contract; changed.
- `core/src/types/upstream/queryProducerSemanticReasoning.ts`: current rule catalog and evaluator bindings; traced, not changed in this interface-first phase.
- `core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: upstream decision is consulted first; `malformed` stops, and legacy dispatch is reached only after `not_applicable`; traced, not changed.

## Important limitation

This phase defines the target executor contract; it does **not** claim the existing evaluator table implements `QueryOperationSemanticRuntimeAuthority`, that every obligation has a machine-checkable receipt, or that scanner fallback coverage is complete. The request's `source` span must be populated from actual parser provenance during the later wiring migration. Runtime evaluator changes should follow only after the contract is reviewed and the evidence source is connected.

## Verification

Run `node scripts/audits/audit-phase1527-runtime-authority-interface.cjs` and the previous Phase 1526 audit. Build status must be recorded independently; a static contract audit is not a TypeScript compilation.
