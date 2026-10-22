# Phase 1541 — Interface-first runtime executor and scanner wiring

## Source trace

- `types/upstream/semanticDataflow.ts` owns the closed dataflow ADT, derivations, closure certificate, and judgment shape.
- `types/upstream/semanticDataflowAuthority.ts` derives fixed-point facts, reachability, paths, and derivations. It is the reasoning implementation, not the consumer contract.
- `types/upstream/semanticDataflowInterface.ts` owns the admission contract and proof-envelope checks. Before this phase, the scanner composed the authority and admission boundary directly.
- `types/upstream/semanticDataflowRuntimeExecutor.ts` now composes the existing authority with the existing admission interface behind one runtime executor contract. It adds no solver, semantic classifier, or second proof model.
- `compiler/scanner/wiring/semanticDataflowInputAdapter.ts` maps scanner knowledge evidence into canonical upstream input.
- `compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts` now calls the upstream runtime executor, then projects the accepted canonical judgment to its deprecated legacy return type.
- `compiler/scanner/subscanners/queryEvidenceProducer.ts` separately consumes `queryProducerSemanticAlgebra` and its evidence-bound execution validation; its explicit unclaimed-operation compatibility catalog remains a migration frontier.

## Change

The interface now declares `SemanticDataflowRuntimeExecutorInterface` (`kind`, `authority`, and `execute(input)`). The upstream runtime executor is the single composition point for reasoning plus admission. The scanner no longer imports or recomposes `semanticDataflowReasoningAuthority` and `semanticDataflowJudgmentBoundary` itself. The executor is exported from the upstream barrel.

## Contract flow

`scanner evidence -> typed input adapter -> upstream runtime executor interface -> authority judgment -> proof admission -> accepted closed judgment -> compatibility projection`

## Verification

- Phase 1540 proof-grounded interface audit: 7/7 pass after updating its scanner assertion to check the executor boundary.
- Phase 1541 interface-first runtime executor/scanner audit: 7/7 pass.
- TypeScript build was not run: this workspace has no installed `node_modules`; global TypeScript 5.8.3 is older than the repository's configured TypeScript 7.0.2 and root `ES2025` configuration.

## Explicit residuals (not claimed fixed)

1. `semanticDataFlowAnalyzer.ts` still has a no-`dataFlow` fast path that returns the legacy judgment wrapper without passing through the canonical judgment boundary. The model has no source anchor when both knowledge and flow collections are empty, so a correct closure-safe migration needs an explicit empty-input/source-context contract rather than an invented identity.
2. The analyzer still converts accepted canonical paths through `toLegacyPath`; it is deprecated compatibility projection, not the canonical downstream API.
3. `queryEvidenceProducer.ts` still has an explicitly scoped compatibility catalog for operation families not yet claimed by the upstream semantic algebra.
4. This phase closes one dataflow runtime-composition gap; it does not claim every file under `compiler/scanner` has been migrated.
