# Phase 1920 — Semantic Knowledge Projection Contract

## Trace finding

The prior `SemanticKnowledgeEvidenceAdapter<TEvidence>` exposed a low-level operation:

- raw evidence as a positional argument;
- optional `sourceName?: string` detached from canonical source identity;
- a bare `SemanticKnowledgeDataFlow` result that did not carry the projection's source/provider context as one typed output.

The previous scanner wiring also forwarded the adapter into `canonicalDefinition`, although that function did not consume it. That was a misleading propagation claim and an unnecessary parameter.

## Interface-first correction

The existing upstream interface was evolved in place. No parallel authority was introduced.

`SemanticKnowledgeEvidenceProjectionInput<TEvidence>` now binds:

- a discriminant identifying the semantic projection request;
- source-specific evidence;
- canonical `SourceFile` identity;
- typed `SemanticEvidenceProvider` provenance.

`SemanticKnowledgeEvidenceAdapter<TEvidence>.project(...)` returns one `SemanticKnowledgeEvidenceProjection`, pairing canonical source identity and provider provenance with the canonical `SemanticKnowledgeDataFlow`.

The PHP AST adapter implements this contract. The controller analyzer passes the exact `judgment.sourceFile` as source identity, consumes the projection's `knowledge`, and passes that same knowledge value to integrated-response composition. The adapter is no longer passed into `canonicalDefinition`, where it was unused.

## Semantic boundary retained

- `invocationJudgment` remains the canonical invocation judgment.
- `invocationSemanticIntegratedResponse` remains a separate integrated result.
- The integrated response consumes the projection's exact canonical knowledge graph and `judgment.response`.
- Variable semantic judgments remain owned by the existing upstream executor.

## Validation scope

The phase audit checks source-level contract shape, injection, provenance preservation, and removal of the false adapter propagation boundary. ZIP integrity is checked separately. Build, typecheck, and runtime tests are intentionally not run.
