# Phase 1907 — Laravel Controller Dataflow Interface-First Trace

## Scope

Trace the supplied Phase 1906 archive. This phase updates the existing upstream ownership contract to record the concrete remaining semantic stages and the exact gates required before reducing `controllerDataflowAnalyzer.ts`. It does not claim those runtime stages have already been migrated.

## Source trace

- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`
  - `produceSemanticKnowledgeDataFlow(block, filePath)` produces knowledge inside the analyzer path.
  - `collectStatementPayloads(block)` walks statement variants and constructs source-span payload records.
  - `canonicalDefinition(...)` correlates binding spans to payloads, manufactures an unsupported-expression fallback when no payload matches, projects a PHP AST value to the resource/upstream expression model, resolves semantic values, and derives variable origin.
  - `canonicalSemanticVariables(...)` groups definitions by variable name.
  - `createControllerDataflowAnalyzer(...)` composes the integrated response and returns the exact judgment alongside the projected values.
- `packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts`
  - Correctly describes the output value model, not a callable authority. It should not be expanded into an all-purpose runtime service.
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`
  - Owns integrated-response composition. The composition result and `judgment.response` have distinct roles and must not be made artificially type-identical.
- `packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts`
  - Still traverses return expressions and recursively discovers resource-binding candidates. Keep this as a separate trace; do not fold resource binding into the invocation judgment without a proven domain match.

## Interface-first recommendation

Do not create another invocation judgment or another aggregate that duplicates `ControllerDataflowInvocationSemanticModelInterface`.

1. Trace consumers of each analyzer helper and the existing upstream interfaces before designing a new contract.
2. For statement payload collection, identify whether an existing PHP AST/source-evidence contract already represents the required statement-to-expression relation. If it does, strengthen that contract; do not add a parallel traversal model.
3. For binding-span correlation, the target contract must express a source-correlated binding/payload relation with explicit matched versus unmatched evidence. Do not silently turn an unmatched binding into an unsupported expression before the contract's judgment is known.
4. For origin and expression projection, reuse existing typed semantic domains and authorities only where their meanings are compatible. Do not replace stronger semantic judgments with primitive fields or reclassify them in the scanner.
5. Keep `LaravelControllerInvocationSemanticJudgmentInterface` as the one canonical invocation judgment. Keep integrated response composition as a distinct, knowledge-bound result retaining the exact judgment response.
6. Only after those contracts are closed should the analyzer be reduced to wiring/projection; then trace all consumers before retiring any subscanner.

## Contract update

`LaravelControllerInvocationSemanticBoundaryContract` is version 73. It now explicitly records the remaining analyzer stages, the binding-evidence contract gate, and the canonical-judgment/composition invariant. This is an ownership declaration and audit aid, not proof that runtime migration is complete.

## Verification status

- Static source/contract inspection: completed.
- TypeScript build: not run, per workspace constraints.
- Package tests: not run.
- Full semantic migration: incomplete; no false pass is claimed.
