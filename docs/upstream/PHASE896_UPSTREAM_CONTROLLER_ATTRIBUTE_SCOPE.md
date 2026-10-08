# Phase 896 — Upstream Controller Attribute Scope

## Frontier

Promote controller class-level PHP attribute evidence into controller method contracts without losing provenance or introducing Laravel-specific flags.

## Changes

- `ControllerMethodAttribute` now carries a closed `class | method` scope.
- `ControllerProducerInput` carries `ControllerDeclarationAst.attributes`.
- Controller method contract projection folds class-scoped attributes before method-scoped attributes using the relational sequence algebra.
- `ControllerScanner` passes declaration attributes to the canonical producer.
- Regression coverage verifies class-level `Middleware` and method-level `Authorize` retain their scopes.
- No duplicate model-binding vocabulary was introduced; route binding remains owned by the route upstream contract.

## Invariants

`PHP AST -> evidence -> scoped relation -> controller method contract`.

No host-array spread is used to merge class and method attribute evidence. No Laravel-specific boolean classifier is introduced.
