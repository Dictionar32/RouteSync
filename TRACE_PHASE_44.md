# RouteSync Phase 44 — High-Level Controller Action Semantic Contract

## Goal
Raise Laravel controller semantics above the scanner so downstream code consumes one typed action contract instead of independently discovering request/response identity.

## New upstream model
`ControllerActionContract` is created from `ControllerMethodAst` at the semantic origin boundary.

It carries:
- controller/action identity
- typed controller parameters
- request ADT (`none | form_request | typed`)
- resolved response descriptor
- runtime return AST value (`none | expression`)
- source provenance

## AST strengthening
`ControllerParameterAst.type` is now `PhpParameterTypeAst` (`primitive | named | nullable`).
`ResponseAttributeAst` is now an explicit ADT (`absent | declared`) instead of `undefined`.

## Dataflow
`PHP -> tokenizer -> Laravel AST -> ControllerActionContract -> legacy action descriptor -> Manifest/IR`.

The declared response path no longer rescans controller body tokens to discover the response. The action scanner still performs legacy validation/error extraction temporarily; this is deliberately isolated as the next semantic migration target rather than silently changing behavior.

## Next boundary
Move validation and error extraction from `method.bodyTokens` into AST-level semantic contracts, then make `ControllerActionContract` the direct input of the route/manifest layer.
