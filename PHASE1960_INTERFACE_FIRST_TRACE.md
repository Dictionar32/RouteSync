# Phase 1960 — Existing AST Authority, No Overloads

## Trace finding

The Phase 1959 `AstClassifierEvidenceInterface.classify` overload set combined three responsibilities: expression parsing, block parsing, and semantic-stage production. The repository already has the semantic path:

`AstSemanticEvidenceProducerInterface.produce(AstSemanticEvidenceObservation) → createScannerEvidencePort → AstSemanticStageInterface → AstSemanticInterface / stage closure`.

Therefore the classifier did not need a semantic request variant or an overloaded dispatcher.

## Interface-first change

- `AstClassifierEvidenceInterface` now names two syntax capabilities: `expression(tokens)` and `block(tokens)`.
- Both return explicit, closed result ADTs (`expression` / `block`).
- The classifier no longer accepts a semantic request and no longer returns a semantic stage result. Semantic syntax is retained as a `syntax` variant in `AstSemanticTerm`, rather than being flattened into the generic `text` term.
- `classifyAstSemanticEvidence` delegates to the existing `produceAstSemanticEvidence` producer and projects its existing `AstSemanticStageInterface`.
- The producer's former `syntaxKind: string` has been replaced by the canonical upstream `PhpAstExpressionKind` vocabulary, reused by the PHP expression ADT through `Extract`.
- No new semantic authority was created; syntax implementation remains in `astClassifierRuntime.ts`, semantic-stage construction remains upstream-owned.

## Laravel invocation path preserved

`CLI invocation judgment composition → LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close() → closed inventory receipt → source AST scanner → controller scan artifact → manifest builder`.

`LaravelControllerScannerInterface` continues to consume the closed invocation inventory receipt and preserves `invocationJudgment` in its controller scan artifact. This phase does not reclassify or reconstruct invocation judgments.

## Important remaining work

The typed PHP syntax kind closes the `string` hole at the producer interface, but it does not yet prove that `AstSemanticEvidenceObservation.source` and token-derived `SourceRange` share the same canonical `SourceFile` identity. That provenance alignment is the next trace target. No claim of end-to-end typecheck/build success is made here.

## Adjacent scanner blocker found during verification

The targeted TypeScript run exposed a missing closing brace in the existing `semanticReturn` closure target expression in `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`. The expression is now syntactically closed; this was a pre-existing scanner syntax defect discovered while verifying the interface changes.
