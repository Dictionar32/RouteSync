# Phase 894 — Upstream Controller Method Contract Projection

## Repair

- Captures method-level PHP attributes as generic controller AST evidence.
- Projects PHP implicit method visibility to semantic `public`.
- Adds canonical `ControllerMethodContract` production.
- Emits only controller operations backed by existing canonical semantic evidence: resource and response.
- Keeps model query/write, request validation, database table, and external-service operations deferred until their canonical producers are wired.
- Keeps HTTP abort status as failure evidence and does not invent exception identity.

## Laravel relevance

Laravel 13 documents method-level `#[Middleware]` and `#[Authorize]` attributes. The parser now preserves these attributes without hard-coding Laravel semantics into the lexer boundary. Semantic interpretation can be added as relations later.

## E-commerce relevance

The available Phase 893 checkpoint contains e-commerce workload tests and trace references but not the physical `examples/ecommerce-shop-source` directory. The contract projection therefore consumes existing controller dataflow/resource/response evidence and does not fabricate source facts.

## Validation

`audit-phase894-controller-method-contract-projection.cjs` passes all checks.

The workspace has no installed `tsup`/workspace dependencies, so a full repository build cannot be executed in this extracted checkpoint. A direct TypeScript check reaches existing baseline errors outside this change; no changed-file-specific error was surfaced before those pre-existing compiler errors.
