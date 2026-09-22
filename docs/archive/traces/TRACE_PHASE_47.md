# RouteSync Phase 47 — High-Level Upstream Semantic Boundary

## Goal
Raise the controller expression model so semantic downstream code receives typed ADTs instead of structural free strings.

## Trace
Laravel PHP → tokenizer → Laravel AST → semantic resolver → ControllerActionContract → Route domain → Manifest/IR → pure lowerers → emitter.

## Changes
- `ControllerExpressionContract` now uses `AstIdentifier` for variable/member/resource names.
- Property access and method calls use a typed `ControllerPropertyPath` ADT instead of a free target string.
- Resource arguments are recursively resolved into `ControllerExpressionContract` instead of remaining as a free argument string.
- Ternary conditions are recursively resolved into `ControllerExpressionContract`.
- Object property names remain canonical `AstIdentifier` values.
- Unsupported syntax terminates at the semantic boundary as `{ kind: 'unknown' }`; raw source is not carried downstream.
- Empty property paths are rejected instead of fabricated with an empty string.

## Ecommerce-shop register trace
`#[Response(RegisterResponse::class)]` + `RegisterRequest $request` + runtime response array now resolves through the typed controller action contract. The runtime object remains an expression ADT:

`object → success: literal(boolean) → message: literal(string) → data: literal(null)`.

## Remaining upstream work
The source `PhpAstValue` itself still contains legacy raw-expression fallbacks and string-shaped member paths. The next architectural step is to replace those syntax fields with first-class AST nodes in the lexer/parser, so the semantic resolver becomes a direct structural projection rather than parsing a string-shaped intermediate.

Do not solve this by adding more downstream regex/fallback logic. The correct direction is: enrich the Laravel AST upstream, then delete the semantic adapters that currently reconstruct structure.
