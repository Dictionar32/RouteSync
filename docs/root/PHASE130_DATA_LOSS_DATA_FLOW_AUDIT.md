# Phase 130 — Data-Loss / Data-Flow Model Audit

## Scope
Audit ulang terhadap `??`, positional arithmetic, `if`, `switch`, `===/!==`, `undefined`, `null`, `Record`, ternary, dan bentuk data-loss lain pada RouteSync route AST + semantic route pipeline.

## Implementation
- Closed Laravel knowledge catalogs no longer use `Record<...>` in `packages/core/src` production code.
- Semantic finite vocabularies now use immutable tuple catalogs with named resolvers:
  - binding target / withTrashed knowledge
  - missing behavior
  - constraint resolver knowledge
  - group binding scope
  - resource capability and singleton creation/destruction behavior
  - resource method and middleware scope adapters
  - constraint AST adapters
- Semantic route layer contains no `if` and no `switch`; domain meaning is selected by catalog data / discriminated ADTs.
- Resource data-flow graph added: source -> syntax_fact -> semantic_fact -> consumer, with explicit cardinality for middleware and exclusions.
- Route target unsupported syntax remains an explicit `unsupported` fact rather than being coerced into `closure`.
- Empty vs missing remains explicit through `Presence` and `Cardinality`.

## Static audit
- Production `Record<...>`: 0
- `switch`: 0 in semantic route layer; traversal route AST `switch`: 0
- `if`: 0 in semantic route layer
- `??`: 0 in route AST + semantic route layers
- `null` literal: 0 in route AST + semantic route layers
- `indexOf` / `findIndex`: 0
- numeric positional `[0]` / `[1]`: 0 in route AST model/navigation implementation
- `+1/+2/+123` outside primitive syntax navigation: 0
- TypeScript transpile: 69 files, 0 failures

## Intentional residuals
- `while` remains in parser/traversal engines and `SyntaxRange`/`TokenCursor`. These are execution mechanisms, not Laravel knowledge storage.
- `===/!==` remain as structural predicates/type discrimination. They are not domain dispatch tables; finite domain decisions have been raised into catalogs/ADTs.
- `undefined` remains at parser boundaries where an API genuinely represents an unresolved token/cursor. Semantic facts convert optionality to `Presence` before downstream semantic resolution.
- `?` in route binding regex is Laravel syntax vocabulary, not a ternary operator.

## External architecture alignment
Tree-sitter recommends named fields and named-child navigation instead of relying on child position. Laravel 13 documents route-group merge semantics and route constraint/resource syntax as explicit routing concepts. RouteSync therefore models these as facts and data-flow nodes rather than encoding them as parser control flow.
