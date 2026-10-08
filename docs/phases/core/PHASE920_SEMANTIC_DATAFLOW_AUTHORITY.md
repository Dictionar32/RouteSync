# Phase 920 — Semantic Dataflow Authority Cutover

Phase 920 completes the semantic dataflow boundary started in Phase 918.

## Authority

`packages/core/src/types/upstream/semanticDataflowInterface.ts` is the sole upstream semantic dataflow algebra.

It contains:

- `SemanticDataflowIdentity`
- `SemanticDataflowFact`
- `SemanticDataflowDerivation`
- `SemanticDataflowJudgment`
- `SemanticDataflowOrigin`
- `SemanticDataflowInterface`

`SemanticDataflowJudgment.node` is now a `SemanticDataflowIdentity`, not `AstNodeIdentity`.

## Scanner compatibility

The older `SemanticDataFlow*Contract` vocabulary is scanner-local only. It is no longer exported from `types/upstream` and therefore cannot become a second upstream authority.

## Rationale

CodeQL models runtime value flow as a graph distinct from the AST. MLIR likewise encourages analyses to operate through semantic interfaces rather than concrete operation representations. RouteSync therefore keeps syntax/AST as evidence at the scanner boundary and exposes semantic identities and relations upstream.

## Laravel frontier

Laravel controller middleware is a semantic policy source, not a dataflow identity. Route middleware, `HasMiddleware::middleware()`, `#[Middleware]`, `#[WithoutMiddleware]`, and `#[Authorize]` should be normalized into effective action policy relations before entering global semantic graph/dataflow closure.

The next safe frontier is policy normalization and relation composition, not another dataflow fact family.
