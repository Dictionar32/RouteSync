# Phase 911 — Upstream Route Declaration Evidence

## Boundary change

`types/upstream/ast.ts` and `types/upstream/route.ts` no longer import the concrete scanner `RouteDeclarationAst`.

The upstream contract now owns `RouteDeclarationEvidence` in `routeDeclarationEvidence.ts`. The scanner remains responsible for producing concrete PHP AST evidence, which is structurally consumable by the neutral upstream contract.

## Rationale

Laravel route declarations combine syntax evidence with semantic middleware, binding, constraint, target, and group information. The upstream layer should preserve that evidence without depending on the scanner's concrete AST implementation.

This follows the interface/dataflow separation used by MLIR and CodeQL: generic analysis contracts should operate on semantic interfaces/dataflow models rather than encode concrete syntax implementations.

## Scope

This phase intentionally changes only the route declaration boundary. Controller/provider concrete AST imports remain a separate frontier.

## Validation

- `ast.ts` has no `compiler/scanner` import.
- `route.ts` has no `compiler/scanner` import.
- `RouteProducerInput.declaration` is now `RouteDeclarationEvidence`.
- `RouteAstSemantic.declaration` preserves the same neutral evidence contract.
- Full repository build is not claimed because this checkpoint does not include the repository's complete TypeScript build configuration/dependencies.
