# Phase 918 — Semantic Dataflow Upstream Boundary

## Decision

`SemanticDataflowInterface` is the canonical upstream dataflow contract.

The former `AstDataflow*` names are compatibility aliases only. Production semantic analysis imports the semantic contract directly.

## Boundary

- syntax/parser evidence may create semantic knowledge facts;
- semantic knowledge owns dataflow identity and relation facts;
- upstream exposes typed semantic identities, dependencies, value-flow and reachability closure;
- analysis consumes the closed semantic interface without reconstructing source/target payloads;
- no concrete PHP AST type is required by the semantic dataflow authority.

The anchor is a `SemanticDataflowIdentity`, not an `AstNodeIdentity`.

## Laravel relevance

Laravel controller behavior is declarative across route middleware, `HasMiddleware::middleware()`, controller/method `#[Middleware]`, `#[WithoutMiddleware]`, and `#[Authorize]`. Those inputs should be normalized into semantic policy relations before entering global dataflow rather than being encoded as AST-shaped dataflow nodes.

Laravel 13 documents class/method middleware merging and `only`/`except` scoping, and class-level `WithoutMiddleware` inheritance. `#[Authorize]` is a declarative authorization input. See the Laravel controller documentation and release notes.

## External design evidence

MLIR interfaces are explicitly designed to let analyses operate generically without special-casing concrete operations/dialects. CodeQL likewise models a dataflow graph whose nodes are semantic runtime-value carriers rather than the AST itself.

## Acceptance

- `semanticDataflowInterface.ts` is the canonical production import.
- `astDataflowInterface.ts` contains aliases only.
- the authority produces `semantic_dataflow_*` discriminants.
- no production upstream file imports compiler/scanner implementation types.
- e-commerce regression remains inline when the named fixture is absent.
