# Phase 937 — Upstream Dataflow Input Boundary

Phase 937 traces the semantic dataflow interface before the implementation boundary.

## Boundary

The canonical contract remains `types/upstream/semanticDataflowInterface.ts`.
The contract now includes `SemanticDataflowInput`, a closed input algebra containing the
canonical upstream identity, source span, facts, and origin.

The scanner-specific `SemanticKnowledgeDataFlow` vocabulary is no longer imported by
`compiler/analysis/astDataflowAuthority.ts`. Instead:

```text
PHP/Laravel evidence
  -> scanner semantic knowledge
  -> compiler/scanner/upstream/semanticDataflowInputAdapter.ts
  -> SemanticDataflowInput
  -> compiler/analysis/astDataflowAuthority.ts
  -> least-fixed-point SemanticDataflowJudgment
```

This keeps scanner evidence production separate from the generic dataflow solver.

## Example corpus

Neither `examples/ecomerce-shop-source` nor `examples/ecommerce-shop-source` is a
production source tree. Test-owned fixtures remain under `packages/sdk/tests/fixtures/`.

## Rationale

The interface is traced first. The compiler analysis consumes the canonical upstream
input contract rather than a scanner-local relation model. Laravel-specific middleware,
resource policy, and route policy relations remain separate semantic relations and are
not folded into generic dataflow facts.
