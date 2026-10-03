# Phase 716 — Resource Model Semantic Algebra

## Objective

Raise Resource -> Model resolution from descriptor/string transport to a closed semantic ADT boundary. The implementation must preserve semantic meaning as data and keep host-language absence out of the semantic contract.

## Changes

- `ResourceModelBindingSource` is now a closed source ADT with canonical constructors.
- `UnbackedDtoBinding.reason` is now `StringValue`, not a free-form host string.
- `ResourceModelResolutionOrigin` is now a closed origin ADT.
- `ResourceModelResolver` consumes canonical source witnesses and canonical `ModelSymbolTable.findForControllerOrigin` lookup.
- `resolveInitialModel` consumes `Presence<ControllerResourceDataflow>` rather than an optional parameter.
- fixed-point iteration bound in `propagateRelationEdges` is `NumberValue`, keeping the public semantic contract typed.
- raw presence object construction in the resource knowledge closure was replaced by `absent()` / `present()` witnesses.
- downstream diagnostic formatting unwraps the canonical `StringValue` only at the host error boundary.
- public exports expose the source ADT value catalog.

## Audits

- Phase 709 diagnostic trace/suggestion: PASS.
- Phase 710 request/domain AST frontier: PASS.
- Phase 711 route security NumberValue ADT: PASS.
- Phase 712 resolver graph interface: PASS.
- Phase 715 resource model highest interface: PASS.
- Phase 716 resource model semantic algebra: PASS.
- Changed TypeScript files parse successfully with the global TypeScript compiler API.

## Forbidden-construction audit on Phase 716 resource-model surface

`if`, `while`, `for`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `null`, `===`, `as unknown`, `any`, and `new`: **0**.

## Build status

The user's last full build reached this resource-model frontier after ESM/CJS success. The checkpoint environment does not contain `node_modules/.bin/tsup`, so a full `npm run build` was not claimed locally. Targeted TypeScript checking produced no diagnostics in the modified resource-model files; it still reports unrelated pre-existing repository-wide type frontiers.

## Architecture reference direction

The phase follows the declarative direction of WebAssembly validation, MLIR declarative rewriting, CompCert semantic-preservation boundaries, and circular/reference attribute-grammar fixed-point evaluation: semantic constraints and facts are authoritative, while execution is an implementation of the semantic judgment.
