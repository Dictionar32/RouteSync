# Phase 1921 — Laravel controller knowledge provenance, interface-first

## Trace finding

`LaravelControllerInvocationSemanticJudgmentInterface` is the authority-closed invocation result and source identity. `InvocationSemanticIntegratedResponseCompositionInterface` composes that judgment's exact `response` with the produced `SemanticKnowledgeDataFlow`. Neither contract can replace PHP-AST-to-Knowledge projection: they operate on different semantic domains. The existing `ControllerDataflowInvocationSemanticModelInterface` is the correct top-level value model for retaining the canonical invocation judgment and the distinct integrated-response aggregate.

The previous projection input made the controller analyzer classify evidence provenance as `{ code: 'parser' }`, even though the injected implementation is already the PHP AST projector. This put source-specific knowledge in the orchestration layer. The projection input now carries only typed evidence and canonical `SourceFile`; the PHP projector owns parser provenance and returns it together with the canonical knowledge graph.

The scanner-local `semanticKnowledgeEvidenceAdapter.ts` was only a factory wrapping a `project` function. It added no semantic rule, authority, or invariant, so it has been removed. The PHP-specific implementation now directly conforms to the upstream `SemanticKnowledgeEvidenceAdapter<PhpBlock>` interface. The interface remains because it is the real boundary between concrete PHP AST evidence and framework-neutral semantic knowledge; it is not a second invocation judgment.

## Changed files

- `packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts`
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowProducer.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/index.ts`
- Reduced `packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeEvidenceAdapter.ts` to a type-only compatibility barrel; its runtime factory was removed
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts` (boundary version 87 and ownership statements)
- `scripts/audits/audit-phase1921-controller-knowledge-provenance-interface-first.cjs`

## Validation

Run the dedicated static source-contract audit. No package build, TypeScript compilation, or runtime test suite is claimed for this phase.
