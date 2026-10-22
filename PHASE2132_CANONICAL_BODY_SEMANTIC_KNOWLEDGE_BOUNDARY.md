# Phase 2132 — Canonical Body Semantic Knowledge Boundary

## Trace finding

The action judgment's semantic surface already published request binding, response, return semantics, dependencies, resource bindings, dataflow, and `RouteSchemaPayload`. The remaining body product was exposed only through the compiler projection, where it retained `PhpStatement[]` and `ControllerDataflowAst` evidence.

The existing `controllerStatements(...)` projector already converts controller method statements to the upstream `SourceStatements` ADT. This phase reuses that projection and the existing `HttpErrorResponseDescriptor` domain type instead of introducing another body AST or a duplicate semantic authority.

## Contract changes

- Added `LaravelControllerActionBodySemanticKnowledge` with upstream `SourceStatements` and domain `HttpErrorResponseDescriptor` values.
- Published it as `LaravelControllerActionSemanticKnowledge.body`.
- Advanced `LaravelControllerActionSemanticJudgmentContract` to version 9.
- Coverage now marks body semantic knowledge as published and identifies `body-source-ast` as the remaining projection item.
- The production adapter constructs body knowledge from the existing statement projector and resolved error descriptors.
- Exact invocation judgment, runtime forwarding, and controller-wide integrated response ownership remain unchanged.

## Remaining debt

This does not retire `scanControllerAction()` or `resolveControllerActionContract()`. The source AST and body-derived schema/error aggregation still pass through legacy production derivation. This phase fixes the contract boundary and does not claim complete upstream semantic derivation.

## Validation

Run `npm run audit:phase2132-canonical-body-semantic-knowledge-boundary`.

Static audit only; no TypeScript build, typecheck, or Vitest is claimed by this document.
